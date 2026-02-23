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
 * @deprecated Token-based sharing is replaced by direct ID/slug links.
 */
export async function createShareLink(linkType: 'category' | 'book', target: string): Promise<string> {
  const token = generateToken();
  const { error } = await supabase
    .from('shared_links')
    .insert({ token, link_type: linkType, target });

  if (error) {
    console.error('Create share link error:', error);
    throw new Error(`Failed to generate share link: ${error.message}`);
  }

  return token;
}

/**
 * @deprecated Token-based sharing is replaced by direct ID/slug links.
 */
export async function resolveShareLink(token: string): Promise<{ linkType: string; target: string } | null> {
  const { data, error } = await supabase
    .from('shared_links')
    .select('link_type, target')
    .eq('token', token)
    .single();

  if (error || !data) return null;
  return { linkType: data.link_type, target: data.target };
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Load books by category error:', error);
    throw new Error(`Failed to load books: ${error.message}`);
  }

  return data || [];
}

/**
 * Update book metadata (category, favorite, summary)
 */
export async function updateBook(
  bookId: string,
  updates: Partial<Pick<StoredBook, 'category' | 'is_favorite' | 'summary'>>
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
 * Delete a book and all its associated storage files.
 * Fetches real Supabase storage URLs from the DB before deleting the row,
 * since the pdfUrl in LibraryBook may be a blob:// URL used by the viewer.
 */
export async function deleteBook(bookId: string): Promise<void> {
  // Step 1: fetch the real storage URLs from the database
  const { data: bookRow, error: fetchError } = await supabase
    .from('books')
    .select('pdf_url, cover_url')
    .eq('id', bookId)
    .single();

  if (fetchError) {
    console.error('Delete book fetch error:', fetchError);
    throw new Error(`Failed to fetch book for deletion: ${fetchError.message}`);
  }

  // Step 2: delete the database row
  const { error: dbError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (dbError) {
    console.error('Delete book DB error:', dbError);
    throw new Error(`Failed to delete book: ${dbError.message}`);
  }

  // Step 3: delete storage files using the real Supabase URLs
  try {
    if (bookRow?.pdf_url) {
      // PDF path inside bucket: everything after '/pdfs/'
      // e.g. https://xxx.supabase.co/storage/v1/object/public/pdfs/books/file.pdf
      //       → path = 'books/file.pdf'
      const pdfMatch = bookRow.pdf_url.match(/\/pdfs\/(.+)$/);
      if (pdfMatch?.[1]) {
        const { error } = await supabase.storage.from('pdfs').remove([pdfMatch[1]]);
        if (error) console.warn('PDF storage delete error:', error.message);
        else console.log('PDF deleted from storage:', pdfMatch[1]);
      }
    }

    if (bookRow?.cover_url) {
      // Cover path inside bucket: everything after '/covers/'
      // e.g. https://xxx.supabase.co/storage/v1/object/public/covers/covers/id-cover.jpg
      //       → path = 'covers/id-cover.jpg'
      const coverMatch = bookRow.cover_url.match(/\/covers\/(.+)$/);
      if (coverMatch?.[1]) {
        const { error } = await supabase.storage.from('covers').remove([coverMatch[1]]);
        if (error) console.warn('Cover storage delete error:', error.message);
        else console.log('Cover deleted from storage:', coverMatch[1]);
      }
    }
  } catch (e) {
    console.warn('Could not delete storage files:', e);
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
export async function saveCategory(name: string, slug: string, color: string): Promise<CustomCategory> {
  let userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
  }
  if (!userId) throw new Error('User authentication required.');

  const { data, error } = await supabase
    .from('book_categories')
    .insert({ created_by: userId, name, slug, color })
    .select()
    .single();

  if (error) {
    console.error('Save category error:', error);
    throw new Error(`Failed to save category: ${error.message}`);
  }

  return data;
}

/**
 * Delete a user-created category
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('book_categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete category error:', error);
    throw new Error(`Failed to delete category: ${error.message}`);
  }
}
