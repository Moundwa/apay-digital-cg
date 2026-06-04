'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: ${location.origin}/auth/callback
        }
      })
      if (error) {
        alert(error.message)
      } else {
        alert('Check tes emails pour confirmer !')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        alert(error.message)
      } else {
        router.push('/compte')
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <form onSubmit={handleAuth} className="w-full max-w-md space-y-4 rounded-lg bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-center">
          {isSignUp ? 'Créer un compte' : 'Connexion'}
        </h1>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
        
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border p-2"
          required
        />
        
        <button
          type="submit"
          className="w-full rounded bg-black p-2 text-white hover:bg-gray-800"
        >
          {isSignUp ? 'S’inscrire' : 'Se connecter'}
        </button>
        
        <p
          onClick={() => setIsSignUp(!isSignUp)}
          className="cursor-pointer text-center text-sm text-gray-600"
        >
          {isSignUp ? 'Déjà un compte ? Connecte-toi' : 'Pas de compte ? Inscris-toi'}
        </p>
      </form>
    </div>
  )
}
