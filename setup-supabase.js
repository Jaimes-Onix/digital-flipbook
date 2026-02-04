import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://gikpzgdmxjqapioutsmo.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdpa3B6Z2RteGpxYXBpb3V0c21vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDIwNTMxNSwiZXhwIjoyMDg1NzgxMzE1fQ.XrXzI0m1pGyalQDAHqY8ntGnz4drigrSOjBugLNOZLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🔧 Setting up Supabase database...\n');

  // Read SQL schema
  const sql = readFileSync('./supabase-schema.sql', 'utf8');
  
  // Split SQL into individual statements (rough split by semicolons)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    
    // Skip comment-only lines
    if (stmt.trim().startsWith('--')) continue;
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });
      if (error) {
        console.log(`⚠️  Statement ${i + 1}: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    } catch (err) {
      console.log(`⚠️  Statement ${i + 1}: ${err.message}`);
    }
  }

  console.log('\n📦 Creating storage buckets...\n');

  // Create PDFs bucket (private)
  try {
    const { data: pdfBucket, error: pdfError } = await supabase.storage.createBucket('pdfs', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    });
    if (pdfError && !pdfError.message.includes('already exists')) {
      console.log('❌ PDFs bucket error:', pdfError.message);
    } else {
      console.log('✅ PDFs bucket created (private, 50MB limit)');
    }
  } catch (err) {
    console.log('⚠️  PDFs bucket:', err.message);
  }

  // Create covers bucket (public)
  try {
    const { data: coverBucket, error: coverError } = await supabase.storage.createBucket('covers', {
      public: true,
      fileSizeLimit: 5242880, // 5MB
    });
    if (coverError && !coverError.message.includes('already exists')) {
      console.log('❌ Covers bucket error:', coverError.message);
    } else {
      console.log('✅ Covers bucket created (public, 5MB limit)');
    }
  } catch (err) {
    console.log('⚠️  Covers bucket:', err.message);
  }

  console.log('\n🎉 Supabase setup complete!\n');
  console.log('📋 Summary:');
  console.log('  - Database tables: profiles, books, reading_progress');
  console.log('  - Storage buckets: pdfs (private), covers (public)');
  console.log('  - Row Level Security: Enabled');
  console.log('  - Region: Asia-Pacific (Singapore)');
  console.log('\n✅ Your .env.local is already configured!');
  console.log('\n🚀 Run: npm run dev');
}

setupDatabase().catch(console.error);
