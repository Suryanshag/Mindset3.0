/**
 * Seed realistic reflection data for evaluating desktop reflection mode.
 * Run: npx tsx scripts/seed-reflection.ts
 *
 * Produces for the first USER in the database:
 *
 *   SESSIONS (5 past + 1 upcoming)
 *   ├── Session A  ~11 weeks ago  with Doctor 1  (COMPLETED, has notes)
 *   ├── Session B  ~8 weeks ago   with Doctor 2  (COMPLETED)
 *   ├── Session C  ~5 weeks ago   with Doctor 1  (COMPLETED, has notes)
 *   ├── Session D  ~3 weeks ago   with Doctor 1  (COMPLETED)
 *   ├── Session E  ~10 days ago   with Doctor 2  (COMPLETED, has notes)
 *   └── Session F  +3 days        with Doctor 1  (CONFIRMED, has meet link)
 *
 *   JOURNAL ENTRIES (7 total, scattered between sessions)
 *   ├── 1 day after Session A   "First impressions"
 *   ├── 4 days after Session A  "Trying the breathing exercise"
 *   ├── 2 days after Session B  "Why I avoid conflict"
 *   ├── Same day as Session C   "Before my session today"
 *   ├── 3 days after Session C  "Thought record practice"
 *   ├── 1 day after Session D   "Small wins this week"
 *   └── 2 days after Session E  "Sitting with discomfort"
 *
 *   ASSIGNMENTS (4 completed + 1 pending)
 *   ├── From Doctor 1, created ~session A, completed 5 days after A  (COMPLETED)
 *   ├── From Doctor 2, created ~session B, completed 6 days after B  (COMPLETED)
 *   ├── From Doctor 1, created ~session C, completed 4 days after C  (COMPLETED)
 *   ├── From Doctor 1, created ~session E, completed 3 days after E  (COMPLETED — recent for chapter view)
 *   └── From Doctor 1, created ~session D, due in 2 days             (PENDING)
 *
 *   WORKSHOPS (2 past with registrations, 1 upcoming)
 *   ├── Workshop 1  ~6 weeks ago   (user attended)
 *   ├── Workshop 2  ~2 weeks ago   (user attended)
 *   └── Workshop 3  +5 days        (user registered, upcoming)
 *
 * This data makes chapter views meaningful — each past session has at least
 * one journal entry or assignment orbiting it.
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

function daysAgo(n: number, hour = 10, min = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, min, 0, 0)
  return d
}

function daysFromNow(n: number, hour = 10, min = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(hour, min, 0, 0)
  return d
}

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: 'USER' },
    select: { id: true, name: true },
  })
  const doctors = await prisma.doctor.findMany({
    select: { id: true, user: { select: { name: true } } },
    take: 2,
  })

  if (!user || doctors.length === 0) {
    console.error('No users or doctors found. Seed those first.')
    return
  }

  const uid = user.id
  const doc1 = doctors[0].id
  const doc2 = doctors[1 % doctors.length].id

  console.log(`Seeding reflection data for ${user.name} (${uid})`)
  console.log(`  Doctor 1: ${doctors[0].user.name} (${doc1})`)
  console.log(`  Doctor 2: ${doctors[1 % doctors.length].user.name} (${doc2})`)

  // ── Sessions ──────────────────────────────────────────────────
  const sessionA = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc1,
      date: daysAgo(77, 14, 0),
      status: 'COMPLETED', paymentStatus: 'PAID',
      notes: 'We talked about setting boundaries at work and identifying automatic negative thoughts. Suryansh mentioned difficulty sleeping before important meetings.',
    },
  })

  const sessionB = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc2,
      date: daysAgo(56, 11, 30),
      status: 'COMPLETED', paymentStatus: 'PAID',
    },
  })

  const sessionC = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc1,
      date: daysAgo(35, 15, 0),
      status: 'COMPLETED', paymentStatus: 'PAID',
      notes: 'Followed up on the thought record exercises. Good progress with identifying cognitive distortions. Starting to work on self-compassion practices.',
    },
  })

  const sessionD = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc1,
      date: daysAgo(21, 10, 0),
      status: 'COMPLETED', paymentStatus: 'PAID',
    },
  })

  const sessionE = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc2,
      date: daysAgo(10, 16, 30),
      status: 'COMPLETED', paymentStatus: 'PAID',
      notes: 'Discussed the journaling habit — Suryansh has been consistent. We explored what comes up when sitting with discomfort rather than distracting.',
    },
  })

  const _sessionF = await prisma.session.create({
    data: {
      userId: uid, doctorId: doc1,
      date: daysFromNow(3, 14, 0),
      status: 'CONFIRMED', paymentStatus: 'PAID',
      meetLink: 'https://meet.google.com/abc-defg-hij',
    },
  })

  console.log('  ✓ 6 sessions created')

  // ── Journal entries ───────────────────────────────────────────
  const journals = [
    {
      userId: uid,
      title: 'First impressions',
      body: "Had my first session today. It felt strange talking to someone I don't know about things I barely talk about with people I do know. But Dr. Sharma made it easy. She asked about what brought me here and I told her about the anxiety before meetings. She didn't seem surprised — said it's more common than I think. I left feeling lighter somehow, like putting something down I didn't realise I was carrying.",
      mood: 3,
      entryDate: daysAgo(76, 21, 0),
    },
    {
      userId: uid,
      title: 'Trying the breathing exercise',
      body: "Tried the 4-4-6 breathing before bed like Dr. Sharma suggested. It felt awkward at first — counting breaths while my mind was racing about tomorrow's presentation. But after a few rounds something shifted. The racing didn't stop entirely but it felt further away, like watching traffic from a balcony instead of standing in the road. Slept better than usual.",
      mood: 4,
      entryDate: daysAgo(73, 22, 30),
    },
    {
      userId: uid,
      title: 'Why I avoid conflict',
      body: "Something came up in the session that I've been thinking about. When asked about conflict I realised I don't just avoid it — I pretend it doesn't exist. At work, at home, everywhere. It's not peace-keeping, it's disappearing. I nodded along to a decision I disagreed with today and felt that familiar hollowness after. Writing this down because I don't want to forget this feeling. It's uncomfortable but it's real.",
      mood: 2,
      entryDate: daysAgo(54, 20, 0),
    },
    {
      userId: uid,
      title: 'Before my session today',
      body: "Writing this in the car before my session. I want to bring up the thing with my brother. I've been avoiding it for three sessions now. Every time I plan to mention it and then pivot to something easier. Today I'm going to say it out loud. That's the whole point of being here.",
      mood: 3,
      entryDate: daysAgo(35, 13, 0),
    },
    {
      userId: uid,
      title: 'Thought record practice',
      body: "Did the thought record worksheet for the first time properly. Situation: colleague didn't reply to my message for 6 hours. Automatic thought: they're annoyed with me, I said something wrong in the meeting. Evidence for: they usually reply faster. Evidence against: they had back-to-back meetings, they replied normally when they did, they even asked how my weekend was. Balanced thought: they were busy, and my anxiety filled the silence with a story. It sounds so obvious written down. But in the moment it felt absolutely real.",
      mood: 4,
      entryDate: daysAgo(32, 19, 0),
    },
    {
      userId: uid,
      title: 'Small wins this week',
      body: "Three things that went well: 1) I disagreed with a suggestion in a meeting and the world didn't end. 2) I did the breathing exercise every night this week without skipping. 3) I called my brother. We didn't talk about the big thing but we talked, and that's a start. Dr. Sharma says progress isn't always dramatic. Sometimes it's just showing up.",
      mood: 5,
      entryDate: daysAgo(20, 21, 30),
    },
    {
      userId: uid,
      title: 'Sitting with discomfort',
      body: "Today's session was about sitting with discomfort instead of rushing to fix it. I told her about the Sunday anxiety — that heavy feeling on Sunday evenings that Monday is coming. She asked what I do with it and I said I distract myself: phone, TV, anything. She asked what would happen if I just sat with it for five minutes. So I tried it tonight. Five minutes of just feeling the weight. It didn't go away but something changed — I stopped fighting it, and that's its own kind of relief.",
      mood: 3,
      entryDate: daysAgo(8, 22, 0),
    },
  ]

  for (const j of journals) {
    await prisma.journalEntry.create({ data: j })
  }
  console.log('  ✓ 7 journal entries created')

  // ── Assignments ───────────────────────────────────────────────
  // Completed ones — updatedAt backdated via raw update
  const assignmentA = await prisma.assignment.create({
    data: {
      userId: uid, doctorId: doc1,
      type: 'BREATHING',
      title: '5-minute breathing exercise',
      description: '',
      instructions: 'Find a quiet spot, sit comfortably, and follow the guided breathing timer. Breathe in for 4 counts, hold for 4, exhale for 6. Repeat for the full 5 minutes.',
      status: 'COMPLETED',
      createdAt: daysAgo(77),
      dueDate: daysAgo(70),
    },
  })
  // Backdate updatedAt
  await prisma.$executeRaw`UPDATE "Assignment" SET "updatedAt" = ${daysAgo(72)} WHERE id = ${assignmentA.id}`

  const assignmentB = await prisma.assignment.create({
    data: {
      userId: uid, doctorId: doc2,
      type: 'READING',
      title: 'Read: Understanding your anxiety patterns',
      description: '',
      instructions: 'Read the assigned article and note three things that resonate with your experience. We will discuss in the next session.',
      status: 'COMPLETED',
      createdAt: daysAgo(56),
      dueDate: daysAgo(49),
    },
  })
  await prisma.$executeRaw`UPDATE "Assignment" SET "updatedAt" = ${daysAgo(50)} WHERE id = ${assignmentB.id}`

  const assignmentC = await prisma.assignment.create({
    data: {
      userId: uid, doctorId: doc1,
      type: 'WORKSHEET',
      title: 'CBT Thought Record',
      description: '',
      instructions: 'Fill out the thought record worksheet: describe the situation, your automatic thought, the emotion it triggered, evidence for/against the thought, and a balanced alternative thought.',
      status: 'COMPLETED',
      createdAt: daysAgo(35),
      dueDate: daysAgo(28),
    },
  })
  await prisma.$executeRaw`UPDATE "Assignment" SET "updatedAt" = ${daysAgo(31)} WHERE id = ${assignmentC.id}`

  const assignmentE = await prisma.assignment.create({
    data: {
      userId: uid, doctorId: doc2,
      type: 'JOURNAL_PROMPT',
      title: 'Write about a moment of discomfort you sat with',
      description: '',
      instructions: 'Think of a recent moment where you felt uncomfortable and chose not to distract yourself. What happened? What did you notice?',
      status: 'COMPLETED',
      createdAt: daysAgo(10),
      dueDate: daysAgo(5),
    },
  })
  await prisma.$executeRaw`UPDATE "Assignment" SET "updatedAt" = ${daysAgo(7)} WHERE id = ${assignmentE.id}`

  // Pending assignment (due soon)
  await prisma.assignment.create({
    data: {
      userId: uid, doctorId: doc1,
      type: 'JOURNAL_PROMPT',
      title: 'Reflect on a positive experience this week',
      description: '',
      instructions: 'Think about one moment this week where you felt genuinely happy or at peace. Write about what happened, who was there, and how it made you feel.',
      status: 'PENDING',
      dueDate: daysFromNow(2),
    },
  })

  console.log('  ✓ 5 assignments created (4 completed, 1 pending)')

  // ── Workshops + registrations ─────────────────────────────────
  const ws1 = await prisma.workshop.create({
    data: {
      title: 'Managing anxiety in daily life',
      subtitle: 'Practical CBT techniques for everyday calm',
      description: 'A 90-minute interactive workshop where you will learn breathing exercises, cognitive reframing, and grounding techniques to manage anxiety in work and relationships.',
      instructorName: 'Dr. Meera Sharma',
      startsAt: daysAgo(42, 18, 0),
      durationMin: 90,
      priceCents: 0,
      capacity: 50,
      published: true,
    },
  })
  await prisma.workshopRegistration.create({
    data: { userId: uid, workshopId: ws1.id },
  })

  const ws2 = await prisma.workshop.create({
    data: {
      title: 'Mindful journaling for self-discovery',
      subtitle: 'Write your way to clarity',
      description: 'Learn structured journaling prompts rooted in positive psychology. Bring a notebook — you will leave with a 7-day journaling plan.',
      instructorName: 'Priya Kapoor',
      startsAt: daysAgo(14, 17, 0),
      durationMin: 60,
      priceCents: 29900,
      capacity: 30,
      published: true,
    },
  })
  await prisma.workshopRegistration.create({
    data: { userId: uid, workshopId: ws2.id },
  })

  const ws3 = await prisma.workshop.create({
    data: {
      title: 'Sleep hygiene masterclass',
      description: 'Understand the science of sleep and build a personalised wind-down routine that actually sticks.',
      instructorName: 'Dr. Rohan Patel',
      startsAt: daysFromNow(5, 18, 0),
      durationMin: 75,
      priceCents: 0,
      published: true,
    },
  })
  await prisma.workshopRegistration.create({
    data: { userId: uid, workshopId: ws3.id },
  })

  console.log('  ✓ 3 workshops created (2 past, 1 upcoming) with registrations')
  console.log('\nDone. Reflection mode should now have realistic data.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
