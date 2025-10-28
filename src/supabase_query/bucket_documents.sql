-- Create policies for the "documents" bucket to allow authenticated users to upload, view, update, and delete documents

-- First, drop any existing policies for the documents bucket to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON storage.objects;

-- Simple permissive policy for documents bucket
CREATE POLICY "Allow authenticated users to manage documents" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');