'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardLayout } from '@/components/dashboard-layout'
import { ArrowLeft, Calendar, User, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ContentEntry {
  id: string
  content_type_id: string
  title: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  created_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  content_type?: {
    id: string
    name: string
    display_name: string
    icon: string
  }
  content_types?: {
    id: string
    name: string
    display_name: string
    icon: string
  }
  fields: Record<string, unknown>
}

export default function PreviewPage() {
  const params = useParams()
  const router = useRouter()
  const [entry, setEntry] = useState<ContentEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/content-entries/slug/${params.slug}`)
        const result = await response.json()

        if (result.success) {
          setEntry(result.data)
        } else {
          setError(result.error || 'Content tidak ditemukan')
        }
      } catch {
        setError('Gagal memuat content')
      } finally {
        setLoading(false)
      }
    }

    if (params.slug) {
      fetchEntry()
    }
  }, [params.slug])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Memuat content...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !entry) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Error</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {error || 'Content tidak ditemukan'}
              </p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {entry.title}
                </CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <FileText className="mr-1 h-4 w-4" />
                    {entry.content_types?.display_name || entry.content_type?.display_name || 'Unknown Type'}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {formatDate(entry.created_at)}
                  </div>
                  {entry.published_at && (
                    <div className="flex items-center">
                      <User className="mr-1 h-4 w-4" />
                      Published: {formatDate(entry.published_at)}
                    </div>
                  )}
                </div>
              </div>
              <Badge variant={entry.status === 'published' ? 'default' : 'secondary'}>
                {entry.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              {/* Render fields content */}
              {Object.entries(entry.fields).map(([key, value]) => (
                <div key={key} className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </h3>
                  <div className="text-gray-700 dark:text-gray-300">
                    {typeof value === 'string' ? (
                      <div dangerouslySetInnerHTML={{ __html: value }} />
                    ) : (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
