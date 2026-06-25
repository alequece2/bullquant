import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const ticker = searchParams.get('ticker')

    if (!ticker) {
      return NextResponse.json({ error: "Ticker is required" }, { status: 400 })
    }

    const item = await prisma.portfolioItem.findFirst({
      where: {
        portfolio: {
          userId: user.id
        },
        company: {
          ticker: ticker.toUpperCase()
        }
      }
    })

    return NextResponse.json({ isFollowing: !!item })
  } catch (error) {
    console.error("Error checking portfolio state:", error)
    return NextResponse.json(
      { error: "Failed to check portfolio state" },
      { status: 500 }
    )
  }
}
