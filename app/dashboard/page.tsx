"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SchemaGenerator } from "@/components/schema-generator"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

/**
 * Dashboard page component yang menampilkan halaman utama dashboard
 * dengan layout sidebar dan konten utama SchemaGenerator
 */
export default function DashboardPage() {
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
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Schema Generator
          </h1>
          <p className="text-gray-400">
            Generate database schemas using AI-powered natural language processing
          </p>
        </div>
        
        {/* Main Content */}
        <div className="w-full">
          <SchemaGenerator />
        </div>
      </div>
    </DashboardLayout>
  )
}
