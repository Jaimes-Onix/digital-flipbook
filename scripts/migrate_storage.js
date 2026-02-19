import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Ensure node-fetch is available (npm install node-fetch) or use global fetch in Node 18+

// --- CONFIGURATION ---
// Source Project (Read Only / Public Access)
const SOURCE_URL = 'https://gikpzgdmxjqapioutsmo.supabase.co';
// const SOURCE_BUCKETS = ['pdfs', 'covers'];

// Target Project (Write Access - REQUIRES SERVICE ROLE KEY)
const TARGET_URL = 'https://lsarymmlfhylhjymvavs.supabase.co';
// TODO: Enter your Target Project Service Role Key here
const TARGET_SERVICE_KEY = process.env.TARGET_SERVICE_KEY || 'REPLACE_WITH_YOUR_TARGET_SERVICE_ROLE_KEY';

// Files to migrate (Extracted from Source Database)
const FILES = [
    // PDFS
    { bucket: 'pdfs', path: 'books/1770297431060-0d1fg6xfa.pdf' },
    { bucket: 'pdfs', path: 'books/1771463254015-124nsxhzv.pdf' },
    { bucket: 'pdfs', path: 'books/1771212898116-qveo906pc.pdf' },
    { bucket: 'pdfs', path: 'books/1770975364371-fvko3z9jj.pdf' },
    { bucket: 'pdfs', path: 'books/1770966669994-z7qkgv1g0.pdf' },
    { bucket: 'pdfs', path: 'books/1771472065593-7jqju60v4.pdf' },
    { bucket: 'pdfs', path: 'books/1770966752113-ht6atmbtr.pdf' },
    { bucket: 'pdfs', path: 'books/1770966766248-p8mqa0lm3.pdf' },
    { bucket: 'pdfs', path: 'books/1770966757964-k2somn68g.pdf' },

    // COVERS
    { bucket: 'covers', path: 'covers/xzvxs1cz51770297435499-cover.jpg' },
    { bucket: 'covers', path: 'covers/48db6p9f81771463286279-cover.jpg' },
    { bucket: 'covers', path: 'covers/sur3g8sz21771212937688-cover.jpg' },
    { bucket: 'covers', path: 'covers/vq66pzff81770975382526-cover.jpg' },
    { bucket: 'covers', path: 'covers/fypyfe7ds1770966691591-cover.jpg' },
    { bucket: 'covers', path: 'covers/528wd6wfe1771472195575-cover.jpg' },
    { bucket: 'covers', path: 'covers/h0nq4rih81770966756917-cover.jpg' },
    { bucket: 'covers', path: 'covers/63sq511mo1770966810088-cover.jpg' },
    { bucket: 'covers', path: 'covers/se2p5kzqa1770966762515-cover.jpg' }
];

async function migrate() {
    console.log('Starting migration...');

    if (TARGET_SERVICE_KEY === 'REPLACE_WITH_YOUR_TARGET_SERVICE_ROLE_KEY') {
        console.error('ERROR: You must set the TARGET_SERVICE_KEY.');
        process.exit(1);
    }

    const targetClient = createClient(TARGET_URL, TARGET_SERVICE_KEY);

    for (const file of FILES) {
        const publicUrl = `${SOURCE_URL}/storage/v1/object/public/${file.bucket}/${file.path}`;
        console.log(`Downloading: ${publicUrl}`);

        try {
            const response = await fetch(publicUrl);
            if (!response.ok) {
                console.error(`Failed to download ${publicUrl}: ${response.statusText}`);
                continue;
            }

            const buffer = await response.arrayBuffer();
            const fileData = new Uint8Array(buffer);

            // Determine content type (simple guess)
            const contentType = file.path.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';

            console.log(`Uploading to ${file.bucket}/${file.path}...`);
            const { error } = await targetClient
                .storage
                .from(file.bucket)
                .upload(file.path, fileData, {
                    contentType: contentType,
                    upsert: true
                });

            if (error) {
                console.error(`Upload error for ${file.path}:`, error.message);
            } else {
                console.log(`Success: ${file.path}`);
            }

        } catch (err) {
            console.error(`Error processing ${file.path}:`, err);
        }
    }

    console.log('Migration finished.');
}

migrate();
