/**
 * File upload validation helpers
 * Enforces strict MIME type and size limits for different upload categories
 */

export const FILE_UPLOAD_CONFIG = {
  images: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSizeBytes: 5 * 1024 * 1024, // 5 MB
    maxSizeLabel: '5 MB',
    description: 'JPEG, PNG, or WebP images (max 5 MB)',
  },
  documents: {
    allowedMimeTypes: ['application/pdf'],
    maxSizeBytes: 10 * 1024 * 1024, // 10 MB
    maxSizeLabel: '10 MB',
    description: 'PDF documents (max 10 MB)',
  },
} as const

export type FileUploadCategory = keyof typeof FILE_UPLOAD_CONFIG

/**
 * Validates file type and size before upload
 * @param file The File object from input element
 * @param category The upload category (images, documents, etc.)
 * @returns Object with valid flag and error message if invalid
 */
export function validateFileUpload(
  file: File,
  category: FileUploadCategory
): { valid: boolean; error?: string } {
  const config = FILE_UPLOAD_CONFIG[category]

  // Check file exists
  if (!file) {
    return {
      valid: false,
      error: 'No file selected.',
    }
  }

  // Check MIME type
  if (!Array.from(config.allowedMimeTypes).includes(file.type as never)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
    }
  }

  // Check file size
  if (file.size > config.maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size: ${config.maxSizeLabel}`,
    }
  }

  return { valid: true }
}

/**
 * Gets the file upload configuration for a category
 * Useful for displaying requirements to users
 */
export function getUploadConfig(category: FileUploadCategory) {
  return FILE_UPLOAD_CONFIG[category]
}
