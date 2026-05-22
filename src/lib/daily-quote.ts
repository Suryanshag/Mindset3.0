// Daily rotating quote for the home "Reflection of the day" card.
// Same quote for everyone on a given day so users can compare with
// friends and the reflection has a shared cadence. Rotation key is
// day-of-year against the local calendar — server and client agree
// because the page is rendered server-first and the client hydrates
// from the same payload.

export type DailyQuote = { text: string; author: string }

const QUOTES: DailyQuote[] = [
  { text: "You don't have to see the whole staircase. Just take the first step.", author: 'Martin Luther King Jr.' },
  { text: "Healing isn't linear. Some days you'll feel stuck. That's still healing.", author: 'Unknown' },
  { text: 'The wound is the place where the light enters you.', author: 'Rumi' },
  { text: 'Vulnerability is the birthplace of innovation, creativity and change.', author: 'Brené Brown' },
  { text: "What we don't need anymore is permission to be ourselves.", author: 'Pema Chödrön' },
  { text: 'Self-compassion is simply giving the same kindness to ourselves that we would give to others.', author: 'Christopher Germer' },
  { text: 'You are not a burden. You have a life force that the world needs.', author: 'Glennon Doyle' },
  { text: 'Mental health is not a destination, but a process.', author: 'Noam Shpancer' },
  { text: 'Owning our story can be hard but not nearly as difficult as spending our lives running from it.', author: 'Brené Brown' },
  { text: 'Even the darkest night will end and the sun will rise.', author: 'Victor Hugo' },
  { text: 'Out of difficulties grow miracles.', author: 'Jean de La Bruyère' },
  { text: "There is hope, even when your brain tells you there isn't.", author: 'John Green' },
  { text: 'Recovery is not one and done. It is a lifelong journey.', author: 'Demi Lovato' },
  { text: "Your present circumstances don't determine where you can go. They merely determine where you start.", author: 'Nido Qubein' },
  { text: 'It is okay to not be okay. It is not okay to stay that way.', author: 'Unknown' },
  { text: 'The only way out is through.', author: 'Robert Frost' },
  { text: 'Be patient with yourself. Nothing in nature blooms all year.', author: 'Unknown' },
  { text: "Feelings are like waves, we can't stop them from coming, but we can choose which ones to surf.", author: 'Jonatan Mårtensson' },
  { text: 'What lies behind us and what lies before us are tiny matters compared to what lies within us.', author: 'Ralph Waldo Emerson' },
  { text: 'You are allowed to be both a masterpiece and a work in progress simultaneously.', author: 'Sophia Bush' },
  { text: "Sometimes the people around you won't understand your journey. They don't need to, it's not for them.", author: 'Joubert Botha' },
  { text: "Don't believe everything you think.", author: 'Allan Lokos' },
  { text: 'Rest is not idleness. It is part of the work.', author: 'Unknown' },
  { text: 'The strongest people are not those who show strength in front of us but those who win battles we know nothing about.', author: 'Unknown' },
  { text: "You don't have to be positive all the time. It's perfectly okay to feel sad, angry, annoyed, frustrated, scared, or anxious.", author: 'Lori Deschene' },
  { text: 'There is no greater agony than bearing an untold story inside you.', author: 'Maya Angelou' },
  { text: "Healing is not about moving on or getting over it. It's about learning to make peace with our pain.", author: 'Unknown' },
  { text: "Be gentle with yourself, you're doing the best you can.", author: 'Unknown' },
  { text: 'The most beautiful people we have known are those who have known defeat, known suffering, known struggle, and have found their way out of those depths.', author: 'Elisabeth Kübler-Ross' },
  { text: 'Progress, not perfection.', author: 'Unknown' },
]

// Returns the same quote for everyone on a given day. dayOfYear is
// computed against the user's local timezone (IST in our case) so the
// quote changes at midnight India-time, which is what users expect.
export function getDailyQuote(date: Date = new Date()): DailyQuote {
  // toLocaleDateString with en-CA gives YYYY-MM-DD; parse to a date
  // anchored at midnight IST. Then dayOfYear is the diff against
  // Jan 1 of the same year in IST.
  const istKey = date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  const [year, month, day] = istKey.split('-').map(Number)
  const startOfYear = Date.UTC(year, 0, 1)
  const today = Date.UTC(year, month - 1, day)
  const dayOfYear = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24))
  return QUOTES[dayOfYear % QUOTES.length]
}
