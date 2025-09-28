'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Play, Code, Database } from 'lucide-react';

// Import relation components
import { useRelationDefinitions } from '@/hooks/use-relations';
import RelationDefinitionManager from '@/components/relations/RelationDefinitionManager';
import RelationManager from '@/components/relations/RelationManager';
import RelationField from '@/components/relations/RelationField';
import { RelationItem } from '@/components/relations/RelationItem';
import { RelationPickerModal } from '@/components/relations/RelationPickerModal';

export default function RelationsDemoPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  // Mock data for demonstration
  const mockRelationDefinition = {
    id: '1',
    name: 'article_tags',
    display_name: 'Article Tags',
    description: 'Tags associated with articles',
    source_content_type_id: 1,
    source_field_name: 'tags',
    target_content_type_id: 4,
    target_field_name: 'articles',
    relation_type: 'many_to_many' as const,
    is_bidirectional: true,
    is_required: false,
    on_source_delete: 'cascade' as const,
    on_target_delete: 'set_null' as const,
    max_relations: undefined,
    min_relations: 0,
    metadata: {},
    sort_order: 0,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockRelationItem = {
    id: 1,
    source_entry_id: 1,
    target_entry_id: 2,
    relation_definition_id: 1,
    metadata: {},
    sort_order: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    target_entry: {
      id: 2,
      title: 'React Hooks',
      content_type: 'tag',
      status: 'published' as const,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  };

  const mockContentEntry = {
    id: 1,
    title: 'Getting Started with React',
    content: 'This is a comprehensive guide...',
    content_type: 'article',
    status: 'published' as const,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Relations System Demo</h1>
        <p className="text-gray-600">
          Explore and test all the relation management components that have been created.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hooks">Hooks</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="manager">Manager</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="api">API Test</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info size={20} />
                System Overview
              </CardTitle>
              <CardDescription>
                Complete content relations system with all components ready for use
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Database Schema</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="secondary">content_relation_definitions</Badge>
                    <Badge variant="secondary">content_relations</Badge>
                    <Badge variant="secondary">RLS Policies</Badge>
                    <Badge variant="secondary">Triggers & Functions</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">API Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="outline">/api/relations/definitions</Badge>
                    <Badge variant="outline">/api/relations</Badge>
                    <Badge variant="outline">/api/relations/[id]</Badge>
                    <Badge variant="outline">/api/schema/apply-relations</Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">UI Components</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant="default">RelationField</Badge>
                    <Badge variant="default">RelationManager</Badge>
                    <Badge variant="default">RelationDefinitionManager</Badge>
                    <Badge variant="default">RelationPickerModal</Badge>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-6">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Setup Required:</strong> Run the database migration script first:
                  <code className="ml-2 px-2 py-1 bg-gray-100 rounded">npm run db:migrate</code>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hooks Tab */}
        <TabsContent value="hooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>React Hooks for Data Management</CardTitle>
              <CardDescription>
                Test and explore the custom hooks for managing relations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">useRelationDefinitions</h4>
                  <p className="text-sm text-gray-600 mb-3">Fetch and manage relation definitions</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Testing useRelationDefinitions hook...');
                    }}
                  >
                    <Play size={16} className="mr-2" />
                    Test Hook
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">useContentRelations</h4>
                  <p className="text-sm text-gray-600 mb-3">Manage relations for content entries</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Testing useContentRelations hook...');
                    }}
                  >
                    <Play size={16} className="mr-2" />
                    Test Hook
                  </Button>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">useRelationField</h4>
                  <p className="text-sm text-gray-600 mb-3">Form field management for relations</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      console.log('Testing useRelationField hook...');
                    }}
                  >
                    <Play size={16} className="mr-2" />
                    Test Hook
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>RelationItem Component</CardTitle>
                <CardDescription>Individual relation item display</CardDescription>
              </CardHeader>
              <CardContent>
                <RelationItem
                  id={mockRelationItem.id}
                  title={mockRelationItem.target_entry.title}
                  contentType={mockRelationItem.target_entry.content_type}
                  status={mockRelationItem.target_entry.status}
                  publishedAt={mockRelationItem.target_entry.published_at}
                  onRemove={(id: number) => console.log('Delete relation:', id)}
                  onEdit={(id: number) => console.log('Edit relation:', id)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>RelationField Component</CardTitle>
                <CardDescription>Relation field for forms</CardDescription>
              </CardHeader>
              <CardContent>
                <RelationField
                  relationDefinition={mockRelationDefinition}
                  entryId={1}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RelationPickerModal</CardTitle>
              <CardDescription>Modal for selecting relation targets</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowPickerModal(true)}>
                Open Relation Picker
              </Button>
              {showPickerModal && (
                <RelationPickerModal
                  isOpen={showPickerModal}
                  onClose={() => setShowPickerModal(false)}
                  targetContentType="tag"
                  onSelect={(entries) => {
                    console.log('Selected entries:', entries);
                    setShowPickerModal(false);
                  }}
                  multiSelect={true}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manager Tab */}
        <TabsContent value="manager" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RelationManager Component</CardTitle>
              <CardDescription>
                Comprehensive relation management for content entries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RelationManager
                contentTypeId={1}
                entryId={1}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tab */}
        <TabsContent value="admin" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>RelationDefinitionManager</CardTitle>
              <CardDescription>
                Admin interface for managing relation definitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RelationDefinitionManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Test Tab */}
        <TabsContent value="api" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Test API Endpoints</CardTitle>
                <CardDescription>Test the relation API endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/relations/definitions');
                      const data = await response.json();
                      console.log('Definitions:', data);
                    } catch (error) {
                      console.error('Error fetching definitions:', error);
                    }
                  }}
                >
                  <Code size={16} className="mr-2" />
                  GET /api/relations/definitions
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/relations?entry_id=1');
                      const data = await response.json();
                      console.log('Relations:', data);
                    } catch (error) {
                      console.error('Error fetching relations:', error);
                    }
                  }}
                >
                  <Code size={16} className="mr-2" />
                  GET /api/relations
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/schema/apply-relations', {
                        method: 'POST'
                      });
                      const data = await response.json();
                      console.log('Schema apply result:', data);
                    } catch (error) {
                      console.error('Error applying schema:', error);
                    }
                  }}
                >
                  <Database size={16} className="mr-2" />
                  POST /api/schema/apply-relations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Console Output</CardTitle>
                <CardDescription>Check browser console for API responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Open your browser's developer console (F12) to see the API responses 
                    when you click the test buttons.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}