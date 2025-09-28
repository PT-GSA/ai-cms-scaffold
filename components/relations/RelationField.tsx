'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, ArrowUpDown, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { RelationItem } from './RelationItem';
import { RelationPickerModal } from './RelationPickerModal';
import { useRelationField } from '@/hooks/use-relations';
import { 
  ContentRelationDefinition,
  RelationType 
} from '@/types/relations';

interface RelationFieldProps {
  entryId: number;
  relationDefinition: ContentRelationDefinition;
  onSave?: (relations: Array<{ target_entry_id: number; relation_data?: any; sort_order?: number }>) => void;
  readOnly?: boolean;
  showSaveButton?: boolean;
  className?: string;
}

export function RelationField({
  entryId,
  relationDefinition,
  onSave,
  readOnly = false,
  showSaveButton = true,
  className = ''
}: RelationFieldProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    selectedItems,
    loading,
    canAddMore,
    hasChanges,
    maxSelections,
    addItem,
    removeItem,
    reorderItems,
    setSelectedItems
  } = useRelationField(
    entryId,
    relationDefinition.source_field_name,
    relationDefinition.max_relations || undefined
  );

  // Handle item selection from picker
  const handlePickerSelect = useCallback((items: any[]) => {
    const newItems = items.map(item => ({
      id: item.id,
      title: item.title || item.slug,
      content_type: item.content_type
    }));
    setSelectedItems(newItems);
  }, [setSelectedItems]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!onSave || !hasChanges) return;

    try {
      setIsSaving(true);
      const relations = selectedItems.map((item, index) => ({
        target_entry_id: item.id,
        sort_order: index
      }));
      
      await onSave(relations);
    } catch (error) {
      console.error('Error saving relations:', error);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, hasChanges, selectedItems]);

  // Handle reset
  const handleReset = useCallback(() => {
    // This will trigger a refetch from the hook
    window.location.reload();
  }, []);

  // Get relation type info
  const relationTypeInfo = useMemo(() => {
    const type = relationDefinition.relation_type;
    switch (type) {
      case 'one_to_one':
        return {
          label: 'One-to-One',
          description: 'This entry can only be related to one other entry',
          color: 'bg-blue-100 text-blue-800'
        };
      case 'one_to_many':
        return {
          label: 'One-to-Many',
          description: 'This entry can be related to multiple entries, but each target can only belong to one source',
          color: 'bg-green-100 text-green-800'
        };
      case 'many_to_many':
        return {
          label: 'Many-to-Many',
          description: 'This entry can be related to multiple entries, and each target can belong to multiple sources',
          color: 'bg-purple-100 text-purple-800'
        };
      default:
        return {
          label: type,
          description: '',
          color: 'bg-gray-100 text-gray-800'
        };
    }
  }, [relationDefinition.relation_type]);

  // Check constraints
  const constraintWarnings = useMemo(() => {
    const warnings = [];
    
    if (relationDefinition.min_relations && selectedItems.length < relationDefinition.min_relations) {
      warnings.push(`Minimum ${relationDefinition.min_relations} relations required`);
    }
    
    if (relationDefinition.max_relations && selectedItems.length > relationDefinition.max_relations) {
      warnings.push(`Maximum ${relationDefinition.max_relations} relations allowed`);
    }

    if (relationDefinition.is_required && selectedItems.length === 0) {
      warnings.push('At least one relation is required');
    }

    return warnings;
  }, [relationDefinition, selectedItems.length]);

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold">{relationDefinition.display_name}</h3>
            <Badge className={`text-xs px-2 py-1 ${relationTypeInfo.color}`}>
              {relationTypeInfo.label}
            </Badge>
            {relationDefinition.is_required && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
          </div>
          
          {relationDefinition.description && (
            <p className="text-sm text-gray-600 mb-2">{relationDefinition.description}</p>
          )}
          
          <p className="text-xs text-gray-500">{relationTypeInfo.description}</p>
        </div>

        {!readOnly && (
          <div className="flex gap-2">
            {showSaveButton && hasChanges && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RotateCcw size={14} className="mr-1" />
                  Reset
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || constraintWarnings.length > 0}
                >
                  <Save size={14} className="mr-1" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Constraint Warnings */}
      {constraintWarnings.length > 0 && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="text-sm space-y-1">
              {constraintWarnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Relations List */}
      <div className="space-y-3">
        {selectedItems.length > 0 ? (
          selectedItems.map((item, index) => (
            <RelationItem
              key={item.id}
              id={item.id}
              title={item.title}
              contentType={item.content_type}
              sortOrder={index}
              showRemove={!readOnly}
              showDragHandle={!readOnly && selectedItems.length > 1}
              onRemove={readOnly ? undefined : removeItem}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="mb-2">No relations added yet</p>
            {!readOnly && (
              <p className="text-sm">Click "Add Relations" to get started</p>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div className="text-sm text-gray-600">
            {selectedItems.length} of {maxSelections || '∞'} relations
            {hasChanges && (
              <Badge variant="secondary" className="ml-2">
                Unsaved changes
              </Badge>
            )}
          </div>

          <Button
            onClick={() => setIsPickerOpen(true)}
            disabled={!canAddMore}
            size="sm"
          >
            <Plus size={14} className="mr-1" />
            Add Relations
          </Button>
        </div>
      )}

      {/* Relation Picker Modal */}
      <RelationPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handlePickerSelect}
        selectedItems={selectedItems.map(item => ({
          id: item.id,
          title: item.title,
          slug: `slug-${item.id}`, // This would come from actual data
          content_type: item.content_type,
          status: 'published' // This would come from actual data
        }))}
        targetContentType={
          (relationDefinition as any).target_content_type?.name || 
          (relationDefinition as any).target_content_type_name
        }
        title={`Select ${relationDefinition.display_name}`}
        description={`Choose entries to relate to this ${relationDefinition.source_field_name}`}
        maxSelections={relationDefinition.max_relations || undefined}
        multiSelect={relationDefinition.relation_type !== 'one_to_one'}
        excludeIds={[entryId]} // Don't allow self-reference
      />
    </Card>
  );
}

export default RelationField;