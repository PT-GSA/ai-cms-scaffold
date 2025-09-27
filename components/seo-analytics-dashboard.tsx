/**
 * SEO Analytics Dashboard untuk AI CMS Scaffold
 * Real-time SEO insights dan actionable recommendations
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Target, 
  AlertCircle, 
  CheckCircle,
  BarChart3,
  Globe,
  Clock,
  Eye
} from 'lucide-react'

interface SEOMetrics {
  overall_score: number
  total_content: number
  indexed_pages: number
  avg_page_speed: number
  mobile_friendly: number
  core_web_vitals: {
    lcp: number
    fid: number
    cls: number
  }
  top_keywords: Array<{
    keyword: string
    position: number
    traffic: number
    trend: 'up' | 'down' | 'stable'
  }>
  content_performance: Array<{
    id: string
    title: string
    seo_score: number
    views: number
    clicks: number
    impressions: number
    ctr: number
  }>
  issues: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    affected_pages: number
    priority: 'high' | 'medium' | 'low'
  }>
  opportunities: Array<{
    title: string
    impact: 'high' | 'medium' | 'low'
    effort: 'high' | 'medium' | 'low'
    description: string
  }>
}

export function SEOAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchSEOMetrics()
  }, [timeRange])

  const fetchSEOMetrics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/seo/analytics?range=${timeRange}`)
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch SEO metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">Unable to load SEO metrics</h3>
          <p className="text-sm text-gray-500">Please try refreshing the page</p>
          <Button onClick={fetchSEOMetrics} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">SEO Analytics</h2>
          <p className="text-gray-500">Track your SEO performance and get actionable insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={timeRange === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('7d')}
          >
            7 days
          </Button>
          <Button
            variant={timeRange === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('30d')}
          >
            30 days
          </Button>
          <Button
            variant={timeRange === '90d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeRange('90d')}
          >
            90 days
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall SEO Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overall_score}/100</div>
            <Progress value={metrics.overall_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indexed Pages</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.indexed_pages}</div>
            <p className="text-xs text-muted-foreground">
              of {metrics.total_content} total pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Speed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avg_page_speed}s</div>
            <p className="text-xs text-muted-foreground">
              Average load time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mobile Friendly</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.mobile_friendly}%</div>
            <p className="text-xs text-muted-foreground">
              Pages optimized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Core Web Vitals */}
      <Card>
        <CardHeader>
          <CardTitle>Core Web Vitals</CardTitle>
          <CardDescription>
            Google's page experience metrics that affect search rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">LCP (Largest Contentful Paint)</span>
                <span className={`text-sm ${metrics.core_web_vitals.lcp <= 2500 ? 'text-green-600' : metrics.core_web_vitals.lcp <= 4000 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {(metrics.core_web_vitals.lcp / 1000).toFixed(1)}s
                </span>
              </div>
              <Progress 
                value={(metrics.core_web_vitals.lcp / 4000) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">Good: ≤2.5s, Needs improvement: ≤4s</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">FID (First Input Delay)</span>
                <span className={`text-sm ${metrics.core_web_vitals.fid <= 100 ? 'text-green-600' : metrics.core_web_vitals.fid <= 300 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {metrics.core_web_vitals.fid}ms
                </span>
              </div>
              <Progress 
                value={(metrics.core_web_vitals.fid / 300) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">Good: ≤100ms, Needs improvement: ≤300ms</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">CLS (Cumulative Layout Shift)</span>
                <span className={`text-sm ${metrics.core_web_vitals.cls <= 0.1 ? 'text-green-600' : metrics.core_web_vitals.cls <= 0.25 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {metrics.core_web_vitals.cls.toFixed(3)}
                </span>
              </div>
              <Progress 
                value={(metrics.core_web_vitals.cls / 0.25) * 100} 
                className="h-2"
              />
              <p className="text-xs text-gray-500">Good: ≤0.1, Needs improvement: ≤0.25</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList>
          <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
          <TabsTrigger value="content">Content Performance</TabsTrigger>
          <TabsTrigger value="issues">Issues & Opportunities</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Keywords</CardTitle>
              <CardDescription>Keywords driving the most organic traffic</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.top_keywords.map((keyword, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm font-medium">{keyword.keyword}</div>
                      <Badge variant="outline">#{keyword.position}</Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">{keyword.traffic} visits</span>
                      {keyword.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {keyword.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Content Performance</CardTitle>
              <CardDescription>How your content is performing in search results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.content_performance.map((content) => (
                  <div key={content.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{content.title}</h4>
                      <Badge variant={content.seo_score >= 80 ? 'default' : content.seo_score >= 60 ? 'secondary' : 'destructive'}>
                        SEO Score: {content.seo_score}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Views:</span> {content.views}
                      </div>
                      <div>
                        <span className="text-gray-500">Clicks:</span> {content.clicks}
                      </div>
                      <div>
                        <span className="text-gray-500">Impressions:</span> {content.impressions}
                      </div>
                      <div>
                        <span className="text-gray-500">CTR:</span> {(content.ctr * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  SEO Issues
                </CardTitle>
                <CardDescription>Problems that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.issues.map((issue, index) => (
                    <div key={index} className="border-l-4 border-red-500 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{issue.message}</span>
                        <Badge variant={issue.priority === 'high' ? 'destructive' : issue.priority === 'medium' ? 'secondary' : 'outline'}>
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Affects {issue.affected_pages} pages
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  SEO Opportunities
                </CardTitle>
                <CardDescription>Improvements you can make</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.opportunities.map((opportunity, index) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{opportunity.title}</span>
                        <div className="flex space-x-1">
                          <Badge variant="outline" className="text-xs">
                            {opportunity.impact} impact
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {opportunity.effort} effort
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {opportunity.description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}