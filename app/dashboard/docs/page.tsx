"use client"

import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Halaman dokumentasi dashboard yang menampilkan panduan penggunaan CMS,
 * API documentation, dan contoh implementasi
 */
export default function DocsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6 p-6 md:p-8">
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Dokumentasi
          </h1>
          <p className="text-gray-400">
            Panduan lengkap penggunaan AI CMS Scaffold dan API documentation
          </p>
        </div>
        
        {/* Main Content */}
        <Tabs defaultValue="getting-started" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="getting-started" className="text-white">Memulai</TabsTrigger>
            <TabsTrigger value="api" className="text-white">API</TabsTrigger>
            <TabsTrigger value="examples" className="text-white">Contoh</TabsTrigger>
            <TabsTrigger value="deployment" className="text-white">Deploy</TabsTrigger>
          </TabsList>

          {/* Getting Started Tab */}
          <TabsContent value="getting-started" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Selamat Datang di AI CMS Scaffold</CardTitle>
                <CardDescription className="text-gray-400">
                  Platform CMS yang didukung AI untuk mengelola konten dengan mudah
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Fitur Utama</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Schema Generator berbasis AI</li>
                    <li>Content Management System yang fleksibel</li>
                    <li>Media Management terintegrasi</li>
                    <li>API Keys management</li>
                    <li>User authentication & authorization</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Langkah Pertama</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Buat content type baru menggunakan Schema Generator</li>
                    <li>Tambahkan content entries sesuai dengan schema</li>
                    <li>Upload media files melalui Media Manager</li>
                    <li>Generate API key untuk akses eksternal</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">API Documentation</CardTitle>
                <CardDescription className="text-gray-400">
                  Panduan lengkap untuk menggunakan REST API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Authentication</h3>
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <code className="text-green-400">
                        Authorization: Bearer YOUR_API_KEY
                      </code>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Public API Endpoints</h3>
                    <p className="text-gray-400 mb-4">Endpoint ini dapat digunakan oleh frontend aplikasi Anda tanpa autentikasi khusus.</p>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-900 text-green-300">GET</Badge>
                          <code className="text-gray-300">/api/public/content-types</code>
                        </div>
                        <p className="text-gray-400 mb-2">Mengambil semua content types yang aktif</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Query params:</strong> slug (optional) - filter berdasarkan nama content type</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-blue-900 text-blue-300">POST</Badge>
                          <code className="text-gray-300">/api/public/content-types</code>
                        </div>
                        <p className="text-gray-400 mb-2">Membuat content type baru</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Body:</strong> name, display_name, description, fields, is_active</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-900 text-green-300">GET</Badge>
                          <code className="text-gray-300">/api/public/content-types/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Mengambil content type berdasarkan slug</p>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-yellow-900 text-yellow-300">PUT</Badge>
                          <code className="text-gray-300">/api/public/content-types/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Update content type berdasarkan slug</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Body:</strong> display_name, description, fields, is_active</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-red-900 text-red-300">DELETE</Badge>
                          <code className="text-gray-300">/api/public/content-types/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Hapus content type berdasarkan slug</p>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-900 text-green-300">GET</Badge>
                          <code className="text-gray-300">/api/public/content-entries</code>
                        </div>
                        <p className="text-gray-400 mb-2">Mengambil content entries untuk frontend consumer</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Query params:</strong></p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>content_type (required) - nama content type</li>
                            <li>limit (default: 10, max: 100) - jumlah entries</li>
                            <li>offset (default: 0) - untuk pagination</li>
                            <li>status (default: published) - filter status</li>
                            <li>sort (default: created_at) - field untuk sorting</li>
                            <li>order (default: desc) - asc atau desc</li>
                          </ul>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-blue-900 text-blue-300">POST</Badge>
                          <code className="text-gray-300">/api/public/content-entries</code>
                        </div>
                        <p className="text-gray-400 mb-2">Membuat content entry baru</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Body:</strong> content_type, slug, data, meta_data, status</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-900 text-green-300">GET</Badge>
                          <code className="text-gray-300">/api/public/content-entries/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Mengambil single content entry berdasarkan slug</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Query params:</strong> content_type (required) - nama content type</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-yellow-900 text-yellow-300">PUT</Badge>
                          <code className="text-gray-300">/api/public/content-entries/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Update content entry berdasarkan slug</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Body:</strong> content_type, data, meta_data, status</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-red-900 text-red-300">DELETE</Badge>
                          <code className="text-gray-300">/api/public/content-entries/[slug]</code>
                        </div>
                        <p className="text-gray-400 mb-2">Hapus content entry berdasarkan slug</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Query params:</strong> content_type (required) - nama content type</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="bg-green-900 text-green-300">GET</Badge>
                          <code className="text-gray-300">/api/public/media</code>
                        </div>
                        <p className="text-gray-400 mb-2">Mengambil media files untuk frontend consumer</p>
                        <div className="text-xs text-gray-500">
                          <p><strong>Query params:</strong></p>
                          <ul className="list-disc list-inside ml-2 mt-1">
                            <li>limit (default: 10, max: 100) - jumlah files</li>
                            <li>offset (default: 0) - untuk pagination</li>
                            <li>type (optional) - filter berdasarkan file type (image, video, document)</li>
                            <li>folder_id (optional) - filter berdasarkan folder</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Contoh Penggunaan CRUD API</h3>
                    <div className="space-y-4">
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">Membuat Content Type Baru:</h4>
                        <pre className="text-green-400 bg-gray-800 p-2 rounded border block text-xs overflow-x-auto">
{`POST /api/public/content-types
Content-Type: application/json

{
  "name": "blog_post",
  "display_name": "Blog Post",
  "description": "Blog post content type",
  "fields": [
    {
      "name": "title",
      "type": "text",
      "required": true
    },
    {
      "name": "content",
      "type": "textarea",
      "required": true
    }
  ],
  "is_active": true
}`}
                        </pre>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">Membuat Content Entry Baru:</h4>
                        <pre className="text-green-400 bg-gray-800 p-2 rounded border block text-xs overflow-x-auto">
{`POST /api/public/content-entries
Content-Type: application/json

{
  "content_type": "blog_post",
  "slug": "my-first-blog-post",
  "data": {
    "title": "My First Blog Post",
    "content": "This is the content of my first blog post..."
  },
  "status": "published"
}`}
                        </pre>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">Update Content Entry:</h4>
                        <pre className="text-green-400 bg-gray-800 p-2 rounded border block text-xs overflow-x-auto">
{`PUT /api/public/content-entries/my-first-blog-post
Content-Type: application/json

{
  "content_type": "blog_post",
  "data": {
    "title": "My Updated Blog Post",
    "content": "This is the updated content..."
  },
  "status": "published"
}`}
                        </pre>
                      </div>
                      
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                        <h4 className="font-medium text-white mb-2">Hapus Content Entry:</h4>
                        <code className="text-green-400 bg-gray-800 p-2 rounded border block">
                          DELETE /api/public/content-entries/my-first-blog-post?content_type=blog_post
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Contoh Implementasi</CardTitle>
                <CardDescription className="text-gray-400">
                  Contoh kode untuk mengintegrasikan dengan aplikasi Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Fetch Content dengan JavaScript</h3>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Mengambil semua content entries
const response = await fetch('/api/content-entries', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Membuat Content Entry</h3>
                  <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm text-gray-300">
{`// Membuat content entry baru
const newEntry = await fetch('/api/content-entries', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content_type_id: 'your-content-type-id',
    title: 'Judul Content',
    data: {
      field1: 'value1',
      field2: 'value2'
    }
  })
});`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Deployment Tab */}
          <TabsContent value="deployment" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Panduan Deployment</CardTitle>
                <CardDescription className="text-gray-400">
                  Cara deploy aplikasi ke production
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Environment Variables</h3>
                  <div className="bg-gray-900 p-4 rounded-lg">
                    <pre className="text-sm text-gray-300">
{`# .env.local (untuk development)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# .env (untuk production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Deploy ke Vercel</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Push kode ke GitHub repository</li>
                    <li>Connect repository ke Vercel</li>
                    <li>Set environment variables di Vercel dashboard</li>
                    <li>Deploy otomatis akan berjalan</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Database Setup</h3>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Local: Gunakan Docker untuk Supabase local</li>
                    <li>Production: Setup Supabase project di cloud</li>
                    <li>Jalankan migration scripts di folder /scripts</li>
                    <li>Setup storage bucket untuk media files</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}