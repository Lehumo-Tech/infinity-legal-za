'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const events = [
    { id: '1', title: 'Court - INF-2025-1231', type: 'court', date: '2025-03-25', time: '09:00', location: 'Johannesburg High Court' },
    { id: '2', title: 'Consultation - John Doe', type: 'consultation', date: '2025-03-22', time: '14:00', location: 'Jitsi Meeting' },
    { id: '3', title: 'Task Due: File court papers', type: 'task', date: '2025-03-21', time: '17:00', location: 'N/A' },
    { id: '4', title: 'Consultation - Jane Smith', type: 'consultation', date: '2025-03-23', time: '10:30', location: 'Jitsi Meeting' }
  ]

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    return { daysInMonth, startingDayOfWeek }
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  
  const getEventsForDate = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  const getEventColor = (type) => {
    switch (type) {
      case 'court': return 'bg-red-100 text-red-700 border-red-300'
      case 'consultation': return 'bg-infinity-gold/20 text-infinity-navy border-infinity-gold'
      case 'task': return 'bg-blue-100 text-blue-700 border-blue-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-infinity-cream">
      <nav className="bg-white border-b border-infinity-gold/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/attorney/office" className="flex items-center gap-3">
              <img src="/logo.png" alt="Infinity Legal" className="h-10 w-auto" />
              <span className="font-bold text-xl text-infinity-navy">Attorney Office</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/attorney/office" className="text-infinity-navy/70 hover:text-infinity-navy">Dashboard</Link>
              <Link href="/attorney/office/cases" className="text-infinity-navy/70 hover:text-infinity-navy">Cases</Link>
              <Link href="/attorney/office/calendar" className="text-infinity-navy font-medium border-b-2 border-infinity-gold pb-1">Calendar</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Calendar</h1>
          <p className="text-infinity-navy/70">Court dates, consultations, and task deadlines</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="md:col-span-2 bg-white rounded-lg border border-infinity-gold/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-infinity-navy">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-infinity-gold/20 rounded hover:bg-infinity-cream">←</button>
                <button className="px-3 py-1 border border-infinity-gold/20 rounded hover:bg-infinity-cream">→</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-semibold text-infinity-navy/70 py-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dayEvents = getEventsForDate(day)
                const isToday = day === new Date().getDate() && 
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear()
                
                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 hover:bg-infinity-cream/50 cursor-pointer ${
                      isToday ? 'border-infinity-gold bg-infinity-gold/5' : 'border-infinity-gold/10'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday ? 'text-infinity-gold' : 'text-infinity-navy'
                    }`}>
                      {day}
                    </div>
                    {dayEvents.map(event => (
                      <div key={event.id} className="text-xs bg-infinity-navy text-white rounded px-1 py-0.5 mb-1 truncate">
                        {event.type === 'court' && '⚖️'}
                        {event.type === 'consultation' && '📅'}
                        {event.type === 'task' && '✅'}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-6">
            <h2 className="text-xl font-semibold text-infinity-navy mb-4">Upcoming Events</h2>
            <div className="space-y-4">
              {events.slice(0, 5).map(event => (
                <div key={event.id} className={`p-3 rounded-lg border ${getEventColor(event.type)}`}>
                  <div className="font-medium mb-1">{event.title}</div>
                  <div className="text-xs">{event.date} at {event.time}</div>
                  <div className="text-xs mt-1">{event.location}</div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 px-4 py-2 bg-infinity-navy text-infinity-cream rounded-lg hover:bg-infinity-navy/90">
              + Add Event
            </button>
          </div>
        </div>

        {/* Calendar Sync */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📅 Calendar Integration</h3>
          <p className="text-sm text-blue-800 mb-3">
            Sync your Infinity Legal calendar with Google Calendar, Outlook, or Apple Calendar.
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
            Export to Google Calendar
          </button>
        </div>
      </div>
    </div>
  )
}
