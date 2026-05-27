'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2, ChevronLeft, ChevronRight, ChevronDown,
  Calendar, Zap, X, Check, Plane, AlertCircle,
} from 'lucide-react'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import SlotAIAgent from '@/components/dashboard/doctor/slot-ai-agent'
import {
  format,
  startOfMonth, endOfMonth,
  startOfWeek, endOfWeek,
  eachDayOfInterval,
  isSameMonth, isSameDay, isToday, isPast,
  addMonths, subMonths,
  isBefore,
} from 'date-fns'
import { startOfDayIST, startOfNextDayIST } from '@/lib/format-date'

interface Slot {
  id: string
  date: string
  isBooked: boolean
}

interface Leave {
  id: string
  startDate: string
  endDate: string
  reason: string | null
  createdAt: string
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function isDateOnLeave(d: Date, leaves: Leave[]): boolean {
  // IST-aligned comparison; leave dates come from @db.Date so they
  // already round to UTC midnight, but slotDate is a DateTime instant.
  const dayStart = startOfDayIST(d)
  return leaves.some((l) => {
    const ls = startOfDayIST(l.startDate)
    const le = startOfNextDayIST(l.endDate)
    return dayStart >= ls && dayStart < le
  })
}

// All possible hours in a day (7am to 9pm)
const ALL_HOURS = Array.from(
  { length: 15 },
  (_, i) => i + 7
) // [7,8,9,...,21]

const formatHour = (hour: number) => {
  if (hour === 12) return '12:00 PM'
  if (hour < 12) return `${hour}:00 AM`
  return `${hour - 12}:00 PM`
}

export default function DoctorSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] =
    useState<Date | null>(null)
  const [currentMonth, setCurrentMonth] =
    useState(new Date())
  const [pendingHours, setPendingHours] =
    useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Bulk mode state
  const [showBulk, setShowBulk] = useState(false)
  const [bulkStartDate, setBulkStartDate] = useState('')
  const [bulkEndDate, setBulkEndDate] = useState('')
  const [bulkStartHour, setBulkStartHour] = useState(9)
  const [bulkEndHour, setBulkEndHour] = useState(17)
  const [bulkMode, setBulkMode] = useState<'uniform' | 'per-day'>('uniform')
  const [bulkDays, setBulkDays] = useState<Record<number, boolean>>({
    0: false, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true,
  })
  const [perDayHours, setPerDayHours] = useState<Record<number, { start: number; end: number }>>({
    0: { start: 10, end: 17 },
    1: { start: 10, end: 17 },
    2: { start: 10, end: 17 },
    3: { start: 10, end: 17 },
    4: { start: 10, end: 17 },
    5: { start: 10, end: 17 },
    6: { start: 12, end: 16 },
  })
  const [isBulkAdding, setIsBulkAdding] = useState(false)

  // Leave / Time Off state
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [showLeavePanel, setShowLeavePanel] = useState(false)
  const [leaveStart, setLeaveStart] = useState('')
  const [leaveEnd, setLeaveEnd] = useState('')
  const [leaveReason, setLeaveReason] = useState('')
  const [isAddingLeave, setIsAddingLeave] = useState(false)
  const [leaveError, setLeaveError] = useState('')
  const [bookedWarning, setBookedWarning] = useState(0)

  const showSuccess = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const fetchSlots = async (showLoader = true) => {
    if (showLoader) setIsLoading(true)
    try {
      const res = await fetch('/api/doctor/slots')
      const data = await res.json()
      if (data.success) setSlots(data.data)
    } catch {
      setError('Failed to load slots')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchSlots() }, [])

  useEffect(() => {
    fetch('/api/doctor/leaves')
      .then((r) => r.json())
      .then((d) => { if (d.success) setLeaves(d.data) })
      .catch(() => {})
  }, [])

  async function handleAddLeave() {
    setLeaveError('')
    setBookedWarning(0)
    setIsAddingLeave(true)
    try {
      const res = await fetch('/api/doctor/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: leaveStart,
          endDate: leaveEnd,
          reason: leaveReason || undefined,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setLeaves((prev) => [data.data.leave, ...prev])
        if (data.data.bookedSessionsInRange > 0) {
          setBookedWarning(data.data.bookedSessionsInRange)
        }
        setLeaveStart('')
        setLeaveEnd('')
        setLeaveReason('')
      } else {
        setLeaveError(data.error || 'Failed to add leave')
      }
    } catch {
      setLeaveError('Failed to add leave')
    } finally {
      setIsAddingLeave(false)
    }
  }

  async function handleDeleteLeave(id: string) {
    if (!window.confirm('Cancel this leave period? Your slots in this range will reappear for booking.')) return
    try {
      const res = await fetch(`/api/doctor/leaves/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setLeaves((prev) => prev.filter((l) => l.id !== id))
      }
    } catch {
      // Silent — non-critical, user can retry.
    }
  }

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {}
    slots.forEach(slot => {
      const key = format(new Date(slot.date), 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(slot)
    })
    return map
  }, [slots])

  // When date selected, init pendingHours from existing slots
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    const key = format(date, 'yyyy-MM-dd')
    const existing = slotsByDate[key] ?? []
    const existingHours = new Set(
      existing.map(s => new Date(s.date).getHours())
    )
    setPendingHours(existingHours)
  }

  // Calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart,
      { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd,
      { weekStartsOn: 1 })
    return eachDayOfInterval({
      start: calStart, end: calEnd
    })
  }, [currentMonth])

  // Save changes for selected date
  const handleSaveDay = async () => {
    if (!selectedDate) return
    setIsSaving(true)
    setError(null)

    const key = format(selectedDate, 'yyyy-MM-dd')
    const existing = slotsByDate[key] ?? []

    // Hours to add (in pendingHours but not in existing)
    const existingHours = new Set(
      existing.map(s => new Date(s.date).getHours())
    )
    const hoursToAdd = Array.from(pendingHours).filter(
      h => !existingHours.has(h)
    )

    // Hours to remove (in existing but not in pendingHours)
    // Only non-booked slots can be removed
    const slotsToRemove = existing.filter(s =>
      !s.isBooked &&
      !pendingHours.has(new Date(s.date).getHours())
    )

    try {
      // Add new slots
      if (hoursToAdd.length > 0) {
        const dates = hoursToAdd.map(hour => {
          const d = new Date(selectedDate)
          d.setHours(hour, 0, 0, 0)
          return d.toISOString()
        })
        const res = await fetch('/api/doctor/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dates }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error)
      }

      // Remove slots
      for (const slot of slotsToRemove) {
        await fetch(`/api/doctor/slots/${slot.id}`, {
          method: 'DELETE',
        })
      }

      await fetchSlots(false)
      showSuccess(
        `Saved ${hoursToAdd.length} new slots` +
        (slotsToRemove.length > 0
          ? `, removed ${slotsToRemove.length}` : '')
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save slots'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  // Bulk add slots
  const handleBulkAdd = async () => {
    if (!bulkStartDate || !bulkEndDate) {
      setError('Please select start and end dates')
      return
    }
    if (bulkMode === 'uniform' && bulkStartHour > bulkEndHour) {
      setError('Start time must be before end time')
      return
    }
    if (!Object.values(bulkDays).some(Boolean)) {
      setError('Pick at least one working day')
      return
    }

    setIsBulkAdding(true)
    setError(null)

    try {
      const start = new Date(bulkStartDate)
      const end = new Date(bulkEndDate)
      const dates: string[] = []
      let skippedForLeave = 0

      const current = new Date(start)
      while (current <= end) {
        const weekday = current.getDay()

        if (bulkDays[weekday]) {
          if (isDateOnLeave(current, leaves)) {
            skippedForLeave++
          } else {
            const hours = bulkMode === 'per-day'
              ? perDayHours[weekday]
              : { start: bulkStartHour, end: bulkEndHour }

            if (hours.start <= hours.end && (!isPast(current) || isToday(current))) {
              for (let h = hours.start; h <= hours.end; h++) {
                const d = new Date(current)
                d.setHours(h, 0, 0, 0)
                if (!isBefore(d, new Date())) {
                  dates.push(d.toISOString())
                }
              }
            }
          }
        }
        current.setDate(current.getDate() + 1)
      }

      if (dates.length === 0) {
        setError(
          skippedForLeave > 0
            ? `No slots created — all matching days are within an active leave period`
            : 'No valid future slots in selected range'
        )
        setIsBulkAdding(false)
        return
      }

      // Send in batches of 50
      const batchSize = 50
      for (let i = 0; i < dates.length; i += batchSize) {
        const batch = dates.slice(i, i + batchSize)
        await fetch('/api/doctor/slots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dates: batch }),
        })
      }

      await fetchSlots(false)
      setShowBulk(false)
      showSuccess(
        `Added ${dates.length} slots${skippedForLeave > 0 ? ` (${skippedForLeave} day${skippedForLeave === 1 ? '' : 's'} skipped — on leave)` : ''}`
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Bulk add failed'
      setError(message)
    } finally {
      setIsBulkAdding(false)
    }
  }

  // Get available hours for selected date
  // (filter out past hours if today)
  const availableHours = useMemo(() => {
    if (!selectedDate) return ALL_HOURS
    const nowHour = new Date().getHours()
    if (isToday(selectedDate)) {
      return ALL_HOURS.filter(h => h > nowHour)
    }
    return ALL_HOURS
  }, [selectedDate])

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Manage Availability
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Click a date to add or remove time slots
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* AI agent hidden — free model was unreliable. Restore when migrating to paid model. */}
          {/* <SlotAIAgent onSlotsChanged={() => fetchSlots(false)} /> */}
          <button
            onClick={() => setShowBulk(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            <Zap className="w-4 h-4" />
            Bulk Add
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <X className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Leave / Time Off Section */}
      <div className="mb-6 bg-white rounded-xl border border-gray-100 shadow-sm">
        <button
          onClick={() => setShowLeavePanel(prev => !prev)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Plane className="w-5 h-5" style={{ color: 'var(--coral)' }} />
            <div className="text-left">
              <h2 className="font-semibold text-gray-900">Time Off</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {leaves.length === 0
                  ? 'No upcoming leave periods'
                  : `${leaves.filter(l => new Date(l.endDate) >= new Date()).length} upcoming leave period(s)`}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showLeavePanel ? 'rotate-180' : ''}`} />
        </button>

        {showLeavePanel && (
          <div className="border-t border-gray-100 p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input
                type="date"
                value={leaveStart}
                onChange={(e) => setLeaveStart(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="date"
                value={leaveEnd}
                onChange={(e) => setLeaveEnd(e.target.value)}
                min={leaveStart || format(new Date(), 'yyyy-MM-dd')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={handleAddLeave}
                disabled={!leaveStart || !leaveEnd || isAddingLeave}
                className="px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                style={{ background: 'var(--coral)' }}
              >
                {isAddingLeave ? 'Adding...' : 'Add Leave'}
              </button>
            </div>

            <input
              type="text"
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              placeholder="Reason (optional, e.g. vacation, conference)"
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4"
            />

            {leaveError && (
              <p className="text-sm text-red-600 mb-3">{leaveError}</p>
            )}

            {bookedWarning > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  You have {bookedWarning} booked session(s) in this range. They are NOT auto-cancelled. Please reach out to those patients and cancel manually via Calendar.
                </p>
              </div>
            )}

            {leaves.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current &amp; Upcoming</p>
                {leaves.map((l) => {
                  const past = new Date(l.endDate) < new Date()
                  return (
                    <div
                      key={l.id}
                      className={`flex items-center justify-between p-3 rounded-lg bg-gray-50 ${past ? 'opacity-60' : ''}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(l.startDate), 'MMM d, yyyy')}
                          {' → '}
                          {format(new Date(l.endDate), 'MMM d, yyyy')}
                        </p>
                        {l.reason && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{l.reason}</p>
                        )}
                      </div>
                      {!past && (
                        <button
                          onClick={() => handleDeleteLeave(l.id)}
                          className="ml-3 p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Cancel this leave"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bulk Add Panel */}
      {showBulk && (
        <div className="mb-6 p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-teal-600" />
              Bulk Add Slots
            </h2>
            <button
              onClick={() => setShowBulk(false)}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                From Date
              </label>
              <input
                type="date"
                value={bulkStartDate}
                min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setBulkStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                To Date
              </label>
              <input
                type="date"
                value={bulkEndDate}
                min={bulkStartDate || format(new Date(), 'yyyy-MM-dd')}
                onChange={e => setBulkEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none"
              />
            </div>
          </div>

          {/* Mode selector */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setBulkMode('uniform')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkMode === 'uniform' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Same hours every day
            </button>
            <button
              type="button"
              onClick={() => setBulkMode('per-day')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                bulkMode === 'per-day' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Different hours per weekday
            </button>
          </div>

          {/* Weekday checkboxes */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Working days</p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, idx) => {
                const active = bulkDays[idx]
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setBulkDays(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Uniform-mode hours */}
          {bulkMode === 'uniform' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  From Time
                </label>
                <select
                  value={bulkStartHour}
                  onChange={e => setBulkStartHour(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-teal-500 outline-none cursor-pointer"
                >
                  {ALL_HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  To Time
                </label>
                <select
                  value={bulkEndHour}
                  onChange={e => setBulkEndHour(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-teal-500 outline-none cursor-pointer"
                >
                  {ALL_HOURS.map(h => (
                    <option key={h} value={h}>{formatHour(h)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Per-day hours */}
          {bulkMode === 'per-day' && (
            <div className="mb-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Hours per day</p>
              {WEEKDAY_LABELS.map((label, idx) => {
                if (!bulkDays[idx]) return null
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-12 text-sm font-medium text-gray-700">{label}</span>
                    <select
                      value={perDayHours[idx].start}
                      onChange={(e) => setPerDayHours(prev => ({
                        ...prev,
                        [idx]: { ...prev[idx], start: Number(e.target.value) },
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {ALL_HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                    </select>
                    <span className="text-gray-400">to</span>
                    <select
                      value={perDayHours[idx].end}
                      onChange={(e) => setPerDayHours(prev => ({
                        ...prev,
                        [idx]: { ...prev[idx], end: Number(e.target.value) },
                      }))}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {ALL_HOURS.map(h => <option key={h} value={h}>{formatHour(h)}</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          )}

          {/* Preview */}
          {bulkStartDate && bulkEndDate && (
            <div className="mb-4 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-700">
                {bulkMode === 'uniform'
                  ? <>Slots <strong>{formatHour(bulkStartHour)}</strong>–<strong>{formatHour(bulkEndHour)}</strong> on selected days</>
                  : <>Custom hours per weekday on selected days</>}
                {' · '}
                {Object.values(bulkDays).filter(Boolean).length} of 7 weekdays active
              </p>
            </div>
          )}

          <button
            onClick={handleBulkAdd}
            disabled={isBulkAdding || !bulkStartDate || !bulkEndDate}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isBulkAdding && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {isBulkAdding ? 'Adding slots...' : 'Add Slots'}
          </button>
        </div>
      )}

      {/* Main layout: Calendar + Time picker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* LEFT: Calendar */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h3 className="font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <button
              onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Date grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((date, i) => {
              const inMonth = isSameMonth(date, currentMonth)
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isPastDate = isPast(date) && !isToday(date)
              const key = format(date, 'yyyy-MM-dd')
              const daySlots = slotsByDate[key] ?? []
              const bookedCount = daySlots.filter(s => s.isBooked).length
              const availCount = daySlots.filter(s => !s.isBooked).length
              const onLeave = inMonth && isDateOnLeave(date, leaves)

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (!inMonth) return
                    if (isPastDate) return
                    handleDateSelect(date)
                  }}
                  disabled={!inMonth || isPastDate}
                  className={`
                    relative p-1.5 min-h-[56px]
                    flex flex-col items-center gap-0.5
                    border-b border-r border-gray-50
                    transition-all text-xs
                    ${!inMonth || isPastDate
                      ? 'opacity-30 cursor-default'
                      : 'cursor-pointer hover:bg-gray-50'
                    }
                    ${isSelected
                      ? 'bg-teal-600 hover:bg-teal-600'
                      : ''
                    }
                  `}
                >
                  {onLeave && !isSelected && (
                    <span
                      className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                      style={{ background: 'var(--coral)' }}
                      title="On leave"
                    />
                  )}
                  <span className={`
                    text-sm font-medium
                    ${isSelected ? 'text-white' :
                      isToday(date)
                        ? 'text-teal-600 font-bold'
                        : 'text-gray-700'}
                  `}>
                    {format(date, 'd')}
                  </span>
                  {/* Slot counts */}
                  {(availCount > 0 || bookedCount > 0) && inMonth && (
                    <div className="flex gap-0.5">
                      {availCount > 0 && (
                        <span className={`text-xs font-bold ${isSelected ? 'text-teal-100' : 'text-teal-600'}`}>
                          {availCount}
                        </span>
                      )}
                      {bookedCount > 0 && (
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-200' : 'text-blue-500'}`}>
                          {availCount > 0 ? '/' : ''}{bookedCount}&#10003;
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--coral)' }} />
              On leave
            </span>
          </div>
        </div>

        {/* RIGHT: Time slot picker */}
        <div>
          {!selectedDate ? (
            <div className="flex items-center justify-center h-full min-h-64 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <div className="text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium text-sm">
                  Click a date to manage slots
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {format(selectedDate, 'EEEE, MMMM d')}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Click times to toggle slots
                </p>
              </div>

              <div className="p-4">
                {availableHours.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">
                    No more hours available today
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {ALL_HOURS.map(hour => {
                      const key = format(selectedDate, 'yyyy-MM-dd')
                      const daySlots = slotsByDate[key] ?? []
                      const existingSlot = daySlots.find(s =>
                        new Date(s.date).getHours() === hour
                      )
                      const isBooked = existingSlot?.isBooked ?? false
                      const isPending = pendingHours.has(hour)
                      const isPastHour = isToday(selectedDate) && hour < new Date().getHours()

                      if (isPastHour) {
                        return (
                          <div
                            key={hour}
                            className="py-2.5 px-3 rounded-xl text-sm text-center text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed"
                          >
                            {formatHour(hour)}
                          </div>
                        )
                      }

                      if (isBooked) {
                        return (
                          <div
                            key={hour}
                            className="py-2.5 px-3 rounded-xl text-sm text-center text-blue-600 bg-blue-50 border-2 border-blue-200 cursor-not-allowed"
                            title="Already booked"
                          >
                            {formatHour(hour)}
                            <span className="block text-xs text-blue-400">
                              booked
                            </span>
                          </div>
                        )
                      }

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => {
                            setPendingHours(prev => {
                              const next = new Set(prev)
                              if (next.has(hour)) {
                                next.delete(hour)
                              } else {
                                next.add(hour)
                              }
                              return next
                            })
                          }}
                          className={`
                            py-2.5 px-3 rounded-xl
                            text-sm font-medium
                            border-2 transition-all
                            text-center
                            ${isPending
                              ? 'border-teal-500 bg-teal-50 text-teal-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-teal-300'
                            }
                          `}
                        >
                          {formatHour(hour)}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Save button */}
              <div className="px-4 pb-4">
                <button
                  onClick={handleSaveDay}
                  disabled={isSaving}
                  className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSaving && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
