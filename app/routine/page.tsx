'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar, MobileNav } from '@/components/navbar'
import type { CourseSection, EventBlock } from '@/lib/types'
import {
  fetchCourseData,
  getEventBlocksForSection,
  isConflictWithCart,
  checkExamConflict,
  minutesToPercent,
  formatExam,
  DAY_ORDER,
  TIME_LABELS,
  POLL_INTERVAL,
} from '@/lib/course-utils'

const CART_STORAGE_KEY = 'brush_course_cart'

export default function RoutinePage() {
  const [rawData, setRawData] = useState<CourseSection[]>([])
  const [cart, setCart] = useState<CourseSection[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CourseSection[]>([])
  const [hoveredSection, setHoveredSection] = useState<CourseSection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [cartLoaded, setCartLoaded] = useState(false)

  // Load cart from localStorage (runs once on mount)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          setCart(parsed)
        }
      }
    } catch {
      // Ignore parse errors
    }
    setCartLoaded(true)
  }, [])

  // Save cart to localStorage (only after initial load)
  useEffect(() => {
    if (!cartLoaded) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, cartLoaded])

  // Fetch data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    const data = await fetchCourseData()
    setRawData(data)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [loadData])

  // Filter data based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    const q = searchQuery.toLowerCase()
    const filtered = rawData.filter((item) => {
      const code = (item.courseCode || '').toLowerCase()
      const faculties = (item.faculties || '').toLowerCase()
      const sec = String(item.sectionName || '').toLowerCase()
      return code.includes(q) || faculties.includes(q) || sec.includes(q)
    })
    // Sort by available seats
    filtered.sort((a, b) => {
      const aSeats = Math.max(0, (a.capacity || 0) - (a.consumedSeat || 0))
      const bSeats = Math.max(0, (b.capacity || 0) - (b.consumedSeat || 0))
      if (bSeats !== aSeats) return bSeats - aSeats
      const aSec = parseInt(a.sectionName, 10)
      const bSec = parseInt(b.sectionName, 10)
      if (!isNaN(aSec) && !isNaN(bSec)) return aSec - bSec
      return String(a.sectionName).localeCompare(String(b.sectionName))
    })
    setSearchResults(filtered.slice(0, 20))
  }, [searchQuery, rawData])

  const handleToggleAdd = (section: CourseSection) => {
    const idx = cart.findIndex((c) => c.sectionId === section.sectionId)
    if (idx >= 0) {
      // Already in cart → remove
      setCart(cart.filter((c) => c.sectionId !== section.sectionId))
      return
    }

    const existingIndex = cart.findIndex((c) => c.courseCode === section.courseCode)
    if (existingIndex >= 0) {
      // Check exam conflict (excluding same course)
      const examConflict = checkExamConflict(section, cart, section.courseCode)
      if (examConflict) {
        alert('Exam clash: ' + examConflict)
        return
      }

      // Check time conflict
      const blocks = getEventBlocksForSection(section)
      const hasConflict = blocks.some((b) => isConflictWithCart(b, cart, section.courseCode))
      if (hasConflict) {
        alert('Time clash: cannot replace.')
        return
      }

      // Safe to replace
      const newCart = [...cart]
      newCart[existingIndex] = section
      setCart(newCart)
      return
    }

    // New course being added
    const examConflict = checkExamConflict(section, cart)
    if (examConflict) {
      alert('Exam clash: ' + examConflict)
      return
    }

    const blocks = getEventBlocksForSection(section)
    const hasConflict = blocks.some((b) => isConflictWithCart(b, cart))
    if (hasConflict) {
      alert('Time clash: cannot add.')
      return
    }

    setCart([...cart, section])
  }

  const clearCart = () => setCart([])

  // Get all event blocks for rendering
  const getGhostBlocks = (): EventBlock[] => {
    if (!hoveredSection) return []
    return getEventBlocksForSection(hoveredSection)
  }

  const getSolidBlocks = (): EventBlock[] => {
    const blocks: EventBlock[] = []
    cart.forEach((section) => {
      const sectionBlocks = getEventBlocksForSection(section)
      sectionBlocks.forEach((b) => {
        blocks.push({ ...b, solid: true })
      })
    })
    return blocks
  }

  const ghostBlocks = getGhostBlocks()
  const solidBlocks = getSolidBlocks()

  // Filter out solid blocks for hovered course to show ghost instead
  const visibleSolidBlocks = hoveredSection
    ? solidBlocks.filter((b) => b.section.courseCode !== hoveredSection.courseCode)
    : solidBlocks

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileNav />

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              <span className="bg-[#FAFF00] px-3 py-1 neo-border inline-block">
                Course Routine
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Search courses and build your schedule. Conflicts are detected automatically.
            </p>
          </div>

          {/* Search Area */}
          <div className="neo-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Search course code (e.g. CSE221) or faculty (e.g. MLDH)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 neo-input"
              />
              <button
                onClick={loadData}
                disabled={isLoading}
                className="neo-btn px-6 py-3 bg-[#FAFF00]"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {searchResults.map((item) => {
                  const seatsAvailable = Math.max(0, (item.capacity || 0) - (item.consumedSeat || 0))
                  const pct = item.capacity ? Math.round((seatsAvailable / item.capacity) * 100) : 0
                  const isLab = (item.sectionType || '').toUpperCase() === 'LAB'
                  const inCart = cart.some((c) => c.sectionId === item.sectionId)

                  let seatColor = 'bg-gray-400'
                  if (pct >= 80) seatColor = 'bg-green-500'
                  else if (pct >= 50) seatColor = 'bg-yellow-400'
                  else if (pct >= 20) seatColor = 'bg-orange-500'
                  else if (pct > 0) seatColor = 'bg-red-500'

                  return (
                    <div
                      key={item.sectionId}
                      className={`flex-shrink-0 w-64 neo-border p-4 cursor-pointer neo-hover ${
                        inCart ? 'bg-[#FAFF00]' : 'bg-white'
                      }`}
                      onMouseEnter={() => setHoveredSection(item)}
                      onMouseLeave={() => setHoveredSection(null)}
                      onClick={() => handleToggleAdd(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-black text-sm">
                            {item.courseCode} — {item.sectionName}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {item.roomName} · {item.faculties}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono">
                          {item.courseCredit} cr · {isLab ? 'Lab' : 'Class'}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 neo-border">
                            <div className={`h-full ${seatColor}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-mono">
                            {seatsAvailable}/{item.capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-[#4f46e5] neo-border" />
              <span className="text-sm font-medium">Class</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-[#10b981] neo-border" />
              <span className="text-sm font-medium">Lab</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-4 bg-gray-300 neo-border opacity-50" />
              <span className="text-sm font-medium">Hover Preview</span>
            </div>
          </div>

          {/* Timetable */}
          <div className="neo-card p-4 overflow-x-auto mb-6">
            {/* Days header */}
            <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-0 min-w-[900px]">
              <div className="p-2 font-black text-center neo-border bg-muted">Time</div>
              {DAY_ORDER.map((day) => (
                <div key={day} className="p-2 font-black text-center neo-border bg-muted text-xs md:text-sm">
                  {day.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* Time grid */}
            <div className="relative min-w-[900px]">
              <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-0">
                {/* Time gutter */}
                <div className="flex flex-col">
                  {TIME_LABELS.map((label) => (
                    <div
                      key={label}
                      className="h-14 flex items-center justify-center text-xs font-mono neo-border border-t-0 bg-muted"
                    >
                      {label}
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {DAY_ORDER.map((_, dayIndex) => (
                  <div key={dayIndex} className="relative">
                    {TIME_LABELS.map((_, timeIndex) => (
                      <div
                        key={timeIndex}
                        className="h-14 neo-border border-t-0 border-l-0 bg-white"
                      />
                    ))}
                  </div>
                ))}
              </div>

              {/* Event blocks overlay */}
              <div className="absolute top-0 left-[100px] right-0 bottom-0 pointer-events-none">
                {/* Solid blocks (cart items) */}
                {visibleSolidBlocks.map((block, idx) => (
                  <EventBlockComponent key={`solid-${idx}`} block={block} isGhost={false} />
                ))}

                {/* Ghost blocks (preview) */}
                {ghostBlocks.map((block, idx) => {
                  const conflict = isConflictWithCart(block, cart, hoveredSection?.courseCode)
                  return (
                    <EventBlockComponent
                      key={`ghost-${idx}`}
                      block={block}
                      isGhost={true}
                      isConflict={conflict}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Cart */}
          <div className="neo-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black uppercase">Cart</h2>
              <button onClick={clearCart} className="neo-btn px-4 py-2 bg-red-400 text-sm">
                Clear All
              </button>
            </div>

            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm">Cart is empty. Search and add courses above.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((section) => {
                  const midDate = section.sectionSchedule?.midExamDate
                  const midStart = section.sectionSchedule?.midExamStartTime
                  const midEnd = section.sectionSchedule?.midExamEndTime
                  const finalDate = section.sectionSchedule?.finalExamDate
                  const finalStart = section.sectionSchedule?.finalExamStartTime
                  const finalEnd = section.sectionSchedule?.finalExamEndTime

                  return (
                    <div
                      key={section.sectionId}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 neo-border bg-white gap-4"
                    >
                      <div>
                        <h3 className="font-black">
                          {section.courseCode} — {section.sectionName}
                          {section.sectionType === 'LAB' && ' (Lab)'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-1">
                          <span>Faculty: {section.faculties}</span>
                          <span>Mid: {formatExam(midDate, midStart, midEnd)}</span>
                          <span>Final: {formatExam(finalDate, finalStart, finalEnd)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleAdd(section)}
                        className="neo-btn px-4 py-2 bg-muted text-sm self-start md:self-center"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function EventBlockComponent({
  block,
  isGhost,
  isConflict = false,
}: {
  block: EventBlock
  isGhost: boolean
  isConflict?: boolean
}) {
  const colWidthPct = 100 / 7
  const left = block.dayIndex * colWidthPct
  const top = minutesToPercent(block.startMin)
  const height = minutesToPercent(block.endMin) - top

  let bgClass = block.isLab ? 'bg-[#10b981]' : 'bg-[#4f46e5]'
  if (isConflict) bgClass = 'bg-red-500'

  return (
    <div
      className={`absolute neo-border text-white text-xs p-1 overflow-hidden pointer-events-auto ${bgClass} ${
        isGhost ? 'opacity-50' : ''
      }`}
      style={{
        left: `calc(${left}% + 4px)`,
        width: `calc(${colWidthPct}% - 8px)`,
        top: `${top}%`,
        height: `${height}%`,
      }}
    >
      <div className="font-bold truncate">{block.title}</div>
      <div className="truncate opacity-90">{block.meta}</div>
    </div>
  )
}
