'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description: string
  requiresBody?: boolean
  queryParams?: string[]
  bodyExample?: string
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/public/content-types',
    description: 'Mengambil semua content types',
    queryParams: ['slug']
  },
  {
    method: 'POST',
    path: '/api/public/content-types',
    description: 'Membuat content type baru',
    requiresBody: true,
    bodyExample: JSON.stringify({
      name: 'blog_post',
      display_name: 'Blog Post',
      description: 'Blog post content type',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true
        },
        {
          name: 'content',
          type: 'textarea',
          required: true
        }
      ],
      is_active: true
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/api/public/content-types/[slug]',
    description: 'Mengambil content type berdasarkan slug'
  },
  {
    method: 'PUT',
    path: '/api/public/content-types/[slug]',
    description: 'Update content type berdasarkan slug',
    requiresBody: true,
    bodyExample: JSON.stringify({
      display_name: 'Updated Blog Post',
      description: 'Updated blog post content type',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true
        },
        {
          name: 'content',
          type: 'textarea',
          required: true
        },
        {
          name: 'author',
          type: 'text',
          required: false
        }
      ],
      is_active: true
    }, null, 2)
  },
  {
    method: 'DELETE',
    path: '/api/public/content-types/[slug]',
    description: 'Hapus content type berdasarkan slug'
  },
  {
    method: 'GET',
    path: '/api/public/content-entries',
    description: 'Mengambil content entries dengan pagination',
    queryParams: ['content_type', 'limit', 'offset', 'status', 'sort', 'order']
  },
  {
    method: 'POST',
    path: '/api/public/content-entries',
    description: 'Membuat content entry baru',
    requiresBody: true,
    bodyExample: JSON.stringify({
      content_type: 'blog_post',
      slug: 'my-first-blog-post',
      data: {
        title: 'My First Blog Post',
        content: 'This is the content of my first blog post...'
      },
      status: 'published'
    }, null, 2)
  },
  {
    method: 'GET',
    path: '/api/public/content-entries/[slug]',
    description: 'Mengambil single content entry berdasarkan slug',
    queryParams: ['content_type']
  },
  {
    method: 'PUT',
    path: '/api/public/content-entries/[slug]',
    description: 'Update content entry berdasarkan slug',
    requiresBody: true,
    bodyExample: JSON.stringify({
      content_type: 'blog_post',
      data: {
        title: 'My Updated Blog Post',
        content: 'This is the updated content...'
      },
      status: 'published'
    }, null, 2)
  },
  {
    method: 'DELETE',
    path: '/api/public/content-entries/[slug]',
    description: 'Hapus content entry berdasarkan slug',
    queryParams: ['content_type']
  },
  {
    method: 'GET',
    path: '/api/public/media',
    description: 'Mengambil media files dengan pagination',
    queryParams: ['limit', 'offset', 'type', 'folder_id']
  }
]

/**
 * Komponen API Playground untuk menguji API endpoints secara interaktif
 */
