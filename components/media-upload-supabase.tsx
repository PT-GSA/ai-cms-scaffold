'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useStorage } from '@/hooks/use-storage'
import { Upload, X, FileText, Image, Video, Music, File } from 'lucide-react'

interface MediaFile {
  id: string
  filename: string
  original_filename: string
  file_path: string
  storage_path: string
  file_size: number
  mime_type: string
  file_type: string
  width?: number
  height?: number
  alt_text?: string
  caption?: string
  folder_id?: string
  uploaded_by: string
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

interface MediaUploadSupabaseProps {
  onUploadSuccess?: (file: MediaFile) => void
  onUploadError?: (error: string) => void
  currentFolder?: string | null
  folders?: MediaFolder[]
  maxFiles?: number
  acceptedFileTypes?: string[]
}

/**
 * Komponen upload media yang menggunakan Supabase Storage
 */
export default function MediaUploadSupabase({
  onUploadSuccess,
  onUploadError,
  currentFolder = null,
  folders = [],
  maxFiles = 10,
  acceptedFileTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/ogg',
    'audio/mp3', 'audio/wav', 'audio/ogg',
    'application/pdf', 'text/plain', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
}: MediaUploadSupabaseProps) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [selectedFolder, setSelectedFolder] = useState<string>(currentFolder || '')
  const [fileMetadata, setFileMetadata] = useState<{ [key: string]: { altText: string; caption: string } }>({})
  
  const { toast } = useToast()
  const { validateUpload, refreshStorageData } = useStorage()

  /**
   * Handle file drop
   */
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => {
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: "File type not supported",
          description: `${file.name} has unsupported file type`,
          variant: "destructive"
        })
        return false
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive"
        })
        return false
      }
      
      return true
    })

    if (files.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return
    }

    // Validasi storage quota untuk semua file
    const totalNewFileSize = validFiles.reduce((total, file) => total + file.size, 0)
    const validation = await validateUpload(totalNewFileSize)
    
    if (!validation || !validation.can_upload) {
      toast({
        title: "Storage quota exceeded",
        description: validation?.message || "Not enough storage space for these files",
        variant: "destructive"
      })
      return
    }

    setFiles(prev => [...prev, ...validFiles])
    
    // Initialize metadata for new files
    const newMetadata: { [key: string]: { altText: string; caption: string } } = {}
    validFiles.forEach(file => {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      newMetadata[fileKey] = { altText: '', caption: '' }
    })
    setFileMetadata(prev => ({ ...prev, ...newMetadata }))
  }, [files.length, maxFiles, acceptedFileTypes, toast, validateUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = []
      return acc
    }, {} as Record<string, string[]>),
    maxFiles,
    multiple: true
  })

  /**
   * Remove file from upload queue
   */
  const removeFile = (index: number) => {
    const file = files[index]
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`
    
    setFiles(prev => prev.filter((_, i) => i !== index))
    setFileMetadata(prev => {
      const newMetadata = { ...prev }
      delete newMetadata[fileKey]
      return newMetadata
    })
  }

  /**
   * Update file metadata
   */
  const updateFileMetadata = (index: number, field: 'altText' | 'caption', value: string) => {
    const file = files[index]
    const fileKey = `${file.name}-${file.size}-${file.lastModified}`
    
    setFileMetadata(prev => ({
      ...prev,
      [fileKey]: {
        ...prev[fileKey],
        [field]: value
      }
    }))
  }

  /**
   * Upload files to Supabase Storage
   */
  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    const uploadPromises = files.map(async (file) => {
      const fileKey = `${file.name}-${file.size}-${file.lastModified}`
      const metadata = fileMetadata[fileKey] || { altText: '', caption: '' }

      try {
        setUploadProgress(prev => ({ ...prev, [fileKey]: 0 }))

        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder_id', selectedFolder)
        formData.append('alt_text', metadata.altText)
        formData.append('caption', metadata.caption)

        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Upload failed')
        }

        const result = await response.json()
        setUploadProgress(prev => ({ ...prev, [fileKey]: 100 }))

        if (onUploadSuccess) {
          onUploadSuccess(result.data)
        }

        return result.data
      } catch (error) {
        console.error('Upload error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Upload failed'
        
        if (onUploadError) {
          onUploadError(errorMessage)
        }
        
        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}: ${errorMessage}`,
          variant: "destructive"
        })
        
        throw error
      }
    })

    try {
      await Promise.all(uploadPromises)
      
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${files.length} file(s)`,
      })
      
      // Refresh storage data setelah upload berhasil
      refreshStorageData()
      
      // Clear files after successful upload
      setFiles([])
      setFileMetadata({})
      setUploadProgress({})
    } catch {
      // Some uploads failed, but we don't need to do anything here
      // Individual errors are already handled above
    } finally {
      setUploading(false)
    }
  }

  /**
   * Get file type icon
   */
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Media Files</CardTitle>
        <CardDescription>
          Upload files to Supabase Storage. Maximum file size: 10MB. Maximum {maxFiles} files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Folder Selection */}
        {folders.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="folder-select">Upload to Folder</Label>
            <Select value={selectedFolder} onValueChange={setSelectedFolder}>
              <SelectTrigger>
                <SelectValue placeholder="Select folder (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Root Folder</SelectItem>
                {folders.map(folder => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 dark:text-blue-400">Drop files here...</p>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                Drag & drop files here, or click to select
              </p>
              <p className="text-sm text-gray-500">
                Supported: Images, Videos, Audio, Documents (max 10MB each)
              </p>
            </div>
          )}
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-medium">Files to Upload ({files.length})</h3>
            <div className="space-y-3">
              {files.map((file, index) => {
                const fileKey = `${file.name}-${file.size}-${file.lastModified}`
                const progress = uploadProgress[fileKey] || 0
                const metadata = fileMetadata[fileKey] || { altText: '', caption: '' }

                return (
                  <Card key={fileKey} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {uploading && progress > 0 && (
                          <div className="mb-3">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{progress}% uploaded</p>
                          </div>
                        )}

                        {/* Metadata inputs for images */}
                        {file.type.startsWith('image/') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                              <Label htmlFor={`alt-${index}`} className="text-xs">Alt Text</Label>
                              <Input
                                id={`alt-${index}`}
                                placeholder="Describe the image..."
                                value={metadata.altText}
                                onChange={(e) => updateFileMetadata(index, 'altText', e.target.value)}
                                disabled={uploading}
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`caption-${index}`} className="text-xs">Caption</Label>
                              <Input
                                id={`caption-${index}`}
                                placeholder="Image caption..."
                                value={metadata.caption}
                                onChange={(e) => updateFileMetadata(index, 'caption', e.target.value)}
                                disabled={uploading}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}

                        {/* Caption for non-images */}
                        {!file.type.startsWith('image/') && (
                          <div className="mt-3">
                            <Label htmlFor={`caption-${index}`} className="text-xs">Description</Label>
                            <Textarea
                              id={`caption-${index}`}
                              placeholder="File description..."
                              value={metadata.caption}
                              onChange={(e) => updateFileMetadata(index, 'caption', e.target.value)}
                              disabled={uploading}
                              className="text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Upload Button */}
            <div className="flex justify-end">
              <Button 
                onClick={uploadFiles} 
                disabled={uploading || files.length === 0}
                className="min-w-[120px]"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}