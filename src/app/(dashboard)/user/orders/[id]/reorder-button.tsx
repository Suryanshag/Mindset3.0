'use client'

import { toast } from 'sonner'

export default function ReorderButton() {
  return (
    <button
      onClick={() => toast('Reorder coming soon')}
      className="inline-flex items-center justify-center h-[44px] px-5 rounded-full bg-primary text-white text-[14px] font-medium transition-colors duration-150 hover:opacity-90"
    >
      Reorder
    </button>
  )
}
