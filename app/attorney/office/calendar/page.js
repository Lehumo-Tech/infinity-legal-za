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
  const [selectedDay, setSelectedDay] = useState(null)

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
      ;(casesRes.cases || []).forEach(c => {
        if (c.court_date) {
          calEvents.push({
            id: 'case-' + c.id, title: `Court: ${c.case_number}`,
            type: 'court', date: c.court_date, location: c.court_location || 'TBD', caseTitle: c.title
          })
        }
      })
      ;(tasksRes.tasks || []).forEach(t => {
        if (t.due_date) {
          calEvents.push({
            id: 'task-' + t.id, title: t.title,
            type: 'task', date: t.due_date.split('T')[0], status: t.status, priority: t.priority
          })
        }
      })
      setEvents(calEvents)
    } catch (error) { console.error('Fetch error:', error) }
    finally { setLoading(false) }
  }

  const { daysInMonth, startingDayOfWeek } = (() => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth()
    return {
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      startingDayOfWeek: new Date(year, month, 1).getDay()
    }
  })()

  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))

  const upcomingEvents = events
    .filter(e => new Date(e.date) >= new Date(new Date().toDateString()))
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10)

  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : []

  return (
    <AttorneyLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Court dates, consultations, and deadlines</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1 bg-gray-50 rounded-lg p-1">
                <button onClick={prevMonth} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white">← Prev</button>
                <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white">Today</button>
                <button onClick={nextMonth} className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-white">Next →</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-[11px] font-medium text-gray-400 py-2">{day}</div>
              ))}
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square"></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDate(day)
                const today = new Date()
                const isToday = day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()
                const isSelected = selectedDay === day

                return (
                  <div key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`aspect-square border rounded-lg p-1.5 transition-all cursor-pointer ${
                      isSelected ? 'border-gray-900 bg-gray-900/5 ring-1 ring-gray-900' :
                      isToday ? 'border-blue-300 bg-blue-50/50' :
                      dayEvents.length > 0 ? 'border-gray-200 hover:border-gray-300' : 'border-transparent hover:border-gray-200'
                    }`}>
                    <div className={`text-xs font-medium ${
                      isToday ? 'text-blue-600' : isSelected ? 'text-gray-900' : 'text-gray-600'
                    }`}>{day}</div>
                    <div className="flex gap-0.5 mt-0.5 flex-wrap">
                      {dayEvents.slice(0, 3).map(event => (
                        <div key={event.id} className={`w-1.5 h-1.5 rounded-full ${
                          event.type === 'court' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-5 mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-red-500"></div> Court Dates
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Task Deadlines
              </div>
            </div>

            {/* Selected Day Events */}
            {selectedDay && selectedDayEvents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Events on {currentDate.toLocaleString('default', { month: 'long' })} {selectedDay}
                </h3>
                <div className="space-y-2">
                  {selectedDayEvents.map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border ${
                      event.type === 'court' ? 'border-red-100 bg-red-50' : 'border-blue-100 bg-blue-50'
                    }`}>
                      <div className={`font-medium text-sm ${
                        event.type === 'court' ? 'text-red-800' : 'text-blue-800'
                      }`}>{event.title}</div>
                      {event.location && event.location !== 'TBD' && (
                        <div className="text-xs opacity-70 mt-0.5">📍 {event.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Upcoming Events</h2>
              <p className="text-xs text-gray-400 mt-0.5">{upcomingEvents.length} upcoming</p>
            </div>
            {upcomingEvents.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-sm">No upcoming events</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="px-5 py-3.5 hover:bg-gray-50/50">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        event.type === 'court' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900 truncate">{event.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {new Date(event.date).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        {event.location && event.location !== 'TBD' && (
                          <div className="text-[11px] text-gray-400 mt-0.5">📍 {event.location}</div>
                        )}
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        event.type === 'court' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {event.type}
                      </span>
                    </div>
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
