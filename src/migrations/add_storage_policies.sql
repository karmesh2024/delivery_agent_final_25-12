-- Create "public" bucket if it doesn't exist
INSERT INTO storage.buckets (id, name)
VALUES ('public', 'public')
ON CONFLICT (id) DO NOTHING;

-- Create policy for "public" bucket
DROP POLICY IF EXISTS "Allow authenticated users full access to public bucket" ON storage.objects;
CREATE POLICY "Allow authenticated users full access to public bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'public')
WITH CHECK (bucket_id = 'public');

-- Create or update policy for the "avatars" bucket as a fallback
DROP POLICY IF EXISTS "Allow authenticated users full access to avatars bucket" ON storage.objects;
CREATE POLICY "Allow authenticated users full access to avatars bucket"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Make sure authenticated users have full access to storage
GRANT ALL ON storage.objects TO authenticated; 