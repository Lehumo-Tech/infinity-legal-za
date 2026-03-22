'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TasksPage() {
  const [tasks, setTasks] = useState({
    pending: [
      { id: '1', title: 'Review employment contract', case: 'INF-2025-1234', priority: 'high', dueDate: '2025-03-22' },
      { id: '2', title: 'File court papers', case: 'INF-2025-1231', priority: 'urgent', dueDate: '2025-03-21' }
    ],
    in_progress: [
      { id: '3', title: 'Draft response letter', case: 'INF-2025-1233', priority: 'medium', dueDate: '2025-03-25' }
    ],
    completed: [
      { id: '4', title: 'Client consultation prep', case: 'INF-2025-1230', priority: 'medium', dueDate: '2025-03-20' }
    ]
  })

  const [newTask, setNewTask] = useState({
    title: '',
    caseNumber: '',
    priority: 'medium',
    dueDate: ''
  })

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      case 'low': return 'bg-green-100 text-green-700 border-green-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date()
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
              <Link href="/attorney/office/documents" className="text-infinity-navy/70 hover:text-infinity-navy">Documents</Link>
              <Link href="/attorney/office/tasks" className="text-infinity-navy font-medium border-b-2 border-infinity-gold pb-1">Tasks</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-infinity-navy mb-2">Task Manager</h1>
          <p className="text-infinity-navy/70">Organize and track your legal work</p>
        </div>

        {/* Kanban Board */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Pending Column */}
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-infinity-navy">Pending</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {tasks.pending.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.pending.map(task => (
                <div key={task.id} className="bg-infinity-cream rounded-lg p-4 border border-infinity-gold/20">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-infinity-navy">{task.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-xs text-infinity-navy/70 mb-2">Case: {task.case}</div>
                  <div className={`text-xs ${isOverdue(task.dueDate) ? 'text-red-600 font-semibold' : 'text-infinity-navy/70'}`}>
                    Due: {task.dueDate} {isOverdue(task.dueDate) && '⚠️ OVERDUE'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-infinity-navy">In Progress</h2>
              <span className="px-3 py-1 bg-infinity-gold/10 text-infinity-navy rounded-full text-sm">
                {tasks.in_progress.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.in_progress.map(task => (
                <div key={task.id} className="bg-infinity-cream rounded-lg p-4 border border-infinity-gold/20">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-infinity-navy">{task.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-xs text-infinity-navy/70 mb-2">Case: {task.case}</div>
                  <div className="text-xs text-infinity-navy/70">Due: {task.dueDate}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white rounded-lg border border-infinity-gold/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-infinity-navy">Completed</h2>
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {tasks.completed.length}
              </span>
            </div>
            <div className="space-y-3">
              {tasks.completed.map(task => (
                <div key={task.id} className="bg-infinity-cream rounded-lg p-4 border border-infinity-gold/20 opacity-60">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-infinity-navy line-through">{task.title}</h3>
                    <span className="text-green-600">✓</span>
                  </div>
                  <div className="text-xs text-infinity-navy/70 mb-2">Case: {task.case}</div>
                  <div className="text-xs text-infinity-navy/70">Completed</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Email Reminder Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📧 Email Reminders</h3>
          <p className="text-sm text-blue-800">
            You'll receive email reminders 24 hours before task due dates. Overdue tasks are highlighted in red.
          </p>
        </div>
      </div>
    </div>
  )
}
