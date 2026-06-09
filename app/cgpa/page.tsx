'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Navbar, MobileNav } from '@/components/navbar'
import type { GradeEntry, Semester, Course } from '@/lib/types'

const GRADE_POLICIES: Record<string, GradeEntry[]> = {
  bracu: [
    { min: 97, grade: 'A+', gpa: 4.0 },
    { min: 90, grade: 'A', gpa: 4.0 },
    { min: 85, grade: 'A-', gpa: 3.7 },
    { min: 80, grade: 'B+', gpa: 3.3 },
    { min: 75, grade: 'B', gpa: 3.0 },
    { min: 70, grade: 'B-', gpa: 2.7 },
    { min: 65, grade: 'C+', gpa: 2.3 },
    { min: 60, grade: 'C', gpa: 2.0 },
    { min: 57, grade: 'C-', gpa: 1.7 },
    { min: 55, grade: 'D+', gpa: 1.3 },
    { min: 52, grade: 'D', gpa: 1.0 },
    { min: 50, grade: 'D-', gpa: 0.7 },
    { min: 0, grade: 'F', gpa: 0.0 },
  ],
  mun: [
    { min: 80, grade: 'A', gpa: 4.0 },
    { min: 65, grade: 'B', gpa: 3.0 },
    { min: 55, grade: 'C', gpa: 2.0 },
    { min: 50, grade: 'D', gpa: 1.0 },
    { min: 0, grade: 'F', gpa: 0.0 },
  ],
}

const STORAGE_KEY = 'brush_cgpa_state'

