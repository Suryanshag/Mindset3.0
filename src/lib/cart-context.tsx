'use client'

import {
  createContext, useContext, useState,
  useEffect, useCallback, useRef,
} from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  isLoading: boolean
  addItem: (productId: string, quantity?: number) => Promise<void>
  removeItem: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  totalAmount: number
  totalItems: number
  refresh: () => Promise<void>
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fetchedRef = useRef(false)

  const isUser = session?.user?.role === 'USER'

  const fetchCart = useCallback(async () => {
    if (!isUser) {
      setItems([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/user/cart')
      const data = await res.json()
      if (data.success) {
        setItems(
          data.data.items.map(
            (item: {
              productId: string
              product: { name: string; price: number; image: string | null }
              quantity: number
            }) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              image: item.product.image,
              quantity: item.quantity,
            })
          )
        )
      }
    } catch (error) {
      console.error('[CART] Fetch failed:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isUser])

  useEffect(() => {
    if (status === 'loading') return
    if (isUser && !fetchedRef.current) {
      fetchedRef.current = true
      fetchCart()
    }
    if (!isUser) {
      setItems([])
      fetchedRef.current = false
    }
  }, [status, isUser, fetchCart])

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (!isUser) return
      const res = await fetch('/api/user/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchCart()
      } else {
        throw new Error(data.error ?? 'Failed to add to cart')
      }
    },
    [isUser, fetchCart]
  )

  const removeItem = useCallback(
    async (productId: string) => {
      if (!isUser) return
      setItems((prev) => prev.filter((i) => i.productId !== productId))
      try {
        await fetch(`/api/user/cart/${productId}`, { method: 'DELETE' })
      } catch (error) {
        console.error('[CART] Remove failed:', error)
        await fetchCart()
      }
    },
    [isUser, fetchCart]
  )

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (!isUser) return
      if (quantity === 0) {
        setItems((prev) => prev.filter((i) => i.productId !== productId))
      } else {
        setItems((prev) =>
          prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        )
      }
      try {
        await fetch(`/api/user/cart/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        })
      } catch (error) {
        console.error('[CART] Update failed:', error)
        await fetchCart()
      }
    },
    [isUser, fetchCart]
  )

  const clearCart = useCallback(async () => {
    setItems([])
    if (!isUser) return
    try {
      await fetch('/api/user/cart', { method: 'DELETE' })
    } catch (error) {
      console.error('[CART] Clear failed:', error)
    }
  }, [isUser])

  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
        refresh: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
