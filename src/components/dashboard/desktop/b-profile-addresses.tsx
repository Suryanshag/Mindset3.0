'use client'

import { useEffect, useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import AddressForm from '@/components/address/address-form'

// Phase 3j — Address book (Direction B port).

type Address = {
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

type FormData = {
  label: string
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export default function BProfileAddresses() {
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

  async function fetchAddresses() {
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

  useEffect(() => {
    fetchAddresses()
  }, [])

  async function handleAdd(formData: FormData) {
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

  async function handleEdit(formData: FormData) {
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

  async function handleDelete(id: string) {
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

  async function handleSetDefault(id: string) {
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

  return (
    <>
      <BPageHeader
        title="Address book."
        breadcrumb={[
          { label: 'PROFILE', href: '/user/profile' },
          { label: 'ADDRESSES' },
        ]}
        back="/user/profile"
        sub="Where we ship books and notebooks. Not where we send anything about therapy."
        ctas={['search']}
      />

      <div className="flex items-center gap-2">
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            background: 'var(--ink)',
            color: '#fff',
          }}
        >
          {addresses.length} of 3 saved
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            marginLeft: 8,
          }}
        >
          USED ONLY FOR SHOP &amp; NGO LOGISTICS
        </span>
        <div style={{ flex: 1 }} />
        {addresses.length < 3 && !showAdd && (
          <button
            type="button"
            onClick={() => {
              setEditing(null)
              setShowAdd(true)
            }}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
            }}
          >
            Add an address +
          </button>
        )}
      </div>

      {error && <p style={{ fontSize: 13, color: '#9A3412' }}>{error}</p>}
      {success && <p style={{ fontSize: 13, color: 'var(--primary)' }}>{success}</p>}

      {loading ? (
        <BCard>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>
        </BCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {showAdd && (
            <BCard padding={18} accent="var(--primary)">
              <div className="flex items-baseline justify-between mb-3">
                <BCap>New address</BCap>
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                  }}
                >
                  Cancel
                </button>
              </div>
              <AddressForm
                onSubmit={handleAdd}
                onCancel={() => setShowAdd(false)}
                isLoading={formLoading}
                submitLabel="Save address"
              />
            </BCard>
          )}

          {addresses.map((addr) =>
            editing?.id === addr.id ? (
              <BCard key={addr.id} padding={18} accent="var(--primary)">
                <div className="flex items-baseline justify-between mb-3">
                  <BCap>Edit address</BCap>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      background: 'transparent',
                      border: 'none',
                    }}
                  >
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
              </BCard>
            ) : (
              <BCard
                key={addr.id}
                padding={18}
                accent={addr.isDefault ? 'var(--primary)' : undefined}
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div className="flex items-baseline justify-between">
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {addr.label}
                  </span>
                  {addr.isDefault ? (
                    <BChip kind="primary">
                      <Star size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                      DEFAULT
                    </BChip>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 11,
                        color: 'var(--primary)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      Set as default
                    </button>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.55,
                  }}
                >
                  {addr.name}
                  <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                    {addr.addressLine1}
                    {addr.addressLine2 && (
                      <>
                        <br />
                        {addr.addressLine2}
                      </>
                    )}
                    <br />
                    {addr.city}, {addr.state} — {addr.pincode}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-faint)',
                    marginTop: 'auto',
                  }}
                >
                  {addr.phone}
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditing(addr)}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'transparent',
                      color: 'var(--text)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                    }}
                  >
                    Edit
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    disabled={deletingId === addr.id}
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 12,
                      padding: '7px 12px',
                      borderRadius: 999,
                      background: 'transparent',
                      color: 'var(--accent-deep)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {deletingId === addr.id ? <Loader2 size={12} className="animate-spin" /> : 'Delete'}
                  </button>
                </div>
              </BCard>
            ),
          )}

          {addresses.length < 3 && !showAdd && (
            <div
              style={{
                background: 'transparent',
                borderRadius: 14,
                border: '1px dashed var(--border-strong)',
                padding: 18,
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 8,
              }}
              onClick={() => {
                setEditing(null)
                setShowAdd(true)
              }}
              role="button"
              tabIndex={0}
            >
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 28,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  lineHeight: 1,
                }}
              >
                +
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--text)',
                }}
              >
                Add a new address
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                For shop orders or NGO visits you&rsquo;re driving to.
              </p>
            </div>
          )}
        </div>
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
        }}
      >
        Addresses are never shared with your therapist.
      </p>
    </>
  )
}
