// Types for the BRUSH application
export interface ClassSchedule {
  day: string
  startTime: string
  endTime: string
}

export interface SectionSchedule {
  classSchedules: ClassSchedule[]
  midExamDate?: string
  midExamStartTime?: string
  midExamEndTime?: string
  finalExamDate?: string
  finalExamStartTime?: string
  finalExamEndTime?: string
}

export interface CourseSection {
  sectionId: number
  courseCode: string
  sectionName: string
  courseCredit: number
  sectionType: string
  roomName: string
  roomNumber?: string
  faculties: string
  capacity: number
  consumedSeat: number
  sectionSchedule: SectionSchedule
  labSchedules?: ClassSchedule[]
  labRoomName?: string
  labCourseCode?: string
  labSectionId?: number
  labFaculties?: string
}

export interface EventBlock {
  dayIndex: number
  startMin: number
  endMin: number
  title: string
  meta: string
  isLab: boolean
  sectionId: number
  section: CourseSection
  solid?: boolean
}

export interface TableRow {
  courseCode: string
  sectionName: string
  faculties: string
  roomName: string
  timeslot: string
  raw?: CourseSection
}

// Grade policies for CGPA Calculator
export interface GradeEntry {
  min: number
  grade: string
  gpa: number
}

export interface Semester {
  title: string
  courses: Course[]
}

export interface Course {
  id: string
  name: string
  gpa: string
  mark: string
}
