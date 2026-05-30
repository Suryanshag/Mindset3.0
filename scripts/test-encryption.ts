// Smoke-test the encryption helper. Run BEFORE the backfill — a green run
// here is the gate that lets us trust the rest of the sprint.
//
// Usage:
//   set -a && source .env.local && set +a && npx tsx scripts/test-encryption.ts

import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
  encryptField,
  decryptField,
  isEncrypted,
} from '@/lib/encryption'

let failed = 0

function check(label: string, pass: boolean, note?: string) {
  if (pass) {
    console.log(`✅ ${label}`)
  } else {
    console.log(`❌ ${label}${note ? ` — ${note}` : ''}`)
    failed += 1
  }
}

// 1. Basic round-trip
{
  const plaintext = 'This is a secret journal entry about my anxiety.'
  const round = decrypt(encrypt(plaintext))
  check('round-trip basic string', round === plaintext)
}

// 2. Serialized round-trip
{
  const plaintext = 'Doctor note: patient reports improved sleep.'
  const serialized = serializeEncrypted(encrypt(plaintext))
  check('serialized has enc_ prefix', serialized.startsWith('enc_'))
  const data = deserializeEncrypted(serialized)
  check('deserialize produces struct', data !== null)
  check('full serialize -> deserialize -> decrypt', data ? decrypt(data) === plaintext : false)
}

// 3. Tampered ciphertext is rejected
{
  const enc = encrypt('sensitive')
  const tampered = { ...enc, ciphertext: Buffer.from('garbage', 'utf8').toString('base64') }
  let threw = false
  try {
    decrypt(tampered)
  } catch {
    threw = true
  }
  check('tampered ciphertext throws on decrypt', threw)
}

// 4. Tampered authTag is rejected
{
  const enc = encrypt('sensitive')
  const badTag = Buffer.alloc(16, 0).toString('base64')
  let threw = false
  try {
    decrypt({ ...enc, authTag: badTag })
  } catch {
    threw = true
  }
  check('tampered authTag throws on decrypt', threw)
}

// 5. Unique IV — same plaintext encrypted twice should produce different ciphertext
{
  const a = encrypt('same input')
  const b = encrypt('same input')
  check('two encryptions of the same plaintext differ', a.ciphertext !== b.ciphertext && a.iv !== b.iv)
}

// 6. Null-safe wrappers
{
  check('encryptField(null) === null', encryptField(null) === null)
  check('encryptField(undefined) === null', encryptField(undefined) === null)
  check('encryptField("") === null', encryptField('') === null)
  check('decryptField(null) === null', decryptField(null) === null)
  check('decryptField(undefined) === null', decryptField(undefined) === null)
  check('decryptField("") === null', decryptField('') === null)

  const plain = 'a small note'
  const stored = encryptField(plain)!
  check('encryptField produces enc_ string', stored.startsWith('enc_'))
  check('decryptField round-trips', decryptField(stored) === plain)
}

// 7. decryptField on a plaintext leak must throw (fail-loud)
{
  let threw = false
  try {
    decryptField('this looks like plaintext')
  } catch {
    threw = true
  }
  check('decryptField throws on non-encrypted input', threw)
}

// 8. isEncrypted detection
{
  check('isEncrypted detects valid prefix', isEncrypted(encryptField('hi')))
  check('isEncrypted rejects plaintext', !isEncrypted('plain'))
  check('isEncrypted handles null/undefined', !isEncrypted(null) && !isEncrypted(undefined))
}

// 9. Large blob (a long journal entry, ~5 KB)
{
  const large = 'Today was a tough day. '.repeat(250)
  const round = decryptField(encryptField(large))
  check('large (~5 KB) text round-trips', round === large)
}

// 10. Unicode (Hindi, emoji)
{
  const unicode = 'मैं ठीक नहीं हूँ 😔'
  const round = decryptField(encryptField(unicode))
  check('unicode + emoji round-trips', round === unicode)
}

// 11. deserializeEncrypted rejects malformed input
{
  check('deserialize rejects no-prefix', deserializeEncrypted('not_encrypted') === null)
  check('deserialize rejects too-few-parts', deserializeEncrypted('enc_a$b') === null)
  check('deserialize rejects empty parts', deserializeEncrypted('enc_$$') === null)
}

console.log('')
if (failed === 0) {
  console.log('✅ All encryption tests passed')
  process.exit(0)
} else {
  console.log(`❌ ${failed} test(s) failed`)
  process.exit(1)
}
