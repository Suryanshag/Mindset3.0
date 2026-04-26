'use client'

import { useState, useEffect } from 'react'

interface Message {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  isRead: boolean
  createdAt: string
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'unread' | 'read'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((res) => { if (res.success) setMessages(res.data) })
      .finally(() => setLoading(false))
  }, [])

  async function markAsRead(id: string) {
    const res = await fetch(`/api/admin/messages/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    if (data.success) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)))
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead).length
  const filtered =
    tab === 'all' ? messages :
    tab === 'unread' ? messages.filter((m) => !m.isRead) :
    messages.filter((m) => m.isRead)

  if (loading) return <div className="p-8 text-gray-500">Loading messages...</div>

  const tabs = [
    { key: 'all' as const, label: 'All' },
    { key: 'unread' as const, label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
    { key: 'read' as const, label: 'Read' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Contact Messages</h1>

      <div className="flex gap-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={tab === t.key ? { background: 'var(--coral)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No messages found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              style={{ borderLeft: m.isRead ? undefined : '4px solid var(--coral)' }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <p className="text-xs text-gray-500">
                    {m.email}
                    {m.phone && <> &middot; {m.phone}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                  {!m.isRead && (
                    <button
                      onClick={() => markAsRead(m.id)}
                      className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 font-medium"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </div>
              <p className="font-medium text-gray-800 text-sm mb-1">{m.subject}</p>
              {expandedId === m.id ? (
                <>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{m.message}</p>
                  <button onClick={() => setExpandedId(null)} className="text-xs text-blue-600 mt-1">Show less</button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-600 line-clamp-2">{m.message}</p>
                  {m.message.length > 150 && (
                    <button onClick={() => setExpandedId(m.id)} className="text-xs text-blue-600 mt-1">Show more</button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
