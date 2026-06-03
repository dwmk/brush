'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CustomTool, loadCustomTools } from '@/lib/custom-tools'

const navItems = [
  { href: '/', label: 'Hub' },
  { href: '/routine', label: 'Routine' },
  { href: '/classvader', label: 'Class Vader' },
  { href: '/cgpa', label: 'CGPA' },
]

export function Navbar() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [customTools, setCustomTools] = useState<CustomTool[]>([])

  // Load custom tools on mount
  useEffect(() => {
    setCustomTools(loadCustomTools())
  }, [])

  // Listen for custom tools updates
  useEffect(() => {
    const handleUpdate = () => {
      setCustomTools(loadCustomTools())
    }
    window.addEventListener('customToolsUpdated', handleUpdate)
    return () => window.removeEventListener('customToolsUpdated', handleUpdate)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white neo-border border-t-0 border-l-0 border-r-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 neo-hover" prefetch>
              <span className="bg-primary px-3 py-1 neo-border text-xl font-black tracking-tighter">
                BRUSH
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`px-4 py-2 font-bold uppercase tracking-wide text-sm neo-hover ${
                    pathname === item.href
                      ? 'bg-black text-white neo-border'
                      : 'neo-border bg-white hover:bg-muted'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Custom tools in navbar */}
              {customTools.map((tool) => (
                <a
                  key={tool.id}
                  href={tool.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 font-bold uppercase tracking-wide text-sm neo-hover neo-border bg-gray-200 hover:bg-gray-300"
                >
                  {tool.name}
                </a>
              ))}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex md:hidden px-3 py-2 neo-border bg-primary font-bold text-sm"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? 'CLOSE' : 'MENU'}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Sliding Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Sliding Panel */}
        <div
          className={`absolute top-16 right-0 w-64 h-[calc(100vh-64px)] bg-white neo-border border-t-0 border-r-0 transform transition-transform duration-200 overflow-y-auto ${
            mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full px-4 py-3 font-bold uppercase tracking-wide text-sm neo-border ${
                  pathname === item.href
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Custom tools in mobile menu */}
            {customTools.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <span className="text-xs font-bold uppercase text-muted-foreground">
                    Your Shortcuts
                  </span>
                </div>
                {customTools.map((tool) => (
                  <a
                    key={tool.id}
                    href={tool.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block w-full px-4 py-3 font-bold uppercase tracking-wide text-sm neo-border bg-gray-200 hover:bg-gray-300"
                  >
                    {tool.name}
                  </a>
                ))}
              </>
            )}
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <div className="neo-border p-3 bg-muted text-center">
              <span className="text-xs font-mono text-muted-foreground">
                by <a target="_blank" href="https://dewanmukto.github.io/">Dewan Mukto</a>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Keep for backwards compatibility but no longer used
export function MobileNav() {
  return null
}
