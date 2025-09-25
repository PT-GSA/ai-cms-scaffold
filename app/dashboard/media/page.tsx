'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { MediaUpload } from '@/components/media-upload'
import { 
  Upload, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Trash2, 
  Edit, 
  Download,
  Eye,
  FolderPlus,
  Folder,
  Image,
  Video,
  Music,
  FileText,
  File
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
  }, [pagination.page, pagination.limit, searchTerm, fileTypeFilter, currentFolder, toast])

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
   * Handle upload success
   */
  const handleUploadSuccess = useCallback((file: MediaFile) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Gallery</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your files and images
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Buat Folder Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-name">Nama Folder</Label>
                  <Input
                    id="folder-name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Masukkan nama folder"
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
              <MediaUpload
                onUploadSuccess={handleUploadSuccess}
                folderId={currentFolder || undefined}
                multiple={true}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="audio">Audio</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
          </SelectContent>
        </Select>
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
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentFolder(null)}
          >
            Root
          </Button>
          <span>/</span>
          <span>Current Folder</span>
        </div>
      )}

      {/* Folders */}
      {folders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setCurrentFolder(folder.id)}
            >
              <CardContent className="p-4 text-center">
                <Folder className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="text-sm font-medium truncate">{folder.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Files Grid/List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No files found
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="group cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                  {file.file_type === 'image' ? (
                    <img
                      src={file.file_path}
                      alt={file.alt_text || file.original_filename}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(file.mime_type, 'w-12 h-12 text-gray-400')
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium truncate">{file.original_filename}</p>
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
            <Card key={file.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {file.file_type === 'image' ? (
                      <img
                        src={file.file_path}
                        alt={file.alt_text || file.original_filename}
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
          <span className="flex items-center px-4">
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

      {/* File Preview Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onOpenChange={() => setSelectedFile(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedFile.original_filename}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {selectedFile.file_type === 'image' ? (
                <img
                  src={selectedFile.file_path}
                  alt={selectedFile.alt_text || selectedFile.original_filename}
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
                <div className="text-center py-8">
                  {getFileIcon(selectedFile.mime_type, 'w-16 h-16 mx-auto text-gray-400')}
                  <p className="mt-2 text-gray-500">Preview not available</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>File Size:</strong> {formatFileSize(selectedFile.file_size)}
                </div>
                <div>
                  <strong>Type:</strong> {selectedFile.mime_type}
                </div>
                <div>
                  <strong>Uploaded:</strong> {new Date(selectedFile.created_at).toLocaleString()}
                </div>
                {selectedFile.width && selectedFile.height && (
                  <div>
                    <strong>Dimensions:</strong> {selectedFile.width} × {selectedFile.height}
                  </div>
                )}
              </div>
              {selectedFile.alt_text && (
                <div>
                  <strong>Alt Text:</strong> {selectedFile.alt_text}
                </div>
              )}
              {selectedFile.caption && (
                <div>
                  <strong>Caption:</strong> {selectedFile.caption}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => window.open(selectedFile.file_path, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit File Dialog */}
      {editingFile && (
        <Dialog open={!!editingFile} onOpenChange={() => setEditingFile(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit File</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  value={editingFile.alt_text || ''}
                  onChange={(e) => setEditingFile(prev => prev ? { ...prev, alt_text: e.target.value } : null)}
                  placeholder="Alt text for accessibility"
                />
              </div>
              <div>
                <Label htmlFor="edit-caption">Caption</Label>
                <Textarea
                  id="edit-caption"
                  value={editingFile.caption || ''}
                  onChange={(e) => setEditingFile(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  placeholder="File caption or description"
                />
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
  )
}