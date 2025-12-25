-- Enable Row Level Security on delivery_documents table
ALTER TABLE IF EXISTS delivery_documents ENABLE ROW LEVEL SECURITY;

-- Create a function to check if the current user has access to a delivery record
CREATE OR REPLACE FUNCTION check_delivery_document_access(delivery_doc_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  delivery_record_id UUID;
  is_admin BOOLEAN;
BEGIN
  -- Get the delivery_id from the document
  SELECT delivery_id INTO delivery_record_id FROM delivery_documents WHERE id = delivery_doc_id;
  
  -- Check if user is part of the admin role (admins can access all documents)
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
  ) INTO is_admin;
  
  -- Return true if admin or if the user is the owner of the delivery record
  RETURN is_admin OR EXISTS (
    SELECT 1 FROM delivery_boys WHERE id = delivery_record_id AND id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM new_profiles_delivery WHERE id = delivery_record_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy for viewing documents (any authenticated user can submit documents, which might need refining)
CREATE POLICY "Delivery documents can be submitted by any authenticated user" 
ON delivery_documents FOR INSERT 
TO authenticated 
USING (true);

-- Policy for viewing documents (users can only view their own documents)
CREATE POLICY "Users can view their own delivery documents" 
ON delivery_documents FOR SELECT 
TO authenticated 
USING (
  delivery_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM new_profiles_delivery 
    WHERE id = delivery_documents.delivery_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
  )
);

-- Policy for updating documents (users can only update their own documents)
CREATE POLICY "Users can update their own delivery documents" 
ON delivery_documents FOR UPDATE 
TO authenticated 
USING (
  delivery_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM new_profiles_delivery 
    WHERE id = delivery_documents.delivery_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
  )
);

-- Policy for deleting documents (users can only delete their own documents)
CREATE POLICY "Users can delete their own delivery documents" 
ON delivery_documents FOR DELETE 
TO authenticated 
USING (
  delivery_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM new_profiles_delivery 
    WHERE id = delivery_documents.delivery_id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_app_meta_data->>'role' = 'admin'
  )
); 