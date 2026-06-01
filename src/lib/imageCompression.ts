const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1600;
const TARGET_SIZE_BYTES = 500 * 1024; // 500KB
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.1;

/**
 * Validates that a file has an allowed image MIME type.
 */
export function isAllowedImageType(file: File): boolean {
  return ALLOWED_MIME_TYPES.includes(file.type);
}

/**
 * Compresses an image file client-side before upload.
 *
 * - Resizes to max 1600×1600 (preserving aspect ratio)
 * - Converts to JPEG
 * - Iteratively reduces quality until the file is ≤500KB
 *
 * Returns a new File object with the compressed image data.
 */
export async function compressImage(file: File): Promise<File> {
  // If the file is already small enough and a JPEG, skip compression
  if (file.size <= TARGET_SIZE_BYTES && file.type === 'image/jpeg') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down preserving aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Iteratively reduce quality until file is under target size
        let quality = INITIAL_QUALITY;
        let blob: Blob | null = null;

        while (quality >= MIN_QUALITY) {
          blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/jpeg', quality)
          );

          if (blob && blob.size <= TARGET_SIZE_BYTES) {
            break;
          }

          quality -= QUALITY_STEP;
        }

        // Final attempt at minimum quality if still too large
        if (!blob || blob.size > TARGET_SIZE_BYTES) {
          blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, 'image/jpeg', MIN_QUALITY)
          );
        }

        if (!blob) {
          reject(new Error('Image compression failed'));
          return;
        }

        // Generate a clean filename
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const compressedFile = new File(
          [blob],
          `${baseName}.jpg`,
          { type: 'image/jpeg', lastModified: Date.now() }
        );

        resolve(compressedFile);
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
  });
}
