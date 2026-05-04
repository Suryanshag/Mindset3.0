'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useCart } from '@/lib/cart-context'
import RazorpayCheckout from '@/components/payments/razorpay-checkout'
import AddressForm from '@/components/address/address-form'
import { Minus, Plus, Trash2, Check, Truck, CreditCard, MapPin, Star, Loader2 } from 'lucide-react'

interface ShippingAddress {
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

interface CourierOption {
  courierId: number
  courierName: string
  rate: number
  estimatedDays: string
  tag: 'CHEAPEST' | 'FASTEST' | 'CHEAPEST_AND_FASTEST'
}

interface SavedAddress {
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

export default function CheckoutPage() {
  const router = useRouter()
  const { data: authSession, status: sessionStatus } = useSession()
  const { items, isLoading: cartLoading, updateQuantity, removeItem, clearCart, totalAmount, totalItems } = useCart()

  const [step, setStep] = useState(1)
  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [couriers, setCouriers] = useState<CourierOption[]>([])
  const [selectedCourier, setSelectedCourier] = useState<CourierOption | null>(null)
  const [loadingCouriers, setLoadingCouriers] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string
    amount: number
    orderId: string
  } | null>(null)

  // Saved addresses state
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveNewAddress, setSaveNewAddress] = useState(true)
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [savingAddress, setSavingAddress] = useState(false)

  // Ordering for someone else
  const [orderingForSomeoneElse, setOrderingForSomeoneElse] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')

  // Digital product detection
  const allDigital = items.length > 0 && items.every(i => i.isDigital)
  const hasPhysical = items.some(i => !i.isDigital)

