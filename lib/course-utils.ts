import type { CourseSection, EventBlock, ClassSchedule } from './types'

export const DATA_URL = 'https://usis-cdn.eniamza.com/connect.json'
export const POLL_INTERVAL = 60000

export const START_OF_DAY = timeToMinutes('08:00:00')
export const END_OF_DAY = timeToMinutes('18:20:00')

export const DAY_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

export const TIME_LABELS = [
  '08:00 - 09:20',
  '09:30 - 10:50',
  '11:00 - 12:20',
  '12:30 - 13:50',
  '14:00 - 15:20',
  '15:30 - 16:50',
  '17:00 - 18:20',
]

export const STANDARD_TIMESLOTS = [
  { label: '8:00 AM - 9:20 AM', start: '08:00:00', end: '09:20:00' },
  { label: '9:30 AM - 10:50 AM', start: '09:30:00', end: '10:50:00' },
  { label: '11:00 AM - 12:20 PM', start: '11:00:00', end: '12:20:00' },
  { label: '12:30 PM - 1:50 PM', start: '12:30:00', end: '13:50:00' },
  { label: '2:00 PM - 3:20 PM', start: '14:00:00', end: '15:20:00' },
  { label: '3:30 PM - 4:50 PM', start: '15:30:00', end: '16:50:00' },
  { label: '5:00 PM - 6:20 PM', start: '17:00:00', end: '18:20:00' },
]

export function timeToMinutes(t: string): number {
  if (!t) return 0
  const parts = t.split(':').map(Number)
  return parts[0] * 60 + parts[1]
}

export function minutesToPercent(minute: number): number {
  const total = END_OF_DAY - START_OF_DAY
  return ((minute - START_OF_DAY) / total) * 100
}

export function timesOverlap(s1: number, e1: number, s2: number, e2: number): boolean {
  return Math.max(s1, s2) < Math.min(e1, e2)
}

export function intervalsOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return !(aEnd <= bStart || bEnd <= aStart)
}

export async function fetchCourseData(): Promise<CourseSection[]> {
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error('Fetch failed')
    const data = await res.json()
    return normalizeData(data)
  } catch {
    return []
  }
}

function normalizeData(arr: CourseSection[]): CourseSection[] {
  if (!Array.isArray(arr)) return []
  return arr.map((item) => {
    const clone = JSON.parse(JSON.stringify(item)) as CourseSection
    if (clone.sectionSchedule?.classSchedules) {
      clone.sectionSchedule.classSchedules = clone.sectionSchedule.classSchedules.map((s) => ({
        day: (s.day || '').toUpperCase(),
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    }
    if (clone.labSchedules) {
      clone.labSchedules = clone.labSchedules.map((s) => ({
        day: (s.day || '').toUpperCase(),
        startTime: s.startTime,
        endTime: s.endTime,
      }))
    }
    if (clone.sectionType) {
      clone.sectionType = clone.sectionType.toUpperCase()
    }
    return clone
  })
}

export function getEventBlocksForSection(section: CourseSection): EventBlock[] {
  const blocks: EventBlock[] = []
  const baseTitle = `${section.courseCode} ${section.sectionName}`
  const metaRoom = section.roomName || ''

  const classSchedules = section.sectionSchedule?.classSchedules || []
  classSchedules.forEach((sch) => {
    const startMin = timeToMinutes(sch.startTime)
    const endMin = timeToMinutes(sch.endTime)
    const dayIndex = DAY_ORDER.indexOf(sch.day)
    if (dayIndex < 0) return
    blocks.push({
      dayIndex,
      startMin,
      endMin,
      title: baseTitle,
      meta: metaRoom,
      isLab: false,
      sectionId: section.sectionId,
      section,
    })
  })

  const labSchedules = section.labSchedules || []
  labSchedules.forEach((sch) => {
    const startMin = timeToMinutes(sch.startTime)
    const endMin = timeToMinutes(sch.endTime)
    const dayIndex = DAY_ORDER.indexOf(sch.day)
    if (dayIndex < 0) return
    blocks.push({
      dayIndex,
      startMin,
      endMin,
      title: baseTitle + ' (Lab)',
      meta: section.labRoomName || '',
      isLab: true,
      sectionId: section.sectionId,
      section,
    })
  })

  return blocks
}

export function isConflictWithCart(
  block: EventBlock,
  cart: CourseSection[],
  ignoreCourseCode?: string
): boolean {
  for (const c of cart) {
    if (ignoreCourseCode && c.courseCode === ignoreCourseCode) continue
    const cblocks = getEventBlocksForSection(c)
    for (const cb of cblocks) {
      if (cb.dayIndex !== block.dayIndex) continue
      if (timesOverlap(cb.startMin, cb.endMin, block.startMin, block.endMin)) return true
    }
  }
  return false
}

export function checkExamConflict(
  candidate: CourseSection,
  cart: CourseSection[],
  ignoreCourseCode?: string
): string | null {
  const cExamDate = candidate.sectionSchedule?.finalExamDate
  const cStart = candidate.sectionSchedule?.finalExamStartTime
  const cEnd = candidate.sectionSchedule?.finalExamEndTime
  if (!cExamDate) return null

  for (const other of cart) {
    if (ignoreCourseCode && other.courseCode === ignoreCourseCode) continue

    const oDate = other.sectionSchedule?.finalExamDate
    const oStart = other.sectionSchedule?.finalExamStartTime
    const oEnd = other.sectionSchedule?.finalExamEndTime
    if (!oDate) continue

    if (oDate === cExamDate) {
      const s1 = timeToMinutes(cStart || '')
      const e1 = timeToMinutes(cEnd || '')
      const s2 = timeToMinutes(oStart || '')
      const e2 = timeToMinutes(oEnd || '')
      if (timesOverlap(s1, e1, s2, e2)) {
        return `${candidate.courseCode} ${candidate.sectionName} vs ${other.courseCode} ${other.sectionName} on ${cExamDate}`
      }
    }
  }
  return null
}

export function schedulesContain(schedules: ClassSchedule[], day: string, timeslotIdx: number): boolean {
  if (!schedules || !schedules.length) return false
  const t = STANDARD_TIMESLOTS[timeslotIdx]
  return schedules.some((s) => {
    return s.day === day && intervalsOverlap(s.startTime, s.endTime, t.start, t.end)
  })
}

export function formatExam(date?: string, start?: string, end?: string): string {
  if (!date) return 'N/A'
  const d = new Date(date)
  const month = d.toLocaleString('default', { month: 'short' })
  const day = d.getDate()
  return `${month} ${day}, ${start || ''} - ${end || ''}`
}

export function timeToLabel(tt: string): string {
  if (!tt) return ''
  const parts = tt.split(':').map(Number)
  const hh = parts[0]
  const mm = parts[1]
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const h = ((hh + 11) % 12) + 1
  const min = mm.toString().padStart(2, '0')
  return `${h}:${min} ${ampm}`
}
