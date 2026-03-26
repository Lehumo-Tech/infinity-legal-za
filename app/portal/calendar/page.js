'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const EVENT_TYPES = [
  { value: 'court_date', label: 'Court Date', color: 'bg-purple-500' },
  { value: 'hearing', label: 'Hearing', color: 'bg-indigo-500' },
  { value: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
  { value: 'consultation', label: 'Consultation', color: 'bg-green-500' },
  { value: 'deadline', label: 'Deadline', color: 'bg-red-500' },
  { value: 'filing', label: 'Filing Deadline', color: 'bg-teal-500' },
  { value: 'deposition', label: 'Deposition', color: 'bg-cyan-500' },
  { value: 'reminder', label: 'Reminder', color: 'bg-amber-500' },
  { value: 'personal', label: 'Personal', color: 'bg-gray-500' },
]

const getColorForType = (type) => {
  const found = EVENT_TYPES.find(e => e.value === type)
  return found?.color || 'bg-blue-500'
}

export default function CalendarPage() {
  const { profile } = useAuth()
  const [token, setToken] = useState(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [viewMode, setViewMode] = useState('month') // 'month' | 'week' | 'agenda'

  const [newEvent, setNewEvent] = useState({
    title: '', description: '', startDate: '', endDate: '', startTime: '09:00', endTime: '10:00',
    type: 'meeting', priority: 'normal', location: '', visibility: 'personal',
  })

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchEvents = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const headers = { Authorization: `Bearer ${token}` }
      const [calRes, casesRes, tasksRes] = await Promise.allSettled([
        fetch('/api/calendar', { headers }),
        fetch('/api/cases', { headers }),
        fetch('/api/tasks', { headers }),
      ])
      const allEvents = []

      // Calendar events from MongoDB
      if (calRes.status === 'fulfilled' && calRes.value.ok) {
        const d = await calRes.value.json()
        ;(d.events || []).forEach(e => {
          allEvents.push({
            id: e.id,
            date: e.startDate,
            endDate: e.endDate,
            title: e.title,
            description: e.description,
            type: e.type,
            color: e.color || getColorForType(e.type),
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            source: 'calendar',
          })
        })
      }

      // Court dates from cases
      if (casesRes.status === 'fulfilled' && casesRes.value.ok) {
        const d = await casesRes.value.json()
        ;(d.cases || []).forEach(c => {
          if (c.court_date) {
            allEvents.push({
              id: `court-${c.id}`, date: c.court_date, title: `Court: ${c.case_number || c.case_subtype || 'Case'}`,
              description: `${c.case_type} - ${c.court_location || 'TBD'}`, type: 'court_date',
              color: 'bg-purple-500', source: 'case',
            })
          }
        })
      }

      // Task deadlines
      if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) {
        const d = await tasksRes.value.json()
        ;(d.tasks || []).forEach(t => {
          if (t.due_date) {
            allEvents.push({
              id: `task-${t.id}`, date: t.due_date, title: t.title || 'Task',
              description: t.description || '', type: 'deadline',
              color: t.priority === 'urgent' ? 'bg-red-500' : t.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500',
              source: 'task',
            })
          }
        })
      }

      setEvents(allEvents)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const getEventsForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date?.startsWith(dateStr))
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.startDate) return
    setCreateLoading(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newEvent),
      })
      if (res.ok) {
        setShowCreateModal(false)
        setNewEvent({ title: '', description: '', startDate: '', endDate: '', startTime: '09:00', endTime: '10:00', type: 'meeting', priority: 'normal', location: '', visibility: 'personal' })
        fetchEvents()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setCreateLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!eventId.startsWith('evt_')) return // Only delete custom events
    try {
      await fetch(`/api/calendar?id=${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchEvents()
    } catch (err) {
      console.error(err)
    }
  }

  const openCreateForDate = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setNewEvent(prev => ({ ...prev, startDate: dateStr, endDate: dateStr }))
    setShowCreateModal(true)
  }

  // Upcoming events (next 14 days)
  const upcomingEvents = events
    .filter(e => {
      const eventDate = new Date(e.date)
      const diff = (eventDate - today) / (1000 * 60 * 60 * 24)
      return diff >= -1 && diff <= 14
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10)

  // Agenda view: all events this month sorted
  const monthEvents = events
    .filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Calendar & Scheduling</h1>
          <p className="text-sm text-infinity-navy/50 dark:text-white/40">Court dates, meetings, deadlines, and events</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="hidden sm:flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
            {['month', 'agenda'].map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${viewMode === v ? 'bg-infinity-navy text-white dark:bg-infinity-gold dark:text-infinity-navy' : 'text-gray-500 hover:text-infinity-navy'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New Event
          </button>
        </div>
      </div>

      {viewMode === 'month' ? (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Month Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-infinity-navy dark:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="text-center">
                  <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">{MONTHS[month]} {year}</h2>
                  <button onClick={goToday} className="text-[10px] text-infinity-gold font-semibold hover:underline">Today</button>
                </div>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-infinity-navy dark:text-white">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                {DAYS.map(d => <div key={d} className="text-center py-2 text-[10px] font-bold text-gray-400 uppercase">{d}</div>)}
              </div>

              {/* Calendar Cells */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-24 border-b border-r border-gray-50 dark:border-gray-700/50" />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                  const dayEvents = getEventsForDate(day)
                  const isSelected = selectedDate === day
                  return (
                    <div key={day}
                      onClick={() => setSelectedDate(day === selectedDate ? null : day)}
                      className={`h-24 border-b border-r border-gray-50 dark:border-gray-700/50 p-1 cursor-pointer transition-colors group ${isSelected ? 'bg-infinity-gold/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}>
                      <div className="flex items-center justify-between">
                        <div className={`text-xs font-medium ${isToday ? 'w-6 h-6 bg-infinity-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold' : 'text-infinity-navy/70 dark:text-white/70 pl-1'}`}>{day}</div>
                        <button onClick={(e) => { e.stopPropagation(); openCreateForDate(day) }}
                          className="w-4 h-4 rounded hover:bg-infinity-gold/20 items-center justify-center text-infinity-gold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                      <div className="mt-0.5 space-y-0.5">
                        {dayEvents.slice(0, 3).map(e => (
                          <div key={e.id} className={`${e.color} text-white text-[8px] px-1 py-0.5 rounded truncate leading-tight`}>
                            {e.startTime && <span className="font-semibold">{e.startTime} </span>}{e.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && <div className="text-[8px] text-gray-400 pl-1">+{dayEvents.length - 3} more</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Date Events */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-sm font-display font-bold text-infinity-navy dark:text-white mb-3">
                {selectedDate ? `${MONTHS[month]} ${selectedDate}, ${year}` : 'Upcoming Events'}
              </h3>
              {selectedDate && selectedEvents.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-400 mb-2">No events on this date</p>
                  <button onClick={() => openCreateForDate(selectedDate)}
                    className="text-xs text-infinity-gold font-semibold hover:underline">+ Add Event</button>
                </div>
              )}
              {(selectedDate ? selectedEvents : upcomingEvents).map(e => (
                <div key={e.id} className="flex items-start gap-2.5 py-2 border-b border-gray-50 dark:border-gray-700/50 last:border-0 group">
                  <div className={`w-2.5 h-2.5 rounded-full ${e.color} shrink-0 mt-1`} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-infinity-navy dark:text-white truncate">{e.title}</div>
                    {e.startTime && <div className="text-[10px] text-gray-400">{e.startTime}{e.endTime ? ` - ${e.endTime}` : ''}</div>}
                    {e.location && <div className="text-[10px] text-gray-400 truncate">📍 {e.location}</div>}
                    <div className="text-[10px] text-gray-300">{new Date(e.date).toLocaleDateString('en-ZA', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                  </div>
                  {e.source === 'calendar' && (
                    <button onClick={() => handleDeleteEvent(e.id)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity shrink-0">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
              {!selectedDate && upcomingEvents.length === 0 && <p className="text-xs text-gray-400 py-2">No upcoming events</p>}
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-xs font-bold text-gray-400 mb-2">Event Types</h3>
              <div className="space-y-1.5">
                {EVENT_TYPES.slice(0, 7).map(t => (
                  <div key={t.value} className="flex items-center gap-2 text-[11px] text-infinity-navy dark:text-white">
                    <div className={`w-2.5 h-2.5 ${t.color} rounded-full shrink-0`} />
                    {t.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-infinity-navy dark:bg-gray-800 rounded-xl p-4 text-white">
              <h3 className="text-xs font-bold text-infinity-gold mb-2">THIS MONTH</h3>
              <div className="space-y-1.5 text-[11px] text-white/70">
                <div className="flex justify-between">
                  <span>Total Events</span>
                  <span className="font-bold text-white">{monthEvents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Court Dates</span>
                  <span className="font-bold text-purple-300">{monthEvents.filter(e => e.type === 'court_date').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Deadlines</span>
                  <span className="font-bold text-red-300">{monthEvents.filter(e => e.type === 'deadline' || e.type === 'filing').length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Meetings</span>
                  <span className="font-bold text-blue-300">{monthEvents.filter(e => e.type === 'meeting' || e.type === 'consultation').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Agenda View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-infinity-navy dark:text-white">{MONTHS[month]} {year} — Agenda</h2>
            <span className="text-xs text-gray-400">{monthEvents.length} events</span>
          </div>
          {monthEvents.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-sm">No events this month</div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {monthEvents.map(e => {
                const eventDate = new Date(e.date)
                return (
                  <div key={e.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <div className="text-center w-12 shrink-0">
                      <div className="text-lg font-bold text-infinity-navy dark:text-white">{eventDate.getDate()}</div>
                      <div className="text-[10px] text-gray-400 uppercase">{DAYS[eventDate.getDay()]}</div>
                    </div>
                    <div className={`w-1 h-10 rounded-full ${e.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-infinity-navy dark:text-white truncate">{e.title}</div>
                      <div className="text-xs text-gray-400">
                        {e.startTime && <span>{e.startTime}{e.endTime ? ` - ${e.endTime}` : ''}</span>}
                        {e.location && <span className="ml-2">📍 {e.location}</span>}
                      </div>
                    </div>
                    <span className={`${e.color} text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0`}>
                      {EVENT_TYPES.find(t => t.value === e.type)?.label || e.type}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-display font-bold text-infinity-navy dark:text-white">New Event</h2>
              <button onClick={() => setShowCreateModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Event Title *</label>
                <input type="text" required value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white focus:ring-2 focus:ring-infinity-gold/40"
                  placeholder="e.g. Client meeting, Court appearance" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Type</label>
                  <select value={newEvent.type} onChange={e => setNewEvent(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Priority</label>
                  <select value={newEvent.priority} onChange={e => setNewEvent(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white">
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date *</label>
                  <input type="date" required value={newEvent.startDate} onChange={e => setNewEvent(p => ({ ...p, startDate: e.target.value, endDate: p.endDate || e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                  <input type="date" value={newEvent.endDate} onChange={e => setNewEvent(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Start Time</label>
                  <input type="time" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">End Time</label>
                  <input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Location</label>
                <input type="text" value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white"
                  placeholder="e.g. Pretoria High Court, Room 4B" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
                <textarea rows={2} value={newEvent.description} onChange={e => setNewEvent(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-infinity-navy dark:text-white resize-none"
                  placeholder="Optional notes..." />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-infinity-navy dark:text-white rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                <button type="submit" disabled={createLoading}
                  className="flex-1 py-2.5 bg-infinity-navy hover:bg-infinity-navy-light text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  {createLoading ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
