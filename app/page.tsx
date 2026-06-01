import Link from 'next/link'
import { Navbar, MobileNav } from '@/components/navbar'

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
              </p>

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
          </div>
        </section>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 py-8">
          <div className="neo-border p-6 bg-muted">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="bg-primary px-3 py-1 neo-border font-black">BRUSH</span>
                <span className="text-sm text-muted-foreground font-medium">
                  by DMI, creator of <a href="https://braxapp.github.io">BRAX</a>
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                Data from <a href="https://usis-cdn.eniamza.com/connect.json">Tashfeen Azmaine's</a> CDN.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
