"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { ApiPlayground } from '@/components/api-playground'
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Halaman API Playground untuk menguji API endpoints secara interaktif
 * dengan layout sidebar dan authentication check
 */
export default function PlaygroundPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6 md:p-8">
        
        {/* API Playground */}
        <div className="w-full">
          <ApiPlayground />
        </div>
      </div>
    </DashboardLayout>
  )
}