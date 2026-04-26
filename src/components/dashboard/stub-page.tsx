import PageHeader from '@/components/dashboard/page-header'

type Props = {
  title: string
  backHref?: string
}

export default function StubPage({ title, backHref = '/user/profile' }: Props) {
  return (
    <div>
      <PageHeader title={title} back={backHref} />
      <div className="flex flex-col items-center py-16">
        <p className="text-[14px] text-text-muted">Coming soon</p>
      </div>
    </div>
  )
}
