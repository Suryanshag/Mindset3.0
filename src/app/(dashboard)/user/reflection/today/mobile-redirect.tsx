'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MobileRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (window.innerWidth < 1024) {
      router.replace('/user/practice/journal/new')
    }
  }, [router])

  return null
}
