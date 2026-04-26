import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

function getGoogleAuthClient() {
  const credentialsBase64 = process.env.GOOGLE_CALENDAR_CREDENTIALS
  if (!credentialsBase64) {
    throw new Error('GOOGLE_CALENDAR_CREDENTIALS not configured')
  }

  const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
  const credentials = JSON.parse(credentialsJson)

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ],
  })

  return auth
}

export async function createMeetLinkForSession(sessionId: string): Promise<{
  meetLink: string
  calendarEventId: string
} | null> {
  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: { name: true, email: true },
        },
        doctor: {
          select: {
            designation: true,
            user: {
              select: { name: true, email: true },
            },
          },
        },
      },
    })

    if (!session) {
      console.error('[CALENDAR] Session not found:', sessionId)
      return null
    }

    if (session.meetLink) {
      console.log('[CALENDAR] Meet link already exists for session:', sessionId)
      return {
        meetLink: session.meetLink,
        calendarEventId: session.calendarEventId ?? '',
      }
    }

    const auth = getGoogleAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const startTime = new Date(session.date)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary: `Mindset Session: ${session.user.name} with ${session.doctor.user.name}`,
        description: `Mental health session on Mindset platform.\n\nPatient: ${session.user.name}\nDoctor: ${session.doctor.user.name} (${session.doctor.designation})\nSession ID: ${sessionId}`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'Asia/Kolkata',
        },
        attendees: [
          { email: session.user.email, displayName: session.user.name ?? undefined },
          { email: session.doctor.user.email, displayName: session.doctor.user.name ?? undefined },
        ],
        conferenceData: {
          createRequest: {
            requestId: `mindset-${sessionId}`,
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'email', minutes: 30 },
          ],
        },
      },
    })

    const meetLink = event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri

    const calendarEventId = event.data.id

    if (!meetLink || !calendarEventId) {
      console.error('[CALENDAR] No Meet link in response:', event.data)
      return null
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        meetLink,
        calendarEventId,
      },
    })

    console.log('[CALENDAR] Meet link created for session:', sessionId, meetLink)
    return { meetLink, calendarEventId }
  } catch (error) {
    console.error('[CALENDAR_ERROR]', error)
    return null
  }
}

export async function cancelCalendarEvent(calendarEventId: string): Promise<boolean> {
  try {
    const auth = getGoogleAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: calendarEventId,
      sendUpdates: 'all',
    })

    console.log('[CALENDAR] Event cancelled:', calendarEventId)
    return true
  } catch (error) {
    console.error('[CALENDAR_CANCEL_ERROR]', error)
    return false
  }
}

export async function updateCalendarEvent(
  calendarEventId: string,
  updates: {
    date?: Date
    summary?: string
  }
): Promise<boolean> {
  try {
    const auth = getGoogleAuthClient()
    const calendar = google.calendar({ version: 'v3', auth })

    const patchData: Record<string, unknown> = {}

    if (updates.date) {
      const startTime = new Date(updates.date)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
      patchData.start = { dateTime: startTime.toISOString(), timeZone: 'Asia/Kolkata' }
      patchData.end = { dateTime: endTime.toISOString(), timeZone: 'Asia/Kolkata' }
    }

    if (updates.summary) {
      patchData.summary = updates.summary
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId: calendarEventId,
      sendUpdates: 'all',
      requestBody: patchData,
    })

    return true
  } catch (error) {
    console.error('[CALENDAR_UPDATE_ERROR]', error)
    return false
  }
}
