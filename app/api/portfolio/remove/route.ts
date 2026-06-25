import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(request: Request) {
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

    const company = await prisma.company.findUnique({
      where: { ticker: ticker.toUpperCase() }
    })

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.id }
    })

    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 })
    }

    await prisma.portfolioItem.deleteMany({
      where: {
        portfolioId: portfolio.id,
        companyId: company.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing from portfolio:", error)
    return NextResponse.json(
      { error: "Failed to remove from portfolio" },
      { status: 500 }
    )
  }
}
