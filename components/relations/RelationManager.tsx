'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Save, RotateCcw, AlertCircle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { RelationField } from './RelationField';
import { useRelationDefinitions, useContentEntryWithRelations } from '@/hooks/use-relations';
import { ContentRelationDefinition } from '@/types/relations';

interface RelationManagerProps {
  entryId: number;
  contentTypeId: number;
  onSave?: (success: boolean, updatedRelations: number) => void;
  readOnly?: boolean;
  className?: string;
}

interface PendingChanges {
  [relationName: string]: Array<{
    target_entry_id: number;
    relation_data?: any;
    sort_order?: number;
  }>;
}

export function RelationManager({
  entryId,
  contentTypeId,
  onSave,
  readOnly = false,
  className = ''
}: RelationManagerProps) {
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  const [savingState, setSavingState] = useState<{
    isSaving: boolean;
    savedRelations: string[];
    errors: Record<string, string>;
  }>({
    isSaving: false,
    savedRelations: [],
    errors: {}
  });

  // Fetch relation definitions for this content type
  const { 
    definitions, 
    loading: definitionsLoading,
    error: definitionsError 
  } = useRelationDefinitions({
    source_content_type_id: contentTypeId,
    is_active: true
  });

  // Fetch current entry with relations
  const { 
    entry, 
    loading: entryLoading,
    updateRelations 
  } = useContentEntryWithRelations(entryId, {
    includeMetadata: true
  });

  // Handle individual relation changes
  const handleRelationChange = useCallback((
    relationName: string,
    relations: Array<{ target_entry_id: number; relation_data?: any; sort_order?: number }>
  ) => {
    setPendingChanges(prev => ({
      ...prev,
      [relationName]: relations
    }));
  }, []);

  // Handle save all changes
  const handleSaveAll = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;

    try {
      setSavingState(prev => ({ ...prev, isSaving: true, errors: {} }));

      // Update relations via API
      await updateRelations(pendingChanges, true); // replace = true

      // Mark all as saved
      setSavingState(prev => ({
        ...prev,
        savedRelations: Object.keys(pendingChanges)
      }));

      // Clear pending changes
      setPendingChanges({});

      onSave?.(true, Object.keys(pendingChanges).length);

    } catch (error) {
      console.error('Error saving all relations:', error);
      setSavingState(prev => ({
        ...prev,
        errors: { general: error instanceof Error ? error.message : 'Failed to save relations' }
      }));
      onSave?.(false, 0);
    } finally {
      setSavingState(prev => ({ ...prev, isSaving: false }));
    }
  }, [pendingChanges, updateRelations, onSave]);

  // Handle reset all changes
  const handleResetAll = useCallback(() => {
    setPendingChanges({});
    setSavingState({
      isSaving: false,
      savedRelations: [],
      errors: {}
    });
  }, []);

  // Calculate summary info
  const summaryInfo = useMemo(() => {
    const totalChanges = Object.keys(pendingChanges).length;
    const hasErrors = Object.keys(savingState.errors).length > 0;
    const recentlySaved = savingState.savedRelations.length > 0;

    return {
      totalChanges,
      hasErrors,
      recentlySaved,
      canSave: totalChanges > 0 && !savingState.isSaving
    };
  }, [pendingChanges, savingState]);

  // Group definitions by category or type if needed
  const groupedDefinitions = useMemo(() => {
    if (!definitions) return {};

    // Group by relation type for better organization
    return definitions.reduce((acc, def) => {
      const type = def.relation_type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(def);
      return acc;
    }, {} as Record<string, ContentRelationDefinition[]>);
  }, [definitions]);

  if (definitionsLoading || entryLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Card>
    );
  }

  if (definitionsError) {
    return (
      <Card className={`p-6 ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load relation definitions: {definitionsError}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  if (!definitions || definitions.length === 0) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">No relation definitions found</p>
          <p className="text-sm text-gray-400">
            Create relation definitions for this content type to manage relationships
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Relations</h2>
            <p className="text-sm text-gray-600">
              Manage relationships between this entry and other content
            </p>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-3">
              {summaryInfo.recentlySaved && !summaryInfo.hasErrors && (
                <Badge variant="secondary" className="text-green-700 bg-green-50 border-green-200">
                  <Check size={12} className="mr-1" />
                  Saved
                </Badge>
              )}

              {summaryInfo.totalChanges > 0 && (
                <Badge variant="outline">
                  {summaryInfo.totalChanges} pending changes
                </Badge>
              )}

              {summaryInfo.canSave && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetAll}
                    disabled={savingState.isSaving}
                  >
                    <RotateCcw size={14} className="mr-1" />
                    Reset All
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveAll}
                    disabled={savingState.isSaving}
                  >
                    {savingState.isSaving ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : (
                      <Save size={14} className="mr-1" />
                    )}
                    {savingState.isSaving ? 'Saving...' : 'Save All Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Messages */}
        {summaryInfo.hasErrors && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {Object.values(savingState.errors).join('; ')}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Relations Content */}
      <div className="p-6">
        {Object.keys(groupedDefinitions).length === 1 ? (
          // Single group - show directly
          <div className="space-y-6">
            {Object.values(groupedDefinitions)[0].map((definition) => (
              <RelationField
                key={definition.id}
                entryId={entryId}
                relationDefinition={definition}
                onSave={(relations) => handleRelationChange(definition.source_field_name, relations)}
                readOnly={readOnly}
                showSaveButton={false} // We handle saving at the manager level
              />
            ))}
          </div>
        ) : (
          // Multiple groups - show in tabs
          <Tabs defaultValue={Object.keys(groupedDefinitions)[0]} className="w-full">
            <TabsList className="grid w-full" style={{gridTemplateColumns: `repeat(${Object.keys(groupedDefinitions).length}, minmax(0, 1fr))`}}>
              {Object.entries(groupedDefinitions).map(([type, defs]) => (
                <TabsTrigger key={type} value={type} className="capitalize">
                  {type.replace('_', '-')} ({defs.length})
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(groupedDefinitions).map(([type, relationDefs]) => (
              <TabsContent key={type} value={type} className="mt-6">
                <div className="space-y-6">
                  {relationDefs.map((definition) => (
                    <RelationField
                      key={definition.id}
                      entryId={entryId}
                      relationDefinition={definition}
                      onSave={(relations) => handleRelationChange(definition.source_field_name, relations)}
                      readOnly={readOnly}
                      showSaveButton={false} // We handle saving at the manager level
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </Card>
  );
}

export default RelationManager;