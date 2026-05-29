import { prisma as p } from '@/lib/prisma'

async function main() {
  const cols: Array<{ column_name: string; data_type: string; is_nullable: string }> = await p.$queryRawUnsafe(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'User'
      AND column_name IN (
        'consented_at','consent_version','consent_ip_address',
        'consent_user_agent','marketing_consent','marketing_consent_at'
      )
    ORDER BY column_name
  `)
  console.log('User consent columns:')
  console.table(cols)

  const enumVals: Array<{ enumlabel: string }> = await p.$queryRawUnsafe(`
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'AuthEventKind'
    ORDER BY e.enumsortorder
  `)
  console.log('\nAuthEventKind values:', enumVals.map((v) => v.enumlabel).join(', '))

  await p.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
