export const MOODS = [
  { value: 1, label: 'Low', tint: '#FCE7E3', stroke: '#B8796E' },
  { value: 2, label: 'Meh', tint: '#FBE9DD', stroke: '#B8946E' },
  { value: 3, label: 'Good', tint: '#DDE9DC', stroke: '#6E9B6A' },
  { value: 4, label: 'Great', tint: '#DDE9DC', stroke: '#6E9B6A' },
  { value: 5, label: 'Amazing', tint: '#E8E4F2', stroke: '#8B7BAF' },
] as const

export type MoodValue = (typeof MOODS)[number]['value']
