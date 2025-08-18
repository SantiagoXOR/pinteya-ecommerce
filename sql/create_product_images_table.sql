-- 🖼️ Product Images Table Creation Script
-- Enterprise-ready table for product image management

-- Create product_images table
CREATE TABLE IF NOT EXISTS product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 0,
    file_size INTEGER,
    file_type VARCHAR(50),
    original_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_is_primary ON product_images(is_primary);
CREATE INDEX IF NOT EXISTS idx_product_images_display_order ON product_images(display_order);

-- Create unique constraint to ensure only one primary image per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_unique_primary 
ON product_images(product_id) 
WHERE is_primary = TRUE;

-- Enable Row Level Security
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can view product images" ON product_images
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage product images" ON product_images
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_update_product_images_updated_at
    BEFORE UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION update_product_images_updated_at();

-- Create function to ensure only one primary image per product
CREATE OR REPLACE FUNCTION ensure_single_primary_image()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this image as primary, unset all other primary images for this product
    IF NEW.is_primary = TRUE THEN
        UPDATE product_images 
        SET is_primary = FALSE 
        WHERE product_id = NEW.product_id 
        AND id != NEW.id 
        AND is_primary = TRUE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary image constraint
CREATE TRIGGER trigger_ensure_single_primary_image
    BEFORE INSERT OR UPDATE ON product_images
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_image();

-- Create storage bucket for product images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Public can view product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can update product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' 
        AND auth.role() = 'authenticated'
    );

-- Add helpful comments
COMMENT ON TABLE product_images IS 'Stores product images with metadata and storage references';
COMMENT ON COLUMN product_images.product_id IS 'Reference to the product this image belongs to';
COMMENT ON COLUMN product_images.url IS 'Public URL to access the image';
COMMENT ON COLUMN product_images.storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN product_images.is_primary IS 'Whether this is the primary/featured image for the product';
COMMENT ON COLUMN product_images.display_order IS 'Order for displaying images (0 = first)';
COMMENT ON COLUMN product_images.file_size IS 'File size in bytes';
COMMENT ON COLUMN product_images.file_type IS 'MIME type of the image file';

-- Create view for products with their images
CREATE OR REPLACE VIEW products_with_images AS
SELECT 
    p.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', pi.id,
                'url', pi.url,
                'alt_text', pi.alt_text,
                'is_primary', pi.is_primary,
                'display_order', pi.display_order,
                'file_size', pi.file_size,
                'file_type', pi.file_type
            ) ORDER BY pi.display_order, pi.created_at
        ) FILTER (WHERE pi.id IS NOT NULL),
        '[]'::json
    ) AS images,
    (
        SELECT pi2.url 
        FROM product_images pi2 
        WHERE pi2.product_id = p.id 
        AND pi2.is_primary = TRUE 
        LIMIT 1
    ) AS primary_image_url
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id;

COMMENT ON VIEW products_with_images IS 'Products with their associated images aggregated as JSON';

-- Grant permissions
GRANT ALL ON product_images TO authenticated;
GRANT SELECT ON products_with_images TO authenticated;
GRANT SELECT ON products_with_images TO anon;
