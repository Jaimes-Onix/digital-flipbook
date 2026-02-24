import { supabase } from './supabase';
import { VideoEntry } from '../../components/VideoLinksModal';

export async function uploadVideoFile(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const { error } = await supabase.storage
        .from('videos')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        console.error('Video upload error:', error);
        throw new Error(`Failed to upload video: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);

    return urlData.publicUrl;
}

export async function uploadVideoThumbnail(base64Data: string, videoId: string): Promise<string> {
    const response = await fetch(base64Data);
    const blob = await response.blob();

    const fileName = `${videoId}-thumb.jpg`;
    const filePath = `thumbnails/${fileName}`;

    const { error } = await supabase.storage
        .from('video_thumbnails')
        .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
        });

    if (error) {
        console.error('Thumbnail upload error:', error);
        throw new Error(`Failed to upload thumbnail: ${error.message}`);
    }

    const { data: urlData } = supabase.storage
        .from('video_thumbnails')
        .getPublicUrl(filePath);

    return urlData.publicUrl;
}

export async function saveVideoMetadata(
    video: Omit<VideoEntry, 'id' | 'addedAt'>,
    categorySlug: string
): Promise<VideoEntry> {
    let userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id;
    }
    if (!userId) {
        throw new Error("User authentication required. Please sign in to add videos.");
    }

    const insertData = {
        user_id: userId,
        category_slug: categorySlug,
        name: video.name,
        thumbnail_url: video.thumbnailUrl,
        source_url: video.sourceUrl,
        is_file: video.isFile,
    };

    const { data, error } = await supabase
        .from('videos')
        .insert(insertData)
        .select()
        .single();

    if (error) {
        console.error('Save video metadata error:', error);
        throw new Error(`Failed to save video: ${error.message}`);
    }

    return {
        id: data.id,
        name: data.name,
        thumbnailUrl: data.thumbnail_url || '',
        sourceUrl: data.source_url,
        isFile: data.is_file,
        addedAt: new Date(data.added_at).getTime()
    };
}

export async function loadVideos(categorySlug: string): Promise<VideoEntry[]> {
    const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('category_slug', categorySlug)
        .order('added_at', { ascending: false });

    if (error) {
        console.error('Load videos error:', error);
        throw new Error(`Failed to load videos: ${error.message}`);
    }

    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        thumbnailUrl: row.thumbnail_url || '',
        sourceUrl: row.source_url,
        isFile: row.is_file,
        addedAt: new Date(row.added_at).getTime()
    }));
}

export async function updateVideo(
    videoId: string,
    updates: Partial<Pick<VideoEntry, 'name' | 'sourceUrl' | 'thumbnailUrl'>>
): Promise<void> {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sourceUrl !== undefined) dbUpdates.source_url = updates.sourceUrl;
    if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;

    const { error } = await supabase
        .from('videos')
        .update(dbUpdates)
        .eq('id', videoId);

    if (error) {
        console.error('Update video error:', error);
        throw new Error(`Failed to update video: ${error.message}`);
    }
}

export async function deleteVideo(videoId: string): Promise<void> {
    const { data: videoRow, error: fetchError } = await supabase
        .from('videos')
        .select('source_url, thumbnail_url, is_file')
        .eq('id', videoId)
        .single();

    if (fetchError) {
        console.error('Delete video fetch error:', fetchError);
        throw new Error(`Failed to fetch video for deletion: ${fetchError.message}`);
    }

    const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

    if (dbError) {
        console.error('Delete video DB error:', dbError);
        throw new Error(`Failed to delete video: ${dbError.message}`);
    }

    try {
        if (videoRow?.is_file && videoRow?.source_url) {
            const videoMatch = videoRow.source_url.match(/\/videos\/(.+)$/);
            if (videoMatch?.[1]) {
                await supabase.storage.from('videos').remove([videoMatch[1]]);
            }
        }

        if (videoRow?.thumbnail_url) {
            const thumbMatch = videoRow.thumbnail_url.match(/\/video_thumbnails\/(.+)$/);
            if (thumbMatch?.[1]) {
                await supabase.storage.from('video_thumbnails').remove([thumbMatch[1]]);
            }
        }
    } catch (e) {
        console.warn('Could not delete video storage files:', e);
    }
}
