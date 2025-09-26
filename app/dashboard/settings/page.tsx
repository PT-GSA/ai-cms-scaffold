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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  X,
  Trash2,
  Copy,
  CheckCircle
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

  // API Keys state
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyType, setNewKeyType] = useState('production')
  const [generatedKey, setGeneratedKey] = useState<any>(null)
  const [hiddenKeys, setHiddenKeys] = useState<Set<string>>(new Set())
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  /**
   * Load user settings from database
   */
  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user-settings?type=all')
      const result = await response.json()

      if (result.success && result.data) {
        const settings = result.data
        
        // Update settings data with loaded values
        if (settings.appearance) {
          setSettingsData(prev => ({
            ...prev,
            theme: settings.appearance.theme || 'dark',
            language: settings.appearance.language || 'id'
          }))
        }
        
        if (settings.notifications) {
          setSettingsData(prev => ({
            ...prev,
            notifications: {
              ...prev.notifications,
              ...settings.notifications
            }
          }))
        }
        
        if (settings.security) {
          setSettingsData(prev => ({
            ...prev,
            security: {
              ...prev.security,
              ...settings.security
            }
          }))
        }
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
    }
  }

  /**
   * Load API keys from database
   */
  const loadApiKeys = async () => {
    try {
      console.log('Loading API keys...')
        const response = await fetch('/api/api-keys')
        
        console.log('API keys response:', response)
        
        if (response.ok) {
          const result = await response.json()
          console.log('API keys loaded:', result.data)
          setApiKeys(result.data || [])
        } else {
          const errorResult = await response.json()
          console.error('Failed to load API keys:', errorResult.error)
        }
      } catch (error) {
        console.error('Error loading API keys:', error)
    }
  }

  /**
   * Generate new API key
   */
  const handleGenerateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Nama API key harus diisi.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key_name: newKeyName,
          key_type: newKeyType
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedKey(result.data)
        setNewKeyName('')
        setNewKeyType('production')
        setShowGenerateDialog(false) // Tutup dialog
        loadApiKeys() // Reload API keys list
        toast({
          title: "API Key Generated",
          description: "API key berhasil dibuat.",
        })
      } else {
        throw new Error(result.error || 'Failed to generate API key')
      }
    } catch (error) {
      console.error('Error generating API key:', error)
      toast({
        title: "Error",
        description: "Gagal membuat API key.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Delete API key
   */
  const handleDeleteApiKey = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        loadApiKeys() // Reload API keys list
        toast({
          title: "API Key Deleted",
          description: "API key berhasil dihapus.",
        })
      } else {
        throw new Error(result.error || 'Failed to delete API key')
      }
    } catch (error) {
      console.error('Error deleting API key:', error)
      toast({
        title: "Error",
        description: "Gagal menghapus API key.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Toggle hide/unhide API key
   */
  const toggleKeyVisibility = (keyId: string) => {
    setHiddenKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  /**
   * Copy API key to clipboard
   */
  const copyApiKey = async (keyValue: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(keyValue)
      setCopiedKey(keyId)
      toast({
        title: "Copied",
        description: "API key berhasil disalin ke clipboard.",
      })
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedKey(null)
      }, 2000)
    } catch (error) {
      console.error('Error copying API key:', error)
      toast({
        title: "Error",
        description: "Gagal menyalin API key.",
        variant: "destructive"
      })
    }
  }

  /**
   * Get masked API key
   */
  const getMaskedKey = (keyValue: string) => {
    if (keyValue.length <= 8) return keyValue
    return keyValue.substring(0, 8) + '****-****-****-****'
  }

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
      
      // Load user settings and API keys
      loadUserSettings()
      loadApiKeys()
    }
  }, [user, loading, router])

  /**
   * Handle save profile changes
   */
  const handleSaveProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: profileData.full_name,
          email: profileData.email
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Profile Updated",
          description: "Profil Anda berhasil diperbarui.",
        })
      } else {
        throw new Error(result.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
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
      const response = await fetch('/api/user-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: profileData.current_password,
          new_password: profileData.new_password
        })
      })

      const result = await response.json()

      if (result.success) {
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
      } else {
        throw new Error(result.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
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
  const handleSaveSettings = async (settingsType: string, settingsData: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings_type: settingsType,
          settings_data: settingsData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Settings Saved",
          description: "Pengaturan berhasil disimpan.",
        })
      } else {
        throw new Error(result.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
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
                  onClick={() => handleSaveSettings('security', settingsData.security)}
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
                  onClick={() => handleSaveSettings('appearance', { theme: settingsData.theme, language: settingsData.language })}
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
                  onClick={() => handleSaveSettings('notifications', settingsData.notifications)}
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

                {/* Generated Key Display */}
                {generatedKey && (
                  <div className="p-4 bg-green-900/20 border border-green-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-green-400 font-medium">New API Key Generated!</h4>
                      <button
                        onClick={() => setGeneratedKey(null)}
                        className="text-gray-400 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-300">Name: {generatedKey.key_name}</p>
                        <p className="text-sm text-gray-300">Type: {generatedKey.key_type}</p>
                      </div>
                      <div className="p-3 bg-black rounded border">
                        <div className="flex items-center justify-between">
                          <p className="text-green-400 font-mono text-sm break-all flex-1">
                            {generatedKey.key_value}
                          </p>
                          <button
                            onClick={() => copyApiKey(generatedKey.key_value, 'generated')}
                            className="ml-2 text-gray-400 hover:text-white transition-colors"
                            title="Copy key"
                          >
                            {copiedKey === 'generated' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                    Simpan API key ini dengan aman. Anda tidak akan bisa melihatnya lagi setelah menutup dialog ini.
                  </p>
                    </div>
                  </div>
                )}

                {/* API Keys List */}
                <div className="space-y-4">
                  {apiKeys.length === 0 ? (
                    <div className="text-center py-8">
                      <Key className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-semibold text-white">Tidak ada API keys</h3>
                      <p className="mt-1 text-sm text-gray-400">
                        Mulai dengan membuat API key pertama Anda
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        Debug: apiKeys.length = {apiKeys.length}
                      </p>
                    </div>
                  ) : (
                    apiKeys.map((key) => {
                      const isHidden = hiddenKeys.has(key.id)
                      const isCopied = copiedKey === key.id
                      
                      return (
                        <div key={key.id} className="p-4 bg-black rounded-lg border border-gray-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1 min-w-0">
                              <Key className={`h-5 w-5 ${
                                key.key_type === 'production' ? 'text-yellow-400' : 
                                key.key_type === 'development' ? 'text-blue-400' : 'text-green-400'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium">{key.key_name}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                  <p className="text-sm text-gray-400 font-mono">
                                    {isHidden ? getMaskedKey(key.key_value) : key.key_value}
                                  </p>
                                </div>
                                <p className="text-xs text-white mt-1">
                                  Created: {new Date(key.created_at).toLocaleDateString('id-ID')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant={key.is_active ? "default" : "secondary"}>
                                {key.is_active ? "Active" : "Inactive"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => toggleKeyVisibility(key.id)}
                                title={isHidden ? "Show key" : "Hide key"}
                              >
                                {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => copyApiKey(key.key_value, key.id)}
                                title="Copy key"
                              >
                                {isCopied ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                onClick={() => handleDeleteApiKey(key.id)}
                                disabled={isLoading}
                                title="Delete key"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button 
                    onClick={() => setShowGenerateDialog(true)}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                  >
                    <Key className="mr-2 h-4 w-4" />
                    Generate New Key
                  </Button>
                  <Button 
                    onClick={loadApiKeys}
                    disabled={isLoading}
                    variant="outline"
                    className="border-purple-600 text-purple-400 hover:bg-purple-600 hover:text-white"
                  >
                    Reload
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generate API Key Dialog */}
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Generate New API Key</DialogTitle>
              <DialogDescription>
                Buat API key baru untuk integrasi eksternal
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key_name" className="text-gray-300">Key Name</Label>
                <Input
                  id="key_name"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="bg-black border-purple-600 text-white"
                  placeholder="Enter key name (e.g., My App Integration)"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key_type" className="text-gray-300">Key Type</Label>
                <select
                  id="key_type"
                  value={newKeyType}
                  onChange={(e) => setNewKeyType(e.target.value)}
                  className="w-full p-2 bg-black border border-purple-600 text-white rounded-md"
                >
                  <option value="production">Production</option>
                  <option value="development">Development</option>
                  <option value="test">Test</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowGenerateDialog(false)
                  setNewKeyName('')
                  setNewKeyType('production')
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateApiKey}
                disabled={isLoading || !newKeyName.trim()}
                className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
              >
                {isLoading ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}