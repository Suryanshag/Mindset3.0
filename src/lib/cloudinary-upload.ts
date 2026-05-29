import crypto from 'crypto'

export interface CloudinaryUploadSignature {
  signature: string
  timestamp: number
  apiKey: string
  cloudName: string
}

/**
 * Generates a server-signed Cloudinary upload token
 * Called from /api/uploads/sign endpoint
 * @param userId User ID for folder organization and security
 * @returns Signed upload parameters with HMAC signature
 */
export async function generateCloudinaryUploadSignature(userId: string): Promise<CloudinaryUploadSignature> {
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const apiKey = process.env.CLOUDINARY_API_KEY
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

  if (!apiSecret || !apiKey || !cloudName) {
    throw new Error('Cloudinary credentials not configured')
  }

  const timestamp = Math.floor(Date.now() / 1000)

  // Build the string to sign: includes constraints that will be enforced by Cloudinary
  const uploadParams = {
    timestamp,
    resource_type: 'image',
    allowed_formats: 'jpg,png,webp',
    max_file_size: 5242880, // 5 MB in bytes
    folder: `mindset/${userId}`, // Organize uploads by user
  }

  // Create signature from params (order matters for HMAC)
  const paramsString = Object.keys(uploadParams)
    .sort()
    .map((key) => `${key}=${uploadParams[key as keyof typeof uploadParams]}`)
    .join('&')

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(paramsString)
    .digest('hex')

  return {
    signature,
    timestamp,
    apiKey,
    cloudName,
  }
}

/**
 * Uploads a file to Cloudinary with server-generated signature
 * Flow:
 * 1. Client calls /api/uploads/sign to get signed token
 * 2. Client uploads directly to Cloudinary with that token
 * 3. Cloudinary validates signature and enforces constraints
 * @param file File to upload
 * @returns Secure URL of uploaded file
 */
export async function uploadToCloudinary(file: File): Promise<string> {
  // Step 1: Call server to get signed upload token
  const signRes = await fetch('/api/uploads/sign', {
    method: 'POST',
  })

  if (!signRes.ok) {
    throw new Error('Failed to get upload credentials')
  }

  const signData = await signRes.json()
  if (!signData.success) {
    throw new Error(signData.error || 'Upload credential generation failed')
  }

  const { signature, timestamp, apiKey, cloudName } = signData.data

  // Step 2: Upload directly to Cloudinary with signed token
  const formData = new FormData()
  formData.append('file', file)
  formData.append('timestamp', timestamp.toString())
  formData.append('signature', signature)
  formData.append('api_key', apiKey)
  formData.append('resource_type', 'image')
  formData.append('allowed_formats', 'jpg,png,webp')
  formData.append('max_file_size', '5242880')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[CLOUDINARY_UPLOAD_ERROR]', data.error?.message || data)
    throw new Error(data?.error?.message || 'Upload failed')
  }

  return data.secure_url
}
