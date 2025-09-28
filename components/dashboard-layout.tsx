'use client'

import React, { useState } from 'react'
import { usePathname } from 'next/navigation'
// import { motion } from 'framer-motion'
import { useAuth } from "@/lib/auth-context"
// import { Button } from "@/components/ui/button"
// import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Menu, 
  X,
  FileText,
  Settings,
  Users,
  Database,
  LogOut,
  History, 
  Zap, 
  BarChart3,
  Layers,
  User,
  Search,
  Bell,
  Image,
  Play,
  Link
} from "lucide-react"
import { ThemeToggleCompact } from "@/components/theme-toggle"

interface DashboardLayoutProps {
  children: React.ReactNode
}

/**
 * Layout komponen untuk dashboard dengan sidebar profesional
 * Menyediakan navigasi dan struktur layout untuk halaman dashboard
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  /**
   * Handler untuk sign out user
   */
  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-purple-600 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="bg-white dark:bg-black flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-purple-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">AI CMS</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="bg-white dark:bg-black flex-1 px-4 py-6 space-y-2">
            <SidebarItem
              icon={<Zap className="h-5 w-5" />}
              label="Schema Generator"
              href="/dashboard"
              isActive={pathname === "/dashboard"}
            />
            <SidebarItem
              icon={<Layers className="h-5 w-5" />}
              label="Content Types"
              href="/dashboard/content-types"
              isActive={pathname === "/dashboard/content-types"}
            />
            <SidebarItem
              icon={<FileText className="h-5 w-5" />}
              label="Content Entries"
              href="/dashboard/content-entries"
              isActive={pathname === "/dashboard/content-entries"}
            />
            <SidebarItem
              icon={<Link className="h-5 w-5" />}
              label="Relations"
              href="/dashboard/relations"
              isActive={pathname === "/dashboard/relations" || pathname.startsWith("/dashboard/relations/")}
              badge="New"
            />
            <SidebarItem
              // eslint-disable-next-line jsx-a11y/alt-text
              icon={<Image className="h-5 w-5" />}
              label="Media Gallery"
              href="/dashboard/media"
              isActive={pathname === "/dashboard/media"}
            />
            <SidebarItem
              icon={<History className="h-5 w-5" />}
              label="Schema History"
              href="/dashboard/history"
              isActive={pathname === "/dashboard/history"}
            />
            <SidebarItem
              icon={<FileText className="h-5 w-5" />}
              label="Documentation"
              href="/dashboard/docs"
              isActive={pathname === "/dashboard/docs"}
            />
            <SidebarItem
              icon={<Play className="h-5 w-5" />}
              label="API Playground"
              href="/dashboard/playground"
              isActive={pathname === "/dashboard/playground"}
            />
            <SidebarItem
              icon={<BarChart3 className="h-5 w-5" />}
              label="Analytics"
              href="/dashboard/analytics"
              isActive={pathname === "/dashboard/analytics"}
            />
            <SidebarItem
              icon={<Users className="h-5 w-5" />}
              label="Team"
              href="/dashboard/team"
              isActive={pathname === "/dashboard/team"}
            />
            <SidebarItem
              icon={<Settings className="h-5 w-5" />}
              label="Settings"
              href="/dashboard/settings"
              isActive={pathname === "/dashboard/settings"}
            />
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200 dark:border-purple-600">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Premium Plan
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-red-400 transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-black border-b border-gray-200 dark:border-purple-600 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white dark:bg-black border border-gray-300 dark:border-purple-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
            
            <ThemeToggleCompact />
            
            <button className="relative text-gray-400 hover:text-gray-600 dark:hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  href: string
  isActive?: boolean
  badge?: string
}

/**
 * Komponen item sidebar dengan styling profesional
 */
function SidebarItem({ icon, label, href, isActive, badge }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={`group flex w-full items-center justify-between rounded-lg px-4 py-3 text-left transition-all duration-200 ${
        isActive 
          ? "bg-blue-600 text-white shadow-lg" 
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
      }`}
    >
      <div className="flex items-center space-x-3">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge && (
        <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
          {badge}
        </span>
      )}
    </a>
  )
}
