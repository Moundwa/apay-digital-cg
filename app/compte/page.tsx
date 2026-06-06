'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'

type Order = {
  id: number
  product_name: string
  price_text: string
  status: string
  created_at: string
}

export default function Compte() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setOrders(ordersData || [])
      setLoading(false)
    }
    getData()
  }, [supabase, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="bg-gray-950 min-h-screen text-white p-8">Chargement...</div>

  return (
    <div className="bg-gray-950 min-h-screen text-gray-100">
      <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <a href="/">
            <img src="/logo-full.png" alt="Apay Digital CG" className="h-10 md:h-12" />
          </a>
          <div className="flex items-center gap-3">
            <a href="/" className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm">
              ← Retour à la boutique
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

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-2">Salut {user?.email}</h1>
        <p className="text-gray-400 mb-8">Bienvenue dans ton espace client Apay Digital</p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Mes commandes</h2>
          {orders.length === 0 ? (
            <p className="text-gray-500">Aucune commande pour l'instant.</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{order.product_name}</p>
                    <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-cyan-400 font-bold">{order.price_text}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      order.status === 'active' ? 'bg-green-500/20 text-green-400' : 
                      order.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status === 'active' ? 'En cours' : order.status === 'completed' ? 'Livré' : 'En attente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
