import { isAllowedImageType } from './imageCompression';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// 10MB raw upload limit (before compression, Cloudinary free tier allows up to 10MB)
const MAX_RAW_FILE_SIZE = 10 * 1024 * 1024;

export interface CloudinaryUploadOptions {
  /** Cloudinary folder path (e.g. 'nidora/listings') */
  folder?: string;
  /** Progress callback: 0–100 */
  onProgress?: (progress: number) => void;
}

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Uploads a single image file to Cloudinary using unsigned upload.
 *
 * Returns the secure HTTPS URL of the uploaded image.
 *
 * Validates:
 * - MIME type (jpeg, png, webp only)
 * - File size (≤10MB)
 * - Cloudinary configuration is present
 *
 * Never exposes raw Cloudinary errors to the user.
 */
export function uploadToCloudinary(
  file: File,
  options: CloudinaryUploadOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    // --- Pre-flight validation ---

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      reject(new Error('Image upload is not configured. Please contact support.'));
      return;
    }

    if (!isAllowedImageType(file)) {
      reject(new Error('Only JPEG, PNG, and WebP images are allowed.'));
      return;
    }

    if (file.size > MAX_RAW_FILE_SIZE) {
      reject(new Error('Image is too large. Maximum size is 10MB.'));
      return;
    }

    // --- Build form data ---

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    if (options.folder) {
      formData.append('folder', options.folder);
    }

    // --- Upload via XHR for progress tracking ---

    const xhr = new XMLHttpRequest();
    xhr.open('POST', UPLOAD_URL, true);

    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options.onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        options.onProgress(progress);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response: CloudinaryResponse = JSON.parse(xhr.responseText);
          if (response.secure_url) {
            resolve(response.secure_url);
          } else {
            reject(new Error('Upload completed but no image URL was returned.'));
          }
        } catch {
          reject(new Error('Upload completed but the response was invalid.'));
        }
      } else if (xhr.status === 400) {
        reject(new Error('Upload failed. Please check that the image is valid.'));
      } else if (xhr.status === 401 || xhr.status === 403) {
        reject(new Error('Image upload is not properly configured. Please contact support.'));
      } else {
        reject(new Error('Image upload failed. Please try again.'));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error. Please check your internet connection and try again.'));
    };

    xhr.ontimeout = () => {
      reject(new Error('Upload timed out. Please try again with a smaller image.'));
    };

    // 60 second timeout
    xhr.timeout = 60000;

    xhr.send(formData);
  });
}

/**
 * Uploads multiple images to Cloudinary sequentially.
 *
 * Returns an array of secure URLs.
 * If ANY upload fails, the entire batch is rejected (no partial Firestore writes).
 *
 * @param files Array of File objects (already compressed)
 * @param folder Cloudinary folder path
 * @param onProgress Called with overall progress (0–100) across all files
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string,
  onProgress?: (progress: number) => void
): Promise<string[]> {
  const urls: string[] = [];
  const totalFiles = files.length;

  for (let i = 0; i < totalFiles; i++) {
    const url = await uploadToCloudinary(files[i], {
      folder,
      onProgress: (fileProgress) => {
        if (onProgress) {
          // Overall progress: completed files + current file progress
          const overallProgress = Math.round(
            ((i * 100 + fileProgress) / (totalFiles * 100)) * 100
          );
          onProgress(overallProgress);
        }
      },
    });
    urls.push(url);
  }

  return urls;
}

// TODO: Implement Cloudinary deletion via server-side API route
// For MVP, deleting a listing only removes the Firestore document.
// Cloudinary images remain until manual cleanup or a future server-side
// deletion endpoint is implemented using the Cloudinary Admin API.
