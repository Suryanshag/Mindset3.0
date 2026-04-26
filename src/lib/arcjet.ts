import arcjet, {
  shield,
  detectBot,
  slidingWindow,
  fixedWindow,
} from '@arcjet/next'

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  characteristics: ['ip.src'],
  rules: [shield({ mode: 'LIVE' })],
})

export default aj

// Auth routes: login, register, forgot-password (5 req / 15 min)
export const authLimiter = aj.withRule(
  slidingWindow({ mode: 'LIVE', interval: '15m', max: 5 })
)

// Reset password POST only (3 req / 15 min — tighter)
export const sensitiveActionLimiter = aj.withRule(
  slidingWindow({ mode: 'LIVE', interval: '15m', max: 3 })
)

// Public forms: contact, NGO join (5 req / 10 min + bot detection)
export const formLimiter = aj
  .withRule(slidingWindow({ mode: 'LIVE', interval: '10m', max: 5 }))
  .withRule(
    detectBot({
      mode: 'LIVE',
      allow: [],
    })
  )

// Authenticated actions: payments, shipping, cart, session booking (30 req / min)
export const apiLimiter = aj.withRule(
  fixedWindow({ mode: 'LIVE', window: '1m', max: 30 })
)

// Public GET listings: doctors, workshops, products, study-materials (60 req / min)
export const publicGetLimiter = aj.withRule(
  fixedWindow({ mode: 'LIVE', window: '1m', max: 60 })
)
