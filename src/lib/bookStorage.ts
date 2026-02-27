import { supabase } from './supabase';
import type { BookCategory, CustomCategory } from '../../types';

// --- Shared Links ---

function generateToken(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}

/**
 * Create a new token-based share link, optionally with an expiration.
 */
export async function createShareLink(linkType: 'category' | 'book', target: string, expiresInDays?: number | null): Promise<string> {
  const token = generateToken();
  const dataToInsert: any = { token, link_type: linkType, target };

  if (expiresInDays) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    dataToInsert.expires_at = expiresAt.toISOString();
  }

  const { error } = await supabase
    .from('shared_links')
    .insert(dataToInsert);

  if (error) {
    console.error('Create share link error:', error);
    throw new Error(`Failed to generate share link: ${error.message}`);
  }

  return token;
}

/**
 * Resolves a token-based shared link.
 * Returns null if the link has expired or doesn't exist, deleting it if expired.
 */
export async function resolveShareLink(token: string): Promise<{ linkType: string; target: string } | null> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('id, link_type, target, expires_at')
    .eq('token', token)
    .single();

  if (error || !data) return null;

  // Check expiration (lazy deletion)
  if (data.expires_at) {
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      // Lazy delete
      await supabase.from('shared_links').delete().eq('id', data.id);
      return null; // Expired
    }
  }

  return { linkType: data.link_type, target: data.target };
}

export interface SharedLinkInfo {
  id: string;
  token: string;
  created_at: string;
  expires_at: string | null;
  status: 'active' | 'expired' | 'no_expiry';
}

/**
 * Load all shared links for a given target (book ID or category slug).
 */
export async function loadSharedLinks(
  linkType: 'category' | 'book',
  target: string
): Promise<SharedLinkInfo[]> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('id, token, created_at, expires_at')
    .eq('link_type', linkType)
    .eq('target', target)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load shared links error:', error);
    return [];
  }

  const now = new Date();
  return (data || []).map((link: any) => ({
    id: link.id,
    token: link.token,
    created_at: link.created_at,
    expires_at: link.expires_at,
    status: link.expires_at
      ? new Date(link.expires_at) < now ? 'expired' : 'active'
      : 'no_expiry',
  }));
}

/**
 * Delete a specific shared link by ID.
 */
export async function deleteSharedLink(linkId: string): Promise<void> {
  const { error } = await supabase
    .from('shared_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('Delete shared link error:', error);
    throw new Error(`Failed to delete shared link: ${error.message}`);
  }
}

// Type for book in database
export interface StoredBook {
  id: string;
  title: string;
  original_filename: string;
  pdf_url: string;
  cover_url: string | null;
  total_pages: number;
  file_size: number | null;
  category: string | null;
  is_favorite: boolean;
  summary: string | null;
  created_at: string;
  orientation?: 'portrait' | 'landscape';
}

export async function uploadPDF(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `books/${fileName}`;

  const { error } = await supabase.storage
    .from('pdfs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true  // Allow overwrites to prevent duplicate file errors
    });

  if (error) {
    console.error('===== SUPABASE UPLOAD ERROR DETAILS =====');
    console.error('Error object:', JSON.stringify(error, null, 2));
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    console.error('File path attempted:', filePath);
    console.error('File size:', file.size);
    console.error('File type:', file.type);
    console.error('=========================================');
    throw new Error(`Failed to upload PDF: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('pdfs')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Upload a cover image (base64) to Supabase Storage
 */
export async function uploadCover(base64Data: string, bookId: string): Promise<string> {
  // Convert base64 to blob
  const response = await fetch(base64Data);
  const blob = await response.blob();

  const fileName = `${bookId}-cover.jpg`;
  const filePath = `covers/${fileName}`;

  const { error } = await supabase.storage
    .from('covers')
    .upload(filePath, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600',
      upsert: true  // Allow overwrites to prevent duplicate file errors
    });

  if (error) {
    console.error('Cover upload error:', error);
    throw new Error(`Failed to upload cover: ${error.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('covers')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Save book metadata to database
 */
export async function saveBookMetadata(book: {
  title: string;
  original_filename: string;
  pdf_url: string;
  cover_url: string | null;
  total_pages: number;
  file_size: number | null;
  category?: BookCategory;
  is_favorite?: boolean;
  summary?: string;
  orientation?: 'portrait' | 'landscape';
}): Promise<StoredBook> {
  // Get current user (try getUser first, then fall back to getSession)
  let userId = (await supabase.auth.getUser()).data.user?.id;

  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  }

  if (!userId) {
    console.error("Attempted to save book without authenticated user.");
    throw new Error("User authentication required. Please sign in to upload.");
  }

  const insertData: any = {
    user_id: userId, // Explicitly set user_id
    title: book.title,
    original_filename: book.original_filename,
    pdf_url: book.pdf_url,
    cover_url: book.cover_url,
    total_pages: book.total_pages,
    file_size: book.file_size,
    category: book.category || null,
    is_favorite: book.is_favorite || false,
    summary: book.summary || null,
    orientation: book.orientation || 'portrait'
  };

  const { data, error } = await supabase
    .from('books')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Save metadata error:', error);

    // FIX: Self-healing for missing profiles (Foreign Key Violation)
    if (error.code === '23503' && error.message.includes('books_user_id_fkey')) {
      console.warn('Missing user profile detected. Attempting to create one...');

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userData.user.id,
            email: userData.user.email,
            full_name: userData.user.user_metadata?.full_name || 'User'
          });

        if (!profileError) {
          console.log('Profile created successfully. Retrying book save...');
          // Retry the book save
          const { data: retryData, error: retryError } = await supabase
            .from('books')
            .insert(insertData)
            .select()
            .single();

          if (!retryError) return retryData;
          console.error('Retry failed:', retryError);
        } else {
          console.error('Failed to create missing profile:', profileError);
        }
      }
    }

    // Check for common RLS/permission errors
    if (error.code === '42501' || error.message.includes('policy')) {
      throw new Error(`Database permission denied. Check RLS policies are set up correctly.`);
    }
    throw new Error(`Failed to save book: ${error.message}`);
  }

  return data;
}

