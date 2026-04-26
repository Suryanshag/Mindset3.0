import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  successResponse,
  errorResponse,
  serverErrorResponse,
} from '@/lib/api-response'
import { format, addDays, isToday, isBefore } from 'date-fns'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL =
  process.env.OPENROUTER_MODEL ?? 'google/gemini-2.0-flash-exp:free'

// ── helpers ──────────────────────────────────────────────

/** IST is UTC+5:30 */
function nowIST() {
  return new Date(Date.now() + 5.5 * 60 * 60_000)
}

function formatHour(h: number) {
  if (h === 0) return '12 AM'
  if (h === 12) return '12 PM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

/** Create a Date object for a given YYYY-MM-DD and hour in IST */
function istDate(dateStr: string, hour: number): Date {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00+05:30`)
}

/** Summarise existing slots in a compact format for the AI */
function summariseSlots(
  slots: { id: string; date: Date; isBooked: boolean }[]
) {
  if (slots.length === 0) return 'No upcoming slots.'

  // Group by date (IST)
  const byDate = new Map<
    string,
    { available: number[]; booked: number[] }
  >()
  for (const s of slots) {
    // Convert to IST for display
    const ist = new Date(s.date.getTime() + 5.5 * 60 * 60_000)
    const key = format(ist, 'yyyy-MM-dd')
    if (!byDate.has(key))
      byDate.set(key, { available: [], booked: [] })
    const entry = byDate.get(key)!
    const hour = ist.getHours()
    if (s.isBooked) entry.booked.push(hour)
    else entry.available.push(hour)
  }

  const lines: string[] = []
  for (const [date, { available, booked }] of byDate) {
    const d = new Date(date + 'T00:00:00+05:30')
    const dayLabel = format(d, 'EEE, MMM d')
    const parts: string[] = []
    if (available.length)
      parts.push(
        `available: ${available.sort((a, b) => a - b).map(formatHour).join(', ')}`
      )
    if (booked.length)
      parts.push(
        `booked: ${booked.sort((a, b) => a - b).map(formatHour).join(', ')}`
      )
    lines.push(`- ${dayLabel}: ${parts.join(' | ')}`)
  }
  return lines.join('\n')
}

/** Extract JSON from text that might contain markdown fences */
function extractJSON(text: string) {
  // Direct parse
  try {
    return JSON.parse(text)
  } catch {}

  // Try markdown code block
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenced) {
    try {
      return JSON.parse(fenced[1])
    } catch {}
  }

  // Try first { to last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1))
    } catch {}
  }

  return null
}

// ── route ────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Auth
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    const role = session.user.role as string
    if (role !== 'DOCTOR' && role !== 'ADMIN')
      return errorResponse('Forbidden', 403)

    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
    })
    if (!doctor) return errorResponse('Doctor profile not found', 404)

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey)
      return errorResponse(
        'AI service not configured. Add OPENROUTER_API_KEY to your environment.',
        503
      )

    const body = await req.json()
    const message = body.message?.trim()
    if (!message) return errorResponse('Message is required')

    // Fetch future slots for context
    const existingSlots = await prisma.availableSlot.findMany({
      where: { doctorId: doctor.id, date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      select: { id: true, date: true, isBooked: true },
    })

    const ist = nowIST()
    const slotsContext = summariseSlots(existingSlots)

    // Build prompt
    const systemPrompt = `You are a scheduling assistant for a doctor on a mental health platform.
Your job is to convert the doctor's natural language instructions into structured slot actions.

CURRENT DATE/TIME (IST): ${format(ist, 'EEEE, MMMM d, yyyy')} at ${format(ist, 'h:mm a')}

TODAY: ${format(ist, 'yyyy-MM-dd')} (${format(ist, 'EEEE')})
TOMORROW: ${format(addDays(ist, 1), 'yyyy-MM-dd')} (${format(addDays(ist, 1), 'EEEE')})

RULES:
- Slots are 1-hour appointments, on the hour
- Valid hours: 7 AM to 9 PM (values 7 through 21)
- NEVER add slots in the past
- NEVER remove booked slots — only available slots can be removed
- "morning" = hours 9,10,11 (9 AM–11 AM)
- "afternoon" = hours 12,13,14,15,16 (12 PM–4 PM)
- "evening" = hours 17,18,19,20 (5 PM–8 PM)
- "full day" / "all day" = hours 9,10,11,12,13,14,15,16,17 (9 AM–5 PM)
- "working hours" = hours 9,10,11,12,13,14,15,16,17 (9 AM–5 PM)
- Sunday is a rest day by default unless the doctor says otherwise

DOCTOR'S EXISTING UPCOMING SLOTS:
${slotsContext}

RESPOND WITH ONLY a JSON object — no markdown, no explanation:
{
  "add": [
    { "date": "YYYY-MM-DD", "hours": [9, 10, 11] }
  ],
  "remove": [
    { "date": "YYYY-MM-DD", "hours": [14, 15] }
  ],
  "summary": "Brief friendly summary of changes"
}

- "add": array of dates with hours to create (empty array [] if none)
- "remove": array of dates with hours to delete (empty array [] if none)
- "summary": human-readable message about what was done
- If the request is unclear or unrelated to scheduling, return empty arrays and explain in summary`

    // Call OpenRouter
    const aiRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        temperature: 0.1,
      }),
    })

    if (!aiRes.ok) {
      console.error('[AI_SLOTS] OpenRouter error:', await aiRes.text())
      return errorResponse('AI service temporarily unavailable', 503)
    }

    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content
    if (!content) return errorResponse('No response from AI')

    // Parse AI response
    const plan = extractJSON(content)
    if (!plan) {
      console.error('[AI_SLOTS] Failed to parse:', content)
      return errorResponse(
        'AI returned an unexpected response. Please try rephrasing.'
      )
    }

    // ── Execute plan ─────────────────────────────────────

    let addedCount = 0
    let removedCount = 0
    let skippedCount = 0
    const now = new Date()

    // ADD slots
    const addEntries: { date: string; hours: number[] }[] =
      plan.add ?? []
    const datesToAdd: Date[] = []

    for (const entry of addEntries) {
      if (!entry.date || !Array.isArray(entry.hours)) continue
      for (const hour of entry.hours) {
        if (hour < 7 || hour > 21) continue
        const d = istDate(entry.date, hour)
        if (isBefore(d, now)) {
          skippedCount++
          continue
        }
        datesToAdd.push(d)
      }
    }

    if (datesToAdd.length > 0) {
      const result = await prisma.availableSlot.createMany({
        data: datesToAdd.map((date) => ({
          doctorId: doctor.id,
          date,
        })),
        skipDuplicates: true,
      })
      addedCount = result.count
    }

    // REMOVE slots
    const removeEntries: { date: string; hours: number[] }[] =
      plan.remove ?? []

    for (const entry of removeEntries) {
      if (!entry.date || !Array.isArray(entry.hours)) continue
      for (const hour of entry.hours) {
        const d = istDate(entry.date, hour)
        // Find matching unbooked slot
        const slot = existingSlots.find(
          (s) =>
            !s.isBooked &&
            Math.abs(s.date.getTime() - d.getTime()) < 60_000
        )
        if (slot) {
          await prisma.availableSlot.delete({
            where: { id: slot.id },
          })
          removedCount++
        }
      }
    }

    const summary =
      plan.summary ??
      `Added ${addedCount} slots, removed ${removedCount} slots.`

    return successResponse({
      summary,
      added: addedCount,
      removed: removedCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('[AI_SLOTS_ERROR]', error)
    return serverErrorResponse()
  }
}
