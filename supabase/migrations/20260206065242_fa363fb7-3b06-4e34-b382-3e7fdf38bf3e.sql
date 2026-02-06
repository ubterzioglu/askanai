-- Create storage bucket for poll preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('poll-images', 'poll-images', true);

-- Allow anyone to view poll images (public bucket)
CREATE POLICY "Anyone can view poll images"
ON storage.objects FOR SELECT
USING (bucket_id = 'poll-images');

-- Allow anyone to upload poll images (for anonymous poll creators)
CREATE POLICY "Anyone can upload poll images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'poll-images');

-- Add preview_image_url column to polls table
ALTER TABLE public.polls
ADD COLUMN preview_image_url text;