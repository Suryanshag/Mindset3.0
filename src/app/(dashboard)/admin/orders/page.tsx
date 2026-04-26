'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import ToastContainer from '@/components/ui/toast-container'

interface OrderRow {
  id: string
  totalAmount: string
  deliveryCharge: string
  paymentStatus: string
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  shiprocketOrderId: number | null
  createdAt: string
  user: { id: string; name: string; email: string }
  orderItems: { quantity: number; price: string; product: { name: string } }[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  PROCESSING: { bg: '#dbeafe', text: '#1e40af' },
  SHIPPED: { bg: '#e0e7ff', text: '#3730a3' },
  DELIVERED: { bg: '#dcfce7', text: '#166534' },
  RETURNED: { bg: '#fee2e2', text: '#991b1b' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ shippingStatus: '', awbCode: '' })
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { toasts, addToast, removeToast } = useToast()
  const limit = 20

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter, paymentFilter])

  function fetchOrders() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter) params.set('status', statusFilter)
    if (paymentFilter) params.set('paymentStatus', paymentFilter)

    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setOrders(res.data.orders)
          setTotal(res.data.total)
        }
      })
      .finally(() => setLoading(false))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const body: Record<string, string> = {}
    if (editForm.shippingStatus) body.shippingStatus = editForm.shippingStatus
    if (editForm.awbCode) body.awbCode = editForm.awbCode

    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? { ...o, shippingStatus: editForm.shippingStatus || o.shippingStatus, awbCode: editForm.awbCode || o.awbCode }
            : o
        )
      )
      setEditingId(null)
    }
    setSaving(false)
  }

  async function retryShipment(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}/retry-shipment`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        addToast('Shipment creation initiated', 'success')
        fetchOrders()
      } else {
        addToast(data.error ?? 'Failed to create shipment', 'error')
      }
    } catch {
      addToast('Failed to create shipment', 'error')
    }
    setActionLoading(null)
  }

  async function cancelShipmentAction(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/admin/orders/${id}/cancel-shipment`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        addToast('Shipment cancelled successfully', 'success')
        fetchOrders()
      } else {
        addToast(data.error ?? 'Failed to cancel shipment', 'error')
      }
    } catch {
      addToast('Failed to cancel shipment', 'error')
    }
    setActionLoading(null)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
          <option value="">All Payment</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="FAILED">Failed</option>
        </select>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm">
          <option value="">All Shipping</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading orders...</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="lg:hidden space-y-3">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders found.</p>
            ) : orders.map((o) => {
              const pColors = STATUS_COLORS[o.paymentStatus] ?? { bg: '#f3f4f6', text: '#374151' }
              const sColors = STATUS_COLORS[o.shippingStatus] ?? { bg: '#f3f4f6', text: '#374151' }
              const isActioning = actionLoading === o.id
              return (
                <div key={o.id} className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{o.user.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">#{o.id.slice(-8)}</p>
                    </div>
                    <p className="font-bold text-gray-900 flex-shrink-0">{'\u20B9'}{Number(o.totalAmount).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: pColors.bg, color: pColors.text }}>{o.paymentStatus}</span>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: sColors.bg, color: sColors.text }}>{o.shippingStatus}</span>
                  </div>
                  {o.awbCode && <p className="text-xs text-gray-500 mt-2">AWB: {o.awbCode}</p>}

                  {/* Expanded items */}
                  {expandedId === o.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-1">Items:</p>
                      {o.orderItems.map((item, i) => (
                        <p key={i} className="text-xs text-gray-700">{item.product.name} x{item.quantity} — {'\u20B9'}{Number(item.price).toLocaleString('en-IN')}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
                      <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="text-xs text-blue-600 font-medium">
                        {expandedId === o.id ? 'Hide' : 'Items'}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === o.id ? (
                        <div className="flex flex-col gap-2 items-end">
                          <select value={editForm.shippingStatus} onChange={(e) => setEditForm({ ...editForm, shippingStatus: e.target.value })} className="text-xs px-2 py-1 border rounded">
                            <option value="">No change</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="SHIPPED">Shipped</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="RETURNED">Returned</option>
                          </select>
                          <input type="text" placeholder="AWB Code" value={editForm.awbCode} onChange={(e) => setEditForm({ ...editForm, awbCode: e.target.value })} className="text-xs px-2 py-1 border rounded w-full" />
                          <div className="flex gap-1">
                            <button onClick={() => saveEdit(o.id)} disabled={saving} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setEditingId(o.id); setEditForm({ shippingStatus: '', awbCode: o.awbCode ?? '' }) }} className="text-xs text-blue-600 font-medium">Update</button>
                          {!o.shiprocketOrderId && o.paymentStatus === 'PAID' && (
                            <button onClick={() => retryShipment(o.id)} disabled={isActioning} className="text-xs text-amber-600 font-medium disabled:opacity-50">
                              {isActioning ? 'Creating...' : 'Ship'}
                            </button>
                          )}
                          {o.shiprocketOrderId && ['PROCESSING', 'SHIPPED'].includes(o.shippingStatus) && (
                            <button onClick={() => cancelShipmentAction(o.id)} disabled={isActioning} className="text-xs text-red-600 font-medium disabled:opacity-50">
                              {isActioning ? '...' : 'Cancel'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Payment</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Shipping</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const pColors = STATUS_COLORS[o.paymentStatus] ?? { bg: '#f3f4f6', text: '#374151' }
                  const sColors = STATUS_COLORS[o.shippingStatus] ?? { bg: '#f3f4f6', text: '#374151' }
                  const isActioning = actionLoading === o.id
                  return (
                    <>
                      <tr key={o.id} className="border-b border-gray-50">
                        <td className="py-3 px-4">
                          <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="text-xs text-blue-600 hover:underline font-medium">
                            #{o.id.slice(-8)}
                          </button>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-gray-900">{o.user.name}</p>
                          <p className="text-xs text-gray-500">{o.user.email}</p>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-medium text-gray-900">{'\u20B9'}{Number(o.totalAmount).toLocaleString('en-IN')}</span>
                          {Number(o.deliveryCharge) > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">incl. {'\u20B9'}{Number(o.deliveryCharge).toLocaleString('en-IN')} delivery</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: pColors.bg, color: pColors.text }}>{o.paymentStatus}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: sColors.bg, color: sColors.text }}>{o.shippingStatus}</span>
                          {o.awbCode && <p className="text-xs text-gray-500 mt-1">AWB: {o.awbCode}</p>}
                          {o.courierName && <p className="text-xs text-gray-400">{o.courierName}</p>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-col gap-1 items-end">
                            {editingId === o.id ? (
                              <div className="flex flex-col gap-2 items-end">
                                <select value={editForm.shippingStatus} onChange={(e) => setEditForm({ ...editForm, shippingStatus: e.target.value })} className="text-xs px-2 py-1 border rounded">
                                  <option value="">No change</option>
                                  <option value="PROCESSING">Processing</option>
                                  <option value="SHIPPED">Shipped</option>
                                  <option value="DELIVERED">Delivered</option>
                                  <option value="RETURNED">Returned</option>
                                </select>
                                <input type="text" placeholder="AWB Code" value={editForm.awbCode} onChange={(e) => setEditForm({ ...editForm, awbCode: e.target.value })} className="text-xs px-2 py-1 border rounded w-32" />
                                <div className="flex gap-1">
                                  <button onClick={() => saveEdit(o.id)} disabled={saving} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Save</button>
                                  <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(o.id); setEditForm({ shippingStatus: '', awbCode: o.awbCode ?? '' }) }} className="text-xs text-blue-600 hover:underline">
                                  Update
                                </button>
                                {!o.shiprocketOrderId && o.paymentStatus === 'PAID' && (
                                  <button
                                    onClick={() => retryShipment(o.id)}
                                    disabled={isActioning}
                                    className="text-xs text-amber-600 hover:underline disabled:opacity-50"
                                  >
                                    {isActioning ? 'Creating...' : 'Create Shipment'}
                                  </button>
                                )}
                                {o.shiprocketOrderId && ['PROCESSING', 'SHIPPED'].includes(o.shippingStatus) && (
                                  <button
                                    onClick={() => cancelShipmentAction(o.id)}
                                    disabled={isActioning}
                                    className="text-xs text-red-600 hover:underline disabled:opacity-50"
                                  >
                                    {isActioning ? 'Cancelling...' : 'Cancel Shipment'}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === o.id && (
                        <tr key={`${o.id}-items`} className="border-b border-gray-50 bg-gray-50">
                          <td colSpan={7} className="py-3 px-8">
                            <p className="text-xs font-medium text-gray-500 mb-2">Items:</p>
                            {o.orderItems.map((item, i) => (
                              <p key={i} className="text-xs text-gray-700">{item.product.name} x{item.quantity} — ₹{Number(item.price).toLocaleString('en-IN')}</p>
                            ))}
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
            {orders.length === 0 && <p className="p-6 text-center text-gray-500">No orders found.</p>}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50">Previous</button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50">Next</button>
            </div>
          )}
        </>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
