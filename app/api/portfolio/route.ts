import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's portfolio and items
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: user.id },
      include: {
        items: {
          include: {
            company: {
              select: {
                id: true,
                ticker: true,
                name: true,
                logoUrl: true,
                exchange: true,
              }
            }
          },
          orderBy: {
            addedAt: 'desc'
          }
        }
      }
    })

    if (!portfolio) {
      // If portfolio doesn't exist, create it (fallback if trigger failed)
      const newPortfolio = await prisma.portfolio.create({
        data: {
          userId: user.id,
          name: "O Meu Portfólio",
        },
        include: {
          items: {
            include: { company: true }
          }
        }
      })
      return NextResponse.json(newPortfolio)
    }

    return NextResponse.json(portfolio)
  } catch (error) {
    console.error("Error fetching portfolio:", error)
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    )
  }
}
