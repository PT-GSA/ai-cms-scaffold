'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, FileText, File, Package, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { DashboardLayout } from '@/components/dashboard-layout'
import ContentTypeForm from '@/components/content-type-form'

interface ContentTypeField {
  id?: number
  field_name: string
  display_name: string
  field_type: string
  is_required: boolean
  is_unique: boolean
  default_value?: string
  help_text?: string
  sort_order: number
  validation_rules?: Record<string, unknown>
  field_options?: Record<string, unknown>
}

interface ContentType {
  id?: number
  name: string
  display_name: string
  description: string
  icon: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  fields?: ContentTypeField[]
}

/**
 * Halaman untuk mengelola Content Types
 * Menampilkan list content types dengan CRUD operations
 */

export default function ContentTypesPage() {
  const { toast } = useToast()
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContentType, setSelectedContentType] = useState<ContentType | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingContentType, setEditingContentType] = useState<ContentType | null>(null)

  /**
   * Fetch content types dari API
   */
  const fetchContentTypes = useCallback(async () => {
    try {
      setLoading(true)
      // Add cache busting parameter
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/content-types?include_fields=true&_t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch content types')
      }

      const data = await response.json()
      setContentTypes(data.data || [])
    } catch (error) {
      console.error('Error fetching content types:', error)
      toast({
        title: "Error",
        description: "Gagal memuat content types",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  /**
   * Handle create new content type
   */
  const handleCreateNew = () => {
    setEditingContentType(null)
    setShowFormModal(true)
  }

  /**
   * Handle edit content type
   */
  const handleEdit = (contentType: ContentType) => {
    setEditingContentType(contentType)
    setShowFormModal(true)
  }

  /**
   * Handle save content type (create or update)
   */
  const handleSaveContentType = async (contentTypeData: ContentType) => {
    try {
      const isEditing = !!editingContentType
      const url = isEditing 
        ? `/api/content-types/${editingContentType.id}`
        : '/api/content-types'
      
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contentTypeData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save content type')
      }

      toast({
        title: "Berhasil",
        description: `Content type ${isEditing ? 'diperbarui' : 'dibuat'} successfully`
      })

      // Refresh list and close modal
      await fetchContentTypes()
      
      // Force refresh sebagai fallback untuk memastikan UI terupdate
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
      setShowFormModal(false)
      setEditingContentType(null)

    } catch (error) {
      console.error('Error saving content type:', error)
      throw error // Re-throw untuk ditangani oleh form
    }
  }

  /**
   * Delete content type
   */
  const handleDelete = async (contentType: ContentType) => {
    try {
      const url = `/api/content-types/${contentType.id}`
        
      const response = await fetch(url, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete content type')
      }

      toast({
        title: "Berhasil",
        description: result.message || `Content type "${contentType.display_name}" berhasil dihapus`
      })

      // Refresh list
      fetchContentTypes()
      setShowDeleteModal(false)
      setSelectedContentType(null)
    } catch (error) {
      console.error('Error deleting content type:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus content type",
        variant: "destructive"
      })
    }
  }

  /**
   * Get icon component berdasarkan nama icon
   */
  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'FileText':
        return FileText
      case 'File':
        return File
      case 'Package':
        return Package
      default:
        return FileText
    }
  }

  /**
   * Get field type badge color
   */
  const getFieldTypeBadgeVariant = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
        return 'default'
      case 'rich_text':
        return 'secondary'
      case 'number':
        return 'outline'
      case 'boolean':
        return 'destructive'
      case 'date':
      case 'datetime':
        return 'default'
      case 'select':
      case 'multi_select':
        return 'secondary'
      case 'media':
        return 'outline'
      case 'relation':
        return 'destructive'
      default:
        return 'default'
    }
  }

  // Load content types on component mount
  useEffect(() => {
    fetchContentTypes()
  }, [fetchContentTypes])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading content types...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 ml-6 mt-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Content Types</h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Kelola struktur content untuk headless CMS Anda
            </p>
          </div>
          <Button onClick={handleCreateNew} className="w-full sm:w-auto mr-6">
            <Plus className="h-4 w-4 mr-2" />
            New Content Type
          </Button>
        </div>

        {/* Content Types Grid */}
        {contentTypes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2 text-center">No Content Types</h3>
              <p className="text-gray-400 text-center mb-4 text-sm sm:text-base max-w-md">
                Belum ada content types. Buat content type pertama Anda untuk memulai.
              </p>
              <Button onClick={handleCreateNew} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Create Content Type
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {contentTypes.map((contentType) => {
              const IconComponent = getIconComponent(contentType.icon)
              
              return (
                <Card key={contentType.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <IconComponent className="h-5 w-5 text-primary flex-shrink-0" />
                      <CardTitle className="text-base sm:text-lg text-white truncate">
                        {contentType.display_name}
                      </CardTitle>
                    </div>
                    <Badge variant={contentType.is_active ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                      {contentType.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                        {contentType.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        System name: <code className="bg-muted px-1 rounded text-xs">{contentType.name}</code>
                      </p>
                    </div>

                    {/* Fields Preview */}
                    {contentType.fields && contentType.fields.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-white mb-2">
                          Fields ({contentType.fields.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {contentType.fields.slice(0, 2).map((field) => (
                            <Badge 
                              key={field.id} 
                              variant={getFieldTypeBadgeVariant(field.field_type)}
                              className="text-xs truncate max-w-full"
                            >
                              {field.display_name}
                            </Badge>
                          ))}
                          {contentType.fields.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contentType.fields.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2">
                      <div className="text-xs text-muted-foreground order-2 sm:order-1">
                        Created: {contentType.created_at ? new Date(contentType.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                      <div className="flex items-center justify-end space-x-1 order-1 sm:order-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContentType(contentType)
                            setShowDetailModal(true)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(contentType)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedContentType(contentType)
                            setShowDeleteModal(true)
                          }}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create/Edit Form Modal */}
        <Dialog open={showFormModal} onOpenChange={setShowFormModal}>
          <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingContentType ? 'Edit Content Type' : 'Create New Content Type'}
              </DialogTitle>
            </DialogHeader>
            <ContentTypeForm
              contentType={editingContentType || undefined}
              onSave={handleSaveContentType}
              onCancel={() => setShowFormModal(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Detail Modal */}
        {showDetailModal && selectedContentType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-4 sm:p-6 rounded-lg max-w-full sm:max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white truncate pr-4">
                  {selectedContentType.display_name} Details
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetailModal(false)}
                  className="h-8 w-8 p-0 flex-shrink-0"
                >
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Basic Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="text-white break-all">{selectedContentType.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Display Name:</span>
                      <p className="text-white break-words">{selectedContentType.display_name}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-muted-foreground">Description:</span>
                      <p className="text-white break-words">{selectedContentType.description || 'No description'}</p>
                    </div>
                  </div>
                </div>

                {selectedContentType.fields && selectedContentType.fields.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white mb-2">Fields</h3>
                    <div className="space-y-2">
                      {selectedContentType.fields.map((field) => (
                        <div key={field.id} className="border rounded p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <span className="font-medium text-white break-words">{field.display_name}</span>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={getFieldTypeBadgeVariant(field.field_type)} className="text-xs">
                                {field.field_type}
                              </Badge>
                              {field.is_required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                              )}
                              {field.is_unique && (
                                <Badge variant="outline" className="text-xs">Unique</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p className="break-all">Field name: <code className="text-xs">{field.field_name}</code></p>
                            {field.help_text && <p className="break-words">Help: {field.help_text}</p>}
                            {field.default_value && <p className="break-words">Default: {field.default_value}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedContentType && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card p-4 sm:p-6 rounded-lg max-w-full sm:max-w-md w-full">
              <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Confirm Delete</h2>
              <div className="space-y-4 mb-6">
                <p className="text-gray-400 text-sm sm:text-base break-words">
                  Are you sure you want to permanently delete the content type &quot;{selectedContentType.display_name}&quot;?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">
                    <strong>Warning:</strong> This action will permanently delete the content type and all its fields. 
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedContentType)}
                  className="w-full sm:w-auto order-1 sm:order-2"
                >
                  Delete Permanently
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}