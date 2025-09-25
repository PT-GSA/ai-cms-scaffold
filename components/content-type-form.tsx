'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical, FileText, File, Package, Settings, Users, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'

// Field types yang didukung
const FIELD_TYPES = [
  { value: 'text', label: 'Text', description: 'Single line text input' },
  { value: 'textarea', label: 'Textarea', description: 'Multi-line text input' },
  { value: 'rich_text', label: 'Rich Text', description: 'WYSIWYG editor' },
  { value: 'number', label: 'Number', description: 'Numeric input' },
  { value: 'boolean', label: 'Boolean', description: 'True/false checkbox' },
  { value: 'date', label: 'Date', description: 'Date picker' },
  { value: 'datetime', label: 'DateTime', description: 'Date and time picker' },
  { value: 'email', label: 'Email', description: 'Email address input' },
  { value: 'url', label: 'URL', description: 'Website URL input' },
  { value: 'select', label: 'Select', description: 'Dropdown selection' },
  { value: 'multi_select', label: 'Multi Select', description: 'Multiple selection' },
  { value: 'media', label: 'Media', description: 'File/image upload' },
  { value: 'relation', label: 'Relation', description: 'Reference to other content' },
  { value: 'json', label: 'JSON', description: 'Custom JSON data' }
]

// Icon options untuk content types
const ICON_OPTIONS = [
  { value: 'FileText', label: 'FileText', icon: FileText },
  { value: 'File', label: 'File', icon: File },
  { value: 'Package', label: 'Package', icon: Package },
  { value: 'Settings', label: 'Settings', icon: Settings },
  { value: 'Users', label: 'Users', icon: Users },
  { value: 'Calendar', label: 'Calendar', icon: Calendar }
]

interface ContentTypeField {
  id?: number
  field_name: string
  display_name: string
  field_type: string
  is_required: boolean
  is_unique: boolean
  default_value: string
  help_text: string
  sort_order: number
  validation_rules?: Record<string, unknown>
  field_options?: Record<string, unknown>
}

interface ContentType {
  id?: number
  name: string
  display_name: string
  description: string
  icon: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
  fields?: ContentTypeField[]
}

interface ContentTypeFormProps {
  contentType?: ContentType
  onSave: (contentType: ContentType) => Promise<void>
  onCancel: () => void
}

/**
 * Form component untuk create/edit content types
 * Mendukung dynamic field management dengan drag & drop
 */
