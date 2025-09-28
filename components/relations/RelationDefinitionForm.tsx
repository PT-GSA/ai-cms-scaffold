'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { 
  ContentRelationDefinitionWithCounts,
  RelationType,
  CascadeBehavior,
  CreateRelationDefinitionRequest 
} from '@/types/relations';

interface RelationDefinitionFormProps {
  initialData?: ContentRelationDefinitionWithCounts | null;
  onSubmit: (data: CreateRelationDefinitionRequest) => Promise<void>;
  onCancel: () => void;
}

// Mock content types - in real app, fetch from API
const CONTENT_TYPES = [
  { id: 1, name: 'article', display_name: 'Article' },
  { id: 2, name: 'page', display_name: 'Page' },
  { id: 3, name: 'product', display_name: 'Product' },
  { id: 4, name: 'tag', display_name: 'Tag' },
  { id: 5, name: 'category', display_name: 'Category' }
];

export function RelationDefinitionForm({
  initialData,
  onSubmit,
  onCancel
}: RelationDefinitionFormProps) {
  const [formData, setFormData] = useState<CreateRelationDefinitionRequest>({
    name: '',
    display_name: '',
    description: '',
    source_content_type_id: 0,
    source_field_name: '',
    target_content_type_id: 0,
    target_field_name: '',
    relation_type: 'many_to_many',
    is_bidirectional: false,
    is_required: false,
    on_source_delete: 'cascade',
    on_target_delete: 'set_null',
    max_relations: undefined,
    min_relations: 0,
    metadata: {},
    sort_order: 0
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with existing data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        display_name: initialData.display_name,
        description: initialData.description || '',
        source_content_type_id: initialData.source_content_type_id,
        source_field_name: initialData.source_field_name,
        target_content_type_id: initialData.target_content_type_id,
        target_field_name: initialData.target_field_name || '',
        relation_type: initialData.relation_type,
        is_bidirectional: initialData.is_bidirectional,
        is_required: initialData.is_required,
        on_source_delete: initialData.on_source_delete,
        on_target_delete: initialData.on_target_delete,
        max_relations: initialData.max_relations || undefined,
        min_relations: initialData.min_relations,
        metadata: initialData.metadata || {},
        sort_order: initialData.sort_order
      });
    }
  }, [initialData]);

  // Auto-generate name from display_name
  const handleDisplayNameChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      display_name: value,
      name: prev.name || value.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
    }));
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof CreateRelationDefinitionRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Validate form
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.name)) {
      newErrors.name = 'Name can only contain lowercase letters, numbers, and underscores';
    }

    if (!formData.display_name) {
      newErrors.display_name = 'Display name is required';
    }

    if (!formData.source_content_type_id) {
      newErrors.source_content_type_id = 'Source content type is required';
    }

    if (!formData.target_content_type_id) {
      newErrors.target_content_type_id = 'Target content type is required';
    }

    if (!formData.source_field_name) {
      newErrors.source_field_name = 'Source field name is required';
    }

    if (formData.source_content_type_id === formData.target_content_type_id && 
        formData.source_field_name === formData.target_field_name) {
      newErrors.target_field_name = 'Target field name must be different from source when content types are the same';
    }

    if (formData.min_relations !== undefined && formData.min_relations < 0) {
      newErrors.min_relations = 'Minimum relations cannot be negative';
    }

    if (formData.max_relations !== undefined && formData.max_relations < 1) {
      newErrors.max_relations = 'Maximum relations must be at least 1';
    }

    if (formData.max_relations !== undefined && formData.min_relations !== undefined && formData.min_relations > formData.max_relations) {
      newErrors.min_relations = 'Minimum relations cannot be greater than maximum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ general: error instanceof Error ? error.message : 'Failed to save relation definition' });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, onSubmit]);

  // Get content type name by ID
  const getContentTypeName = (id: number) => {
    return CONTENT_TYPES.find(ct => ct.id === id)?.name || '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Errors */}
      {errors.general && (
        <Alert variant="destructive">
          <AlertDescription>{errors.general}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="display_name">Display Name *</Label>
            <Input
              id="display_name"
              value={formData.display_name}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="e.g., Article Tags"
              className={errors.display_name ? 'border-red-500' : ''}
            />
            {errors.display_name && (
              <p className="text-sm text-red-600 mt-1">{errors.display_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Internal Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g., article_tags"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Describe what this relation represents"
            rows={3}
          />
        </div>
      </Card>

      {/* Content Types */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Content Types</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="source_content_type">Source Content Type *</Label>
            <Select
              value={formData.source_content_type_id.toString()}
              onValueChange={(value) => handleFieldChange('source_content_type_id', parseInt(value))}
            >
              <SelectTrigger className={errors.source_content_type_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select source type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.source_content_type_id && (
              <p className="text-sm text-red-600 mt-1">{errors.source_content_type_id}</p>
            )}
          </div>

          <div>
            <Label htmlFor="target_content_type">Target Content Type *</Label>
            <Select
              value={formData.target_content_type_id.toString()}
              onValueChange={(value) => handleFieldChange('target_content_type_id', parseInt(value))}
            >
              <SelectTrigger className={errors.target_content_type_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select target type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(type => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.target_content_type_id && (
              <p className="text-sm text-red-600 mt-1">{errors.target_content_type_id}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="source_field_name">Source Field Name *</Label>
            <Input
              id="source_field_name"
              value={formData.source_field_name}
              onChange={(e) => handleFieldChange('source_field_name', e.target.value)}
              placeholder="e.g., tags"
              className={errors.source_field_name ? 'border-red-500' : ''}
            />
            {errors.source_field_name && (
              <p className="text-sm text-red-600 mt-1">{errors.source_field_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="target_field_name">Target Field Name</Label>
            <Input
              id="target_field_name"
              value={formData.target_field_name}
              onChange={(e) => handleFieldChange('target_field_name', e.target.value)}
              placeholder="e.g., tagged_articles (for bidirectional)"
              className={errors.target_field_name ? 'border-red-500' : ''}
            />
            {errors.target_field_name && (
              <p className="text-sm text-red-600 mt-1">{errors.target_field_name}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Relation Configuration */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Relation Configuration</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="relation_type">Relation Type *</Label>
            <Select
              value={formData.relation_type}
              onValueChange={(value) => handleFieldChange('relation_type', value as RelationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one_to_one">One-to-One</SelectItem>
                <SelectItem value="one_to_many">One-to-Many</SelectItem>
                <SelectItem value="many_to_many">Many-to-Many</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_bidirectional"
              checked={formData.is_bidirectional}
              onCheckedChange={(checked) => handleFieldChange('is_bidirectional', checked)}
            />
            <Label htmlFor="is_bidirectional">Bidirectional</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => handleFieldChange('is_required', checked)}
            />
            <Label htmlFor="is_required">Required</Label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="min_relations">Minimum Relations</Label>
            <Input
              id="min_relations"
              type="number"
              min="0"
              value={formData.min_relations}
              onChange={(e) => handleFieldChange('min_relations', parseInt(e.target.value) || 0)}
              className={errors.min_relations ? 'border-red-500' : ''}
            />
            {errors.min_relations && (
              <p className="text-sm text-red-600 mt-1">{errors.min_relations}</p>
            )}
          </div>

          <div>
            <Label htmlFor="max_relations">Maximum Relations</Label>
            <Input
              id="max_relations"
              type="number"
              min="1"
              value={formData.max_relations || ''}
              onChange={(e) => handleFieldChange('max_relations', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Unlimited"
              className={errors.max_relations ? 'border-red-500' : ''}
            />
            {errors.max_relations && (
              <p className="text-sm text-red-600 mt-1">{errors.max_relations}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Cascade Behavior */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Cascade Behavior</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="on_source_delete">On Source Delete</Label>
            <Select
              value={formData.on_source_delete}
              onValueChange={(value) => handleFieldChange('on_source_delete', value as CascadeBehavior)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cascade">Cascade (delete relations)</SelectItem>
                <SelectItem value="restrict">Restrict (prevent deletion)</SelectItem>
                <SelectItem value="set_null">Set Null</SelectItem>
                <SelectItem value="no_action">No Action</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="on_target_delete">On Target Delete</Label>
            <Select
              value={formData.on_target_delete}
              onValueChange={(value) => handleFieldChange('on_target_delete', value as CascadeBehavior)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cascade">Cascade (delete relations)</SelectItem>
                <SelectItem value="restrict">Restrict (prevent deletion)</SelectItem>
                <SelectItem value="set_null">Set Null</SelectItem>
                <SelectItem value="no_action">No Action</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <X size={16} className="mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save size={16} className="mr-2" />
          {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}

export default RelationDefinitionForm;