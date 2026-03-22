'use client'

import { useState, useEffect } from 'react'
import AttorneyLayout from '@/components/AttorneyLayout'
import { useAuth } from '@/contexts/AuthContext'
import { tasksApi, casesApi } from '@/lib/api'

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [cases, setCases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '', description: '', case_id: '', priority: 'medium', due_date: ''
  })

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksRes, casesRes] = await Promise.all([tasksApi.list(), casesApi.list({ role: 'attorney' })])
      setTasks(tasksRes.tasks || [])
      setCases(casesRes.cases || [])
    } catch (error) {
      console.error('Fetch data error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTask.title) return
    try {
      setCreating(true)
      await tasksApi.create({ ...newTask, case_id: newTask.case_id || null, due_date: newTask.due_date || null })
      setShowCreateModal(false)
      setNewTask({ title: '', description: '', case_id: '', priority: 'medium', due_date: '' })
      await fetchData()
    } catch (error) {
      alert('Failed to create task: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksApi.update(taskId, { status: newStatus })
      await fetchData()
    } catch (error) { console.error('Update error:', error) }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await tasksApi.remove(taskId)
      await fetchData()
    } catch (error) { console.error('Delete error:', error) }
  }

  const getPriorityColor = (p) => ({
    urgent: 'bg-red-50 text-red-600 border-red-100',
    high: 'bg-orange-50 text-orange-600 border-orange-100',
    medium: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    low: 'bg-green-50 text-green-600 border-green-100'
  }[p] || 'bg-gray-50 text-gray-600 border-gray-100')

  const isOverdue = (d) => d && new Date(d) < new Date()

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  }

  const columns = [
    { key: 'pending', label: 'To Do', icon: '○', color: 'border-gray-300', nextStatus: 'in_progress', nextLabel: 'Start' },
    { key: 'in_progress', label: 'In Progress', icon: '◐', color: 'border-blue-400', nextStatus: 'completed', nextLabel: 'Complete' },
    { key: 'completed', label: 'Done', icon: '●', color: 'border-emerald-400', nextStatus: null, nextLabel: null }
  ]

  return (
    <AttorneyLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organize and track your legal work</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-gray-600"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {columns.map(col => (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-2.5 h-2.5 rounded-full border-2 ${col.color}`}></div>
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full ml-1">
                  {tasksByStatus[col.key].length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasksByStatus[col.key].length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <p className="text-xs text-gray-400">No tasks</p>
                  </div>
                ) : (
                  tasksByStatus[col.key].map(task => (
                    <div key={task.id}
                      className={`bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-all ${
                        col.key === 'completed' ? 'opacity-60' : ''
                      }`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-medium text-sm text-gray-900 ${col.key === 'completed' ? 'line-through' : ''}`}>
                          {task.title}
                        </h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-xs text-gray-400 mb-2 line-clamp-2">{task.description}</p>
                      )}
                      {task.cases?.case_number && (
                        <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1z" />
                          </svg>
                          {task.cases.case_number}
                        </div>
                      )}
                      {task.due_date && (
                        <div className={`text-xs mb-3 flex items-center gap-1 ${
                          isOverdue(task.due_date) && col.key !== 'completed' ? 'text-red-500 font-semibold' : 'text-gray-400'
                        }`}>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(task.due_date).toLocaleDateString()}
                          {isOverdue(task.due_date) && col.key !== 'completed' && ' · Overdue'}
                        </div>
                      )}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                        {col.nextStatus && (
                          <button onClick={() => handleStatusChange(task.id, col.nextStatus)}
                            className="text-xs px-2.5 py-1 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors font-medium">
                            {col.nextLabel} →
                          </button>
                        )}
                        {col.key === 'in_progress' && (
                          <button onClick={() => handleStatusChange(task.id, 'pending')}
                            className="text-xs px-2 py-1 text-gray-500 hover:bg-gray-100 rounded-md transition-colors">
                            ← Back
                          </button>
                        )}
                        <button onClick={() => handleDeleteTask(task.id)}
                          className="text-xs px-2 py-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-auto">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">Create New Task</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Task Title *</label>
                <input type="text" required value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm"
                  placeholder="e.g., Review employment contract" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm"
                  placeholder="Optional details..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Related Case</label>
                <select value={newTask.case_id} onChange={(e) => setNewTask({ ...newTask, case_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm">
                  <option value="">No case</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                  <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm">
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
                  <input type="date" value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AttorneyLayout>
  )
}
