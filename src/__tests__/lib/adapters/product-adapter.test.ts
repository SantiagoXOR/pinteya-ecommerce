import { getValidImageUrl, getThumbnailImage, getPreviewImage } from '@/lib/adapters/product-adapter';

describe('Product Image Validation Functions', () => {
  describe('getValidImageUrl', () => {
    it('should return the image URL when it is valid', () => {
      const validUrl = 'https://example.com/image.jpg';
      expect(getValidImageUrl(validUrl)).toBe(validUrl);
    });

    it('should return placeholder when image URL is empty string', () => {
      const emptyUrl = '';
      const result = getValidImageUrl(emptyUrl);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when image URL is only whitespace', () => {
      const whitespaceUrl = '   ';
      const result = getValidImageUrl(whitespaceUrl);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when image URL is undefined', () => {
      const result = getValidImageUrl(undefined);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when image URL is null', () => {
      const result = getValidImageUrl(null);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should trim whitespace from valid URLs', () => {
      const urlWithWhitespace = '  https://example.com/image.jpg  ';
      const result = getValidImageUrl(urlWithWhitespace);
      expect(result).toBe('https://example.com/image.jpg');
    });

    it('should use custom fallback when provided', () => {
      const customFallback = '/custom/placeholder.png';
      const result = getValidImageUrl('', customFallback);
      expect(result).toBe(customFallback);
    });
  });

  describe('getThumbnailImage', () => {
    it('should return valid thumbnail from imgs property', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: ['https://example.com/thumb.jpg'],
          previews: ['https://example.com/preview.jpg']
        }
      };
      
      const result = getThumbnailImage(product);
      expect(result).toBe('https://example.com/thumb.jpg');
    });

    it('should return placeholder when thumbnail is empty string', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: [''],
          previews: ['https://example.com/preview.jpg']
        }
      };
      
      const result = getThumbnailImage(product);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when no thumbnails exist', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: [],
          previews: ['https://example.com/preview.jpg']
        }
      };
      
      const result = getThumbnailImage(product);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when imgs is undefined', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5
      };
      
      const result = getThumbnailImage(product);
      expect(result).toBe('/images/products/placeholder.svg');
    });
  });

  describe('getPreviewImage', () => {
    it('should return valid preview from imgs property', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: ['https://example.com/thumb.jpg'],
          previews: ['https://example.com/preview.jpg']
        }
      };
      
      const result = getPreviewImage(product);
      expect(result).toBe('https://example.com/preview.jpg');
    });

    it('should return placeholder when preview is empty string', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: ['https://example.com/thumb.jpg'],
          previews: ['']
        }
      };
      
      const result = getPreviewImage(product);
      expect(result).toBe('/images/products/placeholder.svg');
    });

    it('should return placeholder when no previews exist', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: ['https://example.com/thumb.jpg'],
          previews: []
        }
      };
      
      const result = getPreviewImage(product);
      expect(result).toBe('/images/products/placeholder.svg');
    });
  });

  describe('Edge Cases', () => {
    it('should handle products with images property instead of imgs', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        images: {
          thumbnails: ['https://example.com/thumb.jpg'],
          previews: ['https://example.com/preview.jpg']
        }
      };
      
      const thumbnailResult = getThumbnailImage(product as any);
      const previewResult = getPreviewImage(product as any);
      
      expect(thumbnailResult).toBe('https://example.com/thumb.jpg');
      expect(previewResult).toBe('https://example.com/preview.jpg');
    });

    it('should handle mixed empty and valid URLs in arrays', () => {
      const product = {
        id: 1,
        title: 'Test Product',
        price: 100,
        discountedPrice: 90,
        reviews: 5,
        imgs: {
          thumbnails: ['', '  ', 'https://example.com/thumb.jpg'],
          previews: ['', 'https://example.com/preview.jpg']
        }
      };
      
      // Should still return placeholder because first element is empty
      const thumbnailResult = getThumbnailImage(product);
      const previewResult = getPreviewImage(product);
      
      expect(thumbnailResult).toBe('/images/products/placeholder.svg');
      expect(previewResult).toBe('/images/products/placeholder.svg');
    });
  });
});









