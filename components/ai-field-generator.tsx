"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Wand2, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Database,
  Eye,
  EyeOff
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface GeneratedField {
  field_name: string
  display_name: string
  field_type: string
  is_required: boolean
  is_unique: boolean
  default_value?: string
  help_text?: string
  validation_rules?: Record<string, unknown>
  field_options?: Record<string, unknown>
  sort_order: number
}

interface FieldGenerationResponse {
  fields: GeneratedField[]
  suggestions: string[]
  reasoning: string
}

interface AIFieldGeneratorProps {
  onFieldsGenerated: (fields: GeneratedField[]) => void
  contentTypeName?: string
  contentTypeDescription?: string
}

/**
 * Komponen untuk generate fields menggunakan AI
 */
export function AIFieldGenerator({ 
  onFieldsGenerated, 
  contentTypeName = '', 
  contentTypeDescription = '' 
}: AIFieldGeneratorProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [generatedData, setGeneratedData] = useState<FieldGenerationResponse | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    contentTypeName: contentTypeName,
    contentTypeDescription: contentTypeDescription,
    businessDomain: 'general',
    targetAudience: 'general audience',
    additionalRequirements: ''
  })

  // Business domain options
  const businessDomains = [
    { value: 'general', label: 'General' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'blog', label: 'Blog/News' },
    { value: 'portfolio', label: 'Portfolio' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'travel', label: 'Travel' }
  ]

  // Generate fields dengan AI
  const generateFields = async () => {
    if (!formData.contentTypeName.trim() || !formData.contentTypeDescription.trim()) {
      toast({
        title: "Error",
        description: "Nama dan deskripsi content type harus diisi",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/ai/generate-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        setGeneratedData(result.data)
        setShowPreview(true)
        toast({
          title: "Berhasil",
          description: `${result.data.fields.length} fields berhasil di-generate dengan AI`
        })
      } else {
        throw new Error(result.error || 'Failed to generate fields')
      }
    } catch (error) {
      console.error('Error generating fields:', error)
      toast({
        title: "Error",
        description: "Gagal generate fields dengan AI",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Apply generated fields
  const applyFields = () => {
    if (generatedData) {
      onFieldsGenerated(generatedData.fields)
      setShowPreview(false)
      toast({
        title: "Berhasil",
        description: "Fields telah diterapkan ke form"
      })
    }
  }

  // Get field type badge variant
  const getFieldTypeBadgeVariant = (fieldType: string) => {
    switch (fieldType) {
      case 'text':
      case 'textarea':
        return 'default'
      case 'rich_text':
        return 'secondary'
      case 'number':
        return 'outline'
      case 'boolean':
        return 'destructive'
      case 'date':
      case 'datetime':
        return 'default'
      case 'select':
      case 'multi_select':
        return 'secondary'
      case 'media':
        return 'outline'
      case 'relation':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <div className="space-y-4">
      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5" />
            <span>AI Field Generator</span>
          </CardTitle>
          <CardDescription>
            Generate fields untuk content type menggunakan Gemini AI berdasarkan kebutuhan bisnis Anda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentTypeName">Nama Content Type *</Label>
              <Input
                id="contentTypeName"
                value={formData.contentTypeName}
                onChange={(e) => setFormData(prev => ({ ...prev, contentTypeName: e.target.value }))}
                placeholder="Contoh: Product, Article, Event"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessDomain">Domain Bisnis</Label>
              <Select 
                value={formData.businessDomain} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, businessDomain: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {businessDomains.map((domain) => (
                    <SelectItem key={domain.value} value={domain.value}>
                      {domain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contentTypeDescription">Deskripsi Content Type *</Label>
            <Textarea
              id="contentTypeDescription"
              value={formData.contentTypeDescription}
              onChange={(e) => setFormData(prev => ({ ...prev, contentTypeDescription: e.target.value }))}
              placeholder="Jelaskan apa yang akan disimpan dalam content type ini..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
              placeholder="Contoh: customers, students, professionals"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalRequirements">Requirements Tambahan</Label>
            <Textarea
              id="additionalRequirements"
              value={formData.additionalRequirements}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalRequirements: e.target.value }))}
              placeholder="Requirements khusus atau field yang harus ada..."
              rows={2}
            />
          </div>

          <Button 
            onClick={generateFields} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Fields...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Fields dengan AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Fields Preview */}
      {generatedData && showPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5" />
                  <span>Generated Fields Preview</span>
                </CardTitle>
                <CardDescription>
                  {generatedData.fields.length} fields di-generate berdasarkan kebutuhan Anda
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button onClick={applyFields} size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply Fields
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Reasoning */}
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <strong>AI Reasoning:</strong> {generatedData.reasoning}
              </AlertDescription>
            </Alert>

            {/* Fields List */}
            <div className="space-y-3">
              <h4 className="font-medium">Generated Fields:</h4>
              <div className="space-y-2">
                {generatedData.fields.map((field, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{field.display_name}</span>
                        <Badge variant={getFieldTypeBadgeVariant(field.field_type)} className="text-xs">
                          {field.field_type}
                        </Badge>
                        {field.is_required && (
                          <Badge variant="destructive" className="text-xs">Required</Badge>
                        )}
                        {field.is_unique && (
                          <Badge variant="outline" className="text-xs">Unique</Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Order: {field.sort_order}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Field name:</strong> <code className="text-xs bg-muted px-1 rounded">{field.field_name}</code></p>
                      {field.help_text && <p><strong>Help:</strong> {field.help_text}</p>}
                      {field.default_value && <p><strong>Default:</strong> {field.default_value}</p>}
                      {field.validation_rules && (
                        <p><strong>Validation:</strong> {JSON.stringify(field.validation_rules)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggestions */}
            {generatedData.suggestions && generatedData.suggestions.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>AI Suggestions</span>
                  </h4>
                  <ul className="space-y-1">
                    {generatedData.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
