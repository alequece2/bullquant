import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserCircle, Mail, Star } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obter o nome real ou usar o início do email
  const displayName = user.user_metadata?.name || user.email?.split('@')[0]

  return (
    <div className="container max-w-3xl py-12 mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">A Minha Conta</h1>
        <p className="text-muted-foreground mt-2">Gere os teus dados pessoais e definições.</p>
      </div>

      <div className="grid gap-6">
        {/* Cartão de Perfil */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <UserCircle className="h-16 w-16 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-2xl font-bold">{displayName}</h2>
              <div className="flex items-center text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                {user.email}
              </div>
            </div>
            <div className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-4 py-2 rounded-full font-bold flex items-center shadow-sm">
              <Star className="h-4 w-4 mr-2 fill-current" />
              Plano FREE
            </div>
          </div>
        </div>

        {/* Secção de Informação (Placeholder para futuras funcionalidades) */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Detalhes da Subscrição</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Atualmente estás a usar a versão gratuita do BullQuant. O plano gratuito inclui acesso ao motor de pesquisa de empresas e snapshots básicos de fundamentais.
          </p>
          <div className="bg-muted rounded-lg p-4 text-center border border-dashed border-border/60">
            <p className="text-sm font-medium text-foreground">
              🚀 Funcionalidades Premium em breve!
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Alertas de preço, screener avançado e relatórios em PDF estão a ser desenvolvidos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
