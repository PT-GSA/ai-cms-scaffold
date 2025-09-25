"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Database,
  Users,
  FileText,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  Plus,
} from "lucide-react"

export function DashboardOverview() {
  const metrics = [
    {
      title: "Total Schemas",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Database,
      color: "text-blue-600",
    },
    {
      title: "Active Users",
      value: "1,234",
      change: "+5.2%",
      trend: "up",
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "API Requests",
      value: "45.2K",
      change: "+18%",
      trend: "up",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      title: "Content Items",
      value: "892",
      change: "+7.1%",
      trend: "up",
      icon: FileText,
      color: "text-orange-600",
    },
  ]

  const recentActivity = [
    {
      id: 1,
      action: "Schema 'blog_system' created",
      user: "john.doe",
      time: "2 minutes ago",
      status: "success",
    },
    {
      id: 2,
      action: "API endpoint deployed",
      user: "jane.smith",
      time: "15 minutes ago",
      status: "success",
    },
    {
      id: 3,
      action: "Database migration completed",
      user: "system",
      time: "1 hour ago",
      status: "success",
    },
    {
      id: 4,
      action: "Schema validation failed",
      user: "bob.wilson",
      time: "2 hours ago",
      status: "error",
    },
  ]

  const quickActions = [
    {
      title: "Generate New Schema",
      description: "Create a database schema using AI",
      icon: Database,
      href: "/dashboard",
      color: "bg-blue-500",
    },
    {
      title: "View Analytics",
      description: "Check your usage statistics",
      icon: TrendingUp,
      href: "/dashboard/analytics",
      color: "bg-green-500",
    },
    {
      title: "Manage Users",
      description: "Add or remove team members",
      icon: Users,
      href: "/dashboard/users",
      color: "bg-purple-500",
    },
    {
      title: "API Documentation",
      description: "Explore your generated APIs",
      icon: FileText,
      href: "/dashboard/api",
      color: "bg-orange-500",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor your AI CMS performance and manage your schemas</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Schema
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="metric-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {metric.change}
                    </Badge>
                    <ArrowUpRight className="h-3 w-3 ml-1 text-green-600" />
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quickActions.map((action) => (
              <div
                key={action.title}
                className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className={`p-2 rounded-lg ${action.color} text-white`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{action.title}</h3>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {activity.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">
                    by {activity.user} • {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">API Calls</span>
                <span className="font-medium">45,234 / 100,000</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Storage Used</span>
                <span className="font-medium">2.4 GB / 10 GB</span>
              </div>
              <Progress value={24} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Team Members</span>
                <span className="font-medium">8 / 25</span>
              </div>
              <Progress value={32} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
