'use server'

/**
 * Pages that read from User (name, image) and need revalidation on mutation:
 *   /user            — dashboard header shows avatar + name
 *   /user/profile    — large avatar, name, email
 *   /user/layout     — reads session for auth (name not directly rendered)
 *
 * If you add a new page that renders user.image or user.name, add it to the
 * revalidatePath calls at the end of each mutation below.
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadAvatar(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: 'Unauthorized' }
  }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) {
    return { error: 'No file provided' }
  }

  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File must be under 5 MB' }
  }

  try {
    // Resize to 256x256 with sharp
    const buffer = Buffer.from(await file.arrayBuffer())
    const resized = await sharp(buffer)
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Upload to Cloudinary
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'mindset/avatars',
          public_id: `user_${session.user.id}`,
          overwrite: true,
          transformation: { width: 256, height: 256, crop: 'fill' },
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'))
          else resolve(result)
        }
      )
      stream.end(resized)
    })

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
    })

    revalidatePath('/user')
    revalidatePath('/user/profile')

    return { url: result.secure_url }
  } catch (err) {
    console.error('[UPLOAD_AVATAR]', err)
    return { error: 'Upload failed. Please try again.' }
  }
}
