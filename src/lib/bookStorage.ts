import { supabase } from './supabase';
import type { BookCategory } from '../../types';

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
  category: BookCategory | null;
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
}): Promise<StoredBook> {
  // Get current user (or use anonymous fallback)
  const { data: { user } } = await supabase.auth.getUser();

  const insertData: any = {
    title: book.title,
    original_filename: book.original_filename,
    pdf_url: book.pdf_url,
    cover_url: book.cover_url,
    total_pages: book.total_pages,
    file_size: book.file_size,
    category: book.category || null,
    is_favorite: book.is_favorite || false,
    summary: book.summary || null
  };

  // Only add user_id if we have an authenticated user
  // Some RLS policies auto-fill this, others require it
  if (user) {
    insertData.user_id = user.id;
  }

  const { data, error } = await supabase
    .from('books')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Save metadata error:', error);
    // Check for common RLS/permission errors
    if (error.code === '42501' || error.message.includes('policy')) {
      throw new Error(`Database permission denied. Check RLS policies are set up correctly.`);
    }
    if (error.message.includes('user_id') || error.message.includes('null')) {
      throw new Error(`User authentication required. Please sign in or disable RLS for testing.`);
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
 * Delete a book and its files
 */
export async function deleteBook(bookId: string, pdfUrl: string, coverUrl?: string): Promise<void> {
  // Delete from database first
  const { error: dbError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId);

  if (dbError) {
    console.error('Delete book error:', dbError);
    throw new Error(`Failed to delete book: ${dbError.message}`);
  }

  // Try to delete files from storage (extract path from URL)
  try {
    const pdfPath = pdfUrl.split('/pdfs/')[1];
    if (pdfPath) {
      await supabase.storage.from('pdfs').remove([`books/${pdfPath}`]);
    }

    if (coverUrl) {
      const coverPath = coverUrl.split('/covers/')[1];
      if (coverPath) {
        await supabase.storage.from('covers').remove([`covers/${coverPath}`]);
      }
    }
  } catch (e) {
    console.warn('Could not delete storage files:', e);
  }
}
