'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Loader2, X, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  stats?: { added: number; removed: number; skipped: number }
}

export default function SlotAIAgent({
  onSlotsChanged,
}: {
  onSlotsChanged: () => void
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)

    try {
      const res = await fetch('/api/doctor/slots/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })
      const data = await res.json()

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.summary,
            stats: {
              added: data.data.added,
              removed: data.data.removed,
              skipped: data.data.skipped,
            },
          },
        ])
        // Refresh the calendar if changes were made
        if (data.data.added > 0 || data.data.removed > 0) {
          onSlotsChanged()
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.error ?? 'Something went wrong. Please try again.',
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Failed to connect. Please check your internet and try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-colors border-2 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-300"
      >
        <Sparkles className="w-4 h-4" />
        AI Assistant
      </button>
    )
  }

  return (
    <div className="mb-6 bg-white rounded-2xl border-2 border-purple-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Slot Assistant
            </h3>
            <p className="text-xs text-purple-200">
              Tell me how to manage your slots
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="px-4 py-4 space-y-3 max-h-80 overflow-y-auto"
        style={{ minHeight: messages.length === 0 ? undefined : '120px' }}
      >
        {messages.length === 0 && (
          <div className="text-center py-6">
            <Bot className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 font-medium mb-3">
              Try saying something like:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Add slots for next week, 9 AM to 5 PM',
                'Remove all slots on Friday',
                'Add evening slots for tomorrow',
                'Clear all slots for next Monday',
              ].map((example) => (
                <button
                  key={example}
                  onClick={() => {
                    setInput(example)
                    inputRef.current?.focus()
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors border border-purple-100"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-800 rounded-bl-md'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.stats &&
                (msg.stats.added > 0 || msg.stats.removed > 0) && (
                  <div
                    className={`flex gap-3 mt-2 pt-2 text-xs font-medium ${
                      msg.role === 'user'
                        ? 'border-t border-purple-400 text-purple-200'
                        : 'border-t border-gray-200 text-gray-500'
                    }`}
                  >
                    {msg.stats.added > 0 && (
                      <span className="text-green-600">
                        +{msg.stats.added} added
                      </span>
                    )}
                    {msg.stats.removed > 0 && (
                      <span className="text-red-500">
                        -{msg.stats.removed} removed
                      </span>
                    )}
                    {msg.stats.skipped > 0 && (
                      <span className="text-amber-500">
                        {msg.stats.skipped} skipped
                      </span>
                    )}
                  </div>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 pb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Add slots for next week 10am to 4pm..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 disabled:opacity-50 disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40 flex items-center gap-1.5 font-medium text-sm flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
