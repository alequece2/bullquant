import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ticker } = body

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
    }

    // Find the company
    const company = await prisma.company.findUnique({
      where: { ticker: ticker.toUpperCase() }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Find or create portfolio
    let portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.id }
    })

    if (!portfolio) {
      portfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: "O Meu Portfólio",
        }
      })
    }

    // Check if already in portfolio
    const existingItem = await prisma.portfolioItem.findUnique({
      where: {
        portfolioId_companyId: {
          portfolioId: portfolio.id,
          companyId: company.id
        }
      }
    })

    if (existingItem) {
      return NextResponse.json({ error: "Company already in portfolio" }, { status: 400 })
    }

    // Add to portfolio
    const item = await prisma.portfolioItem.create({
      data: {
        portfolioId: portfolio.id,
        companyId: company.id
      }
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error("Error adding to portfolio:", error)
    return NextResponse.json(
      { error: "Failed to add to portfolio" },
      { status: 500 }
    )
  }
}
