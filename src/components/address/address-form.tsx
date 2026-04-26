'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
  'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh',
  'Chandigarh', 'Puducherry',
]

const PRESET_LABELS = [
  { value: 'Home', icon: '\u{1F3E0}' },
  { value: 'Work', icon: '\u{1F4BC}' },
  { value: 'Other', icon: '\u{1F4CD}' },
]

export interface AddressFormData {
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

interface AddressFormProps {
  initialData?: Partial<AddressFormData>
  onSubmit: (data: AddressFormData) => Promise<void>
  onCancel?: () => void
  submitLabel?: string
  isLoading?: boolean
}

export default function AddressForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Save Address',
  isLoading = false,
}: AddressFormProps) {
  const [label, setLabel] = useState(initialData?.label ?? 'Home')
  const [isCustomLabel, setIsCustomLabel] = useState(
    initialData?.label ? !PRESET_LABELS.map(p => p.value).includes(initialData.label) : false
  )
  const [name, setName] = useState(initialData?.name ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [addressLine1, setAddressLine1] = useState(initialData?.addressLine1 ?? '')
  const [addressLine2, setAddressLine2] = useState(initialData?.addressLine2 ?? '')
  const [city, setCity] = useState(initialData?.city ?? '')
  const [state, setState] = useState(initialData?.state ?? '')
  const [pincode, setPincode] = useState(initialData?.pincode ?? '')
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? false)

  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pincode autofill — depends on standalone pincode string
  useEffect(() => {
    if (pincode.length !== 6) {
      if (pincodeStatus !== 'idle') setPincodeStatus('idle')
      return
    }

    setPincodeStatus('loading')

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincode/${pincode}`)
        const data = await res.json()

        if (data.success) {
          setCity(data.data.city)
          setState(data.data.state)
          setPincodeStatus('success')
          setErrors(prev => {
            const next = { ...prev }
            delete next.city
            delete next.state
            delete next.pincode
            return next
          })
        } else {
          setPincodeStatus('error')
        }
      } catch {
        setPincodeStatus('error')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [pincode]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearError = (field: string) => {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!label || label.trim().length === 0) newErrors.label = 'Please select a label'
    if (!name || name.trim().length < 2) newErrors.name = 'Full name is required'
    if (!/^[6-9]\d{9}$/.test(phone)) newErrors.phone = 'Enter valid 10-digit mobile number'
    if (!addressLine1 || addressLine1.trim().length < 5) newErrors.addressLine1 = 'Address is too short'
    if (!city || city.trim().length === 0) newErrors.city = 'City is required'
    if (!state || state.trim().length === 0) newErrors.state = 'Please select a state'
    if (!/^\d{6}$/.test(pincode)) newErrors.pincode = 'Enter valid 6-digit pincode'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    await onSubmit({
      label: label.trim(),
      name: name.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault,
    })
  }

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border text-sm transition-all duration-200 outline-none bg-white ${
      errors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
        : 'border-gray-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10'
    }`

  return (
    <div className="space-y-5">
      {/* Label selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Save address as</p>
        <div className="flex flex-wrap gap-2">
          {PRESET_LABELS.map(({ value, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setIsCustomLabel(false)
                setLabel(value)
                clearError('label')
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                !isCustomLabel && label === value
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
              }`}
            >
              {icon} {value}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setIsCustomLabel(true)
              setLabel('')
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              isCustomLabel
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-teal-300'
            }`}
          >
            {'\u270F\uFE0F'} Custom
          </button>
        </div>

        {isCustomLabel && (
          <input
            type="text"
            autoFocus
            placeholder="e.g. Parents' Home, Gym"
            value={label}
            onChange={e => { setLabel(e.target.value); clearError('label') }}
            className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none"
            maxLength={30}
          />
        )}
        {errors.label && <p className="text-red-500 text-xs mt-1">{errors.label}</p>}
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
          <input
            type="text"
            placeholder="Recipient full name"
            value={name}
            onChange={e => { setName(e.target.value); clearError('name') }}
            className={inputClass('name')}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number *</label>
          <input
            type="tel"
            placeholder="10-digit mobile"
            value={phone}
            onChange={e => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); clearError('phone') }}
            className={inputClass('phone')}
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
        </div>
      </div>

      {/* Address lines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Address Line 1 *</label>
        <input
          type="text"
          placeholder="Flat/House No., Building, Street"
          value={addressLine1}
          onChange={e => { setAddressLine1(e.target.value); clearError('addressLine1') }}
          className={inputClass('addressLine1')}
        />
        {errors.addressLine1 && <p className="text-red-500 text-xs mt-1">{errors.addressLine1}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="Area, Colony, Landmark"
          value={addressLine2}
          onChange={e => setAddressLine2(e.target.value)}
          className={inputClass('addressLine2')}
        />
      </div>

      {/* Pincode + City + State */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="6-digit pincode"
              value={pincode}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                setPincode(val)
                clearError('pincode')
              }}
              className={inputClass('pincode')}
              maxLength={6}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {pincodeStatus === 'loading' && (
                <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
              )}
              {pincodeStatus === 'success' && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {pincodeStatus === 'error' && (
                <X className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
          {pincodeStatus === 'success' && (
            <p className="text-green-600 text-xs mt-1">{'\u2713'} City and state auto-filled</p>
          )}
          {pincodeStatus === 'error' && (
            <p className="text-amber-600 text-xs mt-1">Not found — fill manually</p>
          )}
          {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
          <input
            type="text"
            placeholder="City"
            value={city}
            onChange={e => { setCity(e.target.value); clearError('city') }}
            className={inputClass('city')}
          />
          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
          <select
            value={state}
            onChange={e => { setState(e.target.value); clearError('state') }}
            className={inputClass('state') + ' cursor-pointer'}
          >
            <option value="">Select State</option>
            {INDIAN_STATES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
        </div>
      </div>

      {/* Default toggle */}
      <button
        type="button"
        onClick={() => setIsDefault(prev => !prev)}
        className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-left"
      >
        <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          isDefault ? 'bg-teal-600' : 'bg-gray-300'
        }`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
            isDefault ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">Set as default address</p>
          <p className="text-xs text-gray-500">Pre-selected at checkout</p>
        </div>
      </button>

      {/* Action buttons */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </div>
  )
}
