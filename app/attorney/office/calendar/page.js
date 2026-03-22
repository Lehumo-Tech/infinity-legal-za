'use client'

import { useState, useEffect } from 'react'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { casesApi, tasksApi } from '@/lib/api'

export default function CalendarPage() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) fetchEvents()
  }, [user])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const [casesRes, tasksRes] = await Promise.all([
        casesApi.list({ role: 'attorney' }),
        tasksApi.list()
      ])

      const calEvents = []

      // Cases with court dates
      ;(casesRes.cases || []).forEach(c => {
        if (c.court_date) {
          calEvents.push({
            id: 'case-' + c.id,
            title: `Court - ${c.case_number}`,
            type: 'court',
            date: c.court_date,
            location: c.court_location || 'TBD',
            caseTitle: c.title
          })
        }
      })

      // Tasks with due dates
      ;(tasksRes.tasks || []).forEach(t => {
        if (t.due_date) {
          calEvents.push({
            id: 'task-' + t.id,
            title: t.title,
            type: 'task',
            date: t.due_date.split('T')[0],
            caseNumber: t.cases?.case_number,
            status: t.status,
            priority: t.priority
          })
        }
      })

      setEvents(calEvents)
    } catch (error) {
      console.error('Fetch events error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay()
    }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const getEventColor = (type) => {
    switch (type) {
      case 'court': return 'bg-red-500 text-white'
      case 'consultation': return 'bg-infinity-gold text-infinity-navy'
      case 'task': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getEventBorderColor = (type) => {
    switch (type) {
      case 'court': return 'border-red-300 bg-red-50 text-red-800'
      case 'consultation': return 'border-infinity-gold bg-infinity-gold/10 text-infinity-navy'
      case 'task': return 'border-blue-300 bg-blue-50 text-blue-800'
      default: return 'border-gray-300 bg-gray-50 text-gray-800'
    }
  }

  // Sort upcoming events by date
  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10)

  return (
    <AttorneyLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-infinity-navy mb-1">Calendar</h1>
        <p className="text-infinity-navy/70 text-sm">Court dates, consultations, and task deadlines</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-infinity-navy mx-auto mb-3"></div>
            <p className="text-infinity-navy/50 text-sm">Loading calendar...</p>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="md:col-span-2 bg-white rounded-lg border border-infinity-gold/20 p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-infinity-navy">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={prevMonth}
                  className="px-3 py-1.5 border border-infinity-gold/20 rounded-lg text-sm hover:bg-infinity-cream transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1.5 border border-infinity-gold/20 rounded-lg text-sm hover:bg-infinity-cream transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1.5 border border-infinity-gold/20 rounded-lg text-sm hover:bg-infinity-cream transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-infinity-navy/50 py-2">
                  {day}
                </div>
              ))}

              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDate(day)
                const today = new Date()
                const isToday = day === today.getDate() &&
                  currentDate.getMonth() === today.getMonth() &&
                  currentDate.getFullYear() === today.getFullYear()

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-1 transition-colors ${
                      isToday ? 'border-infinity-gold bg-infinity-gold/5' : 'border-infinity-gold/10 hover:bg-infinity-cream/50'
                    }`}
                  >
                    <div className={`text-xs font-medium mb-0.5 ${
                      isToday ? 'text-infinity-gold font-bold' : 'text-infinity-navy/70'
                    }`}>
                      {day}
                    </div>
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-[9px] rounded px-1 py-0.5 mb-0.5 truncate ${getEventColor(event.type)}`}
                        title={event.title}
                      >
                        {event.type === 'court' && '⚖️'}
                        {event.type === 'task' && '✅'}
                        {event.type === 'consultation' && '📅'}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-infinity-navy/50">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 mt-4 pt-4 border-t border-infinity-gold/10">
              <div className="flex items-center gap-1.5 text-xs text-infinity-navy/70">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                Court Dates
              </div>
              <div className="flex items-center gap-1.5 text-xs text-infinity-navy/70">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                Task Deadlines
              </div>
              <div className="flex items-center gap-1.5 text-xs text-infinity-navy/70">
                <div className="w-3 h-3 bg-infinity-gold rounded"></div>
                Consultations
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-5">
            <h2 className="text-lg font-semibold text-infinity-navy mb-4">Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-infinity-navy/50 text-sm">
                No upcoming events
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className={`p-3 rounded-lg border ${getEventBorderColor(event.type)}`}>
                    <div className="font-medium text-sm mb-1">{event.title}</div>
                    <div className="text-xs opacity-80">
                      {new Date(event.date).toLocaleDateString('en-ZA', {
                        weekday: 'short', day: 'numeric', month: 'short'
                      })}
                    </div>
                    {event.location && event.location !== 'TBD' && (
                      <div className="text-xs opacity-60 mt-0.5">📍 {event.location}</div>
                    )}
                    {event.caseNumber && (
                      <div className="text-xs opacity-60 mt-0.5">Case: {event.caseNumber}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AttorneyLayout>
  )
}
