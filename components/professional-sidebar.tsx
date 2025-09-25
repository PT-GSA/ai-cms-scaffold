"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Database,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Zap,
  History,
  Users,
  FileText,
  Shield,
  Globe,
  Code,
  Activity,
  Layers,
  ChevronDown,
  ChevronRight,
} from "lucide-react"

interface ProfessionalSidebarProps {
  children: React.ReactNode
}

export function ProfessionalSidebar({ children }: ProfessionalSidebarProps) {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["schema"])
  const pathname = usePathname()

  const handleSignOut = async () => {
    await signOut()
  }

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  const navigationSections = [
    {
      id: "overview",
      title: "Overview",
      items: [
        { icon: BarChart3, label: "Dashboard", href: "/dashboard", badge: null },
        { icon: Activity, label: "Analytics", href: "/dashboard/analytics", badge: "New" },
      ],
    },
    {
      id: "schema",
      title: "Schema Management",
      items: [
        { icon: Zap, label: "Schema Generator", href: "/dashboard", badge: null },
        { icon: History, label: "Schema History", href: "/dashboard/history", badge: null },
        { icon: Database, label: "Database Explorer", href: "/dashboard/explorer", badge: null },
        { icon: Code, label: "API Endpoints", href: "/dashboard/api", badge: null },
      ],
    },
    {
      id: "content",
      title: "Content Management",
      items: [
        { icon: FileText, label: "Content Types", href: "/dashboard/content-types", badge: null },
        { icon: Layers, label: "Collections", href: "/dashboard/collections", badge: null },
        { icon: Globe, label: "Published Content", href: "/dashboard/published", badge: null },
      ],
    },
    {
      id: "admin",
      title: "Administration",
      items: [
        { icon: Users, label: "User Management", href: "/dashboard/users", badge: null },
        { icon: Shield, label: "Permissions", href: "/dashboard/permissions", badge: null },
        { icon: Settings, label: "Settings", href: "/dashboard/settings", badge: null },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        className="fixed inset-y-0 left-0 z-50 w-72 bg-sidebar-background border-r border-sidebar-border lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-sidebar-primary p-2">
                <Database className="h-6 w-6 text-sidebar-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">AI CMS</h1>
                <p className="text-xs text-muted-foreground">Professional</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {navigationSections.map((section) => (
              <div key={section.id} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex w-full items-center justify-between px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-sidebar-foreground transition-colors"
                >
                  <span>{section.title}</span>
                  {expandedSections.includes(section.id) ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>

                {expandedSections.includes(section.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 ml-2"
                  >
                    {section.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`sidebar-nav-item ${pathname === item.href ? "active" : ""}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          <Separator />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-sidebar-accent">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {user?.email?.split("@")[0] || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="h-8 w-8 p-0">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-muted-foreground">Welcome back, {user?.email?.split("@")[0]}</div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
