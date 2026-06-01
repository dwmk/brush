'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Navbar, MobileNav } from '@/components/navbar'
import { CustomTool, CUSTOM_TOOLS_STORAGE_KEY, loadCustomTools, saveCustomTools } from '@/lib/custom-tools'

const tools = [
  {
    id: 'routine',
    name: 'Course Routine',
    description: 'Build your perfect schedule. Search courses, avoid conflicts, plan exams.',
    href: '/routine',
    color: 'bg-[#FAFF00]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="3" y="4" width="18" height="18" rx="0" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="9" y1="14" x2="15" y2="14" />
        <line x1="9" y1="18" x2="12" y2="18" />
      </svg>
    ),
  },
  {
    id: 'classvader',
    name: 'Class Vader',
    description: 'Find active classes & empty rooms. Know where everyone is, or where no one is.',
    href: '/classvader',
    color: 'bg-[#FF3D8F]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="8" y1="11" x2="14" y2="11" />
        <line x1="11" y1="8" x2="11" y2="14" />
      </svg>
    ),
  },
  {
    id: 'cgpa',
    name: 'CGPA Calculator',
    description: 'Calculate your GPA instantly. Upload transcripts or enter manually.',
    href: '/cgpa',
    color: 'bg-[#00E5FF]',
    icon: (
      <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3">
        <rect x="4" y="2" width="16" height="20" rx="0" />
        <line x1="8" y1="6" x2="16" y2="6" />
        <line x1="8" y1="10" x2="16" y2="10" />
        <line x1="8" y1="14" x2="12" y2="14" />
        <circle cx="14" cy="17" r="2" />
      </svg>
    ),
  },
]

