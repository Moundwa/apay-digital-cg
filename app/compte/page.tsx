import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ComptePage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-20">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
          <h1 className="font-gaming text-3xl font-bold mb-2">
            Salut <span className="text-cyan-400">{user.email}</span>
          </h1>
          <p className="text-gray-400 mb-8">Bienvenue dans ton espace client Apay Digital</p>
          
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="font-bold text-xl mb-4">Mes commandes</h2>
            <p className="text-gray-500">Aucune commande pour l’instant.</p>
          </div>

          <form action="/auth/signout" method="post" className="mt-8">
            <button
              type="submit"
              className="bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold px-6 py-3 rounded-lg"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