/**
 * Load all books from database
 */
export async function loadBooks(): Promise<StoredBook[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load books error:', error);
    throw new Error(`Failed to load books: ${error.message}`);
  }

  return data || [];
}

/**
 * Load a single book by ID (used for shared book links)
 */
export async function loadBookById(bookId: string): Promise<StoredBook | null> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error) {
    console.error('Load book by ID error:', error);
    return null;
  }

  return data;
}

/**
 * Load books filtered by category (used for shared category links)
 */
export async function loadBooksByCategory(category: string): Promise<StoredBook[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('category', category)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load books by category error:', error);
    throw new Error(`Failed to load books: ${error.message}`);
  }

  return data || [];
}

/**
 * Update book metadata (title, category, favorite, summary)
 */
export async function updateBook(
  bookId: string,
  updates: Partial<Pick<StoredBook, 'title' | 'category' | 'is_favorite' | 'summary'>>
): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId);

  if (error) {
    console.error('Update book error:', error);
    throw new Error(`Failed to update book: ${error.message}`);
  }
}

/**
 * Soft-delete a book (mark as deleted, preserve files for undo).
 */
export async function deleteBook(bookId: string): Promise<void> {
  console.log('[deleteBook] Soft-deleting bookId:', bookId);

  const { error } = await supabase
    .from('books')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', bookId);

  if (error) {
    console.error('[deleteBook] Soft-delete failed:', error);
    throw new Error(`Failed to delete book: ${error.message}`);
  }
  console.log('[deleteBook] Soft-delete OK');
}

/**
 * Restore a soft-deleted book (undo deletion).
 */
export async function restoreBook(bookId: string): Promise<void> {
  const { error } = await supabase
    .from('books')
    .update({ is_deleted: false, deleted_at: null })
    .eq('id', bookId);

  if (error) {
    console.error('Restore book error:', error);
    throw new Error(`Failed to restore book: ${error.message}`);
  }
}

/**
 * Permanently delete a book and its storage files (cannot be undone).
 */
