# 🗄️ Supabase Setup Guide

## Quick Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in:
   - **Name**: `lifewood-flipbook`
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
4. Click "Create new project" (wait ~2 minutes)

### 2. Get Your API Keys

Once project is created:
1. Go to **Project Settings** (⚙️ icon) → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)

### 3. Update .env.local

Update your `.env.local` file with the values:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste and click "Run"
5. You should see: "Success. No rows returned"

### 5. Create Storage Buckets

#### For PDFs (Private):
1. Go to **Storage** in sidebar
2. Click "Create a new bucket"
3. Name: `pdfs`
4. Public: ❌ **OFF** (keep private)
5. Click "Create bucket"

#### For Covers (Public):
1. Click "Create a new bucket" again
2. Name: `covers`  
3. Public: ✅ **ON** (make public)
4. Click "Create bucket"

### 6. Install Supabase Client

In your project terminal:
```bash
npm install @supabase/supabase-js
```

### 7. Create Supabase Client

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 📊 Database Schema

Your database includes:

### Tables:
1. **profiles** - User profiles (extends Supabase Auth)
2. **books** - PDF books with metadata
3. **reading_progress** - Track reading position per user/book

### Storage Buckets:
1. **pdfs** - Private storage for PDF files
2. **covers** - Public storage for book cover images

### Features:
- ✅ Row Level Security (RLS) enabled
- ✅ Users can only access their own data
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Optimized indexes for performance
- ✅ Cascading deletes

## 🔐 Authentication Setup (Optional)

To enable user authentication:

1. Go to **Authentication** → **Providers**
2. Enable providers you want:
   - Email/Password ✅ (enabled by default)
   - Google, GitHub, etc. (optional)
3. Configure redirect URLs if needed

## 🧪 Test Your Setup

Run this in SQL Editor to verify:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- profiles
- books
- reading_progress

## 📝 Next Steps

1. ✅ Install Supabase client: `npm install @supabase/supabase-js`
2. ✅ Update `.env.local` with your credentials
3. ✅ Run the schema SQL
4. ✅ Create storage buckets
5. ✅ Start building! `npm run dev`

## 🆘 Troubleshooting

**Can't connect to Supabase?**
- Check your URL and keys in `.env.local`
- Restart dev server after updating env vars

**RLS errors?**
- Make sure users are authenticated
- Check policies in SQL Editor

**Storage upload fails?**
- Verify buckets exist and permissions are correct
- Check file size limits (default 50MB)
