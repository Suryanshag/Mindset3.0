'use client'

export function OpenCookiePreferencesButton({
  label = 'Update cookie preferences',
}: {
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent('mindset:open-cookie-preferences'))}
      className="text-[13px] font-medium px-4 py-2 rounded-lg"
      style={{
        background: 'var(--teal, #0B9DA9)',
        color: '#fff',
      }}
    >
      {label}
    </button>
  )
}
