'use client'

import React, { useState, useEffect, useCallback } from 'react'
import NextImage from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useStorage } from '@/hooks/use-storage'
import MediaUploadSupabase from '@/components/media-upload-supabase'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Upload, 
  Search, 
  Grid, 
  List, 
  Trash2, 
  Edit, 
  Eye,
  FolderPlus,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  File,
  SortAsc,
  SortDesc,
  Star,
  Archive
} from 'lucide-react'

interface MediaFile {
  id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_type: string
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  folder_id?: string
  created_at: string
  updated_at: string
}

interface MediaFolder {
  id: string
  name: string
  parent_id?: string
  created_at: string
  updated_at: string
}

/**
 * Komponen Sidebar Media untuk navigasi dan filter
 */
function MediaSidebar({ 
  currentFolder, 
  setCurrentFolder, 
  fileTypeFilter, 
  setFileTypeFilter,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  folders,
  onCreateFolder
}: {
  currentFolder: string | null
  setCurrentFolder: (folderId: string | null) => void
  fileTypeFilter: string
  setFileTypeFilter: (filter: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
  sortOrder: 'asc' | 'desc'
  setSortOrder: (order: 'asc' | 'desc') => void
  folders: MediaFolder[]
  onCreateFolder: () => void
}) {
  const { storageData, loading: storageLoading } = useStorage()
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-full overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={onCreateFolder}
            >
              <FolderPlus className="w-4 h-4 mr-3" />
              New Folder
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Upload className="w-4 h-4 mr-3" />
              Upload Files
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Star className="w-4 h-4 mr-3" />
              Favorites
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
            >
              <Archive className="w-4 h-4 mr-3" />
              Recently Deleted
            </Button>
          </div>
        </div>

        {/* Folders Navigation */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Folders</h3>
          <div className="space-y-1">
            <Button
              variant={currentFolder === null ? "secondary" : "ghost"}
              className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={() => setCurrentFolder(null)}
            >
              <Folder className="w-4 h-4 mr-3" />
              All Files
            </Button>
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant={currentFolder === folder.id ? "secondary" : "ghost"}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => setCurrentFolder(folder.id)}
              >
                <Folder className="w-4 h-4 mr-3" />
                {folder.name}
              </Button>
            ))}
          </div>
        </div>

        {/* File Type Filters */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">File Types</h3>
          <div className="space-y-1">
            {[
              { value: 'all', label: 'All Files', icon: File },
              { value: 'image', label: 'Images', icon: Image },
              { value: 'video', label: 'Videos', icon: Video },
              { value: 'audio', label: 'Audio', icon: Music },
              { value: 'document', label: 'Documents', icon: FileText }
            ].map(({ value, label, icon: Icon }) => (
              <Button
                key={value}
                variant={fileTypeFilter === value ? "secondary" : "ghost"}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800"
                onClick={() => setFileTypeFilter(value)}
              >
                <Icon className="w-4 h-4 mr-3" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Sort By</h3>
          <div className="space-y-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="date">Date Created</SelectItem>
                <SelectItem value="size">File Size</SelectItem>
                <SelectItem value="type">File Type</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex space-x-1">
              <Button
                variant={sortOrder === 'asc' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-gray-300 hover:text-white"
                onClick={() => setSortOrder('asc')}
              >
                <SortAsc className="w-4 h-4 mr-1" />
                Asc
              </Button>
              <Button
                variant={sortOrder === 'desc' ? "secondary" : "ghost"}
                size="sm"
                className="flex-1 text-gray-300 hover:text-white"
                onClick={() => setSortOrder('desc')}
              >
                <SortDesc className="w-4 h-4 mr-1" />
                Desc
              </Button>
            </div>
          </div>
        </div>

        {/* Storage Info */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Storage</h3>
          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            {storageLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-2 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </div>
            ) : storageData ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Used</span>
                  <span className="text-gray-300">{storageData.used_formatted}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      storageData.usage_percentage > 90 
                        ? 'bg-red-500' 
                        : storageData.usage_percentage > 75 
                        ? 'bg-yellow-500' 
                        : 'bg-blue-500'
                    }`} 
                    style={{ width: `${Math.min(storageData.usage_percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{storageData.used_formatted} used</span>
                  <span>{storageData.quota_formatted} total</span>
                </div>
                {storageData.is_quota_exceeded && (
                  <div className="text-xs text-red-400 mt-1">
                    Storage quota exceeded
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                    {storageData.file_count} files - {storageData.remaining_formatted} remaining
                  </div>
              </>
            ) : (
              <div className="text-xs text-red-400">
                Failed to load storage data
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Halaman Media Gallery untuk manage files/images
 */
export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [folders, setFolders] = useState<MediaFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [editingFile, setEditingFile] = useState<MediaFile | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  const { toast } = useToast()

  /**
   * Format ukuran file untuk display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get icon berdasarkan file type
   */
  const getFileIcon = (mimeType: string, size = 'w-6 h-6') => {
    // eslint-disable-next-line jsx-a11y/alt-text
    if (mimeType.startsWith('image/')) return <Image className={size} />
    if (mimeType.startsWith('video/')) return <Video className={size} />
    if (mimeType.startsWith('audio/')) return <Music className={size} />
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className={size} />
    }
    return <File className={size} />
  }

  /**
   * Fetch media files
   */
  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })

      if (searchTerm) params.append('search', searchTerm)
      if (fileTypeFilter !== 'all') params.append('file_type', fileTypeFilter)
      if (currentFolder) params.append('folder_id', currentFolder)
      if (sortBy) params.append('sort_by', sortBy)
      if (sortOrder) params.append('sort_order', sortOrder)

      const response = await fetch(`/api/media?${params}`)
      const result = await response.json()

      if (response.ok) {
        setFiles(result.data)
        setPagination(prev => ({
          ...prev,
          total: result.total,
          totalPages: result.totalPages
        }))
      } else {
        throw new Error(result.error || 'Failed to fetch files')
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Gagal memuat files",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, searchTerm, fileTypeFilter, currentFolder, sortBy, sortOrder, toast])

  /**
   * Fetch folders
   */
  const fetchFolders = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (currentFolder) params.append('parent_id', currentFolder)

      const response = await fetch(`/api/media/folders?${params}`)
      const result = await response.json()

      if (response.ok) {
        setFolders(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch folders')
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
      toast({
        title: "Error",
        description: "Gagal memuat folders",
        variant: "destructive"
      })
    }
  }, [currentFolder, toast])

  /**
   * Create new folder
   */
  const createFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/media/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parent_id: currentFolder
        })
      })

      const result = await response.json()

      if (response.ok) {
        setNewFolderName('')
        setShowNewFolderDialog(false)
        fetchFolders()
        toast({
          title: "Success",
          description: "Folder berhasil dibuat"
        })
      } else {
        throw new Error(result.error || 'Failed to create folder')
      }
    } catch (error) {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal membuat folder",
        variant: "destructive"
      })
    }
  }

  /**
   * Delete file
   */
  const deleteFile = async (fileId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus file ini?')) return

    try {
      const response = await fetch(`/api/media/${fileId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (response.ok) {
        fetchFiles()
        setSelectedFile(null)
        toast({
          title: "Success",
          description: "File berhasil dihapus"
        })
      } else {
        throw new Error(result.error || 'Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus file",
        variant: "destructive"
      })
    }
  }

  /**
   * Update file metadata
   */
  const updateFile = async () => {
    if (!editingFile) return

    try {
      const response = await fetch(`/api/media/${editingFile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alt_text: editingFile.alt_text,
          caption: editingFile.caption,
          folder_id: editingFile.folder_id
        })
      })

      const result = await response.json()

      if (response.ok) {
        fetchFiles()
        setEditingFile(null)
        toast({
          title: "Success",
          description: "File berhasil diupdate"
        })
      } else {
        throw new Error(result.error || 'Failed to update file')
      }
    } catch (error) {
      console.error('Error updating file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupdate file",
        variant: "destructive"
      })
    }
  }

  /**
   * Handle upload success - refresh files list
   */
  const handleUploadSuccess = useCallback(() => {
    fetchFiles()
  }, [fetchFiles])

  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  return (
    <DashboardLayout>
      <div className="flex h-full">
        {/* Media Sidebar */}
        <MediaSidebar
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          fileTypeFilter={fileTypeFilter}
          setFileTypeFilter={setFileTypeFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          folders={folders}
          onCreateFolder={() => setShowNewFolderDialog(true)}
        />

        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 overflow-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Media Gallery</h1>
              <p className="text-gray-400">
                Manage your files and images
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Upload Media Files</DialogTitle>
                  </DialogHeader>
                  <MediaUploadSupabase
                    onUploadSuccess={handleUploadSuccess}
                    currentFolder={currentFolder || undefined}
                    maxFiles={10}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Breadcrumb */}
          {currentFolder && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(null)}
                className="text-gray-400 hover:text-white"
              >
                Root
              </Button>
              <span>/</span>
              <span className="text-gray-300">Current Folder</span>
            </div>
          )}

          {/* Files Grid/List */}
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading...</div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No files found
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {files.map((file) => (
                <Card key={file.id} className="group cursor-pointer hover:shadow-md transition-shadow bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {file.file_type === 'image' ? (
                        <NextImage
                          src={file.file_path}
                          alt={file.alt_text || file.original_filename}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getFileIcon(file.mime_type, 'w-12 h-12 text-gray-400')
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium truncate text-gray-200">{file.original_filename}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                      <Badge variant="secondary" className="text-xs">
                        {file.file_type}
                      </Badge>
                    </div>
                    <div className="flex space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedFile(file)
                        }}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingFile(file)
                        }}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteFile(file.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <Card key={file.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {file.file_type === 'image' ? (
                          <NextImage
                            src={file.file_path}
                            alt={file.alt_text || file.original_filename}
                            width={48}
                            height={48}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          getFileIcon(file.mime_type, 'w-8 h-8')
                        )}
                        <div>
                          <p className="font-medium">{file.original_filename}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{formatFileSize(file.file_size)}</span>
                            <Badge variant="secondary">{file.file_type}</Badge>
                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedFile(file)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingFile(file)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteFile(file.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center space-x-2">
              <Button
                variant="outline"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </Button>
            </div>
          )}

          {/* New Folder Dialog */}
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogContent className="bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Buat Folder Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name" className="text-gray-300">Nama Folder</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Masukkan nama folder"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createFolder}>
                  Buat Folder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* File Preview Dialog */}
          {selectedFile && (
            <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
              <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">{selectedFile.original_filename}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {selectedFile.file_type === 'image' ? (
                    <NextImage
                      src={selectedFile.file_path}
                      alt={selectedFile.alt_text || selectedFile.original_filename}
                      width={800}
                      height={600}
                      className="w-full max-h-96 object-contain rounded"
                    />
                  ) : selectedFile.file_type === 'video' ? (
                    <video
                      src={selectedFile.file_path}
                      controls
                      className="w-full max-h-96 rounded"
                    />
                  ) : selectedFile.file_type === 'audio' ? (
                    <audio
                      src={selectedFile.file_path}
                      controls
                      className="w-full"
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <div className="mb-4">
                        {getFileIcon(selectedFile.mime_type, 'w-16 h-16 mx-auto')}
                      </div>
                      <p className="text-lg font-medium text-gray-300">{selectedFile.original_filename}</p>
                      <p className="text-gray-500">{formatFileSize(selectedFile.file_size)}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">File Size:</span>
                      <span className="ml-2 text-gray-300">{formatFileSize(selectedFile.file_size)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">File Type:</span>
                      <span className="ml-2 text-gray-300">{selectedFile.mime_type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="ml-2 text-gray-300">{new Date(selectedFile.created_at).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Modified:</span>
                      <span className="ml-2 text-gray-300">{new Date(selectedFile.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {selectedFile.alt_text && (
                    <div>
                      <span className="text-gray-400">Alt Text:</span>
                      <p className="text-gray-300 mt-1">{selectedFile.alt_text}</p>
                    </div>
                  )}
                  
                  {selectedFile.caption && (
                    <div>
                      <span className="text-gray-400">Caption:</span>
                      <p className="text-gray-300 mt-1">{selectedFile.caption}</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedFile(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setEditingFile(selectedFile)
                    setSelectedFile(null)
                  }}>
                    Edit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Edit File Dialog */}
          {editingFile && (
            <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Edit File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="alt-text" className="text-gray-300">Alt Text</Label>
                    <Input
                      id="alt-text"
                      value={editingFile.alt_text || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, alt_text: e.target.value })}
                      placeholder="Enter alt text for accessibility"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="caption" className="text-gray-300">Caption</Label>
                    <Textarea
                      id="caption"
                      value={editingFile.caption || ''}
                      onChange={(e) => setEditingFile({ ...editingFile, caption: e.target.value })}
                      placeholder="Enter file caption"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="folder" className="text-gray-300">Folder</Label>
                    <Select 
                      value={editingFile.folder_id || 'root'} 
                      onValueChange={(value) => setEditingFile({ 
                        ...editingFile, 
                        folder_id: value === 'root' ? undefined : value 
                      })}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">Root Folder</SelectItem>
                        {folders.map((folder) => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingFile(null)}>
                    Cancel
                  </Button>
                  <Button onClick={updateFile}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}