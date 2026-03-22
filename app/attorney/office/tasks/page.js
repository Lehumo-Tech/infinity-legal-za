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
    title: '',
    description: '',
    case_id: '',
    priority: 'medium',
    due_date: ''
  })

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [tasksRes, casesRes] = await Promise.all([
        tasksApi.list(),
        casesApi.list({ role: 'attorney' })
      ])
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
      await tasksApi.create({
        ...newTask,
        case_id: newTask.case_id || null,
        due_date: newTask.due_date || null
      })
      setShowCreateModal(false)
      setNewTask({ title: '', description: '', case_id: '', priority: 'medium', due_date: '' })
      await fetchData()
    } catch (error) {
      console.error('Create task error:', error)
      alert('Failed to create task: ' + error.message)
    } finally {
      setCreating(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await tasksApi.update(taskId, { status: newStatus })
      await fetchData()
    } catch (error) {
      console.error('Update task error:', error)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await tasksApi.remove(taskId)
      await fetchData()
    } catch (error) {
      console.error('Delete task error:', error)
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700 border-red-300',
      high: 'bg-orange-100 text-orange-700 border-orange-300',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      low: 'bg-green-100 text-green-700 border-green-300'
    }
    return colors[priority] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const isOverdue = (dueDate) => {
    return dueDate && new Date(dueDate) < new Date()
  }

  // Group tasks by status
  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed')
  }

  const columns = [
    { key: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-700', nextStatus: 'in_progress', nextLabel: 'Start →' },
    { key: 'in_progress', label: 'In Progress', color: 'bg-infinity-gold/10 text-infinity-navy', nextStatus: 'completed', nextLabel: 'Complete ✓' },
    { key: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700', nextStatus: null, nextLabel: null }
  ]

  if (loading) {
    return (
      <AttorneyLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-infinity-navy mx-auto mb-3"></div>
            <p className="text-infinity-navy/50 text-sm">Loading tasks...</p>
          </div>
        </div>
      </AttorneyLayout>
    )
  }

  return (
    <AttorneyLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-infinity-navy mb-1">Task Manager</h1>
          <p className="text-infinity-navy/70 text-sm">Organize and track your legal work</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 bg-infinity-navy text-infinity-cream rounded-lg font-medium text-sm hover:bg-infinity-navy/90 transition-colors"
        >
          + New Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid md:grid-cols-3 gap-5">
        {columns.map(col => (
          <div key={col.key} className="bg-white rounded-lg border border-infinity-gold/20">
            <div className="p-4 border-b border-infinity-gold/10">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-infinity-navy text-sm">{col.label}</h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${col.color}`}>
                  {tasksByStatus[col.key].length}
                </span>
              </div>
            </div>
            <div className="p-3 space-y-3 min-h-[200px]">
              {tasksByStatus[col.key].length === 0 ? (
                <div className="text-center py-8 text-infinity-navy/30 text-sm">
                  No tasks
                </div>
              ) : (
                tasksByStatus[col.key].map(task => (
                  <div
                    key={task.id}
                    className={`bg-infinity-cream rounded-lg p-3.5 border border-infinity-gold/15 ${
                      col.key === 'completed' ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className={`font-medium text-infinity-navy text-sm ${
                        col.key === 'completed' ? 'line-through' : ''
                      }`}>
                        {task.title}
                      </h3>
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium border shrink-0 ml-2 ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {task.description && (
                      <p className="text-xs text-infinity-navy/60 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    
                    <div className="text-xs text-infinity-navy/50 mb-2">
                      {task.cases?.case_number && <span>Case: {task.cases.case_number}</span>}
                    </div>
                    
                    {task.due_date && (
                      <div className={`text-xs mb-3 ${
                        isOverdue(task.due_date) && col.key !== 'completed'
                          ? 'text-red-600 font-semibold'
                          : 'text-infinity-navy/50'
                      }`}>
                        Due: {new Date(task.due_date).toLocaleDateString()}
                        {isOverdue(task.due_date) && col.key !== 'completed' && ' ⚠️ OVERDUE'}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {col.nextStatus && (
                        <button
                          onClick={() => handleStatusChange(task.id, col.nextStatus)}
                          className="text-xs px-2 py-1 bg-infinity-navy/10 text-infinity-navy rounded hover:bg-infinity-navy/20 transition-colors"
                        >
                          {col.nextLabel}
                        </button>
                      )}
                      {col.key !== 'completed' && col.key === 'in_progress' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'pending')}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                        >
                          ← Back
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs px-2 py-1 text-red-500 hover:bg-red-50 rounded transition-colors ml-auto"
                      >
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

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-infinity-navy mb-4">Create New Task</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-infinity-navy mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  placeholder="e.g., Review employment contract"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-infinity-navy mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  placeholder="Optional details..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-infinity-navy mb-1">Related Case</label>
                <select
                  value={newTask.case_id}
                  onChange={(e) => setNewTask({ ...newTask, case_id: e.target.value })}
                  className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                >
                  <option value="">No case</option>
                  {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.case_number} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-infinity-navy mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-infinity-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-infinity-navy text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-infinity-gold/20 text-infinity-navy rounded-lg text-sm hover:bg-infinity-cream"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-infinity-navy text-infinity-cream rounded-lg text-sm font-medium hover:bg-infinity-navy/90 disabled:opacity-50"
                >
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
