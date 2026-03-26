import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { getUserFromRequest, hasPermission } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

/**
 * GET /api/billing
 * Fetch invoices and billing summary
 */
export async function GET(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'VIEW_BILLING')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const db = await getDb()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const caseId = searchParams.get('caseId')

    const filter = {}
    if (status) filter.status = status
    if (caseId) filter.caseId = caseId

    const invoices = await db.collection('invoices')
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray()

    // Calculate summary
    const summary = {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0,
      invoiceCount: invoices.length,
    }

    const now = new Date()
    invoices.forEach(inv => {
      summary.totalInvoiced += inv.totalAmount || 0
      if (inv.status === 'paid') summary.totalPaid += inv.totalAmount || 0
      if (inv.status === 'sent' || inv.status === 'overdue') {
        summary.totalOutstanding += inv.totalAmount || 0
        if (inv.dueDate && new Date(inv.dueDate) < now) summary.totalOverdue += inv.totalAmount || 0
      }
    })

    const formattedInvoices = invoices.map(inv => ({
      id: inv.id || inv._id?.toString(),
      invoiceNumber: inv.invoiceNumber,
      caseId: inv.caseId,
      caseNumber: inv.caseNumber || '',
      clientName: inv.clientName || '',
      clientEmail: inv.clientEmail || '',
      status: inv.status || 'draft',
      lineItems: inv.lineItems || [],
      totalAmount: inv.totalAmount || 0,
      taxAmount: inv.taxAmount || 0,
      subtotal: inv.subtotal || 0,
      dueDate: inv.dueDate,
      issuedDate: inv.issuedDate,
      paidDate: inv.paidDate,
      notes: inv.notes || '',
      createdBy: inv.createdBy,
      createdByName: inv.createdByName || '',
      createdAt: inv.createdAt,
    }))

    return NextResponse.json({ invoices: formattedInvoices, summary })
  } catch (err) {
    console.error('Billing GET error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/billing
 * Create a new invoice
 */
export async function POST(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'VIEW_BILLING')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { caseId, caseNumber, clientName, clientEmail, lineItems, dueDate, notes, taxRate } = body

    if (!lineItems || lineItems.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date().toISOString()

    // Generate invoice number
    const count = await db.collection('invoices').countDocuments()
    const invoiceNumber = `INF-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
    const tax = taxRate ? subtotal * (taxRate / 100) : subtotal * 0.15 // SA VAT 15%
    const totalAmount = subtotal + tax

    const invoice = {
      id: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      invoiceNumber,
      caseId: caseId || null,
      caseNumber: caseNumber || '',
      clientName: clientName || '',
      clientEmail: clientEmail || '',
      status: 'draft',
      lineItems: lineItems.map((item, i) => ({
        id: `li_${Date.now()}_${i}`,
        description: item.description || '',
        quantity: item.quantity || 0,
        rate: item.rate || 0,
        amount: (item.quantity || 0) * (item.rate || 0),
      })),
      subtotal,
      taxRate: taxRate || 15,
      taxAmount: tax,
      totalAmount,
      dueDate: dueDate || null,
      issuedDate: null,
      paidDate: null,
      notes: notes || '',
      createdBy: user.id,
      createdByName: user.profile?.full_name || user.email,
      createdAt: now,
      updatedAt: now,
    }

    await db.collection('invoices').insertOne(invoice)

    return NextResponse.json({ invoice }, { status: 201 })
  } catch (err) {
    console.error('Billing POST error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/billing
 * Update invoice status or details
 */
export async function PUT(request) {
  const user = await getUserFromRequest(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = user.profile?.role || 'client'
  if (!hasPermission(role, 'VIEW_BILLING')) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { id, action, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })

    const db = await getDb()
    const invoice = await db.collection('invoices').findOne({ id })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    const now = new Date().toISOString()
    const setFields = { updatedAt: now }

    // Handle status transitions
    if (action === 'send') {
      if (invoice.status !== 'draft') return NextResponse.json({ error: 'Can only send draft invoices' }, { status: 400 })
      setFields.status = 'sent'
      setFields.issuedDate = now
    } else if (action === 'mark_paid') {
      if (!hasPermission(role, 'APPROVE_BILLING')) {
        return NextResponse.json({ error: 'Only authorized personnel can mark invoices as paid' }, { status: 403 })
      }
      setFields.status = 'paid'
      setFields.paidDate = now
    } else if (action === 'void') {
      if (!hasPermission(role, 'APPROVE_BILLING')) {
        return NextResponse.json({ error: 'Only authorized personnel can void invoices' }, { status: 403 })
      }
      setFields.status = 'voided'
    } else {
      // General updates for draft invoices
      if (invoice.status !== 'draft') return NextResponse.json({ error: 'Can only edit draft invoices' }, { status: 400 })
      const allowedFields = ['clientName', 'clientEmail', 'dueDate', 'notes', 'lineItems']
      allowedFields.forEach(f => { if (updates[f] !== undefined) setFields[f] = updates[f] })
      // Recalculate totals if line items changed
      if (updates.lineItems) {
        const subtotal = updates.lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
        const tax = subtotal * ((invoice.taxRate || 15) / 100)
        setFields.subtotal = subtotal
        setFields.taxAmount = tax
        setFields.totalAmount = subtotal + tax
      }
    }

    await db.collection('invoices').updateOne({ id }, { $set: setFields })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Billing PUT error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
