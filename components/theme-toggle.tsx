'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'light' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
        }`}
        title="Light mode"
      >
        <Sun className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
        }`}
        title="Dark mode"
      >
        <Moon className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'system' 
            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' 
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700'
        }`}
        title="System mode"
      >
        <Monitor className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ThemeToggleCompact() {
  const [mounted, setMounted] = useState(false)
  
  // Pastikan komponen sudah mounted di client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Jika belum mounted, return fallback
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        title="Theme toggle (loading...)"
        disabled
      >
        <Sun className="w-5 h-5 text-gray-600" />
      </button>
    )
  }

  return <ThemeToggleCompactClient />
}

function ThemeToggleCompactClient() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const Icon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Current: ${theme} (${resolvedTheme})`}
    >
      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
    </button>
  )
}
