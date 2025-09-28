'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Filter, ArrowUpDown, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { RelationDefinitionForm } from './RelationDefinitionForm';
import { useRelationDefinitions } from '@/hooks/use-relations';
import { ContentRelationDefinitionWithCounts, RelationType } from '@/types/relations';

interface RelationDefinitionManagerProps {
  className?: string;
}

type SortField = 'name' | 'relation_type' | 'source_content_type' | 'target_content_type' | 'total_relations' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function RelationDefinitionManager({ className = '' }: RelationDefinitionManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<RelationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedDefinition, setSelectedDefinition] = useState<ContentRelationDefinitionWithCounts | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { 
    definitions, 
    loading, 
    error, 
    createDefinition, 
    updateDefinition, 
    deleteDefinition 
  } = useRelationDefinitions({
    search: searchTerm || undefined,
    relation_type: typeFilter === 'all' ? undefined : typeFilter,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
    limit: 50
  });

  // Filter and sort definitions
  const filteredAndSortedDefinitions = useMemo(() => {
    if (!definitions) return [];

    let filtered = [...definitions];

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Handle nested values
      if (sortField === 'source_content_type') {
        aValue = a.source_content_type?.name || '';
        bValue = b.source_content_type?.name || '';
      } else if (sortField === 'target_content_type') {
        aValue = a.target_content_type?.name || '';
        bValue = b.target_content_type?.name || '';
      } else if (sortField === 'total_relations') {
        aValue = Array.isArray(a.total_relations) ? a.total_relations.length : (typeof a.total_relations === 'object' && a.total_relations && 'count' in a.total_relations) ? (a.total_relations as any).count : a.total_relations || 0;
        bValue = Array.isArray(b.total_relations) ? b.total_relations.length : (typeof b.total_relations === 'object' && b.total_relations && 'count' in b.total_relations) ? (b.total_relations as any).count : b.total_relations || 0;
      }

      // Handle different data types
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [definitions, sortField, sortOrder]);

  // Handle sorting
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  // Handle create
  const handleCreate = useCallback(() => {
    setSelectedDefinition(null);
    setIsFormOpen(true);
  }, []);

  // Handle edit
  const handleEdit = useCallback((definition: ContentRelationDefinitionWithCounts) => {
    setSelectedDefinition(definition);
    setIsFormOpen(true);
  }, []);

  // Handle view
  const handleView = useCallback((definition: ContentRelationDefinitionWithCounts) => {
    setSelectedDefinition(definition);
    setIsViewOpen(true);
  }, []);

  // Handle delete
  const handleDelete = useCallback(async (definition: ContentRelationDefinitionWithCounts) => {
    if (definition.total_relations > 0) {
      alert(`Cannot delete "${definition.display_name}" because it has ${definition.total_relations} existing relations. Delete the relations first.`);
      return;
    }

    try {
      setDeletingId(definition.id);
      await deleteDefinition(definition.id);
    } catch (error) {
      console.error('Error deleting relation definition:', error);
      alert('Failed to delete relation definition');
    } finally {
      setDeletingId(null);
    }
  }, [deleteDefinition]);

  // Handle form submit
  const handleFormSubmit = useCallback(async (data: any) => {
    try {
      if (selectedDefinition) {
        await updateDefinition(selectedDefinition.id, data);
      } else {
        await createDefinition(data);
      }
      setIsFormOpen(false);
      setSelectedDefinition(null);
    } catch (error) {
      console.error('Error saving relation definition:', error);
      throw error;
    }
  }, [selectedDefinition, updateDefinition, createDefinition]);

  // Get relation type badge color
  const getRelationTypeBadgeColor = (type: RelationType) => {
    switch (type) {
      case 'one_to_one': return 'bg-blue-100 text-blue-800';
      case 'one_to_many': return 'bg-green-100 text-green-800';  
      case 'many_to_many': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Relation Definitions</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage content relationship definitions
            </p>
          </div>
          
          <Button onClick={handleCreate}>
            <Plus size={16} className="mr-2" />
            Create Definition
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Relation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="one_to_one">One-to-One</SelectItem>
              <SelectItem value="one_to_many">One-to-Many</SelectItem>
              <SelectItem value="many_to_many">Many-to-Many</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Error loading relation definitions: {error}</p>
          </div>
        ) : filteredAndSortedDefinitions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No relation definitions found</p>
            <Button onClick={handleCreate} variant="outline">
              Create your first relation definition
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('relation_type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('source_content_type')}
                  >
                    <div className="flex items-center gap-2">
                      Source Type
                      <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('target_content_type')}
                  >
                    <div className="flex items-center gap-2">
                      Target Type
                      <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleSort('total_relations')}
                  >
                    <div className="flex items-center gap-2">
                      Relations
                      <ArrowUpDown size={12} />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDefinitions.map((definition) => (
                  <TableRow key={definition.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{definition.display_name}</div>
                        <div className="text-sm text-gray-500">{definition.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs px-2 py-1 ${getRelationTypeBadgeColor(definition.relation_type)}`}>
                        {definition.relation_type.replace('_', '-')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {definition.source_content_type?.display_name || definition.source_content_type?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {definition.target_content_type?.display_name || definition.target_content_type?.name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{Array.isArray(definition.total_relations) ? definition.total_relations.length : (typeof definition.total_relations === 'object' && definition.total_relations && 'count' in definition.total_relations) ? (definition.total_relations as any).count : definition.total_relations || 0}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={definition.is_active ? 'default' : 'secondary'}>
                        {definition.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(definition)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(definition)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit size={14} />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={deletingId === definition.id}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Relation Definition</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{definition.display_name}"?
                                {definition.total_relations > 0 && (
                                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                                    <strong>Warning:</strong> This definition has {definition.total_relations} existing relations.
                                    Delete all relations first before removing the definition.
                                  </div>
                                )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(definition)}
                                className="bg-red-600 hover:bg-red-700"
                                disabled={definition.total_relations > 0}
                              >
                                {definition.total_relations > 0 ? 'Cannot Delete' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDefinition ? 'Edit Relation Definition' : 'Create Relation Definition'}
            </DialogTitle>
          </DialogHeader>
          <RelationDefinitionForm
            initialData={selectedDefinition}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Relation Definition Details</DialogTitle>
          </DialogHeader>
          {selectedDefinition && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1">{selectedDefinition.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Display Name</label>
                  <p className="mt-1">{selectedDefinition.display_name}</p>
                </div>
              </div>

              {selectedDefinition.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1">{selectedDefinition.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Relation Type</label>
                  <Badge className={`mt-1 ${getRelationTypeBadgeColor(selectedDefinition.relation_type)}`}>
                    {selectedDefinition.relation_type.replace('_', '-')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={selectedDefinition.is_active ? 'default' : 'secondary'} className="mt-1">
                    {selectedDefinition.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Statistics</label>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Total Relations:</span>
                    <span className="ml-2 font-medium">{selectedDefinition.total_relations}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unique Sources:</span>
                    <span className="ml-2 font-medium">{selectedDefinition.unique_sources}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unique Targets:</span>
                    <span className="ml-2 font-medium">{selectedDefinition.unique_targets}</span>
                  </div>
                </div>
              </div>

              {selectedDefinition.metadata && Object.keys(selectedDefinition.metadata).length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-1 text-sm bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedDefinition.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default RelationDefinitionManager;