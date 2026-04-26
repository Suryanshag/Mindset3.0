'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Loader2, ChevronLeft, ChevronRight,
  Calendar, Zap, X, Check
} from 'lucide-react'
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

interface Slot {
  id: string
  date: string
  isBooked: boolean
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
  const [bulkSkipSunday, setBulkSkipSunday] = useState(true)
  const [isBulkAdding, setIsBulkAdding] = useState(false)

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
    if (bulkStartHour > bulkEndHour) {
      setError('Start time must be before end time')
      return
    }

    setIsBulkAdding(true)
    setError(null)

    try {
      const start = new Date(bulkStartDate)
      const end = new Date(bulkEndDate)
      const dates: string[] = []

      const current = new Date(start)
      while (current <= end) {
        // Skip Sundays if enabled
        if (!(bulkSkipSunday && current.getDay() === 0)) {
          // Skip past dates
          if (!isPast(current) || isToday(current)) {
            for (let h = bulkStartHour; h <= bulkEndHour; h++) {
              const d = new Date(current)
              d.setHours(h, 0, 0, 0)
              // Skip past hours on today
              if (!isBefore(d, new Date())) {
                dates.push(d.toISOString())
              }
            }
          }
        }
        current.setDate(current.getDate() + 1)
      }

      if (dates.length === 0) {
        setError('No valid future slots in selected range')
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
      showSuccess(`Added ${dates.length} slots`)
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
          <SlotAIAgent onSlotsChanged={() => fetchSlots(false)} />
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
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
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
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skip Sunday toggle */}
          <button
            type="button"
            onClick={() => setBulkSkipSunday(prev => !prev)}
            className="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200 w-full hover:bg-gray-100 transition-colors"
          >
            <div className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${bulkSkipSunday ? 'bg-teal-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${bulkSkipSunday ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
            <span className="text-sm text-gray-700 font-medium">
              Skip Sundays
            </span>
          </button>

          {/* Preview count */}
          {bulkStartDate && bulkEndDate && (
            <div className="mb-4 p-3 bg-teal-50 rounded-xl border border-teal-100">
              <p className="text-sm text-teal-700">
                Will generate slots from{' '}
                <strong>{formatHour(bulkStartHour)}</strong>
                {' '}to{' '}
                <strong>{formatHour(bulkEndHour)}</strong>
                {' '}({bulkEndHour - bulkStartHour + 1} slots/day)
                {bulkSkipSunday ? ', skipping Sundays' : ''}
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
          <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Booked
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
