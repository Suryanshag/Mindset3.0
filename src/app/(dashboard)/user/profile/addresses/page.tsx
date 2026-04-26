'use client'

import { useState, useEffect, useTransition } from 'react'
import { Plus, Pencil, Trash2, Star, Loader2, MapPin } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import AddressForm from '@/components/address/address-form'

interface Address {
  id: string
  label: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export default function ProfileAddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Address | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const fetchAddresses = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/user/addresses')
      const data = await res.json()
      if (data.success) setAddresses(data.data.addresses)
      else setError(data.error)
    } catch {
      setError('Failed to load addresses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAddresses() }, [])

  const handleAdd = async (formData: { label: string; name: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; isDefault: boolean }) => {
    setFormLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setShowAdd(false)
      await fetchAddresses()
      flash('Address added')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (formData: { label: string; name: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; isDefault: boolean }) => {
    if (!editing) return
    setFormLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/addresses/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setEditing(null)
      await fetchAddresses()
      flash('Address updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return
    setDeletingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      await fetchAddresses()
      flash('Address deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/user/addresses/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      })
      await fetchAddresses()
      flash('Default address updated')
    } catch {
      setError('Failed to update default')
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Addresses" back="/user/profile" />
        <div className="space-y-3 pt-5">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-bg-card animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Addresses"
        back="/user/profile"
        rightAction={
          addresses.length < 3 && !showAdd ? (
            <button
              onClick={() => { setEditing(null); setShowAdd(true) }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-tint"
            >
              <Plus size={18} className="text-primary" />
            </button>
          ) : undefined
        }
      />

      <div className="space-y-3.5 pt-5">
        {/* Alerts */}
        {error && (
          <p className="text-[13px] text-red-600 px-1">{error}</p>
        )}
        {success && (
          <p className="text-[13px] text-primary px-1">{success}</p>
        )}

        {/* Add form */}
        {showAdd && (
          <div
            className="bg-bg-card rounded-2xl p-4"
            style={{ border: '0.5px solid var(--color-primary)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[15px] font-medium text-text">New address</p>
              <button onClick={() => setShowAdd(false)} className="text-[13px] text-text-muted">
                Cancel
              </button>
            </div>
            <AddressForm
              onSubmit={handleAdd}
              onCancel={() => setShowAdd(false)}
              isLoading={formLoading}
              submitLabel="Save address"
            />
          </div>
        )}

        {/* Empty state */}
        {addresses.length === 0 && !showAdd && (
          <div
            className="bg-bg-card rounded-2xl py-16 flex flex-col items-center"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <MapPin size={32} className="text-text-faint mb-3" />
            <p className="text-[14px] font-medium text-text">No addresses saved</p>
            <p className="text-[12px] text-text-muted mt-1 mb-4">Save addresses to speed up checkout</p>
            <button
              onClick={() => setShowAdd(true)}
              className="px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-medium"
            >
              Add your first address
            </button>
          </div>
        )}

        {/* Address cards */}
        {addresses.map((addr) => (
          <div key={addr.id}>
            {editing?.id === addr.id ? (
              <div
                className="bg-bg-card rounded-2xl p-4"
                style={{ border: '0.5px solid var(--color-primary)' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[15px] font-medium text-text">Edit address</p>
                  <button onClick={() => setEditing(null)} className="text-[13px] text-text-muted">
                    Cancel
                  </button>
                </div>
                <AddressForm
                  initialData={addr}
                  onSubmit={handleEdit}
                  onCancel={() => setEditing(null)}
                  submitLabel="Update address"
                  isLoading={formLoading}
                />
              </div>
            ) : (
              <div
                className="bg-bg-card rounded-2xl p-4"
                style={{ border: addr.isDefault ? '0.5px solid var(--color-primary)' : '0.5px solid var(--color-border)' }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[14px] font-medium text-text">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 bg-primary-tint text-primary rounded-full font-medium">
                          <Star size={10} />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-text-muted">
                      {addr.name} &middot; {addr.phone}
                    </p>
                    <p className="text-[12px] text-text-faint mt-0.5 leading-relaxed">
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setEditing(addr)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg"
                    >
                      <Pencil size={15} className="text-text-faint" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      disabled={deletingId === addr.id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
                    >
                      {deletingId === addr.id
                        ? <Loader2 size={15} className="text-text-faint animate-spin" />
                        : <Trash2 size={15} className="text-text-faint" />
                      }
                    </button>
                  </div>
                </div>

                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[12px] text-primary font-medium mt-2"
                  >
                    Set as default
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Info line */}
        <p className="text-[11px] text-text-faint text-center">
          {addresses.length} of 3 addresses saved
        </p>
      </div>
    </div>
  )
}
