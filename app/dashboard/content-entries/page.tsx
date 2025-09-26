'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  FileText,
  SortAsc,
  SortDesc,
  Grid,
  List,
  BookOpen,
  Archive,
  Clock,
  CheckCircle,
  BarChart3,
  Menu,
  X
} from 'lucide-react'

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
  content_type: ContentType  // Ubah dari content_types ke content_type
}

/**
 * Sidebar khusus untuk Content Entries dengan navigasi dan filter
 */
function ContentEntriesSidebar({ 
  selectedContentType, 
  setSelectedContentType, 
  selectedStatus, 
  setSelectedStatus,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  contentTypes,
  entries,
  isOpen,
  onClose,
  onCreateNew,
  router
}: {
  selectedContentType: string
  setSelectedContentType: (type: string) => void
  selectedStatus: string
  setSelectedStatus: (status: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  viewMode: 'grid' | 'list'
  setViewMode: (mode: 'grid' | 'list') => void
  contentTypes: ContentType[]
  entries: ContentEntry[]
  isOpen: boolean
  onClose: () => void
  onCreateNew: () => void
  router: ReturnType<typeof useRouter>
}) {
  // Hitung statistik
  const stats = {
    total: entries.length,
    published: entries.filter(e => e.status === 'published').length,
    draft: entries.filter(e => e.status === 'draft').length,
    archived: entries.filter(e => e.status === 'archived').length
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Content Entries</h2>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 p-4 space-y-6 overflow-y-auto">
            {/* Quick Actions */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Quick Actions</h3>
              <div className="space-y-2">
                <Button 
                  className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={onCreateNew}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Buat Entry Baru
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                  onClick={() => router.push('/dashboard/templates')}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Template Library
                </Button>
                <Button variant="ghost" className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </div>
            </div>

            {/* Statistics */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Statistics</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded bg-gray-800">
                  <span className="text-sm text-gray-300">Total Entries</span>
                  <Badge variant="secondary">{stats.total}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-800">
                  <span className="text-sm text-gray-300 flex items-center">
                    <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    Published
                  </span>
                  <Badge variant="default">{stats.published}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-800">
                  <span className="text-sm text-gray-300 flex items-center">
                    <Clock className="mr-1 h-3 w-3 text-yellow-500" />
                    Draft
                  </span>
                  <Badge variant="secondary">{stats.draft}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-gray-800">
                  <span className="text-sm text-gray-300 flex items-center">
                    <Archive className="mr-1 h-3 w-3 text-gray-500" />
                    Archived
                  </span>
                  <Badge variant="outline">{stats.archived}</Badge>
                </div>
              </div>
            </div>

            {/* Content Type Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Content Types</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedContentType('all')}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    selectedContentType === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <FileText className="mr-2 h-4 w-4 inline" />
                  All Content Types
                </button>
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedContentType(type.name)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedContentType === type.name 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <FileText className="mr-2 h-4 w-4 inline" />
                    {type.display_name}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Status Filter</h3>
              <div className="space-y-1">
                {[
                  { value: 'all', label: 'All Status', icon: FileText },
                  { value: 'published', label: 'Published', icon: CheckCircle },
                  { value: 'draft', label: 'Draft', icon: Clock },
                  { value: 'archived', label: 'Archived', icon: Archive }
                ].map((status) => {
                  const Icon = status.icon
                  return (
                    <button
                      key={status.value}
                      onClick={() => setSelectedStatus(status.value)}
                      className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                        selectedStatus === status.value 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4 inline" />
                      {status.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Sort By</h3>
              <div className="space-y-1">
                {[
                  { value: 'title', label: 'Title' },
                  { value: 'created_at', label: 'Date Created' },
                  { value: 'updated_at', label: 'Last Modified' },
                  { value: 'status', label: 'Status' }
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() => setSortBy(sort.value)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      sortBy === sort.value 
                        ? 'bg-blue-600 text-white' 
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
              
              <div className="flex space-x-1">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                    sortOrder === 'asc' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <SortAsc className="h-3 w-3 inline mr-1" />
                  Asc
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                    sortOrder === 'desc' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <SortDesc className="h-3 w-3 inline mr-1" />
                  Desc
                </button>
              </div>
            </div>

            {/* View Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">View Mode</h3>
              <div className="flex space-x-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Grid className="h-3 w-3 inline mr-1" />
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <List className="h-3 w-3 inline mr-1" />
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Halaman Content Entries untuk mengelola semua content entries
 * Menampilkan daftar entries dengan filter berdasarkan content type dan status
 */
export default function ContentEntriesPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<ContentEntry[]>([])
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContentType, setSelectedContentType] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedEntry, setSelectedEntry] = useState<ContentEntry | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { toast } = useToast()

  /**
   * Fetch content entries dari API
   */
  const fetchEntries = useCallback(async () => {
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
      if (sortBy) {
        params.append('sort_by', sortBy)
        params.append('sort_order', sortOrder)
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
  }, [selectedContentType, selectedStatus, searchTerm, sortBy, sortOrder, toast])

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
  }, [fetchEntries])

  // Refetch entries saat filter berubah
  useEffect(() => {
    fetchEntries()
  }, [fetchEntries, selectedContentType, selectedStatus, searchTerm, sortBy, sortOrder])

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <ContentEntriesSidebar
        selectedContentType={selectedContentType}
        setSelectedContentType={setSelectedContentType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        contentTypes={contentTypes}
        entries={entries}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onCreateNew={() => router.push('/dashboard/content-entries/new')}
        router={router}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0 bg-black">
        <div className="space-y-4 md:space-y-6 p-4 md:p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md bg-white shadow-sm border"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Content Entries</h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Kelola semua content entries dalam sistem CMS
                </p>
              </div>
            </div>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => router.push('/dashboard/content-entries/new')}
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Buat Entry Baru</span>
              <span className="sm:hidden">Buat Baru</span>
            </Button>
          </div>

          {/* Search Bar - Mobile Optimized */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan judul atau slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Entries List */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-lg md:text-xl">Daftar Content Entries</CardTitle>
                  <CardDescription className="text-sm">
                    {loading ? 'Memuat...' : `${entries.length} entries ditemukan`}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="hidden sm:flex"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="hidden sm:flex"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Memuat content entries...</p>
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold text-white">Tidak ada entries</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Mulai dengan membuat content entry pertama Anda
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => router.push('/dashboard/content-entries/new')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Buat Entry Baru
                    </Button>
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
                // Grid View - Responsive
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {entries.map((entry) => (
                    <Card key={entry.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-shrink-0">
                          {getIconComponent(entry.content_type.icon)}
                        </div>
                          <Badge variant={getStatusVariant(entry.status)} className="text-xs">
                            {entry.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-sm text-white font-medium line-clamp-2">
                          {entry.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <FileText className="mr-1 h-3 w-3" />
                            <span className="truncate">{entry.content_type.display_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>{formatDate(entry.created_at)}</span>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Slug: {entry.slug}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              setSelectedEntry(entry)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // List View - Responsive
                <div className="space-y-3">
                  {entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                    >
                      <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1 sm:mt-0">
                          {getIconComponent(entry.content_type.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-sm font-medium text-white truncate">
                              {entry.title}
                            </h3>
                            <Badge variant={getStatusVariant(entry.status)} className="w-fit">
                              {entry.status}
                            </Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1 text-xs text-muted-foreground gap-1 sm:gap-0">
                            <span className="flex items-center">
                              <FileText className="mr-1 h-3 w-3" />
                              {entry.content_type.display_name}
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
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            Slug: {entry.slug}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
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
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Hapus Content Entry</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus entry &quot;{selectedEntry?.title}&quot;? 
                  Tindakan ini tidak dapat dibatalkan.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setSelectedEntry(null)
                  }}
                  className="w-full sm:w-auto"
                >
                  Batal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedEntry && handleDelete(selectedEntry.id)}
                  className="w-full sm:w-auto"
                >
                  Hapus
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}