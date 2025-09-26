'use client'

import { useState, useEffect, ComponentType } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { 
  Search, 
  Eye, 
  Download,
  BookOpen,
  FileText,
  File,
  Package,
  Grid,
  List,
  Star,
  Clock,
  User,
  Tag
} from 'lucide-react'

interface ContentType {
  id: string
  name: string
  display_name: string
  icon: string
}

interface Template {
  id: string
  name: string
  description: string
  content_type: ContentType
  preview_data: Record<string, unknown>
  tags: string[]
  is_featured: boolean
  usage_count: number
  created_at: string
  created_by: string
}

// Mock data untuk template library
const mockTemplates: Template[] = [
  {
    id: '1',
    name: 'Blog Article Template',
    description: 'Template untuk artikel blog dengan struktur lengkap termasuk meta description, featured image, dan content sections.',
    content_type: { id: '1', name: 'article', display_name: 'Article', icon: 'FileText' },
    preview_data: {
      title: 'How to Build Amazing Web Applications',
      meta_description: 'Learn the best practices for building modern web applications with React and Next.js',
      featured_image: '/placeholder.jpg',
      content: 'This is a comprehensive guide to building web applications...',
      tags: ['web development', 'react', 'nextjs']
    },
    tags: ['blog', 'article', 'content'],
    is_featured: true,
    usage_count: 45,
    created_at: '2024-01-15T10:00:00Z',
    created_by: 'Admin'
  },
  {
    id: '2',
    name: 'Product Page Template',
    description: 'Template untuk halaman produk e-commerce dengan spesifikasi, galeri gambar, dan call-to-action.',
    content_type: { id: '2', name: 'page', display_name: 'Page', icon: 'File' },
    preview_data: {
      title: 'Premium Wireless Headphones',
      description: 'Experience crystal-clear audio with our premium wireless headphones',
      price: '$199.99',
      specifications: {
        battery: '30 hours',
        connectivity: 'Bluetooth 5.0',
        weight: '250g'
      },
      gallery: ['/placeholder.jpg', '/placeholder.jpg']
    },
    tags: ['ecommerce', 'product', 'page'],
    is_featured: true,
    usage_count: 32,
    created_at: '2024-01-10T14:30:00Z',
    created_by: 'Admin'
  },
  {
    id: '3',
    name: 'Company About Page',
    description: 'Template untuk halaman tentang perusahaan dengan visi, misi, dan team members.',
    content_type: { id: '2', name: 'page', display_name: 'Page', icon: 'File' },
    preview_data: {
      title: 'About Our Company',
      hero_text: 'We are passionate about creating innovative solutions',
      vision: 'To be the leading technology company in our industry',
      mission: 'Delivering exceptional products that make a difference',
      team_members: [
        { name: 'John Doe', position: 'CEO', bio: 'Experienced leader...' }
      ]
    },
    tags: ['company', 'about', 'corporate'],
    is_featured: false,
    usage_count: 18,
    created_at: '2024-01-05T09:15:00Z',
    created_by: 'Admin'
  },
  {
    id: '4',
    name: 'Event Landing Page',
    description: 'Template untuk halaman landing event dengan countdown timer, speaker list, dan registration form.',
    content_type: { id: '2', name: 'page', display_name: 'Page', icon: 'File' },
    preview_data: {
      title: 'Tech Conference 2024',
      event_date: '2024-06-15',
      location: 'Jakarta Convention Center',
      description: 'Join us for the biggest tech conference of the year',
      speakers: [
        { name: 'Jane Smith', company: 'Tech Corp', topic: 'AI in Web Development' }
      ],
      ticket_price: '$99'
    },
    tags: ['event', 'landing', 'conference'],
    is_featured: false,
    usage_count: 12,
    created_at: '2024-01-01T16:45:00Z',
    created_by: 'Admin'
  }
]

/**
 * Halaman Template Library
 * Menampilkan template content entries yang bisa digunakan sebagai starting point
 */
export default function TemplateLibraryPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [templates, setTemplates] = useState<Template[]>([])
  const [contentTypes, setContentTypes] = useState<ContentType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContentType, setSelectedContentType] = useState('all')
  const [selectedTag, setSelectedTag] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)



  /**
   * Load templates dan content types
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load content types
        const contentTypesResponse = await fetch('/api/content-types')
        const contentTypesResult = await contentTypesResponse.json()
        
        if (contentTypesResult.success) {
          setContentTypes(contentTypesResult.data)
        }
        
        // Set mock templates
        setTemplates(mockTemplates)
        
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: 'Error',
          description: 'Gagal memuat data template library',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  /**
   * Filter templates berdasarkan search dan filter
   */
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesContentType = selectedContentType === 'all' || 
                              template.content_type.id === selectedContentType
    
    const matchesTag = selectedTag === 'all' || 
                      template.tags.includes(selectedTag)
    
    return matchesSearch && matchesContentType && matchesTag
  })

  /**
   * Get unique tags dari semua templates
   */
  const allTags = Array.from(new Set(templates.flatMap(t => t.tags))).sort()

  /**
   * Handle preview template
   */
  const handlePreview = (template: Template) => {
    setSelectedTemplate(template)
    setShowPreviewDialog(true)
  }

  /**
   * Handle use template - redirect ke create page dengan template data
   */
  const handleUseTemplate = (template: Template) => {
    // Encode template data untuk dikirim ke create page
    const templateData = encodeURIComponent(JSON.stringify({
      content_type_id: template.content_type.id,
      template_name: template.name,
      preview_data: template.preview_data
    }))
    
    router.push(`/dashboard/content-entries/new?template=${templateData}`)
  }

  /**
   * Get icon component berdasarkan nama icon
   */
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, ComponentType<{ className?: string }>> = {
      FileText,
      File,
      Package,
      BookOpen
    }
    const IconComponent = icons[iconName] || FileText
    return <IconComponent className="h-4 w-4" />
  }

  if (loading) {
    return (
      
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading template library...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Template Library</h1>
            <p className="text-gray-400 mt-2">
              Gunakan template siap pakai untuk mempercepat pembuatan content
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedContentType} onValueChange={setSelectedContentType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Content Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content Types</SelectItem>
              {contentTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Templates Grid/List */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Tidak ada template ditemukan</h3>
              <p className="text-muted-foreground text-center">
                Coba ubah filter pencarian atau kata kunci untuk menemukan template yang sesuai.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getIconComponent(template.content_type.icon)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {template.content_type.display_name}
                          </Badge>
                          {template.is_featured && (
                            <Badge variant="default" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4">
                    {template.description}
                  </CardDescription>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {template.usage_count} kali digunakan
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(template.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Gunakan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && getIconComponent(selectedTemplate.content_type.icon)}
                {selectedTemplate?.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTemplate?.description}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {selectedTemplate.content_type.display_name}
                  </Badge>
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Preview Data:</h4>
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                    {JSON.stringify(selectedTemplate.preview_data, null, 2)}
                  </pre>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreviewDialog(false)}
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => {
                      handleUseTemplate(selectedTemplate)
                      setShowPreviewDialog(false)
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Gunakan Template
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}