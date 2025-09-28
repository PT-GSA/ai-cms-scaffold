'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, X, Plus, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentEntry {
  id: number;
  title: string;
  slug: string;
  content_type: string;
  status: string;
  published_at?: string;
  data?: Record<string, any>;
}

interface RelationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedItems: ContentEntry[]) => void;
  selectedItems?: ContentEntry[];
  targetContentType?: string;
  title?: string;
  description?: string;
  maxSelections?: number;
  multiSelect?: boolean;
  allowSearch?: boolean;
  allowFilters?: boolean;
  excludeIds?: number[];
}

export function RelationPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedItems = [],
  targetContentType,
  title = 'Select Items',
  description = 'Choose items to create relations with',
  maxSelections,
  multiSelect = true,
  allowSearch = true,
  allowFilters = true,
  excludeIds = []
}: RelationPickerModalProps) {
  const [entries, setEntries] = useState<ContentEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>(targetContentType || 'all');
  const [currentSelection, setCurrentSelection] = useState<ContentEntry[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Initialize current selection with provided selected items
  useEffect(() => {
    setCurrentSelection([...selectedItems]);
  }, [selectedItems]);

  // Fetch entries
  const fetchEntries = useCallback(async (reset = false) => {
    if (loading) return;

    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      if (contentTypeFilter && contentTypeFilter !== 'all') params.append('content_type', contentTypeFilter);
      params.append('limit', '20');
      params.append('offset', reset ? '0' : ((page - 1) * 20).toString());

      const response = await fetch(`/api/content-entries?${params}`);
      const result = await response.json();

      if (result.success) {
        const newEntries = result.data || [];
        
        // Filter out excluded IDs
        const filteredEntries = newEntries.filter((entry: ContentEntry) => 
          !excludeIds.includes(entry.id)
        );

        if (reset) {
          setEntries(filteredEntries);
          setPage(2);
        } else {
          setEntries(prev => [...prev, ...filteredEntries]);
          setPage(prev => prev + 1);
        }

        setHasMore(result.pagination?.has_more || false);
      }
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, contentTypeFilter, page, excludeIds, loading]);

  // Reset and fetch on filter changes
  useEffect(() => {
    setPage(1);
    setEntries([]);
    setHasMore(true);
    fetchEntries(true);
  }, [searchTerm, statusFilter, contentTypeFilter]);

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      fetchEntries(true);
    }
  }, [isOpen]);

  // Handle search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // Handle item selection
  const handleItemToggle = useCallback((entry: ContentEntry) => {
    setCurrentSelection(prev => {
      const isSelected = prev.some(item => item.id === entry.id);

      if (isSelected) {
        return prev.filter(item => item.id !== entry.id);
      } else {
        if (!multiSelect) {
          return [entry];
        }
        
        if (maxSelections && prev.length >= maxSelections) {
          return prev; // Don't add if max reached
        }
        
        return [...prev, entry];
      }
    });
  }, [multiSelect, maxSelections]);

  // Handle select all visible
  const handleSelectAllVisible = useCallback(() => {
    const visibleUnselected = entries.filter(entry => 
      !currentSelection.some(selected => selected.id === entry.id)
    );

    if (visibleUnselected.length === 0) {
      // Deselect all visible
      setCurrentSelection(prev => 
        prev.filter(selected => !entries.some(entry => entry.id === selected.id))
      );
    } else {
      // Select all visible (respecting max limit)
      let toAdd = visibleUnselected;
      if (maxSelections) {
        const remaining = maxSelections - currentSelection.length;
        toAdd = visibleUnselected.slice(0, remaining);
      }
      
      setCurrentSelection(prev => [...prev, ...toAdd]);
    }
  }, [entries, currentSelection, maxSelections]);

  // Handle confirm selection
  const handleConfirm = useCallback(() => {
    onSelect(currentSelection);
    onClose();
  }, [currentSelection, onSelect, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setCurrentSelection([...selectedItems]);
    onClose();
  }, [selectedItems, onClose]);

  // Check if entry is selected
  const isEntrySelected = useCallback((entry: ContentEntry) => {
    return currentSelection.some(selected => selected.id === entry.id);
  }, [currentSelection]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate selection info
  const selectionInfo = useMemo(() => {
    const count = currentSelection.length;
    const max = maxSelections;
    const hasChanges = currentSelection.length !== selectedItems.length || 
                      currentSelection.some(item => !selectedItems.some(selected => selected.id === item.id));

    return { count, max, hasChanges };
  }, [currentSelection, selectedItems, maxSelections]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 py-4 border-b">
          {allowSearch && (
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {allowFilters && (
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="page">Page</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          {multiSelect && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAllVisible}
              disabled={entries.length === 0}
            >
              {entries.every(entry => isEntrySelected(entry)) ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {/* Selection Info */}
        <div className="flex items-center justify-between py-2 text-sm text-gray-600">
          <span>
            {selectionInfo.count} selected
            {selectionInfo.max && ` of ${selectionInfo.max} max`}
          </span>
          {selectionInfo.hasChanges && (
            <Badge variant="secondary">Changes pending</Badge>
          )}
        </div>

        {/* Entry List */}
        <ScrollArea className="flex-1">
          <div className="space-y-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isEntrySelected(entry)}
                    onCheckedChange={() => handleItemToggle(entry)}
                    disabled={Boolean(
                      (!multiSelect && currentSelection.length > 0 && !isEntrySelected(entry)) ||
                      (maxSelections && currentSelection.length >= maxSelections && !isEntrySelected(entry))
                    )}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate" title={entry.title}>
                        {entry.title}
                      </h4>
                      <Badge className={`text-xs px-2 py-0.5 ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="capitalize">{entry.content_type}</span>
                      <span>•</span>
                      <span>{entry.slug}</span>
                      {entry.published_at && (
                        <>
                          <span>•</span>
                          <span>{formatDate(entry.published_at)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {isEntrySelected(entry) && (
                    <Check className="text-green-600" size={16} />
                  )}
                </div>
              </Card>
            ))}

            {loading && (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            )}

            {hasMore && !loading && (
              <Button
                variant="outline"
                onClick={() => fetchEntries()}
                className="w-full"
              >
                Load More
              </Button>
            )}

            {entries.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No entries found
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          
          <div className="flex gap-2">
            <Button
              onClick={handleConfirm}
              disabled={!selectionInfo.hasChanges}
            >
              Confirm Selection ({selectionInfo.count})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}