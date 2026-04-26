export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', 'mindset_assignments')
  // Note: developer must create this unsigned upload preset in Cloudinary dashboard
  // Go to: Cloudinary Dashboard > Settings > Upload > Upload Presets > Add preset
  // Set preset name: mindset_assignments, Signing mode: Unsigned

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  if (!cloudName) throw new Error('Cloudinary cloud name not configured')

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
    { method: 'POST', body: formData }
  )

  const data = await res.json()
  if (!res.ok) {
    console.error('Cloudinary upload error:', data)
    throw new Error(data?.error?.message || 'Upload failed')
  }
  return data.secure_url
}
