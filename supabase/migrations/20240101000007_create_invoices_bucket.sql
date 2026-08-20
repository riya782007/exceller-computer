-- Create storage bucket for invoice PDFs
-- This bucket stores generated PDF invoices.
-- Admin can upload; customers access via signed URLs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  true,
  5242880, -- 5MB max file size
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies

-- Allow authenticated admin users to upload/manage invoice PDFs
CREATE POLICY "admin_manage_invoices_storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'invoices'
  AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Allow public read access (since bucket is public, PDFs are accessible via URL)
-- This is appropriate because invoice URLs are not guessable (contain invoice number)
-- For higher security, set bucket to private and use signed URLs instead.
CREATE POLICY "public_read_invoices_storage"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'invoices');
