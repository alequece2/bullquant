import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const tickersParam = searchParams.get('tickers')

  if (!tickersParam) {
    return NextResponse.json({ error: 'Tickers parameter is required' }, { status: 400 })
  }

  const tickers = tickersParam.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
  
  if (tickers.length === 0) {
    return NextResponse.json({ error: 'Valid tickers are required' }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Finnhub API key not configured' }, { status: 500 })
  }

  try {
    const fetchPromises = tickers.map(async (ticker) => {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`,
        { next: { revalidate: 60 } }
      )
      
      if (!response.ok) {
        return { ticker, error: 'Failed to fetch' }
      }
      
      const data = await response.json()
      
      if (data.c === 0 && data.d === null) {
        return { ticker, error: 'Not found' }
      }

      return {
        ticker,
        currentPrice: data.c,
        change: data.d,
        changePercent: data.dp,
        high: data.h,
        low: data.l,
        open: data.o,
        previousClose: data.pc
      }
    })

    const results = await Promise.all(fetchPromises)
    
    // Convert to a dictionary for easier lookup in frontend: { "AAPL": { ... }, "MSFT": { ... } }
    const pricesRecord = results.reduce((acc, curr) => {
      if (!curr.error) {
        acc[curr.ticker] = curr
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json(pricesRecord)
  } catch (error) {
    console.error(`Error fetching batch prices:`, error)
    return NextResponse.json(
      { error: 'Internal server error while fetching batch prices' },
      { status: 500 }
    )
  }
}
