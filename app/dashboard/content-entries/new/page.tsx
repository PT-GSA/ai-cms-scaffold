'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, FileText, Calendar, User, BookOpen } from 'lucide-react'

interface ContentType {
  id: string
  name: string
  display_name: string
  icon: string
  fields?: ContentTypeField[] // Make fields optional
  content_type_fields?: ContentTypeField[] // Alternative field name from API
}

interface ContentTypeField {
  id: string
  field_name: string
  field_type: string
  display_name: string // Changed from field_label to display_name
  is_required: boolean
  field_options: Record<string, unknown>
}

interface FormField {
  field_name: string
  field_type: string
  value: unknown
}

/**
 * Komponen utama untuk membuat content entry baru
 */
function NewContentEntryPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [saving, setSaving] = useState(false)
  const [templateData, setTemplateData] = useState<Record<string, unknown> | null>(null)
  
  // Form data
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft')
  const [fields, setFields] = useState<FormField[]>([])

  /**
   * Load template data dari URL parameter
   */
  const loadTemplateData = useCallback(() => {
    const templateParam = searchParams.get('template')
    if (templateParam) {
      try {
        const decoded = decodeURIComponent(templateParam)
        const template = JSON.parse(decoded)
        setTemplateData(template)
        return template
      } catch (error) {
        console.error('Error parsing template data:', error)
        toast({
          title: 'Error',
          description: 'Template data tidak valid',
          variant: 'destructive'
        })
      }
    }
    return null
  }, [searchParams, toast])

  /**
   * Fetch content types dari API
   */
  const fetchContentTypes = useCallback(async () => {
    try {
      // Tambahkan parameter include_fields=true untuk mendapatkan fields
      const response = await fetch('/api/content-types?include_fields=true')
      const result = await response.json()

      if (result.success) {
        setContentTypes(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch content types')
      }
    } catch (error) {
      console.error('Error fetching content types:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat content types',
        variant: 'destructive'
      })
    }
  }, [toast])

  /**
   * Generate slug dari title
   */
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  /**
   * Handle perubahan title dan auto-generate slug
   */
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  /**
   * Handle perubahan content type
   */
  const handleContentTypeChange = (contentTypeId: string) => {
    const contentType = contentTypes.find(ct => ct.id === contentTypeId)
    if (contentType) {
      setSelectedContentType(contentType)
      // Get fields from either fields or content_type_fields property
      const fields = contentType.fields || contentType.content_type_fields || []
      
      // Initialize fields dengan nilai default
      const initialFields: FormField[] = fields.map(field => ({
        field_name: field.field_name,
        field_type: field.field_type,
        value: getDefaultValue(field.field_type)
      }))
      setFields(initialFields)
    }
  }

  /**
   * Get default value berdasarkan field type
   */
  const getDefaultValue = (fieldType: string): string | number | boolean | Date | null => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
        return ''
      case 'number':
        return 0
      case 'boolean':
        return false
      case 'date':
        return null
      default:
        return ''
    }
  }

  /**
   * Handle perubahan field value
   */
  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFields(prev => prev.map(field =>
      field.field_name === fieldName
        ? { ...field, value }
        : field
    ))
  }

  /**
   * Render field berdasarkan type
   */
  const renderField = (field: ContentTypeField) => {
    const formField = fields.find(f => f.field_name === field.field_name)
    const value = formField?.value

    if (field.field_type === 'text' || field.field_type === 'email' || field.field_type === 'url') {
      return (
        <Input
          type={field.field_type}
          value={String(value || '')}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Masukkan ${field.display_name.toLowerCase()}`}
        />
      )
    } else if (field.field_type === 'textarea') {
      return (
        <Textarea
          value={String(value || '')}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Masukkan ${field.display_name.toLowerCase()}`}
          rows={4}
        />
      )
    } else if (field.field_type === 'number') {
      return (
        <Input
          type="number"
          value={Number(value) || 0}
          onChange={(e) => handleFieldChange(field.field_name, parseFloat(e.target.value) || 0)}
          placeholder={`Masukkan ${field.display_name.toLowerCase()}`}
        />
      )
    } else if (field.field_type === 'boolean') {
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(field.field_name, e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-600">Ya</span>
        </div>
      )
    } else if (field.field_type === 'date') {
      return (
        <Input
          type="date"
          value={value instanceof Date ? value.toISOString().split('T')[0] : value ? new Date(String(value)).toISOString().split('T')[0] : ''}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value ? new Date(e.target.value) : null)}
        />
      )
    } else {
      return (
        <Input
          value={String(value || '')}
          onChange={(e) => handleFieldChange(field.field_name, e.target.value)}
          placeholder={`Masukkan ${field.display_name.toLowerCase()}`}
        />
      )
    }
  }

  /**
   * Submit form untuk membuat entry baru
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedContentType) {
      toast({
        title: 'Error',
        description: 'Pilih content type terlebih dahulu',
        variant: 'destructive'
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Title harus diisi',
        variant: 'destructive'
      })
      return
    }

    try {
      setSaving(true)
      
      const payload = {
        content_type_id: parseInt(selectedContentType.id),
        title: title.trim(),
        slug: slug.trim() || generateSlug(title),
        status,
        fields
      }

      const response = await fetch('/api/content-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Content entry berhasil dibuat'
        })
        router.push('/dashboard/content-entries')
      } else {
        throw new Error(result.error || 'Failed to create entry')
      }
    } catch (error) {
      console.error('Error creating entry:', error)
      toast({
        title: 'Error',
        description: 'Gagal membuat content entry',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  // Load content types saat component mount
  useEffect(() => {
    fetchContentTypes()
  }, [fetchContentTypes])

  // Load template data dan apply ke form
  useEffect(() => {
    const template = loadTemplateData()
    if (template && contentTypes.length > 0) {
      // Set content type berdasarkan template
      const contentType = contentTypes.find(ct => ct.id === template.content_type_id)
      if (contentType) {
        setSelectedContentType(contentType)
        
      // Initialize fields
      const contentTypeFields = contentType.fields || contentType.content_type_fields || []
      const initialFields: FormField[] = contentTypeFields.map((field: ContentTypeField) => ({
        field_name: field.field_name,
        field_type: field.field_type,
        value: getDefaultValue(field.field_type)
      }))
      setFields(initialFields)
        
        // Apply template data ke form
        if (template.preview_data) {
          // Set title dari template
          if (template.preview_data.title) {
            setTitle(template.preview_data.title as string)
            setSlug(generateSlug(template.preview_data.title as string))
          }
          
          // Apply field values dari template
          const updatedFields = initialFields.map(field => {
            const templateValue = template.preview_data[field.field_name]
            if (templateValue !== undefined) {
              return { ...field, value: templateValue }
            }
            return field
          })
          setFields(updatedFields)
          
          toast({
            title: 'Template Loaded',
            description: `Template "${String(template.template_name)}" berhasil dimuat`,
          })
        }
      }
    }
  }, [contentTypes, loadTemplateData, toast])

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali</span>
            </Button>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Buat Entry Baru</h1>
              {templateData && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  Template: {String(templateData.template_name)}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mt-2">
              {templateData
                ? `Menggunakan template "${String(templateData.template_name)}" sebagai starting point`
                : 'Buat content entry baru dengan mengisi form di bawah ini'
              }
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Content Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Content Type</span>
              </CardTitle>
              <CardDescription className='text-white'>
                Pilih jenis content yang ingin dibuat
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="content-type">Content Type *</Label>
                <Select onValueChange={handleContentTypeChange}>
                  <SelectTrigger className="text-white">
                    <SelectValue placeholder="Pilih content type" />
                  </SelectTrigger>
                  <SelectContent className='text-white'>
                    {contentTypes.map((contentType) => (
                      <SelectItem key={contentType.id} value={contentType.id} className="text-white data-[highlighted]:text-white data-[state=checked]:text-white">
                        <div className="flex items-center space-x-2">
                          <span>{contentType.display_name}</span>
                          <Badge variant="secondary">{contentType.name}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          {selectedContentType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informasi Dasar</span>
                </CardTitle>
                <CardDescription>
                  Informasi dasar untuk content entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Masukkan judul content"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: 'draft' | 'published' | 'archived') => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dynamic Fields */}
          {selectedContentType && ((selectedContentType.fields || selectedContentType.content_type_fields)?.length ?? 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Content Fields</span>
                </CardTitle>
                <CardDescription>
                  Isi field-field content sesuai dengan content type yang dipilih
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(selectedContentType.fields || selectedContentType.content_type_fields || []).map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.field_name}>
                      {field.display_name}
                      {field.is_required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {selectedContentType && (
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="w-full sm:w-auto"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Simpan Entry
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

/**
 * Halaman untuk membuat content entry baru dengan Suspense wrapper
 */
export default function NewContentEntryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewContentEntryPageContent />
    </Suspense>
  )
}