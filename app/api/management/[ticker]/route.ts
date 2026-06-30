import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generateObject } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

export const maxDuration = 60; // Vercel function timeout (60s is good for AI)

const DAILY_FREE_LIMIT = 5

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params
    
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 })
    }

    const company = await prisma.company.findUnique({ 
      where: { ticker: ticker.toUpperCase() } 
    })
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Require auth because it consumes AI quota
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Check Cache
    const cached = await prisma.managementProfile.findUnique({
      where: { companyId: company.id }
    })

    if (cached && cached.expiresAt > new Date()) {
      return NextResponse.json({ profile: cached })
    }

    // 1b. Rate limit check
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    })
    
    if (dbUser?.plan !== 'PRO') {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      const usedToday = await prisma.aIUsageLog.count({
        where: { userId: user.id, usedAt: { gte: startOfDay } },
      })
      if (usedToday >= DAILY_FREE_LIMIT) {
        return NextResponse.json(
          {
            error: 'rate_limit',
            message: 'Limite diário de análises de IA atingido. Tenta novamente amanhã.',
          },
          { status: 429 },
        )
      }
    }

    // 2. Generate AI Assessment
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

    const { object } = await generateObject({
      model: google(modelName),
      schema: z.object({
        ceoName: z.string(),
        tenure: z.string().describe("How long the CEO has been in charge, e.g., 'Since 2014' or 'Since foundation'"),
        isFamilyRun: z.boolean().describe("True if the founding family or founders still control or have significant influence over the company"),
        familyInfluence: z.string().nullable().describe("Briefly explain how they control it (e.g. dual-class shares) or null if false"),
        capitalAllocationRating: z.enum(['POOR', 'AVERAGE', 'EXCELLENT']).describe("Grade their capital allocation skills"),
        capitalAllocationSummary: z.string().describe("1-2 sentences summarizing their dividend, buyback, and M&A discipline"),
        skinInTheGame: z.enum(['LOW', 'MODERATE', 'HIGH']).describe("Grade shareholder alignment and insider ownership"),
        analysis: z.string().describe("A professional 1-paragraph summary of the management team's track record and shareholder alignment")
      }),
      system: "You are a senior Wall Street value investor analyzing the management team of a public company. Your focus is strictly on capital allocation (how they spend free cash flow), skin in the game (do they own shares?), and structural advantages (is it founder-led or family-controlled?). Be highly critical, concise, and professional.",
      prompt: `Analyze the management team and CEO of ${company.name} (${company.ticker}). Identify the current CEO, whether it is a family/founder-run business, their capital allocation history, and their skin in the game.`
    })

    // 3. Save to Cache (Expire in 30 days since management doesn't change daily)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const profile = await prisma.managementProfile.upsert({
      where: { companyId: company.id },
      update: {
        ...object,
        expiresAt,
        modelVersion: modelName,
        generatedAt: new Date()
      },
      create: {
        companyId: company.id,
        ...object,
        expiresAt,
        modelVersion: modelName
      }
    })

    // 4. Log AI Usage
    await prisma.aIUsageLog.create({
      data: { userId: user.id, ticker: company.ticker },
    })

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Management AI Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
