'use client';

import React from 'react';
import { X, GripVertical, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface RelationItemProps {
  id: number;
  title: string;
  contentType: string;
  status?: string;
  publishedAt?: string;
  relationData?: Record<string, any>;
  sortOrder?: number;
  showRemove?: boolean;
  showDragHandle?: boolean;
  showExternalLink?: boolean;
  onRemove?: (id: number) => void;
  onEdit?: (id: number) => void;
  className?: string;
}

export function RelationItem({
  id,
  title,
  contentType,
  status = 'draft',
  publishedAt,
  relationData,
  sortOrder,
  showRemove = true,
  showDragHandle = false,
  showExternalLink = true,
  onRemove,
  onEdit,
  className = ''
}: RelationItemProps) {
  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onRemove?.(id);
  };

  const handleEdit = () => {
    onEdit?.(id);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={`p-3 hover:shadow-sm transition-shadow ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showDragHandle && (
            <div className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600">
              <GripVertical size={16} />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 
                className="font-medium text-sm truncate cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleEdit}
                title={title}
              >
                {title}
              </h4>
              
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-0.5 ${getStatusColor(status)}`}
              >
                {status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="capitalize">{contentType}</span>
              
              {publishedAt && (
                <>
                  <span>•</span>
                  <span>{formatDate(publishedAt)}</span>
                </>
              )}
              
              {sortOrder !== undefined && (
                <>
                  <span>•</span>
                  <span>Order: {sortOrder}</span>
                </>
              )}
            </div>
            
            {relationData && Object.keys(relationData).length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                <details className="cursor-pointer">
                  <summary className="hover:text-gray-800">Relation Data</summary>
                  <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(relationData, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {showExternalLink && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="h-8 w-8 p-0"
            >
              <Link 
                href={`/dashboard/content-entries/editor?id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in editor"
              >
                <ExternalLink size={14} />
              </Link>
            </Button>
          )}
          
          {showRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Remove relation"
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}