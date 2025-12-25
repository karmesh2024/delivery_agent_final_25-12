-- Enable Row Level Security on delivery_documents table
ALTER TABLE IF EXISTS delivery_documents ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "Authenticated users can create delivery documents" ON delivery_documents;
DROP POLICY IF EXISTS "Users can view all delivery documents" ON delivery_documents;
DROP POLICY IF EXISTS "Users can update delivery documents" ON delivery_documents;
DROP POLICY IF EXISTS "Users can delete delivery documents" ON delivery_documents;

-- Create a simple policy to allow authenticated users to perform all operations on delivery_documents
-- This is more permissive than ideal, but should resolve the 403 error
CREATE POLICY "Authenticated users can perform all operations on delivery documents" 
ON delivery_documents FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Update permissions to ensure authenticated users have full access
GRANT ALL ON delivery_documents TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE delivery_documents_id_seq TO authenticated;

-- Analytics
ANALYZE delivery_documents; 