export default function ContentTypeForm({ contentType, onSave, onCancel }: ContentTypeFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  // Form state untuk content type
  const [formData, setFormData] = useState<ContentType>({
    name: '',
    display_name: '',
    description: '',
    icon: 'FileText',
    fields: []
  })

  // State untuk fields management
  const [fields, setFields] = useState<ContentTypeField[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Initialize form data
  useEffect(() => {
    if (contentType) {
      setFormData(contentType)
      setFields(contentType.fields || [])
    }
  }, [contentType])

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof ContentType, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate name from display_name
    if (field === 'display_name' && !contentType) {
      const generatedName = value.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .trim()
      
      setFormData(prev => ({
        ...prev,
        name: generatedName
      }))
    }
  }

  /**
   * Add new field to content type
   */
  const addField = () => {
    const newField: ContentTypeField = {
      field_name: '',
      display_name: '',
      field_type: 'text',
      is_required: false,
      is_unique: false,
      default_value: '',
      help_text: '',
      sort_order: fields.length
    }

    setFields(prev => [...prev, newField])
  }

  /**
   * Update field data
   */
  const updateField = (index: number, field: keyof ContentTypeField, value: string | boolean | number) => {
    setFields(prev => prev.map((f, i) => {
      if (i === index) {
        const updated = { ...f, [field]: value }
        
        // Auto-generate field_name from display_name
        if (field === 'display_name' && typeof value === 'string') {
          updated.field_name = value.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '_')
            .trim()
        }
        
        return updated
      }
      return f
    }))
  }

  /**
   * Remove field from content type
   */
  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index)
      .map((field, i) => ({ ...field, sort_order: i })))
  }

  /**
   * Handle drag and drop reordering
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return

    const newFields = [...fields]
    const draggedField = newFields[draggedIndex]
    
    // Remove dragged field
    newFields.splice(draggedIndex, 1)
    
    // Insert at new position
    newFields.splice(dropIndex, 0, draggedField)
    
    // Update sort orders
    const reorderedFields = newFields.map((field, index) => ({
      ...field,
      sort_order: index
    }))
    
    setFields(reorderedFields)
    setDraggedIndex(null)
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama content type harus diisi",
        variant: "destructive"
      })
      return false
    }

    if (!formData.display_name.trim()) {
      toast({
        title: "Error", 
        description: "Display name harus diisi",
        variant: "destructive"
      })
      return false
    }

    // Validate fields
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      if (!field.field_name.trim() || !field.display_name.trim()) {
        toast({
          title: "Error",
          description: `Field ${i + 1}: Nama field dan display name harus diisi`,
          variant: "destructive"
        })
        return false
      }
    }

    // Check for duplicate field names
    const fieldNames = fields.map(f => f.field_name.toLowerCase())
    const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index)
    
    if (duplicates.length > 0) {
      toast({
        title: "Error",
        description: `Nama field duplikat ditemukan: ${duplicates.join(', ')}`,
        variant: "destructive"
      })
      return false
    }

    return true
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const contentTypeData: ContentType = {
        ...formData,
        fields: fields
      }

      await onSave(contentTypeData)
      
      toast({
        title: "Berhasil",
        description: `Content type ${contentType ? 'diperbarui' : 'dibuat'} successfully`
      })
      
    } catch (error) {
      console.error('Error saving content type:', error)
      toast({
        title: "Error",
        description: `Gagal ${contentType ? 'memperbarui' : 'membuat'} content type`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get icon component by name
   */
  // const getIconComponent = (iconName: string) => {
  //   const iconOption = ICON_OPTIONS.find(opt => opt.value === iconName)
  //   return iconOption ? iconOption.icon : FileText
  // }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Content Type Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Content Type</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="e.g., &quot;Blog Article&quot;"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Name (System) *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., blog_article"
                disabled={!!contentType}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe what this content type is used for..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((option) => {
                  const IconComponent = option.icon
                  return (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fields Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fields</CardTitle>
          <Button type="button" onClick={addField} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent>
          {fields.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada fields. Klik &quot;Add Field&quot; untuk menambahkan.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fields.map((field, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="border rounded-lg p-4 bg-card cursor-move hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-grab" />
                    
                    <div className="flex-1 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Display Name *</Label>
                          <Input
                            value={field.display_name}
                            onChange={(e) => updateField(index, 'display_name', e.target.value)}
                            placeholder="e.g., Title"
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Field Name *</Label>
                          <Input
                            value={field.field_name}
                            onChange={(e) => updateField(index, 'field_name', e.target.value)}
                            placeholder="e.g., title"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Field Type *</Label>
                          <Select 
                            value={field.field_type} 
                            onValueChange={(value) => updateField(index, 'field_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">{type.description}</div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Default Value</Label>
                          <Input
                            value={field.default_value}
                            onChange={(e) => updateField(index, 'default_value', e.target.value)}
                            placeholder="Optional default value"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Help Text</Label>
                        <Input
                          value={field.help_text}
                          onChange={(e) => updateField(index, 'help_text', e.target.value)}
                          placeholder="Help text for content editors"
                        />
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`required-${index}`}
                            checked={field.is_required}
                            onCheckedChange={(checked) => updateField(index, 'is_required', !!checked)}
                          />
                          <Label htmlFor={`required-${index}`}>Required</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`unique-${index}`}
                            checked={field.is_unique}
                            onCheckedChange={(checked) => updateField(index, 'is_unique', !!checked)}
                          />
                          <Label htmlFor={`unique-${index}`}>Unique</Label>
                        </div>

                        <Badge variant="outline">
                          Order: {field.sort_order + 1}
                        </Badge>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (contentType ? 'Update' : 'Create')} Content Type
        </Button>
      </div>
    </form>
  )
}