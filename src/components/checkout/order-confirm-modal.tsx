'use client'

import { X, MapPin, Truck, ShoppingBag } from 'lucide-react'

interface OrderItem {
  name: string
  quantity: number
  price: number
}

interface ConfirmModalProps {
  items: OrderItem[]
  address: {
    name: string
    addressLine1: string
    city: string
    state: string
    pincode: string
  }
  courierName: string
  deliveryCharge: number
  subtotal: number
  total: number
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function OrderConfirmModal({
  items,
  address,
  courierName,
  deliveryCharge,
  subtotal,
  total,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Confirm Your Order</h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Items */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Items ({items.length})
              </span>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">
                    {item.name} <span className="text-gray-400">\u00D7{item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-900">
                    {'\u20B9'}{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Delivery address */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Delivering To
              </span>
            </div>
            <p className="text-sm text-gray-700 font-medium">{address.name}</p>
            <p className="text-sm text-gray-500 leading-relaxed">
              {address.addressLine1}, {address.city}, {address.state} — {address.pincode}
            </p>
          </div>

          <hr className="border-gray-100" />

          {/* Courier */}
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Shipping via <span className="font-medium text-gray-900">{courierName}</span>
            </span>
          </div>

          <hr className="border-gray-100" />

          {/* Price summary */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{'\u20B9'}{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery ({courierName})</span>
              <span className="text-gray-900">{'\u20B9'}{deliveryCharge.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span className="text-gray-900">Total</span>
              <span className="text-teal-600">{'\u20B9'}{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-white transition-colors disabled:opacity-50"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm & Pay'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
