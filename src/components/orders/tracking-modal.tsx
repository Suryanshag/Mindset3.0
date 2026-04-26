'use client'

import { useState, useEffect } from 'react'
import { X, Package, MapPin, Truck } from 'lucide-react'

interface TrackingActivity {
  date: string
  activity: string
  location: string
}

interface TrackingData {
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  currentStatus?: string
  estimatedDelivery?: string | null
  deliveredDate?: string | null
  trackingActivities: TrackingActivity[]
  message?: string
}

interface TrackingModalProps {
  orderId: string
  onClose: () => void
}

export default function TrackingModal({ orderId, onClose }: TrackingModalProps) {
  const [data, setData] = useState<TrackingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/user/orders/${orderId}/track`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data)
        else setError(json.error)
      })
      .catch(() => setError('Failed to load tracking'))
      .finally(() => setIsLoading(false))
  }, [orderId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Track Order</h3>
              {data?.courierName && (
                <p className="text-xs text-gray-500">
                  {data.courierName}
                  {data.awbCode && ` · AWB: ${data.awbCode}`}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-500 text-sm">Fetching tracking info...</p>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-center py-8">{error}</p>
          )}

          {data && !isLoading && (
            <div className="space-y-6">
              {data.message ? (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">{data.message}</p>
                </div>
              ) : (
                <>
                  {/* Status + ETA */}
                  <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
                    <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide mb-1">
                      Current Status
                    </p>
                    <p className="font-semibold text-teal-900">
                      {data.currentStatus}
                    </p>
                    {data.estimatedDelivery && (
                      <p className="text-xs text-teal-700 mt-1">
                        Estimated delivery: {data.estimatedDelivery}
                      </p>
                    )}
                  </div>

                  {/* Timeline */}
                  {data.trackingActivities.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                        Tracking History
                      </p>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {data.trackingActivities.map((activity, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-3 h-3 rounded-full flex-shrink-0 mt-0.5 border-2 ${
                                  i === 0
                                    ? 'bg-teal-600 border-teal-600'
                                    : 'bg-white border-gray-300'
                                }`}
                              />
                              {i < data.trackingActivities.length - 1 && (
                                <div className="w-px flex-1 bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="pb-3 flex-1">
                              <p className="text-gray-900 font-medium leading-snug">
                                {activity.activity}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {activity.location && (
                                  <span className="text-gray-500 text-xs flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {activity.location}
                                  </span>
                                )}
                                <span className="text-gray-400 text-xs">
                                  {activity.date}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
