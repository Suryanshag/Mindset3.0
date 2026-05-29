import { auth } from '@/lib/auth'
import { generateCloudinaryUploadSignature } from '@/lib/cloudinary-upload'
import { successResponse, errorResponse, serverErrorResponse } from '@/lib/api-response'
import { apiLimiter } from '@/lib/arcjet'
import { handleArcjetDenial } from '@/lib/arcjet-protect'

/**
 * Generate a server-signed Cloudinary upload token
 * Client calls this endpoint, gets a signed token, then uploads directly to Cloudinary
 * This ensures file constraints are enforced server-side
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return errorResponse('Unauthorized', 401)
    }

    // Rate limit file uploads to prevent abuse
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decision = await apiLimiter.protect(req as any)
    const denied = handleArcjetDenial(decision)
    if (denied) return denied

    // Generate signed upload token scoped to this user
    const signedParams = await generateCloudinaryUploadSignature(session.user.id)

    return successResponse({
      signature: signedParams.signature,
      timestamp: signedParams.timestamp,
      apiKey: signedParams.apiKey,
      cloudName: signedParams.cloudName,
    })
  } catch (error) {
    console.error('[UPLOAD_SIGN_ERROR]', error)
    return serverErrorResponse()
  }
}
