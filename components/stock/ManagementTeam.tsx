'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Crown, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type ManagementProfile = {
  ceoName: string
  tenure: string
  isFamilyRun: boolean
  familyInfluence: string | null
  capitalAllocationRating: 'POOR' | 'AVERAGE' | 'EXCELLENT'
  capitalAllocationSummary: string
  skinInTheGame: 'LOW' | 'MODERATE' | 'HIGH'
  analysis: string
  generatedAt: string
}

const RatingIcon = ({ rating, type }: { rating: string, type: 'capital' | 'skin' }) => {
  if (rating === 'EXCELLENT' || rating === 'HIGH') return <CheckCircle2 className="h-4 w-4 text-bull" />
  if (rating === 'AVERAGE' || rating === 'MODERATE') return <AlertTriangle className="h-4 w-4 text-gold-500" />
  return <XCircle className="h-4 w-4 text-bear" />
}

const RatingColor = ({ rating }: { rating: string }) => {
  if (rating === 'EXCELLENT' || rating === 'HIGH') return 'bg-bull/10 text-bull border-bull/20'
  if (rating === 'AVERAGE' || rating === 'MODERATE') return 'bg-gold-500/10 text-gold-500 border-gold-500/20'
  return 'bg-bear/10 text-bear border-bear/20'
}

export function ManagementTeam({ ticker }: { ticker: string }) {
  const [profile, setProfile] = useState<ManagementProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchManagement() {
      try {
        const res = await fetch(`/api/management/${ticker}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setProfile(data.profile)
      } catch (e) {
        setError("Não foi possível obter os dados da equipa de gestão.")
      } finally {
        setLoading(false)
      }
    }
    fetchManagement()
  }, [ticker])

  if (loading) {
    return (
      <Card className="border-ink-700 bg-ink-900 overflow-hidden relative">
        <CardHeader className="border-b border-ink-800 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-gold-500" />
            Equipa de Gestão
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="h-16 bg-ink-800 rounded-md animate-pulse" />
          <div className="h-24 bg-ink-800 rounded-md animate-pulse" />
          <div className="h-20 bg-ink-800 rounded-md animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  if (error || !profile) return null

  return (
    <Card className="border-ink-700 bg-ink-900 overflow-hidden relative group">
      <div className="absolute top-0 left-0 w-full h-[2px] gold-rule opacity-50 group-hover:opacity-100 transition-opacity" />
      
      <CardHeader className="border-b border-ink-800 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-parchment-100">
            <Users className="h-5 w-5 text-gold-500" />
            Equipa de Gestão
          </CardTitle>
          <span className="text-xs text-grey-400">
            Powered by AI
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Lado Esquerdo: Perfis e Estrutura */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="bg-ink-800 p-3 rounded-lg border border-ink-700">
                <Briefcase className="h-6 w-6 text-parchment-100" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-parchment-100">{profile.ceoName}</h3>
                <p className="text-sm text-grey-400 flex items-center gap-1.5 mt-1">
                  CEO <ChevronRight className="h-3 w-3" /> {profile.tenure}
                </p>
              </div>
            </div>

            {profile.isFamilyRun && (
              <div className="bg-gold-500/5 border border-gold-500/20 rounded-lg p-4 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-5">
                  <Crown className="w-24 h-24" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-gold-500" />
                  <span className="text-sm font-semibold text-gold-500">Founders Control / Negócio Familiar</span>
                </div>
                <p className="text-sm text-grey-400 relative z-10">
                  {profile.familyInfluence}
                </p>
              </div>
            )}
            
            {!profile.isFamilyRun && (
              <div className="bg-ink-800/50 border border-ink-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-grey-400" />
                  <span className="text-sm font-semibold text-parchment-100">Corporate Management</span>
                </div>
                <p className="text-sm text-grey-400">
                  Estrutura corporativa tradicional sem controlo familiar majoritário. O foco deve ser avaliado pela alocação de capital e skin in the game.
                </p>
              </div>
            )}
          </div>

          {/* Lado Direito: Avaliações */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-parchment-100">Alocação de Capital</span>
                <Badge variant="outline" className={RatingColor({ rating: profile.capitalAllocationRating })}>
                  <RatingIcon rating={profile.capitalAllocationRating} type="capital" />
                  <span className="ml-1.5">{profile.capitalAllocationRating}</span>
                </Badge>
              </div>
              <p className="text-sm text-grey-400 leading-relaxed">
                {profile.capitalAllocationSummary}
              </p>
            </div>

            <div className="h-px w-full bg-ink-800" />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-parchment-100">Skin in the Game (Alinhamento)</span>
                <Badge variant="outline" className={RatingColor({ rating: profile.skinInTheGame })}>
                  <RatingIcon rating={profile.skinInTheGame} type="skin" />
                  <span className="ml-1.5">{profile.skinInTheGame}</span>
                </Badge>
              </div>
            </div>

            <div className="bg-ink-800/30 rounded-lg p-4 border border-ink-800">
              <p className="text-sm text-parchment-100 leading-relaxed italic">
                &quot;{profile.analysis}&quot;
              </p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  )
}
