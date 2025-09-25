"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProfessionalSidebar } from "@/components/professional-sidebar"
import { DashboardOverview } from "@/components/dashboard-overview"
import { SchemaGenerator } from "@/components/schema-generator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
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
    <ProfessionalSidebar>
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="generator">Schema Generator</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="generator" className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Schema Generator</h1>
              <p className="text-muted-foreground">Generate database schemas using natural language descriptions</p>
            </div>
            <SchemaGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </ProfessionalSidebar>
  )
}
