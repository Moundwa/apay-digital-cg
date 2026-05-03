'use client'

import { useState } from 'react'

export default function Home() {
  const NUMERO_WHATSAPP = "242069678759"
  
  const [showModal, setShowModal] = useState(false)
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [idJoueur, setIdJoueur] = useState('')
  const [produitActuel, setProduitActuel] = useState({ nom: '', prixTexte: '', jeu: false })

  const categories = [
    {
      titre: "PlayStation",
      emoji: "🎮",
      desc: "Cartes PSN Wallet pour acheter jeux, DLC et abonnements",
      type: "liste",
      produits: [
        { nom: "PSN 10€", prixTexte: "7 780 FCFA" },
        { nom: "PSN 20€", prixTexte: "15 560 FCFA" },
        { nom: "PSN 30€", prixTexte: "23 340 FCFA" },
        { nom: "PSN 50€", prixTexte: "36 000 FCFA" },
        { nom: "PSN 100€", prixTexte: "72 500 FCFA" }
      ]
    },
    {
      titre: "Xbox",
      emoji: "🟢",
      desc: "Cartes Xbox Live pour Game Pass, jeux et contenus",
      type: "liste",
      produits: [
        { nom: "Xbox 10€", prixTexte: "7 780 FCFA" },
        { nom: "Xbox 20€", prixTexte: "15 560 FCFA" },
        { nom: "Xbox 30€", prixTexte: "23 340 FCFA" },
        { nom: "Xbox 50€", prixTexte: "36 000 FCFA" },
        { nom: "Xbox 100€", prixTexte: "72 500 FCFA" }
      ]
    },
    {
      titre: "Streaming",
      emoji: "📺",
      desc: "Abonnements Netflix pour toute la famille",
      type: "liste",
      produits: [
        { nom: "Netflix 1 Mois", prixTexte: "3 500 FCFA" },
        { nom: "Netflix 3 Mois", prixTexte: "10 000 FCFA" },
        { nom: "Netflix 12 Mois", prixTexte: "37 500 FCFA" }
      ]
    },
    {
      titre: "Recharge Jeu Mobile",
      emoji: "🔥",
      desc: "Diamants, UC, et recharges pour tes jeux favoris",
      type: "sous-categorie",
      sousCat: [
        {
          nom: "Free Fire",
          offres: [
            { nom: "100 Diamants", prixTexte: "1 000 FCFA" },
            { nom: "210 Diamants", prixTexte: "2 000 FCFA" },
            { nom: "310 Diamants", prixTexte: "2 500 FCFA" },
            { nom: "520 Diamants", prixTexte: "4 000 FCFA" },
            { nom: "1060 Diamants", prixTexte: "8 000 FCFA" },
            { nom: "2180 Diamants", prixTexte: "16 500 FCFA" }
          ]
        },
        {
          nom: "PUBG Mobile",
          offres: [
            { nom: "60 UC", prixTexte: "1 000 FCFA" },
            { nom: "325 UC", prixTexte: "3 750 FCFA" },
            { nom: "660 UC", prixTexte: "7 500 FCFA" },
            { nom: "1800 UC", prixTexte: "18 750 FCFA" }
          ]
        },
        {
          nom: "Mobile Legends",
          offres: [
            { nom: "86 Diamants", prixTexte: "1 325 FCFA" },
            { nom: "172 Diamants", prixTexte: "2 475 FCFA" },
            { nom: "257 Diamants", prixTexte: "3 750 FCFA" },
            { nom: "336 Diamants", prixTexte: "4 500 FCFA" },
            { nom: "570 Diamants", prixTexte: "7 725 FCFA" },
            { nom: "716 Diamants", prixTexte: "9 225 FCFA" },
            { nom: "1164 Diamants", prixTexte: "12 875 FCFA" },
           ]
        }
      ]
    }
  ]

  const ouvrirModal = (nomProduit: string, prixTexte: string, jeu: boolean) => {
    setProduitActuel({ nom: nomProduit, prixTexte, jeu })
    setShowModal(true)
  }

  const handleCommander = () => {
    if (!nom || !prenom) {
      alert('Nom et prénom obligatoires')
      return
    }
    if (produitActuel.jeu && !idJoueur) {
      alert('ID Joueur obligatoire pour ce produit')
      return
    }

    let msg = `Salut Apay Digital CG! Je veux commander : ${produitActuel.nom} - ${produitActuel.prixTexte}.\nNom: ${prenom} ${nom}`
    if (email) msg += `\nEmail: ${email}`
    if (produitActuel.jeu && idJoueur) msg += `\nID Joueur: ${idJoueur}`
    msg += `\nPaiement Mobile Money/Airtel Money.`
    
    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msg)}`
    
    setShowModal(false)
    setNom('')
    setPrenom('')
    setEmail('')
    setIdJoueur('')
    window.open(url, '_blank')
  }

  const msgGlobal = "Salut Apay Digital CG! Je veux commander un code ou une recharge."
  const urlGlobal = `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(msgGlobal)}`

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;600;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-gaming { font-family: 'Orbitron', sans-serif; }
        .glow { box-shadow: 0 0 20px rgba(34, 211, 238, 0.3); }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
      `}</style>
      
      <div className="bg-gray-950 text-gray-100">
        <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src="/logo-full.png" alt="Apay Digital CG" className="h-10 md:h-12" />
            </div>
            <a href="#contact" className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm">Commander</a>
          </div>
        </header>
        
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="font-gaming text-4xl md:text-6xl font-bold mb-4">Codes & Recharges <span className="text-cyan-400">Instantanés</span></h2>
          <p className="text-gray-400 text-lg mb-8">PlayStation, Xbox, Netflix, Free Fire... Reçois ton code en 5min via WhatsApp.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-sm">✓ Mobile Money</span>
            <span className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-sm">✓ Airtel Money</span>
            <span className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-sm">✓ Support 7j/7</span>
          </div>
        </section>

        <section id="boutique" className="max-w-6xl mx-auto px-4 py-16">
          <h3 className="font-gaming text-3xl text-center mb-12">Nos Catégories</h3>
          <div className="space-y-8">
            {categories.map((cat, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8">
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-4xl">{cat.emoji}</div>
                  <div>
                    <h4 className="font-gaming text-2xl font-bold">{cat.titre}</h4>
                    <p className="text-gray-400 text-sm">{cat.desc}</p>
                  </div>
                </div>
                <div className="mt-6">
                  {cat.type === "liste" && cat.produits?.map((p, j) => (
                    <div key={j} className="flex justify-between items-center py-3 border-b border-gray-800 last:border-0">
                      <div><p className="font-semibold">{p.nom}</p></div>
                      <div className="flex items-center gap-4">
                        <p className="text-cyan-400 font-bold">{p.prixTexte}</p>
                        <button 
                          onClick={() => ouvrirModal(p.nom, p.prixTexte, false)}
                          className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-4 py-2 rounded-lg text-sm"
                        >
                          Commander
                        </button>
                      </div>
                    </div>
                  ))}
                  {cat.type === "sous-categorie" && cat.sousCat?.map((sous, k) => (
                    <details key={k} className="group border-b border-gray-800 last:border-0 py-2">
                      <summary className="flex justify-between items-center cursor-pointer py-2">
                        <p className="font-semibold text-lg">{sous.nom}</p>
                        <span className="text-cyan-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-2 space-y-1">
                        {sous.offres.map((o, l) => (
                          <div key={l} className="flex justify-between items-center py-2 pl-4">
                            <p className="text-gray-300">{o.nom}</p>
                            <div className="flex items-center gap-4">
                              <p className="text-cyan-400 font-bold">{o.prixTexte}</p>
                              <button 
                                onClick={() => ouvrirModal(`${sous.nom} ${o.nom}`, o.prixTexte, true)}
                                className="bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-bold px-3 py-1 rounded-lg text-xs"
                              >
                                Commander
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-gray-900 py-16">
          <div className="max-w-4xl mx-auto px-4">
            <h3 className="font-gaming text-3xl text-center mb-12">Comment ça marche?</h3>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div><div className="text-5xl mb-4">1️⃣</div><h4 className="font-bold mb-2">Choisis & Commande</h4><p className="text-gray-400 text-sm">Clique sur Commander et remplis le formulaire</p></div>
              <div><div className="text-5xl mb-4">2️⃣</div><h4 className="font-bold mb-2">Paie en Mobile Money</h4><p className="text-gray-400 text-sm">On t’envoie le numéro MTN ou Airtel pour payer</p></div>
              <div><div className="text-5xl mb-4">3️⃣</div><h4 className="font-bold mb-2">Reçois ton code</h4><p className="text-gray-400 text-sm">Livraison instantanée sur WhatsApp après paiement</p></div>
            </div>
          </div>
        </section>

        <section id="contact" className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h3 className="font-gaming text-3xl mb-4">Prêt à commander?</h3>
          <p className="text-gray-400 mb-8">Clique et dis-nous ce qu’il te faut. Réponse en 2min.</p>
          <a href={urlGlobal} target="_blank" className="inline-block bg-green-500 hover:bg-green-400 text-gray-900 font-bold px-8 py-4 rounded-lg text-lg glow">Commander sur WhatsApp</a>
          <p className="text-sm text-gray-500 mt-4">Paiement : Mobile Money & Airtel Money</p>
        </section>

        <footer className="border-t border-gray-800 py-8 text-center text-gray-500 text-sm">
          <p>© 2026 ApayDigitalCG - Pointe-Noire, Congo. Tous droits réservés.</p>
          <p className="mt-2">Site non affilié à PlayStation, Xbox, Netflix ou Steam.</p>
        </footer>

        <a href={urlGlobal} target="_blank" className="fixed bottom-6 right-6 bg-green-500 p-4 rounded-full glow hover:scale-110 transition">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
        </a>

        {showModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 p-6 rounded-lg w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-bold mb-1">Commande : {produitActuel.nom}</h2>
              <p className="text-cyan-400 mb-4">{produitActuel.prixTexte}</p>
              
              <input
                type="text"
                placeholder="Nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full bg-gray-800 p-3 rounded mb-3 border border-gray-700"
              />
              <input
                type="text"
                placeholder="Prénom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full bg-gray-800 p-3 rounded mb-3 border border-gray-700"
              />
              <input
                type="email"
                placeholder="Courriel (facultatif)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 p-3 rounded mb-3 border border-gray-700"
              />
              
              {produitActuel.jeu && (
                <input
                  type="text"
                  placeholder="ID Joueur"
                  value={idJoueur}
                  onChange={(e) => setIdJoueur(e.target.value)}
                  className="w-full bg-gray-800 p-3 rounded mb-3 border border-gray-700"
                />
              )}

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCommander}
                  className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded font-semibold"
                >
                  Envoyer sur WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
