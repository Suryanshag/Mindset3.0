'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  isPast,
} from 'date-fns'

export interface CalendarSlot {
  id: string
  date: string | Date
  isBooked: boolean
}

interface SlotsCalendarProps {
  slots: CalendarSlot[]
  selectedSlotId?: string | null
  onSlotSelect?: (slot: CalendarSlot) => void
  onSlotToggle?: (slot: CalendarSlot) => void
  mode: 'book' | 'manage'
}

export default function SlotsCalendar({
  slots,
  selectedSlotId,
  onSlotSelect,
  onSlotToggle,
  mode,
}: SlotsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentMonth])

  const slotsByDate = useMemo(() => {
    const map: Record<string, CalendarSlot[]> = {}
    slots.forEach(slot => {
      const dateKey = format(new Date(slot.date), 'yyyy-MM-dd')
      if (!map[dateKey]) map[dateKey] = []
      map[dateKey].push(slot)
    })
    return map
  }, [slots])

  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return []
    const key = format(selectedDate, 'yyyy-MM-dd')
    const daySlots = slotsByDate[key] ?? []
    return [...daySlots].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )
  }, [selectedDate, slotsByDate])

  function prevMonth() {
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() - 1)
      return d
    })
  }

  function nextMonth() {
    setCurrentMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + 1)
      return d
    })
  }

  function getAvailableCount(date: Date): number {
    const key = format(date, 'yyyy-MM-dd')
    const daySlots = slotsByDate[key] ?? []
    if (mode === 'book') return daySlots.filter(s => !s.isBooked).length
    return daySlots.length
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h3 className="font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {DAYS.map(day => (
            <div
              key={day}
              className="py-2 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, i) => {
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isSelected = selectedDate && isSameDay(date, selectedDate)
            const availableCount = getAvailableCount(date)
            const hasSlots = availableCount > 0
            const isPastDate = isPast(date) && !isToday(date)

            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (!isCurrentMonth) return
                  if (isPastDate && mode === 'book') return
                  setSelectedDate(date)
                }}
                disabled={
                  !isCurrentMonth ||
                  (isPastDate && mode === 'book')
                }
                className={`
                  relative p-2 min-h-[52px] text-sm
                  flex flex-col items-center gap-0.5
                  border-b border-r border-gray-50
                  transition-all
                  ${!isCurrentMonth ? 'opacity-30 cursor-default' : ''}
                  ${isPastDate && mode === 'book' ? 'opacity-40 cursor-default' : ''}
                  ${isSelected
                    ? 'bg-teal-600 text-white'
                    : hasSlots && isCurrentMonth && !(isPastDate && mode === 'book')
                      ? 'hover:bg-teal-50 cursor-pointer'
                      : 'cursor-default'
                  }
                `}
              >
                <span
                  className={`text-sm font-medium ${
                    isSelected
                      ? 'text-white'
                      : isToday(date)
                        ? 'text-teal-600'
                        : 'text-gray-700'
                  }`}
                >
                  {format(date, 'd')}
                </span>
                {hasSlots && isCurrentMonth && (
                  <span
                    className={`text-xs font-semibold leading-none ${
                      isSelected ? 'text-teal-100' : 'text-teal-600'
                    }`}
                  >
                    {availableCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected date slots */}
      {selectedDate && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-gray-400" />
            <h4 className="font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d')}
            </h4>
            <span className="text-sm text-gray-400">
              ({slotsForSelectedDate.length} slot{slotsForSelectedDate.length !== 1 ? 's' : ''})
            </span>
          </div>

          {slotsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-sm">No slots for this date</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {slotsForSelectedDate.map(slot => {
                const slotDate = new Date(slot.date)
                const timeStr = format(slotDate, 'h:mm a')
                const isSlotSelected = selectedSlotId === slot.id
                const isBooked = slot.isBooked

                if (mode === 'book') {
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => !isBooked && onSlotSelect?.(slot)}
                      className={`
                        py-2.5 px-3 rounded-xl text-sm font-medium
                        border-2 transition-all text-center
                        ${isBooked
                          ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                          : isSlotSelected
                            ? 'border-teal-500 bg-teal-600 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-teal-400 hover:text-teal-600'
                        }
                      `}
                    >
                      {timeStr}
                    </button>
                  )
                }

                // manage mode
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => !isBooked && onSlotToggle?.(slot)}
                    className={`
                      py-2.5 px-3 rounded-xl text-sm font-medium
                      border-2 transition-all text-center
                      ${isBooked
                        ? 'border-blue-200 bg-blue-50 text-blue-600 cursor-not-allowed'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                      }
                    `}
                    title={isBooked ? 'Already booked' : 'Click to remove slot'}
                  >
                    {timeStr}
                    {isBooked && (
                      <span className="block text-xs text-blue-400 leading-none mt-0.5">
                        booked
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {mode === 'book' ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-teal-600 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
              Booked
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-200 inline-block" />
              Available (click to remove)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
              Booked by patient
            </span>
          </>
        )}
      </div>
    </div>
  )
}
