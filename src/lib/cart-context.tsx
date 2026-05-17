'use client'

import {
  createContext, useContext, useState,
  useCallback,
} from 'react'
import { useSession } from 'next-auth/react'

interface CartItem {
  productId: string
  name: string
  price: number
  image: string | null
  quantity: number
  isDigital: boolean
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

export function CartProvider({
  children,
  initialItems,
}: {
  children: React.ReactNode
  /**
   * Server-rendered cart items for USER sessions. When provided, the
   * provider uses these as starting state. When omitted, the provider
   * starts empty — there is NO post-mount auto-fetch. Cart-relevant
   * pages (/user/cart, /user/orders/checkout) call refresh() on mount
   * to lazy-load the real cart. For every other page the empty initial
   * state is silently correct for the common empty-cart user.
   */
  initialItems?: CartItem[]
}) {
  const { data: session } = useSession()
  const [items, setItems] = useState<CartItem[]>(initialItems ?? [])
  // No mount-time fetch ⇒ we are never "loading" from a non-user-action.
  // refresh() flips this true/false around explicit calls.
  const [isLoading, setIsLoading] = useState(false)

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
              product: { name: string; price: number; image: string | null; isDigital: boolean }
              quantity: number
            }) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              image: item.product.image,
              quantity: item.quantity,
              isDigital: item.product.isDigital,
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
