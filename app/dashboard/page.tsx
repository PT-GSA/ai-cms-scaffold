"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { SchemaGenerator } from "@/components/schema-generator"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("[v0] Dashboard - user:", !!user, "loading:", loading)

    if (!loading && !user) {
      console.log("[v0] Dashboard - redirecting to login")
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    console.log("[v0] Dashboard - showing loading state")
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log("[v0] Dashboard - no user, returning null")
    return null
  }

  console.log("[v0] Dashboard - rendering dashboard for user:", user.email)
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Schema Generator</h1>
          <p className="text-gray-400">Generate database schemas using natural language descriptions</p>
        </div>
        <SchemaGenerator />
      </div>
    </DashboardLayout>
  )
}
