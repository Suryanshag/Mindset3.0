'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface UserRow {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: string
  _count: { sessions: number; orders: number }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  function fetchUsers(query: string) {
    setLoading(true)
    fetch(`/api/admin/users?search=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((res) => { if (res.success) setUsers(res.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchUsers('')
  }, [])

  function handleSearch(value: string) {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(value), 300)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full max-w-md mb-6 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="text-gray-500">Loading users...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Sessions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Orders</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Joined</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
                  <td className="py-3 px-4 text-gray-600">{u.email}</td>
                  <td className="py-3 px-4 text-gray-600">{u.phone ?? '-'}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{u._count.sessions}</td>
                  <td className="py-3 px-4 text-right text-gray-700">{u._count.orders}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {new Date(u.createdAt).toLocaleDateString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-xs text-blue-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="p-6 text-center text-gray-500">No users found.</p>
          )}
        </div>
      )}
    </div>
  )
}
