'use client'

export default function CalendarPage() {
  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const events = [
    { day: 15, title: 'Court Hearing - Mbeki', color: 'bg-red-500' },
    { day: 18, title: 'Client Consultation', color: 'bg-blue-500' },
    { day: 22, title: 'CCMA Arbitration', color: 'bg-purple-500' },
    { day: 25, title: 'Contract Review Deadline', color: 'bg-orange-500' },
    { day: today.getDate(), title: 'Today', color: 'bg-[#c9a961]' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#0f2b46]" style={{ fontFamily: "'Playfair Display', serif" }}>Calendar</h1>
        <button onClick={() => alert('Add Event dialog coming soon!')} className="px-4 py-2 bg-[#0f2b46] text-white text-sm font-bold rounded-xl">+ Add Event</button>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-[#0f2b46] mb-4">{today.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}</h2>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayEvents = events.filter(e => e.day === day)
            const isToday = day === today.getDate()
            return (
              <div key={day} className={`min-h-[80px] border border-gray-100 rounded-lg p-1.5 ${isToday ? 'bg-[#c9a961]/10 border-[#c9a961]' : 'hover:bg-gray-50'}`}>
                <span className={`text-xs font-bold ${isToday ? 'text-[#c9a961]' : 'text-gray-600'}`}>{day}</span>
                {dayEvents.map((e, ei) => <div key={ei} className={`${e.color} text-white text-[9px] font-medium px-1 py-0.5 rounded mt-0.5 truncate`}>{e.title}</div>)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
