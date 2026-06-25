import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>
}) {
  const resolvedParams = await params
  const { ticker } = resolvedParams
  const t = await getTranslations('stock')

  // Fazer fetch da empresa na base de dados
  const company = await prisma.company.findUnique({
    where: {
      ticker: ticker.toUpperCase(),
    },
  })

  // Se a empresa não existir na base de dados (S&P 500), dá erro 404
  if (!company) {
    notFound()
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="bg-primary/10 p-6 rounded-full">
          {/* Logo provisório se não houver um */}
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
              {company.ticker[0]}
            </div>
          )}
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight">
          {company.name} ({company.ticker})
        </h1>
        
        <div className="bg-muted px-6 py-4 rounded-lg border border-dashed border-border/60 max-w-md">
          <p className="text-lg font-medium text-foreground">{t('underConstruction')} 🚧</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('buildingMessage')}
          </p>
        </div>

        <Link 
          href="/" 
          className="text-primary hover:underline font-medium text-sm mt-8"
        >
          &larr; {t('backHome')}
        </Link>
      </div>
    </div>
  )
}
