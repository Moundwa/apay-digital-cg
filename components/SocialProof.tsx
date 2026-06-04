'use client'
import { useEffect, useState } from 'react'

export default function SocialProof() {
  const [count, setCount] = useState({ commandes: 0, clients: 0, livraison: 0 })
  
  // Animation compteur au montage
  useEffect(() => {
    const targets = { commandes: 247, clients: 54, livraison: 8 }
    const duration = 1500
    const steps = 30
    let currentStep = 0
    
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      setCount({
        commandes: Math.floor(targets.commandes * progress),
        clients: Math.floor(targets.clients * progress),
        livraison: Math.floor(targets.livraison * progress)
      })
      if (currentStep === steps) clearInterval(timer)
    }, duration / steps)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="bg-gray-900/50 border-y border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-center text-gray-400 text-sm mb-6">
          Déjà adopté par les gamers de Pointe-Noire
        </p>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#25D366] font-gaming">
              {count.commandes}+
            </p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Commandes livrées</p>
          </div>
          
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#25D366] font-gaming">
              {count.clients}+
            </p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Clients satisfaits</p>
          </div>
          
          <div>
            <p className="text-3xl md:text-4xl font-black text-[#25D366] font-gaming">
              &lt; {count.livraison}min
            </p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">Livraison moyenne</p>
          </div>
        </div>
      </div>
    </section>
  )
}
