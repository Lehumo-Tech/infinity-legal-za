import { supabase } from './supabase'

// Helper to get auth token for API calls
async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  }
}

// Cases API
export const casesApi = {
  async list(params = {}) {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams(params)
    const res = await fetch(`/api/cases?${searchParams}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async create(caseData) {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers,
      body: JSON.stringify(caseData)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async update(id, updates) {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/cases', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...updates })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }
}

// Tasks API
export const tasksApi = {
  async list(params = {}) {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams(params)
    const res = await fetch(`/api/tasks?${searchParams}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async create(taskData) {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers,
      body: JSON.stringify(taskData)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async update(id, updates) {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/tasks', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ id, ...updates })
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async remove(id) {
    const headers = await getAuthHeaders()
    const res = await fetch(`/api/tasks?id=${id}`, {
      method: 'DELETE',
      headers
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }
}

// Documents API
export const documentsApi = {
  async list(params = {}) {
    const headers = await getAuthHeaders()
    const searchParams = new URLSearchParams(params)
    const res = await fetch(`/api/documents?${searchParams}`, { headers })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async upload(file, caseId, category) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Not authenticated')

    const formData = new FormData()
    formData.append('file', file)
    if (caseId) formData.append('case_id', caseId)
    if (category) formData.append('category', category)

    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }
}

// Dashboard API
export const dashboardApi = {
  async getStats() {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/dashboard/stats', { headers })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }
}

// Profile API
export const profileApi = {
  async get() {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/profile', { headers })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  },

  async update(data) {
    const headers = await getAuthHeaders()
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error((await res.json()).error)
    return res.json()
  }
}
