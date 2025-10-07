"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Database, Loader2, RefreshCw } from 'lucide-react'

interface DatabaseStatus {
  database: {
    initialized: boolean
    tables: {
      content_types: boolean
      content_type_fields: boolean
      content_entries: boolean
    }
  }
  content_types: {
    exists: boolean
    count: number
    fields_count: number
    data: Array<{
      id: number
      name: string
      display_name: string
      description: string
      icon: string
      is_active: boolean
      created_at: string
    }>
  }
  overall: {
    ready: boolean
    needs_setup: boolean
  }
}

interface StatusResponse {
  success: boolean
  message: string
  status: DatabaseStatus
}

interface InitResponse {
  success: boolean
  message: string
  data: {
    content_types: Array<any>
    total_content_types: number
  }
}

/**
 * Komponen untuk setup dan monitoring database
 */
export function DatabaseSetup() {
  const [status, setStatus] = useState<DatabaseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Fungsi untuk memeriksa status database
  const checkStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/setup/status')
      const data: StatusResponse = await response.json()
      
      if (data.success) {
        setStatus(data.status)
      } else {
        setError(data.message || 'Gagal memeriksa status database')
      }
    } catch (err) {
      setError('Error saat memeriksa status database')
      console.error('Error checking status:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fungsi untuk menginisialisasi database
  const initializeDatabase = async () => {
    try {
      setInitializing(true)
      setError(null)
      setSuccess(null)
      
      const response = await fetch('/api/setup/init-database', {
        method: 'POST'
      })
      const data: InitResponse = await response.json()
      
      if (data.success) {
        setSuccess(`Database berhasil diinisialisasi! ${data.data.total_content_types} content types dibuat.`)
        // Refresh status setelah inisialisasi
        await checkStatus()
      } else {
        setError(data.message || 'Gagal menginisialisasi database')
      }
    } catch (err) {
      setError('Error saat menginisialisasi database')
      console.error('Error initializing database:', err)
    } finally {
      setInitializing(false)
    }
  }

  // Cek status saat komponen dimount
  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memeriksa status database...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Setup</span>
          </CardTitle>
          <CardDescription>
            Kelola inisialisasi database dan content types untuk CMS
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Overall */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Status Database:</span>
              {status?.overall.ready ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Needs Setup
                </Badge>
              )}
            </div>
            <Button 
              onClick={checkStatus} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Alert Messages */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-600 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Database Tables Status */}
          {status && (
            <div className="space-y-3">
              <h4 className="font-medium">Database Tables:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">content_types</span>
                  {status.database.tables.content_types ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">content_type_fields</span>
                  {status.database.tables.content_type_fields ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="text-sm font-medium">content_entries</span>
                  {status.database.tables.content_entries ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Content Types Status */}
          {status && (
            <div className="space-y-3">
              <h4 className="font-medium">Content Types:</h4>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Total Content Types: {status.content_types.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    Total Fields: {status.content_types.fields_count}
                  </div>
                </div>
                {status.content_types.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </div>

              {/* List Content Types */}
              {status.content_types.data && status.content_types.data.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium">Available Content Types:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {status.content_types.data.map((ct) => (
                      <div key={ct.id} className="p-2 border rounded text-sm">
                        <div className="font-medium">{ct.display_name}</div>
                        <div className="text-gray-600">{ct.name}</div>
                        <div className="text-xs text-gray-500">{ct.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          {status && status.overall.needs_setup && (
            <div className="pt-4 border-t">
              <Button 
                onClick={initializeDatabase} 
                disabled={initializing}
                className="w-full"
              >
                {initializing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Menginisialisasi Database...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Inisialisasi Database
                  </>
                )}
              </Button>
              <p className="text-xs text-gray-600 mt-2">
                Ini akan membuat tabel database dan sample content types (article, page, product)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
