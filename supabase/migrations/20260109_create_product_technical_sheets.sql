-- 📄 Product Technical Sheets Table Creation Script
-- Enterprise-ready table for product technical sheet (PDF) management

-- Create product_technical_sheets table
CREATE TABLE IF NOT EXISTS product_technical_sheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    title TEXT,
    original_filename TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(50) DEFAULT 'application/pdf',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: Only one technical sheet per product
    CONSTRAINT unique_product_technical_sheet UNIQUE (product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_technical_sheets_product_id ON product_technical_sheets(product_id);

-- Enable Row Level Security
ALTER TABLE product_technical_sheets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view product technical sheets" ON product_technical_sheets
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage product technical sheets" ON product_technical_sheets
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_technical_sheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_product_technical_sheets_updated_at
    BEFORE UPDATE ON product_technical_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_product_technical_sheets_updated_at();

-- Create storage bucket for product documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-documents', 'product-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for product-documents bucket
CREATE POLICY "Public can view product documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-documents');

CREATE POLICY "Authenticated users can upload product documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update product documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete product documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-documents' 
        AND auth.role() = 'authenticated'
    );

-- Add helpful comments
COMMENT ON TABLE product_technical_sheets IS 'Stores product technical sheets (PDFs) with metadata and storage references';
COMMENT ON COLUMN product_technical_sheets.product_id IS 'Reference to the product this technical sheet belongs to';
COMMENT ON COLUMN product_technical_sheets.url IS 'Public URL to access the PDF';
COMMENT ON COLUMN product_technical_sheets.storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN product_technical_sheets.title IS 'Display title for the technical sheet';
COMMENT ON COLUMN product_technical_sheets.original_filename IS 'Original filename of the uploaded PDF';
COMMENT ON COLUMN product_technical_sheets.file_size IS 'File size in bytes';

-- Create view for products with their technical sheets
CREATE OR REPLACE VIEW products_with_technical_sheets AS
SELECT 
    p.*,
    json_build_object(
        'id', pts.id,
        'url', pts.url,
        'title', pts.title,
        'original_filename', pts.original_filename,
        'file_size', pts.file_size
    ) AS technical_sheet
FROM products p
LEFT JOIN product_technical_sheets pts ON p.id = pts.product_id;

COMMENT ON VIEW products_with_technical_sheets IS 'Products with their associated technical sheets';

-- Grant permissions
GRANT ALL ON product_technical_sheets TO authenticated;
GRANT SELECT ON products_with_technical_sheets TO authenticated;
GRANT SELECT ON products_with_technical_sheets TO anon;
