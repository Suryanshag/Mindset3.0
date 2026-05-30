import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.DATA_ENCRYPTION_KEY

if (!ENCRYPTION_KEY || !/^[0-9a-fA-F]{64}$/.test(ENCRYPTION_KEY)) {
  throw new Error(
    'DATA_ENCRYPTION_KEY must be a 64-char hex string (32 bytes). ' +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  )
}

const KEY_BUFFER = Buffer.from(ENCRYPTION_KEY, 'hex')
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // 96-bit IV is the recommended size for GCM
const SERIALIZED_PREFIX = 'enc_'

export interface EncryptedData {
  ciphertext: string
  iv: string
  authTag: string
}

export function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY_BUFFER, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  return {
    ciphertext: ciphertext.toString('base64'),
    iv: iv.toString('base64'),
    authTag: cipher.getAuthTag().toString('base64'),
  }
}

export function decrypt(encrypted: EncryptedData): string {
  const iv = Buffer.from(encrypted.iv, 'base64')
  const authTag = Buffer.from(encrypted.authTag, 'base64')
  const ciphertext = Buffer.from(encrypted.ciphertext, 'base64')
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY_BUFFER, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
}

export function serializeEncrypted(data: EncryptedData): string {
  return `${SERIALIZED_PREFIX}${data.ciphertext}$${data.iv}$${data.authTag}`
}

export function deserializeEncrypted(serialized: string): EncryptedData | null {
  if (!serialized.startsWith(SERIALIZED_PREFIX)) return null
  const payload = serialized.slice(SERIALIZED_PREFIX.length)
  const parts = payload.split('$')
  if (parts.length !== 3) return null
  const [ciphertext, iv, authTag] = parts
  if (!ciphertext || !iv || !authTag) return null
  return { ciphertext, iv, authTag }
}

export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(SERIALIZED_PREFIX)
}

// Null-safe wrappers — these are what call sites should use. They
// collapse null / undefined / empty-string to null on the way in, and
// throw on tampered ciphertext on the way out (fail-loud).

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext === null || plaintext === undefined || plaintext === '') return null
  return serializeEncrypted(encrypt(plaintext))
}

export function decryptField(serialized: string | null | undefined): string | null {
  if (serialized === null || serialized === undefined || serialized === '') return null
  const data = deserializeEncrypted(serialized)
  if (!data) {
    throw new Error(
      'decryptField received a non-encrypted value. ' +
        'This means either a plaintext leak into an *Encrypted column or a corrupted row.'
    )
  }
  return decrypt(data)
}
