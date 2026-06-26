import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Converte Decimal/BigInt do Prisma para number (ou null).
function num(val: unknown): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === "number") return val
  if (typeof val === "bigint") return Number(val)
  if (typeof val === "object" && "toNumber" in val) {
    return (val as { toNumber(): number }).toNumber()
  }
  return null
}

async function fetchCurrentPrice(ticker: string): Promise<number | null> {
  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
      { next: { revalidate: 60 } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return typeof data.c === "number" && data.c > 0 ? data.c : null
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    const upper = ticker.toUpperCase()

    const company = await prisma.company.findUnique({
      where: { ticker: upper },
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Histórico anual (mais recente → mais antigo) para FCF base e CAGR.
    const annuals = await prisma.fundamental.findMany({
      where: { companyId: company.id, periodType: "ANNUAL" },
      orderBy: { periodEnd: "desc" },
      take: 10,
    })

    // FCF base: o anual mais recente com FCF não-nulo.
    const baseRecord = annuals.find((f) => num(f.freeCashFlow) !== null)
    const fcf0 = baseRecord ? num(baseRecord.freeCashFlow) : null

    // Ações e dívida líquida do registo base (fallback: primeiro com dado).
    const shares =
      num(baseRecord?.sharesOutstanding) ??
      num(annuals.find((f) => num(f.sharesOutstanding) !== null)?.sharesOutstanding)

    const totalDebt = num(baseRecord?.totalDebt) ?? 0
    const cash = num(baseRecord?.cash) ?? 0
    const netDebt = totalDebt - cash

    // Sugestão de crescimento: CAGR do FCF entre o mais antigo e o mais recente.
    let suggestedGrowth: number | null = null
    const fcfSeries = annuals
      .map((f) => num(f.freeCashFlow))
      .filter((v): v is number => v !== null && v > 0)
    if (fcfSeries.length >= 2) {
      const latest = fcfSeries[0]
      const oldest = fcfSeries[fcfSeries.length - 1]
      const years = fcfSeries.length - 1
      const cagr = Math.pow(latest / oldest, 1 / years) - 1
      // limita a um intervalo razoável para não enviar sliders para o infinito
      suggestedGrowth = Math.max(-0.1, Math.min(0.3, cagr))
    }

    const currentPrice = await fetchCurrentPrice(upper)

    return NextResponse.json({
      ticker: upper,
      name: company.name,
      currency: company.currency,
      fcf0,
      shares,
      netDebt,
      currentPrice,
      suggestedGrowth,
    })
  } catch (error) {
    console.error("Error fetching DCF data:", error)
    return NextResponse.json(
      { error: "Failed to fetch DCF data" },
      { status: 500 }
    )
  }
}
