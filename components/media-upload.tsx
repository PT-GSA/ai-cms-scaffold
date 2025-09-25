'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Upload, X, File, Image, Video, Music, FileText } from 'lucide-react'

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

interface MediaUploadProps {
  onUploadSuccess?: (file: MediaFile) => void
  onUploadError?: (error: string) => void
  folderId?: string
  accept?: string
  maxSize?: number // in bytes
  multiple?: boolean
}

/**
 * Komponen untuk upload media files dengan drag & drop
 */
export function MediaUpload({
  onUploadSuccess,
  onUploadError,
  folderId,
  accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.txt",
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [altText, setAltText] = useState('')
  const [caption, setCaption] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
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
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8" />
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8" />
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8" />
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className="w-8 h-8" />
    }
    return <File className="w-8 h-8" />
  }

  /**
   * Validasi file
   */
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File ${file.name} terlalu besar. Maksimal ${formatFileSize(maxSize)}`
    }

    const allowedTypes = accept.split(',').map(type => type.trim())
    const isAllowed = allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      return file.type.match(type.replace('*', '.*'))
    })

    if (!isAllowed) {
      return `File ${file.name} tidak didukung`
    }

    return null
  }

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((files: FileList) => {
    const fileArray = Array.from(files)
    const validFiles: File[] = []
    const errors: string[] = []

    fileArray.forEach(file => {
      const error = validateFile(file)
      if (error) {
        errors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: "Error",
          description: error,
          variant: "destructive"
        })
      })
    }

    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...validFiles])
      } else {
        setSelectedFiles([validFiles[0]])
      }
    }
  }, [multiple, maxSize, accept, toast])

  /**
   * Handle drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }, [handleFileSelect])

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  /**
   * Remove selected file
   */
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  /**
   * Upload files
   */
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)

    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        if (folderId) formData.append('folder_id', folderId)
        if (altText) formData.append('alt_text', altText)
        if (caption) formData.append('caption', caption)

        const response = await fetch('/api/media', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        return result.data
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      // Reset form
      setSelectedFiles([])
      setAltText('')
      setCaption('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Notify success
      uploadedFiles.forEach(file => {
        if (onUploadSuccess) {
          onUploadSuccess(file)
        }
      })

      toast({
        title: "Success",
        description: `${uploadedFiles.length} file(s) berhasil diupload`
      })

    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      
      if (onUploadError) {
        onUploadError(errorMessage)
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-lg font-medium mb-2">
          Drag & drop files here, atau klik untuk pilih
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Maksimal {formatFileSize(maxSize)} per file
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          Pilih Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
        />
      </div>

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Files yang dipilih:</Label>
          {selectedFiles.map((file, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(file.type)}
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • {file.type}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Metadata Fields */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="alt-text">Alt Text (untuk gambar)</Label>
            <Input
              id="alt-text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Deskripsi gambar untuk accessibility"
              disabled={isUploading}
            />
          </div>
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption atau deskripsi file"
              disabled={isUploading}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <Button
          onClick={uploadFiles}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
        </Button>
      )}
    </div>
  )
}