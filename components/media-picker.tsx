'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { MediaUpload } from '@/components/media-upload'
import { 
  Search, 
  Grid, 
  List, 
  Upload,
  Image,
  Video,
  Music,
  FileText,
  File,
  Check
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

interface MediaPickerProps {
  onSelect: (file: MediaFile) => void
  onSelectMultiple?: (files: MediaFile[]) => void
  multiple?: boolean
  accept?: string[]
  trigger?: React.ReactNode
  selectedFiles?: MediaFile[]
}

/**
 * Komponen media picker untuk memilih files dari gallery
 */
export function MediaPicker({
  onSelect,
  onSelectMultiple,
  multiple = false,
  accept = ['image', 'video', 'audio', 'document'],
  trigger,
  selectedFiles = []
}: MediaPickerProps) {
  const [open, setOpen] = useState(false)
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all')
  const [selectedItems, setSelectedItems] = useState<MediaFile[]>(selectedFiles)
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
   * Check if file type is accepted
   */
  const isFileTypeAccepted = (fileType: string): boolean => {
    return accept.includes(fileType) || accept.includes('all')
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

      const response = await fetch(`/api/media?${params}`)
      const result = await response.json()

      if (response.ok) {
        // Filter files by accepted types
        const filteredFiles = result.data.filter((file: MediaFile) => 
          isFileTypeAccepted(file.file_type)
        )
        
        setFiles(filteredFiles)
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
  }, [pagination.page, pagination.limit, searchTerm, fileTypeFilter, accept, toast])

  /**
   * Handle file selection
   */
  const handleFileSelect = (file: MediaFile) => {
    if (multiple) {
      const isSelected = selectedItems.some(item => item.id === file.id)
      if (isSelected) {
        setSelectedItems(prev => prev.filter(item => item.id !== file.id))
      } else {
        setSelectedItems(prev => [...prev, file])
      }
    } else {
      onSelect(file)
      setOpen(false)
    }
  }

  /**
   * Handle multiple selection confirm
   */
  const handleConfirmSelection = () => {
    if (onSelectMultiple) {
      onSelectMultiple(selectedItems)
    }
    setOpen(false)
  }

  /**
   * Handle upload success
   */
  const handleUploadSuccess = useCallback((file: MediaFile) => {
    fetchFiles()
    if (!multiple) {
      onSelect(file)
      setOpen(false)
    }
  }, [fetchFiles, multiple, onSelect])

  /**
   * Check if file is selected
   */
  const isFileSelected = (file: MediaFile): boolean => {
    return selectedItems.some(item => item.id === file.id)
  }

  // Load files when dialog opens
  useEffect(() => {
    if (open) {
      fetchFiles()
    }
  }, [open, fetchFiles])

  // Reset selected items when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedItems(selectedFiles)
    }
  }, [open, selectedFiles])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Image className="w-4 h-4 mr-2" />
            Select Media
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="browse" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Files</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="flex-1 flex flex-col space-y-4">
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
                  {accept.includes('image') && <SelectItem value="image">Images</SelectItem>}
                  {accept.includes('video') && <SelectItem value="video">Videos</SelectItem>}
                  {accept.includes('audio') && <SelectItem value="audio">Audio</SelectItem>}
                  {accept.includes('document') && <SelectItem value="document">Documents</SelectItem>}
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

            {/* Files Grid/List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No files found
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map((file) => (
                    <Card 
                      key={file.id} 
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        isFileSelected(file) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <CardContent className="p-3">
                        <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 flex items-center justify-center overflow-hidden relative">
                          {file.file_type === 'image' ? (
                            <img
                              src={file.file_path}
                              alt={file.alt_text || file.original_filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            getFileIcon(file.mime_type, 'w-8 h-8 text-gray-400')
                          )}
                          {isFileSelected(file) && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-1">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium truncate">{file.original_filename}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(file.file_size)}</p>
                          <Badge variant="secondary" className="text-xs">
                            {file.file_type}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <Card 
                      key={file.id}
                      className={`cursor-pointer hover:shadow-md transition-all ${
                        isFileSelected(file) ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleFileSelect(file)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {file.file_type === 'image' ? (
                              <img
                                src={file.file_path}
                                alt={file.alt_text || file.original_filename}
                                className="w-10 h-10 object-cover rounded"
                              />
                            ) : (
                              getFileIcon(file.mime_type, 'w-6 h-6')
                            )}
                            <div>
                              <p className="font-medium text-sm">{file.original_filename}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{formatFileSize(file.file_size)}</span>
                                <Badge variant="secondary">{file.file_type}</Badge>
                              </div>
                            </div>
                          </div>
                          {isFileSelected(file) && (
                            <div className="bg-blue-500 text-white rounded-full p-1">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upload" className="flex-1">
            <MediaUpload
              onUploadSuccess={handleUploadSuccess}
              multiple={multiple}
            />
          </TabsContent>
        </Tabs>

        {multiple && (
          <DialogFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-gray-500">
                {selectedItems.length} file(s) selected
              </span>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleConfirmSelection}
                  disabled={selectedItems.length === 0}
                >
                  Select {selectedItems.length} File(s)
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}