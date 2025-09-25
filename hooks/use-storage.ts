import { useState, useEffect } from 'react'

interface StorageData {
  used_bytes: number
  used_formatted: string
  quota_bytes: number
  quota_formatted: string
  usage_percentage: number
  remaining_bytes: number
  remaining_formatted: string
  file_count: number
  is_quota_exceeded: boolean
}

interface StorageValidation {
  can_upload: boolean
  current_used: number
  file_size: number
  after_upload: number
  quota: number
  remaining: number
  message: string
}

/**
 * Custom hook untuk mengelola storage data dan validasi
 * Menyediakan real-time storage usage dan quota validation
 */
export function useStorage() {
  const [storageData, setStorageData] = useState<StorageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch storage data dari API
   */
  const fetchStorageData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/storage')
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch storage data')
      }
      
      setStorageData(result.data)
    } catch (err) {
      console.error('Error fetching storage data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Validasi apakah file bisa diupload berdasarkan quota
   */
  const validateUpload = async (fileSize: number): Promise<StorageValidation | null> => {
    try {
      const response = await fetch('/api/storage/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_size: fileSize }),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate upload')
      }
      
      return result.data
    } catch (err) {
      console.error('Error validating upload:', err)
      return null
    }
  }

  /**
   * Refresh storage data setelah upload/delete
   */
  const refreshStorageData = () => {
    fetchStorageData()
  }

  // Fetch data saat component mount
  useEffect(() => {
    fetchStorageData()
  }, [])

  return {
    storageData,
    loading,
    error,
    fetchStorageData,
    validateUpload,
    refreshStorageData,
  }
}