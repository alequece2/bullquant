import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface StockPageProps {
  params: Promise<{
    ticker: string
  }>
}

export default async function StockPage({ params }: StockPageProps) {
  const resolvedParams = await params
  const ticker = resolvedParams.ticker.toUpperCase()

  const company = await prisma.company.findUnique({
    where: { ticker }
  })

  if (!company) {
    notFound()
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-2">
          {company.logoUrl && (
            <img src={company.logoUrl} alt={company.name} className="w-12 h-12 rounded-lg bg-white p-1" />
          )}
          <div>
            <h1 className="text-3xl font-bold">{company.name}</h1>
            <div className="flex items-center space-x-2 text-muted-foreground font-medium">
              <span>{company.ticker}</span>
              <span>·</span>
              <span>{company.exchange}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-card border border-border rounded-xl">
        <h2 className="text-xl font-bold mb-4">Em construção (Passo S3)</h2>
        <p className="text-muted-foreground">
          Esta é a página de base da empresa. O próximo passo do plano será implementar o Snapshot, Gráfico de Preços e Motor de Decisão (DCF/Fundamentais).
        </p>
      </div>
    </div>
  )
}
