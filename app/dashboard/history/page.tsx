"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, Eye, Calendar, Database, Code } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { DashboardLayout } from "@/components/dashboard-layout"

interface SchemaHistory {
  id: number
  schemaName: string
  schemaJson: unknown
  sqlQuery: string
  createdAt: string
  updatedAt: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Komponen halaman History untuk menampilkan riwayat schema yang telah dibuat
 * Menggunakan realtime updates dari Supabase
 */
export default function HistoryPage() {
  const [schemas, setSchemas] = useState<SchemaHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })
  const [selectedSchema, setSelectedSchema] = useState<SchemaHistory | null>(null)
  const { toast } = useToast()

  /**
   * Fungsi untuk mengambil data history dari API
   */
  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schema/history?page=${page}&limit=${pagination.limit}`)
      const result = await response.json()

      if (result.success) {
        setSchemas(result.data)
        setPagination(result.pagination)
      } else {
        toast({
          title: "Error",
          description: "Gagal mengambil data history",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching history:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, toast])

  /**
   * Fungsi untuk menghapus schema
   */
  const deleteSchema = async (id: number) => {
    try {
      const response = await fetch(`/api/schema/history?id=${id}`, {
        method: "DELETE",
      })
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Berhasil",
          description: "Schema berhasil dihapus",
        })
        fetchHistory(pagination.page)
      } else {
        toast({
          title: "Error",
          description: "Gagal menghapus schema",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting schema:", error)
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus schema",
        variant: "destructive",
      })
    }
  }

  /**
   * Setup realtime subscription untuk update otomatis
   */
  useEffect(() => {
    fetchHistory()

    const supabase = createClient()
    
    // Subscribe ke perubahan tabel cms_schemas
    const channel = supabase
      .channel("schema-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cms_schemas",
        },
        (payload: unknown) => {
          console.log("Realtime update:", payload)
          // Refresh data ketika ada perubahan
          fetchHistory(pagination.page)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchHistory, pagination.page])

  /**
   * Format tanggal untuk tampilan
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Schema History</h1>
            <p className="text-gray-400">
              Riwayat schema yang telah dibuat dan dijalankan
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Total: {pagination.total}
          </Badge>
        </div>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : schemas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada history</h3>
            <p className="text-muted-foreground text-center">
              Schema yang Anda buat akan muncul di sini
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {schemas.map((schema) => (
            <Card key={schema.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      {schema.schemaName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(schema.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSchema(schema)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSchema(schema.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-1">SQL Query:</h4>
                    <pre className="text-xs text-black bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                      {schema.sqlQuery}
                    </pre>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-1">Schema JSON:</h4>
                    <pre className="text-xs text-black bg-gray-100 p-2 rounded overflow-x-auto max-h-32">
                      {JSON.stringify(schema.schemaJson, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => fetchHistory(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchHistory(pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Modal untuk detail schema */}
      {selectedSchema && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{selectedSchema.schemaName}</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSchema(null)}
                >
                  Close
                </Button>
              </div>
              <CardDescription>
                Created: {formatDate(selectedSchema.createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">SQL Query:</h4>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                  {selectedSchema.sqlQuery}
                </pre>
              </div>
              <div>
                <h4 className="font-medium mb-2">Schema JSON:</h4>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                  {JSON.stringify(selectedSchema.schemaJson, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </DashboardLayout>
  )
}