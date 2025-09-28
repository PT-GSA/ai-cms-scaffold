'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link, 
  Settings, 
  Database, 
  FileText, 
  Plus, 
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Info,
  ExternalLink
} from 'lucide-react';

// Import relation components
import RelationDefinitionManager from '@/components/relations/RelationDefinitionManager';
import RelationManager from '@/components/relations/RelationManager';
import { useRelationDefinitions } from '@/hooks/use-relations';

export default function RelationsDashboardPage() {
  const [activeTab, setActiveTab] = useState('definitions');
  const { definitions, loading } = useRelationDefinitions();

  const relationStats = {
    totalDefinitions: definitions?.length || 0,
    activeDefinitions: definitions?.filter(d => d.is_active)?.length || 0,
    totalRelations: 156, // This would come from API
    recentActivity: 12
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Content Relations
              </h1>
              <Badge variant="secondary" className="ml-2">New Feature</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
              Manage relationships between your content entries. Create definitions, configure 
              constraints, and visualize content connections.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/demo/relations', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Demo Page
            </Button>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Definitions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {relationStats.totalDefinitions}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Definitions
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {relationStats.activeDefinitions}
                  </p>
                </div>
                <Database className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Relations
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {relationStats.totalRelations}
                  </p>
                </div>
                <Link className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Recent Activity
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {relationStats.recentActivity}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status Alert */}
        {relationStats.totalDefinitions === 0 && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Getting Started:</strong> You haven't created any relation definitions yet. 
              Start by creating your first relation definition in the "Definitions" tab below.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="definitions" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Definitions
            </TabsTrigger>
            <TabsTrigger value="management" className="flex items-center gap-2">
              <Link className="h-4 w-4" />
              Relations
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Definitions Tab */}
          <TabsContent value="definitions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Relation Definitions
                </CardTitle>
                <CardDescription>
                  Configure how different content types can be related to each other. 
                  Define constraints, cascade behaviors, and field mappings.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RelationDefinitionManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relations Management Tab */}
          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5" />
                  Relation Management
                </CardTitle>
                <CardDescription>
                  Manage actual relations between content entries. Create, edit, and remove connections.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Search and Filters */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                          type="text"
                          placeholder="Search content entries..."
                          className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <Button variant="outline" size="default">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter
                    </Button>
                  </div>

                  {/* Sample relation manager - would be populated with real data */}
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center py-8">
                      Select a content entry to manage its relations, or create relation definitions first.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Relation Usage</CardTitle>
                  <CardDescription>
                    Most used relation types and patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Article → Tags</span>
                      <Badge variant="secondary">Many-to-Many</Badge>
                      <span className="text-sm text-gray-500">45 relations</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Page → Author</span>
                      <Badge variant="secondary">Many-to-One</Badge>
                      <span className="text-sm text-gray-500">23 relations</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Product → Category</span>
                      <Badge variant="secondary">Many-to-One</Badge>
                      <span className="text-sm text-gray-500">18 relations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relation Health</CardTitle>
                  <CardDescription>
                    Status and integrity of your relations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Healthy Relations</span>
                      <Badge variant="default" className="bg-green-100 text-green-800">142</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Broken References</span>
                      <Badge variant="destructive">3</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Orphaned Relations</span>
                      <Badge variant="secondary">11</Badge>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" className="w-full">
                        <Database className="h-4 w-4 mr-2" />
                        Run Health Check
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest changes to relations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { action: 'Created relation', from: 'Article #123', to: 'Tag "React"', time: '2 minutes ago' },
                      { action: 'Updated definition', from: 'article_tags', to: 'Added min constraint', time: '1 hour ago' },
                      { action: 'Removed relation', from: 'Page #45', to: 'Category "News"', time: '3 hours ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.from} → {activity.to}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}