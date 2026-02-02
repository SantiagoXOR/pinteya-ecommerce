/**
 * Formatea businessHours del tenant a texto legible para mostrar en UI.
 * Ej: "Abierto de 7:30 a 21:00 de lunes a viernes"
 */

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'lunes',
  tuesday: 'martes',
  wednesday: 'miércoles',
  thursday: 'jueves',
  friday: 'viernes',
  saturday: 'sábado',
  sunday: 'domingo',
}

export type BusinessHoursInput = {
  [day: string]: { open: string; close: string } | null
}

/**
 * Devuelve un string legible con los horarios.
 * Si lun-vie tienen el mismo horario, devuelve "Abierto de X a Y de lunes a viernes".
 * Si hay más variación, concatena por rangos o por día.
 */
export function formatBusinessHours(businessHours: BusinessHoursInput | null | undefined): string {
  if (!businessHours || typeof businessHours !== 'object') {
    return 'Consultar horarios'
  }

  const entries = DAY_ORDER
    .map(day => ({ day, slot: businessHours[day] }))
    .filter((e): e is { day: string; slot: { open: string; close: string } } => e.slot != null)

  if (entries.length === 0) {
    return 'Consultar horarios'
  }

  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const weekdayEntries = entries.filter(e => weekdays.includes(e.day))
  const allWeekdaySame =
    weekdayEntries.length === 5 &&
    weekdayEntries.every(
      e => e.slot.open === weekdayEntries[0].slot.open && e.slot.close === weekdayEntries[0].slot.close
    )

  if (allWeekdaySame && weekdayEntries.length > 0) {
    const { open, close } = weekdayEntries[0].slot
    const openFmt = formatTime(open)
    const closeFmt = formatTime(close)
    return `Abierto de ${openFmt} a ${closeFmt} de lunes a viernes`
  }

  // Fallback: listar por día o rangos
  const parts: string[] = []
  let i = 0
  while (i < entries.length) {
    const start = i
    const { open, close } = entries[i].slot
    while (i + 1 < entries.length && entries[i + 1].slot.open === open && entries[i + 1].slot.close === close) {
      i++
    }
    const end = i
    const openFmt = formatTime(open)
    const closeFmt = formatTime(close)
    if (start === end) {
      parts.push(`${DAY_LABELS[entries[start].day] ?? entries[start].day}: ${openFmt} - ${closeFmt}`)
    } else {
      parts.push(
        `${DAY_LABELS[entries[start].day] ?? entries[start].day} a ${DAY_LABELS[entries[end].day] ?? entries[end].day}: ${openFmt} - ${closeFmt}`
      )
    }
    i++
  }
  return parts.join('. ')
}

function formatTime(t: string): string {
  if (!t || typeof t !== 'string') return t
  // "07:30" -> "7:30" opcional; mantener "07:30" o normalizar
  const [h, m] = t.trim().split(/[:\s]/)
  const hh = parseInt(h, 10)
  const mm = m != null ? parseInt(m, 10) : 0
  if (Number.isNaN(hh)) return t
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(hh)}:${pad(Number.isNaN(mm) ? 0 : mm)}`
}
