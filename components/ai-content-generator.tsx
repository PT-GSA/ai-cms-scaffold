'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { 
  Sparkles, 
  Wand2, 
  Loader2, 
  Copy, 
  RefreshCw,
  Check,
  Lightbulb,
  Target,
  FileText,
  Globe
} from 'lucide-react'

type ContentType = 'blog_post' | 'article' | 'product_description' | 'news' | 'tutorial'
type Tone = 'professional' | 'casual' | 'friendly' | 'formal' | 'creative'
type Length = 'short' | 'medium' | 'long'

interface GeneratedContent {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  suggestedImages: string[]
}

export function AIContentGenerator({ onContentGenerated }: { onContentGenerated?: (content: GeneratedContent) => void }) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<{
    topic: string
    contentType: ContentType
    tone: Tone
    length: Length
    language: string
    keywords: string
    targetAudience: string
    additionalInstructions: string
  }>({
    topic: '',
    contentType: 'blog_post',
    tone: 'professional',
    length: 'medium',
    language: 'id',
    keywords: '',
    targetAudience: '',
    additionalInstructions: ''
  })

  const contentTypes = [
    { value: 'blog_post', label: 'Blog Post', icon: FileText },
    { value: 'article', label: 'Article', icon: FileText },
    { value: 'product_description', label: 'Product Description', icon: Target },
    { value: 'news', label: 'News', icon: Globe },
    { value: 'tutorial', label: 'Tutorial', icon: Lightbulb }
  ]

  const tones = [
    { value: 'professional', label: 'Professional' },
    { value: 'casual', label: 'Casual' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
    { value: 'creative', label: 'Creative' }
  ]

  const lengths = [
    { value: 'short', label: 'Short (200-300 words)' },
    { value: 'medium', label: 'Medium (500-800 words)' },
    { value: 'long', label: 'Long (1000-1500 words)' }
  ]

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast({
        title: 'Error',
        description: 'Topic is required',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedContent(result.data)
        toast({
          title: 'Berhasil',
          description: 'Content berhasil di-generate dengan AI'
        })
      } else {
        throw new Error(result.error || 'Failed to generate content')
      }
    } catch (error) {
      console.error('Error generating content:', error)
      toast({
        title: 'Error',
        description: 'Gagal generate content dengan AI',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: 'Berhasil',
        description: 'Text berhasil di-copy ke clipboard'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Gagal copy text',
        variant: 'destructive'
      })
    }
  }

  const handleUseContent = () => {
    if (generatedContent && onContentGenerated) {
      onContentGenerated(generatedContent)
      setIsOpen(false)
      toast({
        title: 'Berhasil',
        description: 'Generated content berhasil digunakan'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Generate dengan AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wand2 className="mr-2 h-5 w-5" />
            AI Content Generator
          </DialogTitle>
          <DialogDescription>
            Generate content berkualitas tinggi menggunakan Gemini AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Content Generation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic *</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Masukkan topik content..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <select
                    id="contentType"
                    value={formData.contentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, contentType: e.target.value as ContentType }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    {contentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <select
                    id="tone"
                    value={formData.tone}
                    onChange={(e) => setFormData(prev => ({ ...prev, tone: e.target.value as Tone }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                  >
                    {tones.map(tone => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Length</Label>
                  <select
                    id="length"
                    value={formData.length}
                    onChange={(e) => setFormData(prev => ({ ...prev, length: e.target.value as Length }))}
                    className="w-full p-2 border border-gray-300 dark:border-600 rounded-md"
                  >
                    {lengths.map(length => (
                      <option key={length.value} value={length.value}>
                        {length.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma separated)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetAudience">Target Audience</Label>
                  <Input
                    id="targetAudience"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                    placeholder="e.g., young professionals, students"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalInstructions">Additional Instructions</Label>
                <textarea
                  id="additionalInstructions"
                  value={formData.additionalInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                  rows={3}
                  placeholder="Instruksi tambahan untuk AI..."
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={loading || !formData.topic.trim()}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Generated Content
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate()}
                      disabled={loading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUseContent}
                    >
                      Use Content
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Title</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedContent.title, 'title')}
                    >
                      {copiedField === 'title' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input value={generatedContent.title} readOnly />
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Excerpt</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(generatedContent.excerpt, 'excerpt')}
                    >
                      {copiedField === 'excerpt' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Input value={generatedContent.excerpt} readOnly />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>Content</Label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <RichTextEditor
                      content={generatedContent.content}
                      editable={false}
                      className="min-h-[200px]"
                    />
                  </div>
                </div>

                {/* SEO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Title</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(generatedContent.metaTitle, 'metaTitle')}
                      >
                        {copiedField === 'metaTitle' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Input value={generatedContent.metaTitle} readOnly />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Meta Description</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(generatedContent.metaDescription, 'metaDescription')}
                      >
                        {copiedField === 'metaDescription' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <textarea
                      value={generatedContent.metaDescription}
                      readOnly
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-2">
                    {generatedContent.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Suggested Images */}
                <div className="space-y-2">
                  <Label>Suggested Images</Label>
                  <div className="space-y-1">
                    {generatedContent.suggestedImages.map((image, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {index + 1}. {image}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
