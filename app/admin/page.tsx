'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type Order = {
  id: number
  user_email: string
  product_name: string
  price_text: string
  status: string
  created_at: string
  account_email: string | null
}

export default function Admin() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      // Check si c'est bien un admin
      if (user.email !== 'contact@apay-digital-cg.store') {
        router.push('/')
        return
      }

      setUser(user)
      fetchOrders()
    }
    checkAdmin()
  }, [supabase, router])

  const fetchOrders = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    
    setOrders(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdating(id)
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      alert('Erreur: ' + error.message)
    } else {
      await fetchOrders() // Refresh la liste
    }
    setUpdating(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="bg-gray-950 min-h-screen text-white p-8">Chargement admin...</div>
  if (!user) return null

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo-full.png" alt="Apay Digital CG" className="h-10" />
            <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-300 hover:text-white font-semibold px-4 py-2 rounded-lg text-sm">
              Voir la boutique
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold px-4 py-2 rounded-lg text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-gray-400 mb-8">Gère toutes les commandes Apay Digital CG</p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold">Date</th>
                  <th className="text-left p-4 text-sm font-semibold">Client</th>
                  <th className="text-left p-4 text-sm font-semibold">Produit</th>
                  <th className="text-left p-4 text-sm font-semibold">Prix</th>
                  <th className="text-left p-4 text-sm font-semibold">Status</th>
                  <th className="text-left p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-gray-500">Aucune commande</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('fr-FR')} 
                        <br />
                        {new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-sm">{order.user_email}</p>
                        {order.account_email && <p className="text-xs text-gray-500">{order.account_email}</p>}
                      </td>
                      <td className="p-4 font-semibold">{order.product_name}</td>
                      <td className="p-4 text-cyan-400 font-bold">{order.price_text}</td>
                      <td className="p-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'active' ? 'bg-yellow-500/20 text-yellow-400' : 
                          order.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {order.status === 'active' ? 'En cours' : order.status === 'completed' ? 'Livré' : order.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {order.status === 'active' && (
                          <button
                            onClick={() => updateStatus(order.id, 'completed')}
                            disabled={updating === order.id}
                            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white px-3 py-1 rounded text-xs font-bold"
                          >
                            {updating === order.id ? '...' : 'Marquer Livré'}
                          </button>
                        )}
                        {order.status === 'completed' && (
                          <span className="text-green-400 text-xs">✓ Validé</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
