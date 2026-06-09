'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Navbar, MobileNav } from '@/components/navbar'
import type { CourseSection, TableRow } from '@/lib/types'
import {
  fetchCourseData,
  schedulesContain,
  intervalsOverlap,
  STANDARD_TIMESLOTS,
  DAY_ORDER,
} from '@/lib/course-utils'

type TabType = 'active-classes' | 'empty-classes' | 'active-labs' | 'empty-labs'
type SortKey = 'courseCode' | 'sectionName' | 'faculties' | 'roomName' | 'timeslot'
type SortDir = 'asc' | 'desc'

const STORAGE_KEY = 'brush_classvader_state'

export default function ClassVaderPage() {
  const [data, setData] = useState<CourseSection[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('active-classes')
  const [day, setDay] = useState('SUNDAY')
  const [timeslotIdx, setTimeslotIdx] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchVisible, setSearchVisible] = useState(false)
  const [sortState, setSortState] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'courseCode',
    dir: 'asc',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [status, setStatus] = useState('Loading...')
  const [stateLoaded, setStateLoaded] = useState(false)

  // Load state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        if (state.activeTab) setActiveTab(state.activeTab)
        if (state.day) setDay(state.day)
        if (state.timeslotIdx !== undefined) setTimeslotIdx(state.timeslotIdx)
        if (state.searchQuery) setSearchQuery(state.searchQuery)
        if (state.searchVisible !== undefined) setSearchVisible(state.searchVisible)
      }
    } catch {
      // Ignore errors
    }
    setStateLoaded(true)
  }, [])

  // Save state to localStorage
  useEffect(() => {
    if (!stateLoaded) return
    const state = { activeTab, day, timeslotIdx, searchQuery, searchVisible }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [activeTab, day, timeslotIdx, searchQuery, searchVisible, stateLoaded])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setStatus('Fetching schedule...')
    const fetchedData = await fetchCourseData()
    setData(fetchedData)
    setStatus(`Loaded ${fetchedData.length} sections`)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Build rows based on active tab
  const buildActiveRows = useCallback(
    (dayVal: string, slotIdx: number, type: 'class' | 'lab'): TableRow[] => {
      const rows: TableRow[] = []

      data.forEach((item) => {
        if (type === 'class') {
          if (String(item.sectionType).toUpperCase() === 'LAB') return
          const schedules = item.sectionSchedule?.classSchedules || []
          if (schedulesContain(schedules, dayVal, slotIdx)) {
            rows.push({
              courseCode: item.courseCode || '',
              sectionName: item.sectionName || '',
              faculties: item.faculties || '',
              roomName: item.roomName || item.roomNumber || '',
              timeslot: STANDARD_TIMESLOTS[slotIdx].label,
              raw: item,
            })
          }
        } else {
          // Lab
          if (String(item.sectionType).toUpperCase() === 'LAB') {
            const labSchedules = item.sectionSchedule?.classSchedules || []
            if (schedulesContain(labSchedules, dayVal, slotIdx)) {
              rows.push({
                courseCode: item.courseCode || item.labCourseCode || '',
                sectionName: item.sectionName || '',
                faculties: item.faculties || '',
                roomName: item.roomName || item.labRoomName || '',
                timeslot: STANDARD_TIMESLOTS[slotIdx].label,
                raw: item,
              })
            }
          } else {
            const ls = item.labSchedules || []
            if (ls.length && schedulesContain(ls, dayVal, slotIdx)) {
              rows.push({
                courseCode: item.labCourseCode || item.courseCode || '',
                sectionName: item.labSectionId ? String(item.labSectionId) : item.sectionName || '',
                faculties: item.labFaculties || item.faculties || '',
                roomName: item.labRoomName || '',
                timeslot: STANDARD_TIMESLOTS[slotIdx].label,
                raw: item,
              })
            }
          }
        }
      })

      return rows
    },
    [data]
  )

  const buildEmptyRows = useCallback(
    (dayVal: string, isLab: boolean): TableRow[] => {
      const rooms = new Map<string, Set<number>>()

      data.forEach((item) => {
        if (isLab) {
          if (item.labRoomName) {
            if (!rooms.has(item.labRoomName)) rooms.set(item.labRoomName, new Set())
            const s = item.labSchedules || []
            s.forEach((sc) => {
              if (sc.day === dayVal) markStandardSlots(rooms.get(item.labRoomName)!, sc)
            })
          }
          if (String(item.sectionType).toUpperCase() === 'LAB') {
            const rn = item.roomName || item.roomNumber
            if (rn) {
              if (!rooms.has(rn)) rooms.set(rn, new Set())
              const s = item.sectionSchedule?.classSchedules || []
              s.forEach((sc) => {
                if (sc.day === dayVal) markStandardSlots(rooms.get(rn)!, sc)
              })
            }
          }
        } else {
          const rn = item.roomName || item.roomNumber
          if (rn) {
            if (!rooms.has(rn)) rooms.set(rn, new Set())
            const s = item.sectionSchedule?.classSchedules || []
            s.forEach((sc) => {
              if (sc.day === dayVal) markStandardSlots(rooms.get(rn)!, sc)
            })
          }
        }
      })

      const rows: TableRow[] = []
      rooms.forEach((usedSet, roomName) => {
        const free: string[] = []
        STANDARD_TIMESLOTS.forEach((ts, idx) => {
          if (!usedSet.has(idx)) free.push(ts.label)
        })
        if (free.length === 0) return
        rows.push({
          courseCode: '-',
          sectionName: '-',
          faculties: '-',
          roomName,
          timeslot: free.join(' | '),
        })
      })

      rows.sort((a, b) => a.roomName.localeCompare(b.roomName))
      return rows
    },
    [data]
  )

  function markStandardSlots(setObj: Set<number>, sched: { startTime: string; endTime: string }) {
    STANDARD_TIMESLOTS.forEach((ts, idx) => {
      if (intervalsOverlap(sched.startTime, sched.endTime, ts.start, ts.end)) {
        setObj.add(idx)
      }
    })
  }

  // Computed rows
  const rows = useMemo(() => {
    let result: TableRow[] = []

    if (activeTab === 'active-classes') {
      result = buildActiveRows(day, timeslotIdx, 'class')
    } else if (activeTab === 'active-labs') {
      result = buildActiveRows(day, timeslotIdx, 'lab')
    } else if (activeTab === 'empty-classes') {
      result = buildEmptyRows(day, false)
    } else if (activeTab === 'empty-labs') {
      result = buildEmptyRows(day, true)
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.courseCode.toLowerCase().includes(q) ||
          r.faculties.toLowerCase().includes(q) ||
          r.roomName.toLowerCase().includes(q) ||
          r.sectionName.toLowerCase().includes(q)
      )
    }

    // Sort
    const key = sortState.key
    const dir = sortState.dir === 'asc' ? 1 : -1
    result.sort((a, b) => {
      const av = (a[key] ?? '').toString().toLowerCase()
      const bv = (b[key] ?? '').toString().toLowerCase()
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return 0
    })

    return result
  }, [activeTab, day, timeslotIdx, searchQuery, sortState, buildActiveRows, buildEmptyRows])

  const handleSort = (key: SortKey) => {
    setSortState((prev) => ({
      key,
      dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
    }))
  }

  const showTimeslot = activeTab === 'active-classes' || activeTab === 'active-labs'
  const isEmptyTab = activeTab === 'empty-classes' || activeTab === 'empty-labs'

  const tabs: { id: TabType; label: string }[] = [
    { id: 'active-classes', label: 'Active Classes' },
    { id: 'empty-classes', label: 'Empty Classes' },
    { id: 'active-labs', label: 'Active Labs' },
    { id: 'empty-labs', label: 'Empty Labs' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileNav />

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              <span className="bg-secondary px-3 py-1 neo-border inline-block text-secondary-foreground">
                Class Vader
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Find active classes or discover empty rooms on campus.
            </p>
          </div><img src="https://brush.makron.workers.dev/?token=classvader" width="1" height="1" alt="."></img>

          {/* Controls */}
          <div className="neo-card p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold uppercase">Day</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className="neo-input py-2 text-sm"
                >
                  {DAY_ORDER.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {showTimeslot && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-bold uppercase">Time</label>
                  <select
                    value={timeslotIdx}
                    onChange={(e) => setTimeslotIdx(parseInt(e.target.value, 10))}
                    className="neo-input py-2 text-sm"
                  >
                    {STANDARD_TIMESLOTS.map((t, i) => (
                      <option key={i} value={i}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={() => setSearchVisible(!searchVisible)}
                className="neo-btn px-4 py-2 bg-card text-sm"
              >
                {searchVisible ? 'Hide Search' : 'Search'}
              </button>

              <div className="ml-auto text-sm text-muted-foreground font-mono">{status}</div>
            </div>

            {searchVisible && (
              <div className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Filter by course, instructor, room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 neo-input py-2"
                />
                <button
                  onClick={() => setSearchQuery('')}
                  className="neo-btn px-4 py-2 bg-muted text-sm"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`neo-btn px-4 py-2 text-sm ${
                  activeTab === tab.id ? 'bg-foreground text-background' : 'bg-card'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Results Count - Above Table */}
          <div className="neo-card p-3 mb-4 bg-muted">
            <span className="text-sm font-bold">
              Showing {rows.length} {activeTab.replace('-', ' ')}
            </span>
          </div>

          {/* Results Table */}
          <div className="neo-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted">
                    {!isEmptyTab && (
                      <>
                        <th className="p-3 text-left">
                          <button
                            onClick={() => handleSort('courseCode')}
                            className="font-black uppercase text-sm flex items-center gap-1"
                          >
                            Course
                            {sortState.key === 'courseCode' && (
                              <span>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </th>
                        <th className="p-3 text-left">
                          <button
                            onClick={() => handleSort('sectionName')}
                            className="font-black uppercase text-sm flex items-center gap-1"
                          >
                            Section
                            {sortState.key === 'sectionName' && (
                              <span>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </th>
                        <th className="p-3 text-left">
                          <button
                            onClick={() => handleSort('faculties')}
                            className="font-black uppercase text-sm flex items-center gap-1"
                          >
                            Instructor
                            {sortState.key === 'faculties' && (
                              <span>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                            )}
                          </button>
                        </th>
                      </>
                    )}
                    <th className="p-3 text-left">
                      <button
                        onClick={() => handleSort('roomName')}
                        className="font-black uppercase text-sm flex items-center gap-1"
                      >
                        Room
                        {sortState.key === 'roomName' && (
                          <span>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </button>
                    </th>
                    {isEmptyTab && (
                      <th className="p-3 text-left">
                        <button
                          onClick={() => handleSort('timeslot')}
                          className="font-black uppercase text-sm flex items-center gap-1"
                        >
                          Free Slots
                          {sortState.key === 'timeslot' && (
                            <span>{sortState.dir === 'asc' ? '▲' : '▼'}</span>
                          )}
                        </button>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={isEmptyTab ? 2 : 4} className="p-8 text-center text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={isEmptyTab ? 2 : 4} className="p-8 text-center text-muted-foreground">
                        No results found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row, idx) => (
                      <tr key={idx} className="neo-border border-t-0 border-l-0 border-r-0 hover:bg-muted/50">
                        {!isEmptyTab && (
                          <>
                            <td className="p-3 font-mono text-sm">{row.courseCode}</td>
                            <td className="p-3 text-sm">{row.sectionName}</td>
                            <td className="p-3 text-sm">{row.faculties}</td>
                          </>
                        )}
                        <td className="p-3 font-bold text-sm">{row.roomName}</td>
                        {isEmptyTab && (
                          <td className="p-3 text-sm font-mono">{row.timeslot}</td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
