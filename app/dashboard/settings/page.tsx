"use client"

import React, { useState, useEffect } from 'react'
import { DashboardLayout } from "@/components/dashboard-layout"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { 
  User, 
  Lock, 
  Palette, 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Database,
  Key,
  Globe,
  Save,
  Eye,
  EyeOff,
  Check,
  X
} from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface SettingsData {
  profile: UserProfile | null
  theme: 'dark' | 'light'
  language: string
  notifications: {
    email: boolean
    push: boolean
    webhooks: boolean
  }
  security: {
    twoFactor: boolean
    sessionTimeout: number
  }
}

/**
 * Settings page component untuk mengelola pengaturan dashboard
 * Menyediakan berbagai tab untuk konfigurasi sistem
 */
export default function SettingsPage() {
  const { user, loading } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  
  // Form states
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  })
  
  const [settingsData, setSettingsData] = useState<SettingsData>({
    profile: null,
    theme: 'dark',
    language: 'id',
    notifications: {
      email: true,
      push: false,
      webhooks: true
    },
    security: {
      twoFactor: false,
      sessionTimeout: 30
    }
  })

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
    
    if (user) {
      setProfileData(prev => ({
        ...prev,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || ''
      }))
    }
  }, [user, loading, router])

  /**
   * Handle save profile changes
   */
  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Profile Updated",
        description: "Profil Anda berhasil diperbarui.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui profil.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle change password
   */
  const handleChangePassword = async () => {
    if (profileData.new_password !== profileData.confirm_password) {
      toast({
        title: "Error",
        description: "Password baru tidak cocok.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setProfileData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }))
      
      toast({
        title: "Password Changed",
        description: "Password berhasil diubah.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah password.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle save settings
   */
  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "Settings Saved",
        description: "Pengaturan berhasil disimpan.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

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
            Settings
          </h1>
          <p className="text-gray-400">
            Kelola pengaturan akun dan preferensi dashboard Anda
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gray-900 border border-purple-600">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                    <p className="text-gray-400">Update your account profile information</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      className="bg-black border-purple-600 text-white"
                      placeholder="Enter your full name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-black border-purple-600 text-white"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </Card>

            {/* Change Password Section */}
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Change Password</h3>
                  <p className="text-gray-400">Update your password to keep your account secure</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password" className="text-gray-300">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPassword ? "text" : "password"}
                        value={profileData.current_password}
                        onChange={(e) => setProfileData(prev => ({ ...prev, current_password: e.target.value }))}
                        className="bg-black border-purple-600 text-white pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new_password" className="text-gray-300">New Password</Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? "text" : "password"}
                          value={profileData.new_password}
                          onChange={(e) => setProfileData(prev => ({ ...prev, new_password: e.target.value }))}
                          className="bg-black border-purple-600 text-white pr-10"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm_password" className="text-gray-300">Confirm Password</Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        value={profileData.confirm_password}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        className="bg-black border-purple-600 text-white"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword}
                  disabled={isLoading || !profileData.current_password || !profileData.new_password}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                >
                  <Lock className="mr-2 h-4 w-4" />
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Security Settings</h3>
                  <p className="text-gray-400">Manage your account security preferences</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Shield className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-gray-400">Add an extra layer of security</p>
                      </div>
                    </div>
                    <Badge variant={settingsData.security.twoFactor ? "default" : "secondary"}>
                      {settingsData.security.twoFactor ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Session Timeout</p>
                        <p className="text-sm text-gray-400">Auto logout after inactivity</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {settingsData.security.sessionTimeout} minutes
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Security Settings
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Appearance Settings</h3>
                  <p className="text-gray-400">Customize the look and feel of your dashboard</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-purple-400" />
                      <div>
                        <p className="text-white font-medium">Theme</p>
                        <p className="text-sm text-gray-400">Choose your preferred theme</p>
                      </div>
                    </div>
                    <Badge variant="default">
                      Dark Mode
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-orange-400" />
                      <div>
                        <p className="text-white font-medium">Language</p>
                        <p className="text-sm text-gray-400">Select your preferred language</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Bahasa Indonesia
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Appearance
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
                  <p className="text-gray-400">Control how you receive notifications</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-400">Receive updates via email</p>
                      </div>
                    </div>
                    <Badge variant={settingsData.notifications.email ? "default" : "secondary"}>
                      {settingsData.notifications.email ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Push Notifications</p>
                        <p className="text-sm text-gray-400">Browser push notifications</p>
                      </div>
                    </div>
                    <Badge variant={settingsData.notifications.push ? "default" : "secondary"}>
                      {settingsData.notifications.push ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-yellow-400" />
                      <div>
                        <p className="text-white font-medium">Webhook Alerts</p>
                        <p className="text-sm text-gray-400">System webhook notifications</p>
                      </div>
                    </div>
                    <Badge variant={settingsData.notifications.webhooks ? "default" : "secondary"}>
                      {settingsData.notifications.webhooks ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Notifications
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">System Information</h3>
                  <p className="text-gray-400">View system status and configuration</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <Database className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-white font-medium">Database Status</p>
                        <p className="text-sm text-green-400">Connected</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                      <SettingsIcon className="h-5 w-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">API Status</p>
                        <p className="text-sm text-green-400">Operational</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="p-6 bg-gray-900 border-purple-600">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">API Keys Management</h3>
                  <p className="text-gray-400">Manage your API keys for external integrations</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Key className="h-5 w-5 text-yellow-400" />
                        <div>
                          <p className="text-white font-medium">Production API Key</p>
                          <p className="text-sm text-gray-400">sk-prod-****-****-****-****</p>
                        </div>
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>

                  <div className="p-4 bg-black rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Key className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-white font-medium">Development API Key</p>
                          <p className="text-sm text-gray-400">sk-dev-****-****-****-****</p>
                        </div>
                      </div>
                      <Badge variant="secondary">Inactive</Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                >
                  <Key className="mr-2 h-4 w-4" />
                  Generate New Key
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}