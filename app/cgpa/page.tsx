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
      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        fullText += textContent.items.map((item) => ('str' in item ? item.str : '')).join(' ') + '\n'
      }

      parsePDFText(fullText)
    } catch (error) {
      console.error('PDF parsing error:', error)
      alert('Failed to parse PDF. Please try again or enter courses manually.')
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const parsePDFText = (text: string) => {
    const semesterBlocks = text.split(/SEMESTER:/).slice(1)
    
    semesterBlocks.forEach((block) => {
      const titleMatch = block.match(/([A-Z]+\s\d{4})/)
      const title = titleMatch ? titleMatch[1].trim() : 'Imported Semester'
      
      const courseRegex = /(\b[A-Z]{3}\d{3})\s+([A-Z\s]+?)\s+(\d\.\d{2})\s+[A-F][-+]?\s+(\d\.\d{2})/g
      const courses: Course[] = []
      let match

      while ((match = courseRegex.exec(block)) !== null) {
        const gpa = parseFloat(match[4])
        courses.push({
          id: match[1],
          name: match[2].trim(),
          gpa: gpa.toString(),
          mark: reverseMapGrade(gpa),
        })
      }

      if (courses.length > 0) {
        addSemester({ title, courses })
      }
    })
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
              <span className="bg-[#00E5FF] px-3 py-1 neo-border inline-block">
                CGPA Calculator
              </span>
            </h1>
            <p className="text-muted-foreground font-medium">
              Calculate your GPA. Upload transcript PDF or enter manually.
            </p>
          </div>

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
                      gradingPolicy === policy ? 'bg-black text-white' : 'bg-white'
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
                  className="neo-btn px-4 py-2 bg-[#00E5FF] text-sm mt-2"
                >
                  Apply Boundaries
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 mb-6">
            <button onClick={() => addSemester()} className="neo-btn px-6 py-3 bg-[#00E5FF]">
              + Add Semester
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">or upload from Connect:</span>
              <label className="neo-btn px-4 py-3 bg-[#C8FF00] cursor-pointer text-sm">
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
                    className="neo-btn px-3 py-2 bg-red-400 text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Courses */}
                <div className="space-y-3 mb-4">
                  {semester.courses.map((course, courseIdx) => (
                    <div
                      key={courseIdx}
                      className="grid grid-cols-[70px_1fr_80px_80px_auto] gap-2 items-center neo-border p-3 bg-white"
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
                    className="neo-btn px-4 py-2 bg-[#C8FF00] text-sm"
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
          <div className="neo-card p-8 bg-black text-white text-center">
            <p className="uppercase font-bold tracking-wide mb-2">Cumulative GPA</p>
            <div className="text-6xl md:text-8xl font-black text-[#00E5FF]">{cgpa}</div>
          </div>
        </div>
      </main>
    </div>
  )
}
