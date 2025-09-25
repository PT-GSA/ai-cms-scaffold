'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Plus, Search, Edit, Trash2, Eye, Calendar, FileText } from 'lucide-react'

interface ContentType {
  id: string
  name: string
  display_name: string
  icon: string
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
  content_types: ContentType
}

/**
 * Halaman Content Entries untuk mengelola semua content entries
 * Menampilkan daftar entries dengan filter berdasarkan content type dan status
 */
export default function ContentEntriesPage() {
  const [entries, setEntries] = useState<ContentEntry[]>([])
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContentType, setSelectedContentType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  /**
   * Fetch content entries dari API
   */
  const fetchEntries = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (selectedContentType !== 'all') {
        params.append('content_type', selectedContentType)
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }
      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await fetch(`/api/content-entries?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        setEntries(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch entries')
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat content entries',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch content types untuk filter
   */
  const fetchContentTypes = async () => {
    try {
      const response = await fetch('/api/content-types')
      const result = await response.json()

      if (result.success) {
        setContentTypes(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching content types:', error)
    }
  }

  /**
   * Delete content entry
   */
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/content-entries/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Berhasil',
          description: 'Content entry berhasil dihapus'
        })
        fetchEntries()
        setShowDeleteDialog(false)
        setSelectedEntry(null)
      } else {
        throw new Error(result.error || 'Failed to delete entry')
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast({
        title: 'Error',
        description: 'Gagal menghapus content entry',
        variant: 'destructive'
      })
    }
  }

  /**
   * Format tanggal untuk display
   */
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  /**
   * Get icon component berdasarkan nama icon
   */
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'FileText':
        return <FileText className="h-4 w-4" />
      case 'File':
        return <FileText className="h-4 w-4" />
      case 'Package':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // Load data saat component mount
  useEffect(() => {
    fetchContentTypes()
    fetchEntries()
  }, [])

  // Refetch entries saat filter berubah
  useEffect(() => {
    fetchEntries()
  }, [selectedContentType, selectedStatus, searchTerm])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Entries</h1>
          <p className="text-muted-foreground">
            Kelola semua content entries dalam sistem CMS
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Buat Entry Baru
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter & Pencarian</CardTitle>
          <CardDescription>
            Filter content entries berdasarkan tipe, status, atau kata kunci
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan judul atau slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Content Type Filter */}
            <Select value={selectedContentType} onValueChange={setSelectedContentType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Content Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Content Type</SelectItem>
                {contentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Pilih Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Entries List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Content Entries</CardTitle>
          <CardDescription>
            {loading ? 'Memuat...' : `${entries.length} entries ditemukan`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Memuat content entries...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Tidak ada entries</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Mulai dengan membuat content entry pertama Anda.
              </p>
              <div className="mt-6">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Entry Baru
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getIconComponent(entry.content_types.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {entry.title}
                        </h3>
                        <Badge variant={getStatusVariant(entry.status)}>
                          {entry.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <FileText className="mr-1 h-3 w-3" />
                          {entry.content_types.display_name}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(entry.created_at)}
                        </span>
                        {entry.published_at && (
                          <span className="flex items-center">
                            <Eye className="mr-1 h-3 w-3" />
                            Published: {formatDate(entry.published_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Slug: {entry.slug}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEntry(entry)
                        setShowDeleteDialog(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Content Entry</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus entry &quot;{selectedEntry?.title}&quot;? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false)
                setSelectedEntry(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedEntry && handleDelete(selectedEntry.id)}
            >
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}