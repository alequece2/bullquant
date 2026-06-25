import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    
    // Fetch all historical prices for the ticker, ordered by date ascending
    const prices = await prisma.price.findMany({
      where: {
        ticker: ticker.toUpperCase(),
      },
      orderBy: {
        date: 'asc',
      },
      select: {
        date: true,
        close: true,
      }
    })

    if (!prices || prices.length === 0) {
      return NextResponse.json({ error: "No price history found" }, { status: 404 })
    }

    // Convert decimal to number for frontend charting and format dates
    const formattedPrices = prices.map(p => ({
      date: p.date.toISOString(),
      close: Number(p.close),
    }))

    return NextResponse.json(formattedPrices)
  } catch (error) {
    console.error("Error fetching price history:", error)
    return NextResponse.json(
      { error: "Failed to fetch price history" },
      { status: 500 }
    )
  }
}
