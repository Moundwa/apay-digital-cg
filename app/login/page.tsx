'use client'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async () => {
    await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: ${location.origin}/auth/callback }
    })
    alert('Check tes emails pour confirmer !')
  }

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/compte')
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <h1 className="text-2xl font-bold mb-4">Espace Client Apay</h1>
      <input className="w-full p-2 border mb-2" placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input className="w-full p-2 border mb-4" type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
      <button onClick={handleSignIn} className="w-full bg-blue-600 text-white p-2 mb-2">Se connecter</button>
      <button onClick={handleSignUp} className="w-full bg-gray-600 text-white p-2">Créer un compte</button>
    </div>
  )
}