export default function HomePage() {
  const [customTools, setCustomTools] = useState<CustomTool[]>([])
  const [toolsLoaded, setToolsLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTool, setEditingTool] = useState<CustomTool | null>(null)
  const [newToolName, setNewToolName] = useState('')
  const [newToolLink, setNewToolLink] = useState('')

  // Load custom tools from localStorage
  useEffect(() => {
    setCustomTools(loadCustomTools())
    setToolsLoaded(true)
  }, [])

  // Save custom tools to localStorage
  useEffect(() => {
    if (!toolsLoaded) return
    saveCustomTools(customTools)
    // Dispatch event to notify navbar
    window.dispatchEvent(new Event('customToolsUpdated'))
  }, [customTools, toolsLoaded])

  const handleAddTool = () => {
    if (!newToolName.trim() || !newToolLink.trim()) return
    
    const newTool: CustomTool = {
      id: `custom-${Date.now()}`,
      name: newToolName.trim(),
      href: newToolLink.trim().startsWith('http') ? newToolLink.trim() : `https://${newToolLink.trim()}`,
    }
    
    setCustomTools([...customTools, newTool])
    setNewToolName('')
    setNewToolLink('')
    setShowAddModal(false)
  }

  const handleEditTool = () => {
    if (!editingTool || !newToolName.trim() || !newToolLink.trim()) return
    
    setCustomTools(customTools.map(t => 
      t.id === editingTool.id 
        ? { ...t, name: newToolName.trim(), href: newToolLink.trim().startsWith('http') ? newToolLink.trim() : `https://${newToolLink.trim()}` }
        : t
    ))
    setEditingTool(null)
    setNewToolName('')
    setNewToolLink('')
  }

  const handleDeleteTool = (id: string) => {
    setCustomTools(customTools.filter(t => t.id !== id))
  }

  const openEditModal = (tool: CustomTool) => {
    setEditingTool(tool)
    setNewToolName(tool.name)
    setNewToolLink(tool.href)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingTool(null)
    setNewToolName('')
    setNewToolLink('')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MobileNav />
      
      <main className="pt-16 pb-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 pattern-dots opacity-20" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-12 md:py-20">
            <div className="flex flex-col items-center text-center">
              {/* Main title */}
              <div className="relative mb-6">
                <h1 className="text-brutal-xl">
                  <span className="bg-primary px-4 py-2 neo-border inline-block transform -rotate-1">
                    BRUSH
                  </span>
                </h1>
              </div>
              
              <p className="text-xl md:text-2xl font-bold max-w-2xl mb-4">
                BRAC UNIVERSITY STUDENT HUB
              </p>
              
              <p className="text-lg text-muted-foreground max-w-xl mb-8">
                Fast and free academic resources, powered by students and Connect.
              </p><img src="https://brush.makron.workers.dev/?token=landing" width="1" height="1" alt="."></img>

              {/* Decorative elements */}
              <div className="flex gap-4 mb-12">
                <div className="w-16 h-4 bg-primary neo-border" />
                <div className="w-16 h-4 bg-secondary neo-border" />
                <div className="w-16 h-4 bg-accent neo-border" />
              </div>
            </div>
          </div>
        </section>

        {/* Tools Catalog */}
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-1 flex-1 bg-black" />
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
              Tools
            </h2>
            <div className="h-1 flex-1 bg-black" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Built-in tools */}
            {tools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="group neo-card neo-hover p-0 overflow-hidden"
              >
                {/* Card header with icon */}
                <div className={`${tool.color} p-6 neo-border border-t-0 border-l-0 border-r-0`}>
                  <div className="flex items-center justify-between">
                    {tool.icon}
                    <svg 
                      viewBox="0 0 24 24" 
                      className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="3"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </div>
                </div>
                
                {/* Card body */}
                <div className="p-6">
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-muted-foreground font-medium">
                    {tool.description}
                  </p>
                </div>
                
                {/* Card footer */}
                <div className="px-6 pb-6">
                  <span className="inline-block px-4 py-2 bg-black text-white font-bold uppercase text-sm tracking-wide neo-border group-hover:bg-primary group-hover:text-black transition-colors">
                    Launch Tool
                  </span>
                </div>
              </Link>
            ))}

            {/* Custom tools */}
            {customTools.map((tool) => (
              <div key={tool.id} className="group neo-card p-0 overflow-hidden relative">
                {/* Edit/Delete buttons */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(tool)}
                    className="p-2 bg-white neo-border text-sm font-bold hover:bg-muted"
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="p-2 bg-white neo-border text-sm font-bold hover:bg-red-100"
                    title="Delete"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>

                <a
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block neo-hover"
                >
                  {/* Card header with icon - Grey color for custom tools */}
                  <div className="bg-gray-300 p-6 neo-border border-t-0 border-l-0 border-r-0">
                    <div className="flex items-center justify-between">
                      <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <svg 
                        viewBox="0 0 24 24" 
                        className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Card body */}
                  <div className="p-6">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-muted-foreground font-medium text-sm truncate">
                      {tool.href}
                    </p>
                  </div>
                  
                  {/* Card footer */}
                  <div className="px-6 pb-6">
                    <span className="inline-block px-4 py-2 bg-black text-white font-bold uppercase text-sm tracking-wide neo-border group-hover:bg-gray-500 transition-colors">
                      Open Link
                    </span>
                  </div>
                </a>
              </div>
            ))}

            {/* Add new tool card */}
            <button
              onClick={() => setShowAddModal(true)}
              className="group neo-card neo-hover p-0 overflow-hidden text-left"
            >
              {/* Card header */}
              <div className="bg-gray-200 p-6 neo-border border-t-0 border-l-0 border-r-0">
                <div className="flex items-center justify-between">
                  <svg viewBox="0 0 24 24" className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="3">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-8 h-8 transform group-hover:translate-x-2 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </div>
              </div>
              
              {/* Card body */}
              <div className="p-6">
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">
                  Add Shortcut
                </h3>
                <p className="text-muted-foreground font-medium">
                  Add your own external resources and links as shortcuts.
                </p>
              </div>
              
              {/* Card footer */}
              <div className="px-6 pb-6">
                <span className="inline-block px-4 py-2 bg-gray-400 text-white font-bold uppercase text-sm tracking-wide neo-border group-hover:bg-gray-600 transition-colors">
                  Add New
                </span>
              </div>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 py-8">
          <div className="neo-border p-6 bg-muted">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary px-3 py-1 neo-border font-black">BRUSH</span>
                <span className="text-sm text-muted-foreground font-medium">
                 by <a target="_blank" href="https://dewanmukto.github.io">Dewan Mukto</a>, creator of <a target="_blank" href="https://braxapp.github.io">BRAX</a>
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                 Data from <a target="_blank" href="https://usis-cdn.eniamza.com/connect.json">Tashfeen Azmaine's</a> CDN.
              </p>
            </div>
          </div>
        </footer>
      </main>

      {/* Add/Edit Modal */}
      {(showAddModal || editingTool) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          
          {/* Modal */}
          <div className="relative bg-white neo-card p-6 w-full max-w-md">
            <h3 className="text-xl font-black uppercase tracking-tight mb-4">
              {editingTool ? 'Edit Shortcut' : 'Add Shortcut'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Name</label>
                <input
                  type="text"
                  value={newToolName}
                  onChange={(e) => setNewToolName(e.target.value)}
                  placeholder="e.g. PreConnect (by Sabbir B. Abbas)"
                  className="w-full neo-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold uppercase mb-2">Link</label>
                <input
                  type="text"
                  value={newToolLink}
                  onChange={(e) => setNewToolLink(e.target.value)}
                  placeholder="e.g. https://preconnect.app"
                  className="w-full neo-input"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 neo-btn bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={editingTool ? handleEditTool : handleAddTool}
                className="flex-1 px-4 py-3 neo-btn bg-primary hover:bg-primary/80"
              >
                {editingTool ? 'Save' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}