'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError(null)

  if (password !== confirmPassword) {
    setError('Les mots de passe ne correspondent pas')
    setLoading(false)
    return
  }

  if (password.length < 6) {
    setError('Le mot de passe doit faire 6 caractères minimum')
    setLoading(false)
    return
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: ${window.location.origin}/auth/callback
    }
  })

  if (error) {
    setError(error.message === 'User already registered' 
      ? 'Ce compte existe déjà. Connecte-toi.' 
      : 'Erreur lors de l’inscription'
    )
    setLoading(false)
  } else {
    setSuccess(true)
    setLoading(false)
  }
}
  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="font-gaming text-2xl font-bold text-white mb-4">Vérifie ton email</h1>
          <p className="text-gray-400 text-sm mb-6">
            On t’a envoyé un lien de confirmation à <span className="text-cyan-400">{email}</span>
          </p>
          <Link 
            href="/login"
            className="inline-block mt-6 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-lg"
          >
            Retour connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo-full.png" alt="Apay Digital" className="h-12 mx-auto mb-4" />
          <h1 className="font-gaming text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-gray-400 text-sm mt-2">Rejoins Apay Digital CG</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Mot de passe (6 caractères min)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded-lg focus:border-cyan-500 focus:outline-none"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 text-gray-900 font-bold py-3 rounded-lg transition"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-gray-500 text-xs text-center mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300">
            Connecte-toi
          </Link>
        </p>
      </div>
    </div>
  )
}