export function ApiPlayground() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [customPath, setCustomPath] = useState('')
  const [queryParams, setQueryParams] = useState('')
  const [requestBody, setRequestBody] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [response, setResponse] = useState<{
    status: number
    data: any
    headers: Record<string, string>
  } | null>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Load API key dari localStorage saat komponen dimount
   */
  useEffect(() => {
    const savedApiKey = localStorage.getItem('api-playground-key')
    if (savedApiKey) {
      setApiKey(savedApiKey)
    }
  }, [])

  /**
   * Save API key ke localStorage setiap kali berubah
   */
  useEffect(() => {
    if (apiKey.trim()) {
      localStorage.setItem('api-playground-key', apiKey)
    }
  }, [apiKey])

  /**
   * Mendapatkan warna status berdasarkan status code
   */
  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-black'
    if (status >= 400 && status < 500) return 'text-white'
    if (status >= 500) return 'text-red-600'
    return 'text-gray-600'
  }

  /**
   * Menangani pemilihan endpoint dari dropdown
   */
  const handleEndpointSelect = (endpointId: string) => {
    const [method, ...pathParts] = endpointId.split('::')
    const path = pathParts.join('::')
    const endpoint = API_ENDPOINTS.find(ep => ep.method === method && ep.path === path)
    if (endpoint) {
      setSelectedEndpoint(endpoint)
      setCustomPath(endpoint.path)
      setRequestBody(endpoint.bodyExample || '')
      setQueryParams('')
      setResponse(null)
    }
  }

  /**
   * Mengirim request ke API endpoint
   */
  const sendRequest = async () => {
    if (!selectedEndpoint) return

    // Validasi API key wajib
    if (!apiKey.trim()) {
      setResponse({
        status: 401,
        data: { error: 'API key is required. Please enter your API key to test the endpoints.' },
        headers: {}
      })
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      let url = customPath
      
      // Tambahkan query parameters jika ada
      if (queryParams.trim()) {
        const separator = url.includes('?') ? '&' : '?'
        url += separator + queryParams
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
        },
      }

      // Tambahkan body untuk POST, PUT requests
      if (selectedEndpoint.requiresBody && requestBody.trim()) {
        try {
          JSON.parse(requestBody) // Validasi JSON
          options.body = requestBody
        } catch (error) {
          throw new Error('Invalid JSON in request body')
        }
      }

      const res = await fetch(url, options)
      const data = await res.json()
      
      // Ambil headers response
      const headers: Record<string, string> = {}
      res.headers.forEach((value, key) => {
        headers[key] = value
      })

      setResponse({
        status: res.status,
        data,
        headers
      })
    } catch (error) {
      setResponse({
        status: 0,
        data: { error: error instanceof Error ? error.message : 'Unknown error' },
        headers: {}
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Mendapatkan warna badge berdasarkan HTTP method
   */
  const getMethodBadgeVariant = (method: string) => {
    switch (method) {
      case 'GET': return 'secondary'
      case 'POST': return 'default'
      case 'PUT': return 'outline'
      case 'DELETE': return 'destructive'
      default: return 'secondary'
    }
  }

  /**
   * Mengisi form dengan contoh preset berdasarkan endpoint
   */
  const loadPreset = (presetType: 'example' | 'minimal') => {
    if (!selectedEndpoint) return

    if (presetType === 'example') {
      // Load example preset dengan data lengkap
      if (selectedEndpoint.path.includes('content-types')) {
        if (selectedEndpoint.method === 'POST') {
          setRequestBody(JSON.stringify({
            name: 'product',
            display_name: 'Product',
            description: 'Product catalog content type',
            fields: [
              {
                name: 'title',
                type: 'text',
                required: true,
                validation: { min_length: 3, max_length: 100 }
              },
              {
                name: 'description',
                type: 'textarea',
                required: true
              },
              {
                name: 'price',
                type: 'number',
                required: true,
                validation: { min: 0 }
              },
              {
                name: 'category',
                type: 'select',
                required: true,
                options: ['electronics', 'clothing', 'books', 'home']
              },
              {
                name: 'featured_image',
                type: 'image',
                required: false
              }
            ],
            is_active: true
          }, null, 2))
        } else if (selectedEndpoint.method === 'PUT') {
          setCustomPath('/api/public/content-types/blog_post')
          setRequestBody(JSON.stringify({
            display_name: 'Updated Blog Post',
            description: 'Updated blog post content type',
            fields: [
              {
                name: 'title',
                type: 'text',
                required: true
              },
              {
                name: 'content',
                type: 'textarea',
                required: true
              },
              {
                name: 'author',
                type: 'text',
                required: false
              }
            ],
            is_active: true
          }, null, 2))
        } else if (selectedEndpoint.method === 'GET' && selectedEndpoint.path.includes('[slug]')) {
          setCustomPath('/api/public/content-types/blog_post')
        } else if (selectedEndpoint.method === 'DELETE') {
          setCustomPath('/api/public/content-types/blog_post')
        } else if (selectedEndpoint.method === 'GET') {
          setQueryParams('slug=blog_post')
        }
      } else if (selectedEndpoint.path.includes('content-entries')) {
        if (selectedEndpoint.method === 'POST') {
          setRequestBody(JSON.stringify({
            content_type: 'product',
            slug: 'iphone-15-pro',
            data: {
              title: 'iPhone 15 Pro',
              description: 'Latest iPhone with advanced camera system and titanium design',
              price: 999,
              category: 'electronics',
              featured_image: 'https://example.com/iphone-15-pro.jpg',
              tags: ['smartphone', 'apple', 'premium']
            },
            meta_data: {
              seo_title: 'iPhone 15 Pro - Premium Smartphone',
              seo_description: 'Get the latest iPhone 15 Pro with advanced features',
              author: 'Admin'
            },
            status: 'published'
          }, null, 2))
        } else if (selectedEndpoint.method === 'PUT') {
          setCustomPath('/api/public/content-entries/iphone-15-pro')
          setRequestBody(JSON.stringify({
            content_type: 'product',
            data: {
              title: 'iPhone 15 Pro Max',
              description: 'Updated iPhone with larger screen and better battery life',
              price: 1099,
              category: 'electronics',
              featured_image: 'https://example.com/iphone-15-pro-max.jpg',
              tags: ['smartphone', 'apple', 'premium', 'large-screen']
            },
            meta_data: {
              seo_title: 'iPhone 15 Pro Max - Premium Large Smartphone',
              seo_description: 'Get the latest iPhone 15 Pro Max with advanced features',
              author: 'Admin',
              updated_by: 'Editor'
            },
            status: 'published'
          }, null, 2))
        } else if (selectedEndpoint.method === 'GET' && selectedEndpoint.path.includes('[slug]')) {
          setCustomPath('/api/public/content-entries/iphone-15-pro')
          setQueryParams('content_type=product')
        } else if (selectedEndpoint.method === 'DELETE') {
          setCustomPath('/api/public/content-entries/iphone-15-pro')
          setQueryParams('content_type=product')
        } else if (selectedEndpoint.method === 'GET') {
          setQueryParams('content_type=product&limit=10&status=published&sort=created_at&order=desc')
        }
      } else if (selectedEndpoint.path.includes('media')) {
        setQueryParams('type=image&limit=20&folder_id=1')
      }
    } else if (presetType === 'minimal') {
      // Load minimal preset dengan data minimum yang diperlukan
      if (selectedEndpoint.path.includes('content-types')) {
        if (selectedEndpoint.method === 'POST') {
          setRequestBody(JSON.stringify({
            name: 'blog',
            display_name: 'Blog',
            fields: [
              {
                name: 'title',
                type: 'text',
                required: true
              }
            ]
          }, null, 2))
        } else if (selectedEndpoint.method === 'PUT') {
          setCustomPath('/api/public/content-types/blog')
          setRequestBody(JSON.stringify({
            display_name: 'Updated Blog'
          }, null, 2))
        }
      } else if (selectedEndpoint.path.includes('content-entries')) {
        if (selectedEndpoint.method === 'POST') {
          setRequestBody(JSON.stringify({
            content_type: 'blog',
            data: {
              title: 'My Blog Post'
            }
          }, null, 2))
        } else if (selectedEndpoint.method === 'PUT') {
          setCustomPath('/api/public/content-entries/my-blog-post')
          setRequestBody(JSON.stringify({
            content_type: 'blog',
            data: {
              title: 'Updated Blog Post'
            }
          }, null, 2))
        } else if (selectedEndpoint.method === 'GET' && selectedEndpoint.path.includes('[slug]')) {
          setCustomPath('/api/public/content-entries/my-blog-post')
          setQueryParams('content_type=blog')
        } else if (selectedEndpoint.method === 'DELETE') {
          setCustomPath('/api/public/content-entries/my-blog-post')
          setQueryParams('content_type=blog')
        } else if (selectedEndpoint.method === 'GET') {
          setQueryParams('content_type=blog')
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Playground</h2>
        <p className="text-muted-foreground">
          Uji coba API endpoints secara interaktif dengan form yang mudah digunakan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Request</h3>
          
          <div className="space-y-4">
            {/* Endpoint Selection */}
            <div>
              <Label htmlFor="endpoint">Pilih Endpoint</Label>
              <Select onValueChange={handleEndpointSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih API endpoint..." />
                </SelectTrigger>
                <SelectContent>
                  {API_ENDPOINTS.map((endpoint, index) => (
                    <SelectItem key={index} value={`${endpoint.method}::${endpoint.path}`}>
                      <div className="flex items-center gap-2">
                        <Badge variant={getMethodBadgeVariant(endpoint.method)} className="text-xs">
                          {endpoint.method}
                        </Badge>
                        <span className="text-sm">{endpoint.path}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEndpoint && (
              <>
                {/* API Key Input */}
                <div>
                  <Label htmlFor="api-key">API Key *</Label>
                  <Input
                    id="api-key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan API key Anda (sk-...)"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    API key diperlukan untuk mengakses public endpoints. 
                    <br />
                    Dapatkan API key di halaman Settings → API Keys.
                    <br />
                    <strong>Catatan:</strong> Semua endpoint PUT, POST, dan DELETE memerlukan API key yang valid.
                  </p>
                </div>

                {/* Method and Path */}
                <div className="flex items-center gap-2">
                  <Badge variant={getMethodBadgeVariant(selectedEndpoint.method)}>
                    {selectedEndpoint.method}
                  </Badge>
                  <Input
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="API path..."
                    className="flex-1"
                  />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {selectedEndpoint.description}
                </p>

                {/* Query Parameters */}
                {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
                  <div>
                    <Label htmlFor="query-params">Query Parameters</Label>
                    <Input
                      id="query-params"
                      value={queryParams}
                      onChange={(e) => setQueryParams(e.target.value)}
                      placeholder={`Contoh: ${selectedEndpoint.queryParams.join('=value&')}=value`}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available params: {selectedEndpoint.queryParams.join(', ')}
                    </p>
                  </div>
                )}

                {/* Request Body */}
                {selectedEndpoint.requiresBody && (
                  <div>
                    <Label htmlFor="request-body">Request Body (JSON)</Label>
                    <Textarea
                      id="request-body"
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      placeholder="Enter JSON request body..."
                      rows={10}
                      className="font-mono text-sm"
                    />
                  </div>
                )}

                {/* Preset Buttons */}
                <div className="flex gap-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => loadPreset('example')}
                    disabled={!selectedEndpoint}
                  >
                    Load Example
                  </Button>
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => loadPreset('minimal')}
                    disabled={!selectedEndpoint}
                  >
                    Load Minimal
                  </Button>
                </div>

                {/* Send Button */}
                <Button 
                  onClick={sendRequest} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </Button>
              </>
            )}
          </div>
        </Card>

        {/* Response Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Response</h3>
          
          {response ? (
            <Tabs defaultValue="body" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="body">Response Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="body" className="space-y-4">
                {/* Status */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge className={getStatusColor(response.status)}>
                    {response.status}
                  </Badge>
                </div>

                {/* Response Data */}
                <div>
                  <Label>Response Data</Label>
                  <Textarea
                    value={JSON.stringify(response.data, null, 2)}
                    readOnly
                    rows={15}
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="headers" className="space-y-4">
                <div>
                  <Label>Response Headers</Label>
                  <Textarea
                    value={JSON.stringify(response.headers, null, 2)}
                    readOnly
                    rows={10}
                    className="font-mono text-sm bg-gray-50 dark:bg-gray-900"
                  />
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Pilih endpoint dan kirim request untuk melihat response</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}