export async function permanentlyDeleteBook(bookId: string): Promise<void> {
  // Fetch book info for storage cleanup
  const { data: bookRow, error: fetchError } = await supabase
    .from('books')
    .select('pdf_url, cover_url')
    .eq('id', bookId)
    .single();

  if (fetchError) {
    console.error('Permanent delete fetch error:', fetchError);
    throw new Error(`Failed to fetch book: ${fetchError.message}`);
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (dbError) {
    console.error('Permanent delete DB error:', dbError);
    throw new Error(`Failed to permanently delete book: ${dbError.message}`);
  }

  // Delete storage files
  try {
    if (bookRow?.pdf_url) {
      const pdfMatch = bookRow.pdf_url.match(/\/pdfs\/(.+)$/);
      if (pdfMatch?.[1]) {
        await supabase.storage.from('pdfs').remove([pdfMatch[1]]);
      }
    }
    if (bookRow?.cover_url) {
      const coverMatch = bookRow.cover_url.match(/\/covers\/(.+)$/);
      if (coverMatch?.[1]) {
        await supabase.storage.from('covers').remove([coverMatch[1]]);
      }
    }
  } catch (e) {
    console.warn('Could not delete storage files:', e);
  }
}

// --- Deleted Books History ---

export interface DeletedBookLog {
  id: string;
  book_title: string;
  category: string | null;
  cover_url: string | null;
  total_pages: number | null;
  deleted_at: string;
}

/**
 * Load soft-deleted books, optionally filtered by category.
 */
export async function loadDeletedBooks(category?: string): Promise<DeletedBookLog[]> {
  let query = supabase
    .from('books')
    .select('id, title, category, cover_url, total_pages, deleted_at')
    .eq('is_deleted', true)
    .order('deleted_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Load deleted books error:', error);
    return [];
  }

  // Map to DeletedBookLog shape
  return (data || []).map((b: any) => ({
    id: b.id,
    book_title: b.title,
    category: b.category,
    cover_url: b.cover_url,
    total_pages: b.total_pages,
    deleted_at: b.deleted_at,
  }));
}

/**
 * Permanently delete a specific soft-deleted book (remove from DB + storage).
 */
export async function clearDeletedBookLog(logId: string): Promise<void> {
  await permanentlyDeleteBook(logId);
}

/**
 * Permanently delete all soft-deleted books for a category (or all if no category).
 */
export async function clearAllDeletedBookLogs(category?: string): Promise<void> {
  // First load all soft-deleted books to get their storage paths
  let query = supabase
    .from('books')
    .select('id, pdf_url, cover_url')
    .eq('is_deleted', true);

  if (category) {
    query = query.eq('category', category);
  }

  const { data: books, error: fetchErr } = await query;
  if (fetchErr || !books) {
    console.error('Clear all deleted books - fetch error:', fetchErr);
    return;
  }

  // Delete storage files and DB rows for each
  for (const book of books) {
    try {
      await permanentlyDeleteBook(book.id);
    } catch (e) {
      console.warn('Failed to permanently delete book:', book.id, e);
    }
  }
}

// --- Custom Categories ---

/**
 * Load all user-created categories from Supabase
 */
export async function loadCategories(): Promise<CustomCategory[]> {
  const { data, error } = await supabase
    .from('book_categories')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Load categories error:', error);
    return [];
  }

  return data || [];
}

/**
 * Save a new user-created category
 */
export async function saveCategory(name: string, slug: string, color: string, icon: string = 'folder'): Promise<CustomCategory> {
  let userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  }
  if (!userId) throw new Error('User authentication required.');

  const { data, error } = await supabase
    .from('book_categories')
    .insert({ user_id: userId, name, slug, color, icon })
    .select()
    .single();

  if (error) {
    console.error('Save category error:', error);
    throw new Error(`Failed to save category: ${error.message}`);
  }

  return data;
}

/**
 * Edit an existing user-created category.
 * Also updates all books currently associated with the old slug.
 */
export async function editCategory(
  id: string,
  oldSlug: string,
  newName: string,
  newSlug: string,
  newColor: string,
  newIcon: string
): Promise<CustomCategory> {
  let userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  }
  if (!userId) throw new Error('User authentication required.');

  // 1. Update the category itself
  const { data, error } = await supabase
    .from('book_categories')
    .update({ name: newName, slug: newSlug, color: newColor, icon: newIcon })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Edit category error:', error);
    throw new Error(`Failed to edit category: ${error.message}`);
  }

  // 2. Cascade: update all books that had the old slug to use the new slug
  if (oldSlug !== newSlug) {
    const { error: cascadeError } = await supabase
      .from('books')
      .update({ category: newSlug })
      .eq('user_id', userId)
      .eq('category', oldSlug);

    if (cascadeError) {
      console.error('Cascade edit category error on books:', cascadeError);
      // We don't necessarily throw here if the category update succeeded, 
      // but it's good to log it.
    }
  }

  return data;
}

/**
 * Delete a user-created category
 * Also removes the category assignment from any associated books.
 */
export async function deleteCategory(id: string, slug: string): Promise<void> {
  let userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  }
  if (!userId) throw new Error('User authentication required.');

  // 1. Un-assign books from this category
  const { error: cascadeError } = await supabase
    .from('books')
    .update({ category: null })
    .eq('user_id', userId)
    .eq('category', slug);

  if (cascadeError) {
    console.error('Cascade delete category error on books:', cascadeError);
  }

  // 2. Delete the category itself
  const { error } = await supabase
    .from('book_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete category error:', error);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}
