import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, message, ageGroup, supportMode, firstTime, heardFrom } = body

    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }
    if (!subject || subject.length < 2) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }
    if (!message || message.length < 10) {
      return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 })
    }

    const extras = [
      ageGroup && `Age group: ${ageGroup}`,
      supportMode && `Preferred mode: ${supportMode}`,
      firstTime && `First time seeking help: ${firstTime}`,
      heardFrom && `Heard about us via: ${heardFrom}`,
    ].filter(Boolean).join('\n')

    const fullMessage = extras ? `${message}\n\n---\n${extras}` : message

    await prisma.contactMessage.create({
      data: { name, email, phone: phone || null, subject, message: fullMessage },
    })

    return NextResponse.json({ message: 'Message sent successfully' }, { status: 201 })
  } catch (error) {
    console.error('[CONTACT_ERROR]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
