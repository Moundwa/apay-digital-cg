'use client'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ComptePage() {
  const [orders, setOrders] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')
      setUser(user)
      
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
      setOrders(data || [])
    }
    getData()
  }, [])

  if (!user) return <p>Chargement...</p>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Mes commandes</h1>
      <p className="mb-6">Connecté en tant que: {user.email}</p>
      {orders.length === 0 ? <p>Aucune commande pour l'instant.</p> : 
        orders.map(order => (
          <div key={order.id} className="border p-4 mb-2 rounded">
            <p><b>{order.product_name}</b> - {order.price_text}</p>
            <p>Status: {order.status}</p>
            <p>Email compte: {order.account_email}</p>
          </div>
        ))
      }
      <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
        className="mt-6 bg-red-600 text-white p-2">Déconnexion</button>
    </div>
  )
}
