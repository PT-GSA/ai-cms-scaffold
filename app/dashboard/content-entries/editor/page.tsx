'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RichTextEditor } from '@/components/rich-text-editor'
import { AIContentGenerator } from '@/components/ai-content-generator'
import { DashboardLayout } from '@/components/dashboard-layout'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { Save, Eye, ArrowLeft } from 'lucide-react'

interface GeneratedContent {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  suggestedImages: string[]
}

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
  content_type: {
    id: string
    name: string
    display_name: string
    icon: string
  }
  fields: Record<string, unknown>
}

function ContentEntryEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [loading, setLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [entryId, setEntryId] = useState<string | null>(null)

  const loadEntryData = useCallback(async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/content-entries/${id}`)
      const result = await response.json()

      if (result.success) {
        const entry: ContentEntry = result.data
        setTitle(entry.title)
        setSlug(entry.slug)
        setStatus(entry.status)
        
        // Load fields content
        if (entry.fields) {
          setContent(typeof entry.fields.content === 'string' ? entry.fields.content : '')
          setExcerpt(typeof entry.fields.excerpt === 'string' ? entry.fields.excerpt : '')
        }
      } else {
        toast({
          title: 'Error',
          description: 'Gagal memuat data content entry',
          variant: 'destructive'
        })
        router.push('/dashboard/content-entries')
      }
    } catch (error) {
      console.error('Error loading entry:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data content entry',
        variant: 'destructive'
      })
      router.push('/dashboard/content-entries')
    } finally {
      setLoading(false)
    }
  }, [toast, router, setTitle, setSlug, setStatus, setContent, setExcerpt, setLoading])

  // Load entry data if editing
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setIsEditMode(true)
      setEntryId(id)
      loadEntryData(id)
    }
  }, [searchParams, loadEntryData])

  const handleSave = async () => {
    try {
      setLoading(true)
      
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        status,
        field_values: {
          content,
          excerpt
        }
      }

      const url = isEditMode ? `/api/content-entries/${entryId}` : '/api/content-entries'
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: isEditMode ? 'Content entry berhasil diperbarui' : 'Content entry berhasil disimpan'
        })
        router.push('/dashboard/content-entries')
      } else {
        throw new Error(result.error || 'Failed to save entry')
      }
    } catch (error) {
      console.error('Error saving entry:', error)
      toast({
        title: 'Error',
        description: 'Gagal menyimpan content entry',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    if (slug) {
      window.open(`/preview/${slug}`, '_blank')
    } else {
      toast({
        title: 'Warning',
        description: 'Masukkan slug terlebih dahulu untuk preview',
        variant: 'destructive'
      })
    }
  }

  const handleAIContentGenerated = (generatedContent: GeneratedContent) => {
    setTitle(generatedContent.title)
    setContent(generatedContent.content)
    setExcerpt(generatedContent.excerpt)
    // You can also set meta title and description if you have those fields
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? 'Edit Content' : 'Editor Content'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isEditMode ? 'Edit content entry dengan Rich Text Editor' : 'Buat dan edit content entry dengan Rich Text Editor'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <AIContentGenerator onContentGenerated={handleAIContentGenerated} />
            <Button
              variant="outline"
              onClick={handlePreview}
              disabled={loading}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>
                  Isi informasi dasar untuk content entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul</Label>
                  <Input
                    id="title"
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan judul content..."
                    className="text-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={slug || ''}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="url-friendly-slug"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Input
                    id="excerpt"
                    value={excerpt || ''}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Ringkasan singkat content..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rich Text Editor */}
            <Card>
              <CardHeader>
                <CardTitle>Content</CardTitle>
                <CardDescription>
                  Gunakan Rich Text Editor untuk membuat content yang menarik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  content={content || ''}
                  onChange={setContent}
                  placeholder="Mulai menulis content Anda di sini..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Status Publikasi</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="draft"
                        checked={status === 'draft'}
                        onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Draft</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="status"
                        value="published"
                        checked={status === 'published'}
                        onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                        className="text-blue-600"
                      />
                      <span className="text-sm">Published</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO */}
            <Card>
              <CardHeader>
                <CardTitle>SEO</CardTitle>
                <CardDescription>
                  Optimasi untuk mesin pencari
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meta-title">Meta Title</Label>
                  <Input
                    id="meta-title"
                    placeholder="Judul untuk SEO..."
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground">60 karakter tersisa</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="meta-description">Meta Description</Label>
                  <textarea
                    id="meta-description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none"
                    rows={3}
                    placeholder="Deskripsi untuk SEO..."
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground">160 karakter tersisa</p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handlePreview}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button
                  className="w-full"
                  onClick={handleSave}
                  disabled={loading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function ContentEntryEditor() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Memuat editor...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ContentEntryEditorContent />
    </Suspense>
  )
}
