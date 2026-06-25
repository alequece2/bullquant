import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    
    const company = await prisma.company.findUnique({
      where: { ticker: ticker.toUpperCase() }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const fundamentals = await prisma.fundamental.findMany({
      where: {
        companyId: company.id,
      },
      orderBy: {
        periodEnd: 'asc',
      }
    })

    if (fundamentals.length === 0) {
      return NextResponse.json({ error: "No fundamentals found" }, { status: 404 })
    }

    const serialized = fundamentals.map(f => {
      const obj: Record<string, unknown> = {}
      for (const [key, val] of Object.entries(f)) {
        if (val !== null && typeof val === 'object' && 'toNumber' in val) {
          obj[key] = (val as { toNumber(): number }).toNumber()
        } else {
          obj[key] = val
        }
      }
      return obj
    })

    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Error fetching fundamentals:", error)
    return NextResponse.json(
      { error: "Failed to fetch fundamentals" },
      { status: 500 }
    )
  }
}