export default function CGPAPage() {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [gradingPolicy, setGradingPolicy] = useState<'bracu' | 'mun' | 'custom'>('bracu')
  const [customPolicy, setCustomPolicy] = useState<GradeEntry[]>([])
  const [customPolicyText, setCustomPolicyText] = useState('')
  const [cgpa, setCgpa] = useState('0.00')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stateLoaded, setStateLoaded] = useState(false)

  const currentPolicy = gradingPolicy === 'custom' ? customPolicy : GRADE_POLICIES[gradingPolicy]

  // Load state from localStorage (runs once on mount)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const state = JSON.parse(saved)
        if (state.semesters && Array.isArray(state.semesters)) setSemesters(state.semesters)
        if (state.gradingPolicy) setGradingPolicy(state.gradingPolicy)
        if (state.customPolicy && Array.isArray(state.customPolicy)) setCustomPolicy(state.customPolicy)
        if (state.customPolicyText) setCustomPolicyText(state.customPolicyText)
      }
    } catch {
      // Ignore errors
    }
    setStateLoaded(true)
  }, [])

  // Save state to localStorage (only after initial load)
  useEffect(() => {
    if (!stateLoaded) return
    const state = { semesters, gradingPolicy, customPolicy, customPolicyText }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [semesters, gradingPolicy, customPolicy, customPolicyText, stateLoaded])

  // Calculate CGPA
  const calculateCGPA = useCallback(() => {
    let totalQP = 0
    let totalCourses = 0

    semesters.forEach((sem) => {
      sem.courses.forEach((course) => {
        const gpa = parseFloat(course.gpa)
        if (!isNaN(gpa)) {
          totalQP += gpa
          totalCourses += 1
        }
      })
    })

    return totalCourses ? (totalQP / totalCourses).toFixed(2) : '0.00'
  }, [semesters])

  useEffect(() => {
    setCgpa(calculateCGPA())
  }, [calculateCGPA])

  const calculateSemesterGPA = (semester: Semester): string => {
    let semQP = 0
    let semCourses = 0
    semester.courses.forEach((course) => {
      const gpa = parseFloat(course.gpa)
      if (!isNaN(gpa)) {
        semQP += gpa
        semCourses += 1
      }
    })
    return semCourses ? (semQP / semCourses).toFixed(2) : '0.00'
  }

  const addSemester = (data?: Partial<Semester>) => {
    setSemesters([
      ...semesters,
      {
        title: data?.title || `Semester ${semesters.length + 1}`,
        courses: data?.courses || [],
      },
    ])
  }

  const updateSemesterTitle = (index: number, title: string) => {
    const updated = [...semesters]
    updated[index].title = title
    setSemesters(updated)
  }

  const removeSemester = (index: number) => {
    setSemesters(semesters.filter((_, i) => i !== index))
  }

  const addCourse = (semesterIndex: number, courseData?: Partial<Course>) => {
    const updated = [...semesters]
    updated[semesterIndex].courses.push({
      id: courseData?.id || '',
      name: courseData?.name || '',
      gpa: courseData?.gpa || '',
      mark: courseData?.mark || '',
    })
    setSemesters(updated)
  }

  const updateCourse = (semesterIndex: number, courseIndex: number, field: keyof Course, value: string) => {
    const updated = [...semesters]
    updated[semesterIndex].courses[courseIndex][field] = value
    setSemesters(updated)
  }

  const removeCourse = (semesterIndex: number, courseIndex: number) => {
    const updated = [...semesters]
    updated[semesterIndex].courses.splice(courseIndex, 1)
    setSemesters(updated)
  }

  const syncFromMark = (semesterIndex: number, courseIndex: number, mark: string) => {
    const markNum = parseFloat(mark)
    if (isNaN(markNum)) return

    const entry = currentPolicy.find((p) => markNum >= p.min)
    if (entry) {
      const updated = [...semesters]
      updated[semesterIndex].courses[courseIndex].gpa = entry.gpa.toString()
      updated[semesterIndex].courses[courseIndex].mark = mark
      setSemesters(updated)
    }
  }

  const syncFromGPA = (semesterIndex: number, courseIndex: number, gpa: string) => {
    const gpaNum = parseFloat(gpa)
    if (isNaN(gpaNum)) return

    const entry = currentPolicy.find((p) => p.gpa === gpaNum)
    if (entry) {
      const updated = [...semesters]
      updated[semesterIndex].courses[courseIndex].gpa = gpa
      updated[semesterIndex].courses[courseIndex].mark = entry.min.toString()
      setSemesters(updated)
    }
  }

  const applyCustomBoundaries = () => {
    const lines = customPolicyText.split('\n').filter((l) => l.trim())
    const parsed = lines
      .map((line) => {
        const parts = line.split(':')
        if (parts.length !== 3) return null
        return {
          min: parseFloat(parts[0]),
          grade: parts[1],
          gpa: parseFloat(parts[2]),
        }
      })
      .filter((p): p is GradeEntry => p !== null)
      .sort((a, b) => b.min - a.min)

    setCustomPolicy(parsed)
  }

  const handlePDFUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdfjsLib = await import('pdfjs-dist')

      // Set worker source
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const lines: string[] = []

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const items = textContent.items.filter((item): item is { str: string; transform: number[]; width: number } => 'str' in item && item.str.trim().length > 0)

        // Group items by Y position to reconstruct lines
        const lineMap = new Map<number, { x: number; str: string }[]>()
        items.forEach(item => {
          const y = Math.round(item.transform[5])
          if (!lineMap.has(y)) lineMap.set(y, [])
          lineMap.get(y)!.push({ x: item.transform[4], str: item.str })
        })

        // Sort by Y (descending, PDF coords start from bottom) then by X
        const sortedLines = [...lineMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([, items]) => {
            items.sort((a, b) => a.x - b.x)
            return items.map(i => i.str).join(' ')
          })

        lines.push(...sortedLines)
      }

      parsePDFText(lines)
    } catch (error) {
      console.error('PDF parsing error:', error)
      alert('Failed to parse PDF. Please try again or enter courses manually.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const parsePDFText = (lines: string[]) => {
    // BRACU grade sheet format:
    // Semester header: "Semester : Spring 2023" or "Spring 2023" on its own
    // Course rows: CSE221  Algorithm  3.00  A  4.00
    //   or with (NT) = skip, (RT) = keep but remove (RT) text

    const semesters: { title: string; courses: Course[] }[] = []
    let currentSem: { title: string; courses: Course[] } | null = null

    // Patterns for semester headers
    const semesterPatterns = [
      /semester\s*:\s*(spring|summer|fall|autumn)\s+(\d{4})/i,
      /^((?:spring|summer|fall|autumn)\s+\d{4})\s*$/i,
    ]

    // Pattern for course rows: CODE  NAME  CREDITS  GRADE  GPA
    // Course codes: 2-4 letters + 3 digits (e.g. CSE221, MAT110, PHY107)
    const coursePattern = /^([A-Z]{2,4}\d{3}[A-Z]?)\s+(.+?)\s+(\d+\.?\d*)\s+([A-F][+-]?)\s*(?:\(RT\)\s*)?(\d+\.?\d*)\s*(?:\(RT\))?/i
    // NT pattern - if (NT) appears in a course row, skip it
    const ntPattern = /\(NT\)/i

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Check for semester header
      let semesterMatch: RegExpMatchArray | null = null
      for (const pattern of semesterPatterns) {
        semesterMatch = trimmed.match(pattern)
        if (semesterMatch) break
      }

      if (semesterMatch) {
        // Save previous semester if it has courses
        if (currentSem && currentSem.courses.length > 0) {
          semesters.push(currentSem)
        }
        const title = semesterMatch[1] ? `${semesterMatch[1]} ${semesterMatch[2]}` : semesterMatch[0]
        currentSem = { title: title.trim(), courses: [] }
        continue
      }

      // Check for (NT) - skip this row entirely
      if (ntPattern.test(trimmed)) continue

      // Try to match a course row
      const courseMatch = trimmed.match(coursePattern)
      if (courseMatch && currentSem) {
        const courseCode = courseMatch[1]
        let courseName = courseMatch[2].trim()
        // Remove (RT) from course name if present
        courseName = courseName.replace(/\s*\(RT\)\s*/g, '')
        const credits = courseMatch[3]
        const grade = courseMatch[4]
        const gpa = courseMatch[5]

        currentSem.courses.push({
          id: courseCode,
          name: courseName,
          gpa: gpa,
          mark: reverseMapGrade(parseFloat(gpa)),
        })
        continue
      }

      // Fallback: try a more relaxed pattern for course rows that may have extra spaces
      // Format: CODE  NAME  CREDITS  GRADE  GPA with possible (RT) markers
      const relaxedPattern = /([A-Z]{2,4}\d{3}[A-Z]?)\s+(.+?)\s+(\d+\.?\d*)\s+([A-F][+-]?)\s+(\d+\.?\d*)/i
      const relaxedMatch = trimmed.match(relaxedPattern)
      if (relaxedMatch && currentSem) {
        // Double check it's not an NT row (redundant but safe)
        if (/\(NT\)/i.test(trimmed)) continue

        const courseCode = relaxedMatch[1]
        let courseName = relaxedMatch[2].trim()
        courseName = courseName.replace(/\s*\(RT\)\s*/g, '')
        const gpa = relaxedMatch[5]

        currentSem.courses.push({
          id: courseCode,
          name: courseName,
          gpa: gpa,
          mark: reverseMapGrade(parseFloat(gpa)),
        })
      }
    }

    // Don't forget the last semester
    if (currentSem && currentSem.courses.length > 0) {
      semesters.push(currentSem)
    }

    // Add all parsed semesters
    semesters.forEach((sem) => {
      addSemester({ title: sem.title, courses: sem.courses })
    })

    // Alert if nothing was found
    if (semesters.length === 0) {
      alert('Could not detect any semester data from this PDF. The format may not be supported. Please enter courses manually.')
    }
  }

  const reverseMapGrade = (gpa: number): string => {
    const closest = currentPolicy.reduce((prev, curr) =>
      Math.abs(curr.gpa - gpa) < Math.abs(prev.gpa - gpa) ? curr : prev
    )
    return closest.min.toString()
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileNav />

      <main className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-2">
              <span className="bg-accent px-3 py-1 neo-border inline-block">
                CGPA Calculator
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Calculate your GPA. Upload transcript PDF or enter manually.
            </p>
          </div><img src="https://brush.makron.workers.dev/?token=cgpa" width="1" height="1" alt="."></img>

          {/* Grading System Selector */}
          <div className="neo-card p-4 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-bold uppercase text-sm">Grading System:</span>
              <div className="flex gap-2">
                {(['bracu', 'mun', 'custom'] as const).map((policy) => (
                  <button
                    key={policy}
                    onClick={() => setGradingPolicy(policy)}
                    className={`neo-btn px-4 py-2 text-sm uppercase ${
                      gradingPolicy === policy ? 'bg-foreground text-background' : 'bg-card'
                    }`}
                  >
                    {policy}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Policy Input */}
            {gradingPolicy === 'custom' && (
              <div className="mt-4">
                <label className="block text-sm font-bold uppercase mb-2">
                  Custom Grade Boundaries
                </label>
                <textarea
                  value={customPolicyText}
                  onChange={(e) => setCustomPolicyText(e.target.value)}
                  placeholder={'Example:\n90:A:4.0\n80:B:3.0\n70:C:2.0'}
                  className="w-full h-32 neo-input font-mono text-sm resize-none"
                />
                <button
                  onClick={applyCustomBoundaries}
                  className="neo-btn px-4 py-2 bg-accent text-sm mt-2"
                >
                  Apply Boundaries
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button onClick={() => addSemester()} className="neo-btn px-6 py-3 bg-accent">
              + Add Semester
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">or upload from Connect:</span>
              <label className="neo-btn px-4 py-3 bg-tertiary cursor-pointer text-sm">
                Upload PDF
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handlePDFUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Semesters */}
          <div className="space-y-6 mb-8">
            {semesters.map((semester, semIdx) => (
              <div key={semIdx} className="neo-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <input
                    type="text"
                    value={semester.title}
                    onChange={(e) => updateSemesterTitle(semIdx, e.target.value)}
                    placeholder="Semester Name"
                    className="neo-input py-2 font-bold text-lg flex-1 mr-4"
                  />
                  <button
                    onClick={() => removeSemester(semIdx)}
                    className="neo-btn px-3 py-2 bg-destructive text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Courses */}
                <div className="space-y-3 mb-4">
                  {semester.courses.map((course, courseIdx) => (
                    <div
                      key={courseIdx}
                      className="grid grid-cols-[70px_1fr_80px_80px_auto] gap-2 items-center neo-border p-3 bg-card"
                    >
                      <input
                        type="text"
                        value={course.id}
                        onChange={(e) => updateCourse(semIdx, courseIdx, 'id', e.target.value)}
                        placeholder="ID"
                        className="neo-input py-1 text-sm font-mono"
                      />
                      <input
                        type="text"
                        value={course.name}
                        onChange={(e) => updateCourse(semIdx, courseIdx, 'name', e.target.value)}
                        placeholder="Course Name"
                        className="neo-input py-1 text-sm"
                      />
                      <input
                        type="number"
                        step="0.1"
                        value={course.gpa}
                        onChange={(e) => {
                          updateCourse(semIdx, courseIdx, 'gpa', e.target.value)
                          syncFromGPA(semIdx, courseIdx, e.target.value)
                        }}
                        placeholder="GPA"
                        className="neo-input py-1 text-sm text-center"
                      />
                      <input
                        type="number"
                        value={course.mark}
                        onChange={(e) => {
                          updateCourse(semIdx, courseIdx, 'mark', e.target.value)
                          syncFromMark(semIdx, courseIdx, e.target.value)
                        }}
                        placeholder="Mark"
                        className="neo-input py-1 text-sm text-center"
                      />
                      <button
                        onClick={() => removeCourse(semIdx, courseIdx)}
                        className="neo-btn px-2 py-1 bg-muted text-xs"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => addCourse(semIdx)}
                    className="neo-btn px-4 py-2 bg-tertiary text-sm"
                  >
                    + Add Course
                  </button>
                  <div className="font-black text-lg">
                    GPA: {calculateSemesterGPA(semester)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CGPA Result */}
          <div className="neo-card p-8 bg-foreground text-background text-center">
            <p className="uppercase font-bold tracking-wide mb-2">Cumulative GPA</p>
            <div className="text-6xl md:text-8xl font-black text-accent">{cgpa}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
