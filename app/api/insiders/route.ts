import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface InsiderTransaction {
  name: string;
  share: number;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionPrice: number;
  transactionCode: string;
}

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
      return NextResponse.json({ error: 'Ticker parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.FINNHUB_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 })
    }

    // Cache the response for 1 hour to save API credits
    const response = await fetch(
      `https://finnhub.io/api/v1/stock/insider-transactions?symbol=${ticker}&token=${apiKey}`,
      { next: { revalidate: 3600 } }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch from Finnhub' }, { status: response.status })
    }

    const rawData = await response.json()
    
    // Safety check if Finnhub returns unexpected structure
    if (!rawData || !Array.isArray(rawData.data)) {
      return NextResponse.json({ transactions: [] })
    }

    // We only care about positive changes (BUYS) where they actually paid money (transactionPrice > 0)
    // Sometimes grants/gifts have transactionPrice = 0, we want actual skin in the game.
    const buys = rawData.data.filter((t: any) => 
      t.change > 0 && t.transactionPrice > 0
    ) as InsiderTransaction[];

    // Sort by transactionDate descending (newest first)
    buys.sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    // Take top 10 most recent
    const recentBuys = buys.slice(0, 10);

    return NextResponse.json({ transactions: recentBuys })
  } catch (error) {
    console.error(`Error fetching insider transactions:`, error)
    return NextResponse.json(
      { error: 'Internal server error while fetching insider transactions' },
      { status: 500 }
    )
  }
}
