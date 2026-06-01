export interface CustomTool {
  id: string
  name: string
  href: string
}

export const CUSTOM_TOOLS_STORAGE_KEY = 'brush_custom_tools'

export function loadCustomTools(): CustomTool[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(CUSTOM_TOOLS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    // Ignore errors
  }
  return []
}

export function saveCustomTools(tools: CustomTool[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CUSTOM_TOOLS_STORAGE_KEY, JSON.stringify(tools))
}
