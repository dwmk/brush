'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/navbar'
import { BookOpen, RefreshCw, ExternalLink, FileText, AlertCircle, Send, CheckCircle } from 'lucide-react'

interface StudyMaterial {
  Course: string
  Type: string
  Semester: string
  Uploader: string
  Description: string
}

export default function StudyMatzPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<StudyMaterial[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form Submission States
  const [formData, setFormData] = useState({
    course: '',
    type: 'PDF',
    uploader: '',
    semester: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Fetch complete JSON archive
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/studymatz.json')
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`)
      }
      const data: StudyMaterial[] = await response.json()
      setMaterials(data)
      setFilteredMaterials(data)
    } catch (err: any) {
      console.error('Error loading static JSON data:', err)
      setError(err.message || 'Failed to load study materials archive.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle local Client-side search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMaterials(materials)
      return
    }
    const query = searchQuery.toLowerCase()
    const filtered = materials.filter(
      (item) =>
        item.Course.toLowerCase().includes(query) ||
        item.Description.toLowerCase().includes(query) ||
        item.Uploader.toLowerCase().includes(query) ||
        item.Semester.toLowerCase().includes(query)
    )
    setFilteredMaterials(filtered)
  }, [searchQuery, materials])

  // Form input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  // Handle Submission to Cloudflare Webhook Worker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitSuccess(null)
    setSubmitError(null)

    try {
      const response = await fetch('https://brush-studymatz.makron.workers.dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit material for review.')
      }

      setSubmitSuccess('Thank you! Your resource has been submitted for verification.')
      setFormData({ course: '', type: 'PDF', uploader: '', semester: '', description: '' })
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">StudyMatz Index</h1>
            </div>
            <button 
              onClick={loadData}
              disabled={isLoading}
              className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-md border bg-card hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Archive
            </button>
          </div>

          {/* New Submission Panel */}
          <div className="border bg-card text-card-foreground rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Contribute New Resource
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Code</label>
                <input 
                  type="text" name="course" required placeholder="e.g. CSE220"
                  value={formData.course} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resource Type</label>
                <select 
                  name="type" value={formData.type} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="PDF">PDF</option>
                  <option value="GITHUB">GITHUB</option>
                  <option value="G DRIVE">G DRIVE</option>
                  <option value="YOUTUBE">YOUTUBE</option>
                  <option value="WEBSITE">WEBSITE</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Your Nickname (Uploader)</label>
                <input 
                  type="text" name="uploader" required placeholder="e.g. Anonymous"
                  value={formData.uploader} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <input 
                  type="text" name="semester" required placeholder="e.g. Spring 2026"
                  value={formData.semester} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Resource URL or Description</label>
                <textarea 
                  name="description" required rows={2} 
                  placeholder="Provide valid links/URLs or access context here..."
                  value={formData.description} onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-md bg-background resize-none"
                />
              </div>
              <div className="md:col-span-2 flex justify-end mt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Submitting...' : 'Submit Material'}
                </button>
              </div>
            </form>

            {submitSuccess && (
              <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}
            {submitError && (
              <div className="mt-4 flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Running Notice Statement */}
            <div className="mt-4 pt-3 border-t text-xs text-muted-foreground bg-muted/40 p-2 rounded text-center font-medium italic animate-pulse">
              ⚠️ Notice: To ensure high quality submissions while not needing any sign-ins, your info would be submitted for review. If approved, it would be automatically added here within 24 hours.
            </div>
          </div>

          {/* Search bar row */}
          <div className="flex gap-4 items-center">
            <input 
              type="text" 
              placeholder="Search by Course code, Semester, Description, or Uploader..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border bg-card rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Archive Table Rendering */}
          {!error && (
            <div className="border bg-card rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <th className="p-3">Course</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Uploader</th>
                      <th className="p-3">Semester</th>
                      <th className="p-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                          {isLoading ? 'Loading file archive...' : 'No data records found matching search filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-sm font-bold text-primary">{escapeHtml(item.Course)}</td>
                          <td className="p-3 text-xs"><span className="px-2 py-0.5 rounded-full bg-secondary font-semibold">{escapeHtml(item.Type)}</span></td>
                          <td className="p-3 font-medium text-sm">{escapeHtml(item.Uploader)}</td>
                          <td className="p-3 text-sm text-muted-foreground">{escapeHtml(item.Semester)}</td>
                          <td className="p-3 text-sm max-w-md break-words">{escapeHtml(item.Description)}</td>
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