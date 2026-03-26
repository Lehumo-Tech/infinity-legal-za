'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export default function PortalTasksPage() {
  const { profile, role } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getSession()
      setToken(data?.session?.access_token || null)
    }
    init()
  }, [])

  const fetchTasks = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      let allTasks = data.tasks || []
      if (filter !== 'all') {
        allTasks = allTasks.filter(t => t.status === filter)
      }
      setTasks(allTasks)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [token, filter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ taskId, status: newStatus }),
      })
      fetchTasks()
    } catch (err) { console.error(err) }
  }

  const grouped = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-infinity-navy dark:text-white">Task Board</h1>
        <p className="text-infinity-navy/50 dark:text-white/50 text-sm font-sans mt-1">Manage your drafting tasks, research requests, and deadlines.</p>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-4">
        {[  
          { key: 'pending', label: 'To Do', color: 'border-t-orange-500', items: grouped.pending },
          { key: 'in_progress', label: 'In Progress', color: 'border-t-blue-500', items: grouped.in_progress },
          { key: 'completed', label: 'Done', color: 'border-t-green-500', items: grouped.completed },
        ].map((col) => (
          <div key={col.key} className={`bg-white dark:bg-gray-800 rounded-xl border border-infinity-navy/10 dark:border-gray-700 border-t-4 ${col.color} overflow-hidden`}>
            <div className="p-4 border-b border-infinity-navy/5 dark:border-gray-700">
              <h3 className="font-display font-semibold text-sm text-infinity-navy dark:text-white flex items-center justify-between">
                {col.label}
                <span className="text-xs bg-infinity-cream dark:bg-gray-700 px-2 py-0.5 rounded-full">{col.items.length}</span>
              </h3>
            </div>
            <div className="p-3 space-y-2 min-h-[200px]">
              {loading ? (
                <div className="text-xs text-infinity-navy/40 dark:text-white/40 text-center py-4">Loading...</div>
              ) : col.items.length === 0 ? (
                <div className="text-xs text-infinity-navy/30 dark:text-white/30 text-center py-4">No tasks</div>
              ) : (
                col.items.map((task) => (
                  <div key={task.id} className="p-3 bg-infinity-cream/50 dark:bg-gray-700/50 rounded-lg border border-infinity-navy/5 dark:border-gray-600">
                    <div className="font-medium text-sm text-infinity-navy dark:text-white">{task.title}</div>
                    {task.description && <p className="text-xs text-infinity-navy/50 dark:text-white/50 mt-1 line-clamp-2">{task.description}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                        task.priority === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
                      }`}>{task.priority}</span>
                      <div className="flex gap-1">
                        {col.key === 'pending' && (
                          <button onClick={() => updateTaskStatus(task.id, 'in_progress')} className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded font-semibold">
                            Start
                          </button>
                        )}
                        {col.key === 'in_progress' && (
                          <button onClick={() => updateTaskStatus(task.id, 'completed')} className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded font-semibold">
                            Done
                          </button>
                        )}
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="text-[10px] text-infinity-navy/40 dark:text-white/40 mt-1">
                        Due: {new Date(task.due_date).toLocaleDateString('en-ZA')}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
