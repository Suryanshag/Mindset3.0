import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  backHref?: string
}

export default function StubPage({ title, backHref = '/user/profile' }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href={backHref} className="p-1">
          <ArrowLeft size={18} className="text-text" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">{title}</h1>
      </div>
      <div className="flex flex-col items-center py-16">
        <p className="text-[14px] text-text-muted">Coming soon</p>
      </div>
    </div>
  )
}
