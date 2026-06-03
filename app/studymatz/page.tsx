'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Navbar } from '@/components/navbar'
import { BookOpen, RefreshCw, ExternalLink, FileText, AlertCircle, Plus, UploadCloud, X } from 'lucide-react'

interface StudyMaterial {
  courseCode: string
  fileExtension: string
  semester: string
  posterName: string
  postDescription: string
  publicUrl: string
  createdAt: number
}

interface ApiResponse {
  items?: StudyMaterial[]
}


export default function StudyMatzPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${'/studymatz.json'}?t=${Date.now()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`)
      }

      const data = await response.json()
      
      const items: StudyMaterial[] = data.items || (Array.isArray(data) ? data : [])

      setMaterials(Array.from(new Map(items.map(item => [item.publicUrl, item])).values()))
      setIsLoading(false)
      setInitialLoadDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setIsLoading(false)
      setInitialLoadDone(true)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRefresh = () => {
    setInitialLoadDone(false)
    loadData()
  }

  const handleSubmission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    if (!formRef.current) return

    try {
      const formData = new FormData(formRef.current)
      
      // Custom validation for File OR URL
      const resourceUrl = formData.get('resourceUrl') as string
      const files = formData.getAll('files') as File[]
      const hasValidFiles = files.some(file => file.size > 0)
      
      if (!resourceUrl.trim() && !hasValidFiles) {
        throw new Error("Please provide either a Resource URL or attach at least one file.")
      }
      
      const response = await fetch('https://brush-studymatz.makron.workers.dev', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Submission failed. Please try again.')
      }

      setSubmitStatus({ type: 'success', msg: 'Thank you! Your materials have been submitted for review.' })
      formRef.current.reset()
      setTimeout(() => setIsFormOpen(false), 3000)
    } catch (err) {
      setSubmitStatus({ type: 'error', msg: err instanceof Error ? err.message : 'An unknown error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMaterials = materials.filter(item => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.courseCode?.toLowerCase().includes(query) ||
      item.semester?.toLowerCase().includes(query) ||
      item.posterName?.toLowerCase().includes(query) ||
      item.postDescription?.toLowerCase().includes(query) ||
      item.fileExtension?.toLowerCase().includes(query)
    )
  })

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const escapeHtml = (val: string | null | undefined) => {
    if (val === null || val === undefined) return 'N/A'
    return String(val)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="neo-card p-6 mb-6 bg-orange-400">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white neo-border">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black uppercase">Study Matz</h1>
                  <p className="text-sm font-medium opacity-80">
                    Crowd-sourced academic notes, lectures &amp; study materials
                  </p>
                  <img src="https://brush.makron.workers.dev/?token=studymatz" width="1" height="1" alt="." />
                  <p className="text-xs font-mono mt-1 opacity-70">
                    Some resources have been collected from <b><a target="_blank" href="https://boracle.app/course-materials" rel="noreferrer">BORACLE</a></b>
                  </p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading && !initialLoadDone}
                className="neo-btn px-4 py-2 bg-white flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="mb-6">
            {!isFormOpen ? (
              <button 
                onClick={() => setIsFormOpen(true)}
                className="neo-btn w-full py-4 bg-green-400 flex items-center justify-center gap-2 font-bold text-lg hover:bg-green-500 transition-colors"
              >
                <Plus className="w-6 h-6" />
                Contribute a resource here
              </button>
            ) : (
              <div className="neo-card p-6 bg-card border-green-400 border-4">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h2 className="text-xl font-black uppercase flex items-center gap-2">
                    <UploadCloud className="w-6 h-6 text-green-600" />
                    Submit New Material
                  </h2>
                  <button 
                    onClick={() => setIsFormOpen(false)}
                    className="p-1 hover:bg-muted neo-border rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form ref={formRef} onSubmit={handleSubmission} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-1">Course Code</label>
                      <input type="text" name="courseCode" required placeholder="e.g., CSE330" className="neo-input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Semester</label>
                      <input type="text" name="semester" required placeholder="e.g., Fall 2024" className="neo-input w-full" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">Your Name (Optional)</label>
                      <input type="text" name="uploaderName" placeholder="Anonymous" className="neo-input w-full" />
                    </div>
                  </div>

                  {/* Either / Or Section */}
                  <div className="p-4 bg-muted neo-border space-y-4">
                    <h3 className="font-black text-sm uppercase">Resource Content (Provide at least one)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold mb-1">Resource Link (URL)</label>
                        <input type="url" name="resourceUrl" placeholder="https://drive.google.com/..." className="neo-input w-full" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <div className="text-center font-bold text-muted-foreground my-2 md:my-0 md:mt-6 hidden md:block">
                          - OR -
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold mb-1">Attach Files</label>
                        <input type="file" name="files" multiple className="neo-input w-full bg-white file:mr-4 file:py-1 file:px-4 file:border-0 file:text-sm file:font-bold file:bg-green-100 file:text-green-700 hover:file:bg-green-200" />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold mb-1">Description</label>
                    <textarea name="description" required rows={3} placeholder="What does this resource cover?" className="neo-input w-full"></textarea>
                  </div>

                  {submitStatus && (
                    <div className={`p-3 font-bold neo-border ${submitStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {submitStatus.msg}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="neo-btn w-full py-3 bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Uploading...' : 'Submit Resource'}
                  </button>
                </form>

                <p className="text-xs font-medium text-muted-foreground mt-4 flex gap-2 items-start text-center">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    To ensure high quality submissions while not needing any sign-ins, your info would be submitted for review. If approved, it would be automatically added here within 24 hours.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="neo-card p-4 mb-6 bg-card">
            <input
              type="text"
              placeholder="Search by course, semester, uploader, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="neo-input w-full"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="neo-card p-4 mb-6 bg-red-100 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !initialLoadDone && (
            <div className="neo-card p-8 text-center bg-card">
              <div className="animate-pulse">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold">Fetching study materials...</p>
              </div>
            </div>
          )}

          {/* Results Count */}
          {initialLoadDone && (
            <div className="neo-card p-3 mb-4 bg-muted">
              <span className="text-sm font-bold">
                Showing {filteredMaterials.length} of {materials.length} materials
              </span>
            </div>
          )}

          {/* Results Table */}
          {(initialLoadDone || materials.length > 0) && (
            <div className="neo-card p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-3 text-left font-black uppercase text-sm">Course</th>
                      <th className="p-3 text-left font-black uppercase text-sm">Type</th>
                      <th className="p-3 text-left font-black uppercase text-sm">Semester</th>
                      <th className="p-3 text-left font-black uppercase text-sm">Uploader</th>
                      <th className="p-3 text-left font-black uppercase text-sm">Description</th>
                      <th className="p-3 text-left font-black uppercase text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          {searchQuery ? 'No materials match your search.' : 'No materials found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map((item, idx) => (
                        <tr key={idx} className="neo-border border-t-0 border-l-0 border-r-0 hover:bg-muted/50">
                          <td className="p-3 font-bold text-orange-600">{escapeHtml(item.courseCode)}</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs font-bold uppercase bg-muted neo-border">
                              {escapeHtml(item.fileExtension)}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-sm">{escapeHtml(item.semester)}</td>
                          <td className="p-3 font-medium text-sm">{escapeHtml(item.posterName)}</td>
                          <td className="p-3 text-sm max-w-xs">
                            <a 
                              href={item.publicUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="hover:underline flex items-center gap-1 text-foreground"
                              title={item.postDescription}
                            >
                              <span className="truncate">{escapeHtml(item.postDescription)}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-50" />
                            </a>
                          </td>
                          <td className="p-3 text-xs text-muted-foreground font-mono">
                            {formatDate(item.createdAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}