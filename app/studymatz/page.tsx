'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/navbar'
import { BookOpen, RefreshCw, ExternalLink, FileText, AlertCircle } from 'lucide-react'

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
  items: StudyMaterial[]
  nextCursor: string | null
}

const WORKER_API_URL = 'https://data01.makron.workers.dev'

export default function StudyMatzPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = useCallback(async (isRefresh = false, overrideCursor: string | null = null) => {
    // Allow recursive auto-loads to bypass this check using overrideCursor
    if (isLoading && !overrideCursor) return

    setIsLoading(true)
    setError(null)

    if (isRefresh) {
      setNextCursor(null)
      setMaterials([])
    }

    // Use overrideCursor if provided (during auto-load), otherwise fallback to state
    const cursor = isRefresh ? null : (overrideCursor || nextCursor)

    try {
      const url = cursor ? `${WORKER_API_URL}?cursor=${cursor}` : WORKER_API_URL
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      const items = data.items || []

      // Safely append and filter out duplicates based on the unique publicUrl
      setMaterials(prev => {
        const combined = isRefresh ? items : [...prev, ...items]
        return Array.from(new Map(combined.map(item => [item.publicUrl, item])).values())
      })
      
      setNextCursor(data.nextCursor)

      // Auto-load next batch if there's more data
      if (data.nextCursor) {
        setTimeout(() => {
          // Pass the fresh cursor directly to avoid stale state in closures
          loadData(false, data.nextCursor)
        }, 600)
      } else {
        setIsLoading(false)
        setInitialLoadDone(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setIsLoading(false)
      setInitialLoadDone(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, nextCursor])

  useEffect(() => {
    loadData(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleRefresh = () => {
    setInitialLoadDone(false)
    loadData(true)
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
                  </p><img src="https://brush.makron.workers.dev/?token=studymatz" width="1" height="1" alt="."></img>
                  <p className="text-xs font-mono mt-1 opacity-70">
                    Fetched from <b><a target="_blank" href="https://boracle.app/course-materials">BORACLE</a></b>
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
                <p className="font-bold">
                  {nextCursor ? 'Loading more materials...' : 'Fetching study materials...'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {materials.length} items loaded
                </p>
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

              {/* Loading indicator for pagination */}
              {isLoading && initialLoadDone && (
                <div className="p-3 bg-muted text-center">
                  <span className="text-sm font-medium animate-pulse">Loading more...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