  // Pre-load Razorpay SDK so it's ready when user clicks Pay
  useEffect(() => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  // Jump to payment step for digital-only carts
  useEffect(() => {
    if (allDigital && step === 1) {
      setStep(3)
    }
  }, [allDigital, step])

  // Fetch saved addresses on mount
  useEffect(() => {
    fetch('/api/user/addresses')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSavedAddresses(d.data.addresses)
          const def = d.data.addresses.find((a: SavedAddress) => a.isDefault)
          if (def) setSelectedAddressId(def.id)
        }
      })
      .catch(() => {})
      .finally(() => setAddressesLoading(false))
  }, [])

  // Redirect if cart is empty and no payment in progress
  // Wait for session + cart fetch to settle before redirecting
  useEffect(() => {
    if (sessionStatus !== 'authenticated' || cartLoading) return
    if (items.length === 0 && !paymentData && !message) {
      router.push('/user/shop')
    }
  }, [sessionStatus, cartLoading, items.length, paymentData, message, router])

  // Handle new address form submission from AddressForm component
  async function handleNewAddressSubmit(formData: { label: string; name: string; phone: string; addressLine1: string; addressLine2: string; city: string; state: string; pincode: string; isDefault: boolean }) {
    const newAddress: ShippingAddress = {
      name: formData.name,
      phone: formData.phone,
      addressLine1: formData.addressLine1,
      addressLine2: formData.addressLine2,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    }

    // Save new address if requested
    if (saveNewAddress && savedAddresses.length < 3) {
      setSavingAddress(true)
      try {
        const res = await fetch('/api/user/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: formData.label,
            name: formData.name,
            phone: formData.phone,
            addressLine1: formData.addressLine1,
            addressLine2: formData.addressLine2 || undefined,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            isDefault: formData.isDefault || savedAddresses.length === 0,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setSavedAddresses(prev => [...prev, data.data.address])
        }
      } catch {
        // Non-blocking — address save failure shouldn't stop checkout
      } finally {
        setSavingAddress(false)
      }
    }

    // Override with recipient details if ordering for someone else
    if (orderingForSomeoneElse) {
      if (!recipientName || recipientName.length < 2) {
        setError('Please enter the recipient\'s name')
        return
      }
      if (!/^[6-9]\d{9}$/.test(recipientPhone)) {
        setError('Please enter a valid 10-digit phone number for the recipient')
        return
      }
      newAddress.name = recipientName
      newAddress.phone = recipientPhone
    }

    setAddress(newAddress)
    setError('')
    setLoadingCouriers(true)

    try {
      const estimatedWeight = items.reduce((sum, item) => sum + 0.5 * item.quantity, 0)
      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPostcode: newAddress.pincode,
          weight: Math.max(estimatedWeight, 0.1),
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Failed to fetch delivery options')
        setLoadingCouriers(false)
        return
      }
      const fetchedCouriers = data.data.couriers as CourierOption[]
      setCouriers(fetchedCouriers)
      const cheapest = fetchedCouriers.find(c => c.tag === 'CHEAPEST' || c.tag === 'CHEAPEST_AND_FASTEST')
      setSelectedCourier(cheapest ?? fetchedCouriers[0])
      setStep(2)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingCouriers(false)
    }
  }

  async function handleCheckDelivery() {
    // This handles saved address path only (new address uses handleNewAddressSubmit via AddressForm)
    const selectedSaved = savedAddresses.find(a => a.id === selectedAddressId)
    if (!selectedSaved) {
      setError('Please select a saved address')
      return
    }

    const effectiveAddress: ShippingAddress = {
      name: selectedSaved.name,
      phone: selectedSaved.phone,
      addressLine1: selectedSaved.addressLine1,
      addressLine2: selectedSaved.addressLine2 || '',
      city: selectedSaved.city,
      state: selectedSaved.state,
      pincode: selectedSaved.pincode,
    }

    // Validate recipient if ordering for someone else
    if (orderingForSomeoneElse) {
      if (!recipientName || recipientName.length < 2) {
        setError('Please enter the recipient\'s name')
        return
      }
      if (!/^[6-9]\d{9}$/.test(recipientPhone)) {
        setError('Please enter a valid 10-digit phone number for the recipient')
        return
      }
      effectiveAddress.name = recipientName
      effectiveAddress.phone = recipientPhone
    }

    setAddress(effectiveAddress)
    setError('')
    setLoadingCouriers(true)

    try {
      const estimatedWeight = items.reduce((sum, item) => sum + 0.5 * item.quantity, 0)

      const res = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPostcode: effectiveAddress.pincode,
          weight: Math.max(estimatedWeight, 0.1),
        }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.error ?? 'Failed to fetch delivery options')
        setLoadingCouriers(false)
        return
      }

      const fetchedCouriers = data.data.couriers as CourierOption[]
      setCouriers(fetchedCouriers)
      const cheapest = fetchedCouriers.find(
        c => c.tag === 'CHEAPEST' || c.tag === 'CHEAPEST_AND_FASTEST'
      )
      setSelectedCourier(cheapest ?? fetchedCouriers[0])
      setStep(2)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoadingCouriers(false)
    }
  }

  async function handlePlaceOrder() {
    if (!allDigital && !selectedCourier) return

    setPlacing(true)
    setError('')

    try {
      // Build request body — omit shipping fields for digital-only
      const orderBody: Record<string, unknown> = {
        type: 'PRODUCT',
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      }
      if (allDigital) {
        orderBody.digital = true
      } else {
        orderBody.shippingAddress = address
        orderBody.selectedCourierId = selectedCourier!.courierId
        orderBody.selectedCourierName = selectedCourier!.courierName
        orderBody.deliveryCharge = selectedCourier!.rate
      }

      // Single API call creates Order + Payment + Razorpay order atomically
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Failed to create order')
        setPlacing(false)
        return
      }

      setPaymentData({
        razorpayOrderId: data.data.razorpayOrderId,
        amount: data.data.amount,
        orderId: data.data.orderId,
      })
    } catch {
      setError('Something went wrong')
      setPlacing(false)
    }
  }

  async function handlePaymentSuccess() {
    setPaymentData(null)
    await clearCart()
    setMessage('Payment successful! Your order has been placed.')
    setTimeout(() => router.push('/user/orders'), 2000)
  }

  function handlePaymentDismiss() {
    setPaymentData(null)
    setPlacing(false)
    setError('Payment cancelled. You can retry.')
  }

  const grandTotal = allDigital ? totalAmount : totalAmount + (selectedCourier?.rate ?? 0)

  if (message) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>Checkout</h1>
        <div className="bg-green-50 rounded-xl p-8 text-center">
          <p className="text-green-700 font-semibold text-lg">{message}</p>
          <p className="text-sm text-gray-500 mt-2">Redirecting to your orders...</p>
        </div>
      </div>
    )
  }

  if (items.length === 0) return null

  const steps = allDigital
    ? [{ number: 3, label: 'Payment', icon: CreditCard }]
    : [
        { number: 1, label: 'Address', icon: MapPin },
        { number: 2, label: 'Delivery', icon: Truck },
        { number: 3, label: 'Payment', icon: CreditCard },
      ]

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>Checkout</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((s, i) => (
          <div key={s.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  s.number < step
                    ? 'bg-primary text-white'
                    : s.number === step
                    ? 'bg-primary text-white ring-4 ring-primary/20'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {s.number < step ? <Check size={18} /> : s.number}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${
                s.number <= step ? 'text-primary' : 'text-gray-400'
              }`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 ${
                s.number < step ? 'bg-primary' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{error}</p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-3">
          {/* STEP 1: Address + Cart */}
          {step === 1 && (
            <>
              <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                Cart ({totalItems} item{totalItems !== 1 ? 's' : ''})
              </h2>
              {items.map(item => (
                <div key={item.productId} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">{'\u{1F4E6}'}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--navy)' }}>{item.name}</p>
                    <p className="text-sm text-gray-500">{'\u20B9'}{item.price.toLocaleString('en-IN')} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--navy)' }}>
                    {'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}

              <h2 className="text-lg font-bold pt-4" style={{ color: 'var(--navy)' }}>
                Shipping Address
              </h2>

              {addressesLoading ? (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : savedAddresses.length > 0 && !showNewAddressForm ? (
                <>
                  {/* Saved address cards */}
                  <div className="space-y-3">
                    {savedAddresses.map(addr => {
                      const isSelected = selectedAddressId === addr.id
                      return (
                        <button
                          key={addr.id}
                          onClick={() => setSelectedAddressId(addr.id)}
                          className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:-translate-y-0.5 ${
                            isSelected
                              ? 'border-primary bg-primary-tint'
                              : 'border-gray-100 bg-white hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'border-primary' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                                  {addr.label}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-xs px-2 py-0.5 bg-primary-tint text-primary rounded-full font-medium flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-gray-700 mt-0.5">
                                {addr.name} {'\u00B7'} {addr.phone}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                                , {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Add new address option */}
                  {savedAddresses.length < 3 && (
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="w-full text-left rounded-xl border-2 border-dashed border-gray-200 p-4 text-sm text-primary font-medium hover:border-primary/40 hover:bg-primary-tint transition-all flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add New Address
                    </button>
                  )}

                  {/* Ordering for someone else toggle */}
                  {selectedAddressId && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mt-2">
                      <button
                        type="button"
                        onClick={() => setOrderingForSomeoneElse(prev => !prev)}
                        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                          orderingForSomeoneElse ? 'bg-amber-500' : 'bg-gray-300'
                        }`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          orderingForSomeoneElse ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          {'\u{1F381}'} Ordering for someone else?
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                          Enter recipient details for the shipping label
                        </p>
                      </div>
                    </div>
                  )}

                  {orderingForSomeoneElse && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Recipient Name *</label>
                        <input
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="Full name"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Recipient Phone *</label>
                        <input
                          value={recipientPhone}
                          onChange={e => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* New address form (inline or when no saved addresses) */}
                  {showNewAddressForm && savedAddresses.length > 0 && (
                    <button
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-sm text-primary hover:text-primary font-medium"
                    >
                      {'\u2190'} Back to saved addresses
                    </button>
                  )}

                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <AddressForm
                      initialData={authSession?.user?.name ? { name: authSession.user.name } : undefined}
                      onSubmit={handleNewAddressSubmit}
                      submitLabel={loadingCouriers || savingAddress ? 'Checking...' : 'Check Delivery Options'}
                      isLoading={loadingCouriers || savingAddress}
                    />
                  </div>

                  {/* Save this address checkbox */}
                  {savedAddresses.length < 3 && (
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={saveNewAddress}
                        onChange={e => setSaveNewAddress(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      Save this address for future orders
                    </label>
                  )}

                  {/* Ordering for someone else toggle (manual form) */}
                  <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 mt-2">
                    <button
                      type="button"
                      onClick={() => setOrderingForSomeoneElse(prev => !prev)}
                      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                        orderingForSomeoneElse ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        orderingForSomeoneElse ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        {'\u{1F381}'} Ordering for someone else?
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Enter recipient details for the shipping label
                      </p>
                    </div>
                  </div>

                  {orderingForSomeoneElse && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Recipient Name *</label>
                        <input
                          value={recipientName}
                          onChange={e => setRecipientName(e.target.value)}
                          placeholder="Full name"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 block mb-1">Recipient Phone *</label>
                        <input
                          value={recipientPhone}
                          onChange={e => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile"
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* STEP 2: Courier Selection */}
          {step === 2 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                  Select Delivery Option
                </h2>
                <button
                  onClick={() => { setStep(1); setError('') }}
                  className="text-sm text-primary hover:text-primary font-medium"
                >
                  &larr; Change Address
                </button>
              </div>

              {/* Address summary */}
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
                <p className="font-semibold text-gray-800">{address.name}</p>
                <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                <p>{address.city}, {address.state} — {address.pincode}</p>
                <p>{address.phone}</p>
              </div>

              {/* Courier cards */}
              <div className="space-y-3">
                {couriers.map(courier => {
                  const isSelected = selectedCourier?.courierId === courier.courierId
                  const isFastest = courier.tag === 'FASTEST' || courier.tag === 'CHEAPEST_AND_FASTEST'
                  const isCheapest = courier.tag === 'CHEAPEST' || courier.tag === 'CHEAPEST_AND_FASTEST'
                  return (
                    <button
                      key={courier.courierId}
                      onClick={() => setSelectedCourier(courier)}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all hover:-translate-y-0.5 ${
                        isSelected
                          ? 'border-primary bg-primary-tint'
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className="flex gap-2 mb-2.5">
                        {isFastest && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Fastest
                          </span>
                        )}
                        {isCheapest && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            Best Value
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-primary' : 'border-gray-300'
                          }`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                          <div>
                            <p className="font-semibold text-sm" style={{ color: 'var(--navy)' }}>
                              {courier.courierName}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Estimated: {courier.estimatedDays} days
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-sm" style={{ color: 'var(--navy)' }}>
                          {'\u20B9'}{courier.rate.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* STEP 3: Payment */}
          {step === 3 && (allDigital || selectedCourier) && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                  Review & Pay
                </h2>
                {!allDigital && (
                  <button
                    onClick={() => { setStep(2); setPaymentData(null); setError('') }}
                    className="text-sm text-primary hover:text-primary font-medium"
                  >
                    &larr; Change Delivery
                  </button>
                )}
              </div>

              {/* Digital delivery notice */}
              {allDigital && (
                <div className="bg-primary-tint rounded-xl border border-primary/20 p-4 text-sm text-primary">
                  Digital delivery — available in your library immediately after payment
                </div>
              )}

              {/* Address summary (physical orders only) */}
              {!allDigital && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
                  <p className="font-semibold text-gray-800">{address.name}</p>
                  <p>{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ''}</p>
                  <p>{address.city}, {address.state} — {address.pincode}</p>
                </div>
              )}

              {/* Items summary */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--navy)' }}>Items</h3>
                {items.map(item => (
                  <div key={item.productId} className="flex justify-between text-sm py-1.5">
                    <div>
                      <span className="text-gray-600">{item.name} x{item.quantity}</span>
                      {hasPhysical && (
                        <span className={`ml-2 text-xs ${item.isDigital ? 'text-primary' : 'text-gray-400'}`}>
                          {item.isDigital ? 'Available immediately' : 'Ships in 2-3 days'}
                        </span>
                      )}
                    </div>
                    <span className="font-medium">{'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                ))}
                {selectedCourier && (
                  <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between text-sm">
                    <span className="text-gray-500">Delivery ({selectedCourier.courierName})</span>
                    <span className="font-medium">{'\u20B9'}{selectedCourier.rate.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-24">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between">
                  <span className="text-gray-600 truncate mr-2">{item.name} x{item.quantity}</span>
                  <span className="font-medium flex-shrink-0">
                    {'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {selectedCourier && !allDigital && (
              <div className="border-t border-gray-100 mt-3 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">{'\u20B9'}{totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Delivery</span>
                  <span className="font-medium">{'\u20B9'}{selectedCourier.rate.toLocaleString('en-IN')}</span>
                </div>
              </div>
            )}

            {allDigital && (
              <p className="text-xs text-primary mt-3 pt-3 border-t border-gray-100">
                Digital delivery — no shipping needed
              </p>
            )}

            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between">
              <span className="font-bold" style={{ color: 'var(--navy)' }}>Total</span>
              <span className="font-bold text-lg" style={{ color: 'var(--navy)' }}>
                {'\u20B9'}{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Step 1: Check Delivery (only for saved address selection — new address uses AddressForm's submit) */}
            {step === 1 && !showNewAddressForm && savedAddresses.length > 0 && (
              <button
                onClick={handleCheckDelivery}
                disabled={loadingCouriers || !selectedAddressId}
                className="mt-4 w-full py-3 px-6 font-semibold rounded-lg text-white disabled:opacity-50 transition-colors"
                style={{ background: 'var(--color-primary)' }}
              >
                {loadingCouriers ? 'Checking...' : 'Check Delivery Options'}
              </button>
            )}

            {/* Step 2: Continue to Payment */}
            {step === 2 && (
              <button
                onClick={() => { setStep(3); setError('') }}
                disabled={!selectedCourier}
                className="mt-4 w-full py-3 px-6 font-semibold rounded-lg text-white disabled:opacity-50 transition-colors"
                style={{ background: selectedCourier ? 'var(--color-primary)' : undefined }}
              >
                Continue to Payment
              </button>
            )}

            {/* Step 3: Place Order / Pay */}
            {step === 3 && (
              <>
                {paymentData && authSession?.user ? (
                  <div className="mt-4">
                    <RazorpayCheckout
                      orderId={paymentData.razorpayOrderId}
                      amount={paymentData.amount}
                      name={authSession.user.name ?? ''}
                      email={authSession.user.email ?? ''}
                      description="Mindset Products Order"
                      onSuccess={handlePaymentSuccess}
                      onDismiss={handlePaymentDismiss}
                      buttonText={`Pay \u20B9${grandTotal.toLocaleString('en-IN')}`}
                      autoOpen
                    />
                  </div>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="mt-4 w-full py-3 px-6 font-semibold rounded-lg text-white disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    style={{ background: 'var(--color-primary)' }}
                  >
                    {placing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay \u20B9${grandTotal.toLocaleString('en-IN')}`
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
