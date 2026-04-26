'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, MapPin, Star, Loader2, Check } from 'lucide-react'
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

const getLabelIcon = (label: string) => {
  if (label === 'Home') return '\u{1F3E0}'
  if (label === 'Work') return '\u{1F4BC}'
  return '\u{1F4CD}'
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const fetchAddresses = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/user/addresses')
      const data = await res.json()
      if (data.success) setAddresses(data.data.addresses)
      else setError(data.error)
    } catch {
      setError('Failed to load addresses')
    } finally {
      setIsLoading(false)
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
      setShowAddForm(false)
      await fetchAddresses()
      showSuccess('Address added successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save address')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async (formData: { label: string; name: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; isDefault: boolean }) => {
    if (!editingAddress) return
    setFormLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/user/addresses/${editingAddress.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setEditingAddress(null)
      await fetchAddresses()
      showSuccess('Address updated successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update address')
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
      showSuccess('Address deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete address')
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
      showSuccess('Default address updated')
    } catch {
      setError('Failed to update default address')
    }
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse" />
        {[1, 2].map(i => (
          <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Addresses</h1>
          <p className="text-sm text-gray-500 mt-1">{addresses.length} of 3 addresses saved</p>
        </div>
        {addresses.length < 3 && !showAddForm && (
          <button
            onClick={() => { setEditingAddress(null); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Address
          </button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <span className="text-red-500 text-lg">{'\u26A0\uFE0F'}</span>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-green-700 text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Add new address form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white rounded-2xl border-2 border-teal-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">Add New Address</h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
          <AddressForm
            onSubmit={handleAdd}
            onCancel={() => setShowAddForm(false)}
            isLoading={formLoading}
            submitLabel="Save Address"
          />
        </div>
      )}

      {/* Address list */}
      <div className="space-y-4">
        {addresses.length === 0 && !showAddForm && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-semibold">No addresses saved yet</p>
            <p className="text-gray-400 text-sm mt-1 mb-4">Save addresses to speed up checkout</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Add Your First Address
            </button>
          </div>
        )}

        {addresses.map(address => (
          <div key={address.id}>
            {editingAddress?.id === address.id ? (
              <div className="p-6 bg-white rounded-2xl border-2 border-teal-400 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Address</h2>
                  <button
                    onClick={() => setEditingAddress(null)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
                <AddressForm
                  initialData={address}
                  onSubmit={handleEdit}
                  onCancel={() => setEditingAddress(null)}
                  submitLabel="Update Address"
                  isLoading={formLoading}
                />
              </div>
            ) : (
              <div className={`p-5 bg-white rounded-2xl border shadow-sm transition-all ${
                address.isDefault
                  ? 'border-teal-300 bg-gradient-to-br from-teal-50/50 to-white'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  {/* Left: icon + details */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                      {getLabelIcon(address.label)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-gray-900">{address.label}</span>
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full font-medium">
                            <Star className="w-3 h-3" />
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-700">
                        {address.name} {'\u00B7'} {address.phone}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                        {address.addressLine1}
                        {address.addressLine2 && `, ${address.addressLine2}`}
                        <br />
                        {address.city}, {address.state} — {address.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Right: action buttons */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingAddress(address)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Edit address"
                      >
                        <Pencil className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        disabled={deletingId === address.id}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group disabled:opacity-50"
                        title="Delete address"
                      >
                        {deletingId === address.id
                          ? <Loader2 className="w-4 h-4 text-red-400 animate-spin" />
                          : <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                        }
                      </button>
                    </div>
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors whitespace-nowrap"
                      >
                        Set as default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add another address bottom button */}
      {addresses.length > 0 && addresses.length < 3 && !showAddForm && (
        <button
          onClick={() => { setEditingAddress(null); setShowAddForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
          className="mt-4 w-full py-3 px-4 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600 transition-all flex items-center justify-center gap-2 font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Another Address ({addresses.length}/3)
        </button>
      )}

      {/* Max limit hint */}
      {addresses.length === 3 && (
        <p className="text-center text-sm text-gray-400 mt-4">
          Maximum 3 addresses reached. Delete one to add another.
        </p>
      )}
    </div>
  )
}
