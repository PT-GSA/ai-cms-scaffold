"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BookOpen,
  Code,
  Copy,
  ExternalLink,
  Play,
  CheckCircle,
  AlertCircle,
  Globe,
  Lock,
  Database,
  FileText,
  Users,
  Settings,
  Search,
  Image,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  category: string;
  requiresAuth: boolean;
  queryParams?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  bodyExample?: string;
  responseExample?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const API_ENDPOINTS: ApiEndpoint[] = [
  // Public Content Types
  {
    method: "GET",
    path: "/api/public/content-types",
    description: "Mengambil semua content types yang aktif",
    category: "Content Types",
    requiresAuth: false,
    queryParams: [
      {
        name: "slug",
        type: "string",
        required: false,
        description: "Filter berdasarkan nama content type",
      },
    ],
    responseExample: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 1,
            name: "blog_post",
            display_name: "Blog Post",
            description: "Blog post content type",
            fields: [
              { name: "title", type: "text", required: true },
              { name: "content", type: "textarea", required: true },
            ],
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
      },
      null,
      2
    ),
    icon: FileText,
  },
  {
    method: "POST",
    path: "/api/public/content-types",
    description: "Membuat content type baru",
    category: "Content Types",
    requiresAuth: false,
    bodyExample: JSON.stringify(
      {
        name: "blog_post",
        display_name: "Blog Post",
        description: "Blog post content type",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "content",
            type: "textarea",
            required: true,
          },
        ],
        is_active: true,
      },
      null,
      2
    ),
    responseExample: JSON.stringify(
      {
        success: true,
        data: {
          id: 1,
          name: "blog_post",
          display_name: "Blog Post",
          description: "Blog post content type",
          fields: [
            { name: "title", type: "text", required: true },
            { name: "content", type: "textarea", required: true },
          ],
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      },
      null,
      2
    ),
    icon: FileText,
  },
  {
    method: "GET",
    path: "/api/public/content-types/[slug]",
    description: "Mengambil content type berdasarkan slug",
    category: "Content Types",
    requiresAuth: false,
    responseExample: JSON.stringify(
      {
        success: true,
        data: {
          id: 1,
          name: "blog_post",
          display_name: "Blog Post",
          description: "Blog post content type",
          fields: [
            { name: "title", type: "text", required: true },
            { name: "content", type: "textarea", required: true },
          ],
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
        },
      },
      null,
      2
    ),
    icon: FileText,
  },

  // Public Content Entries
  {
    method: "GET",
    path: "/api/public/content-entries",
    description: "Mengambil content entries dengan pagination",
    category: "Content Entries",
    requiresAuth: false,
    queryParams: [
      {
        name: "content_type",
        type: "string",
        required: false,
        description: "Filter berdasarkan content type",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Jumlah data per halaman (default: 20)",
      },
      {
        name: "offset",
        type: "number",
        required: false,
        description: "Offset untuk pagination",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter berdasarkan status (published, draft)",
      },
      {
        name: "sort",
        type: "string",
        required: false,
        description: "Field untuk sorting",
      },
      {
        name: "order",
        type: "string",
        required: false,
        description: "Order sorting (asc, desc)",
      },
    ],
    responseExample: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 1,
            content_type: "blog_post",
            slug: "my-first-blog-post",
            data: {
              title: "My First Blog Post",
              content: "This is the content...",
            },
            status: "published",
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_more: false,
        },
      },
      null,
      2
    ),
    icon: Database,
  },
  {
    method: "POST",
    path: "/api/public/content-entries",
    description: "Membuat content entry baru",
    category: "Content Entries",
    requiresAuth: false,
    bodyExample: JSON.stringify(
      {
        content_type: "blog_post",
        slug: "my-first-blog-post",
        data: {
          title: "My First Blog Post",
          content: "This is the content of my first blog post...",
        },
        status: "published",
      },
      null,
      2
    ),
    responseExample: JSON.stringify(
      {
        success: true,
        data: {
          id: 1,
          content_type: "blog_post",
          slug: "my-first-blog-post",
          data: {
            title: "My First Blog Post",
            content: "This is the content of my first blog post...",
          },
          status: "published",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      null,
      2
    ),
    icon: Database,
  },
  {
    method: "GET",
    path: "/api/public/content-entries/[slug]",
    description: "Mengambil single content entry berdasarkan slug",
    category: "Content Entries",
    requiresAuth: false,
    queryParams: [
      {
        name: "content_type",
        type: "string",
        required: false,
        description: "Content type untuk validasi",
      },
    ],
    responseExample: JSON.stringify(
      {
        success: true,
        data: {
          id: 1,
          content_type: "blog_post",
          slug: "my-first-blog-post",
          data: {
            title: "My First Blog Post",
            content: "This is the content...",
          },
          status: "published",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      },
      null,
      2
    ),
    icon: Database,
  },

  // Public Media
  {
    method: "GET",
    path: "/api/public/media",
    description: "Mengambil media files dengan pagination",
    category: "Media",
    requiresAuth: false,
    queryParams: [
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Jumlah data per halaman",
      },
      {
        name: "offset",
        type: "number",
        required: false,
        description: "Offset untuk pagination",
      },
      {
        name: "type",
        type: "string",
        required: false,
        description: "Filter berdasarkan tipe file",
      },
      {
        name: "folder_id",
        type: "number",
        required: false,
        description: "Filter berdasarkan folder",
      },
    ],
    responseExample: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 1,
            filename: "image.jpg",
            original_filename: "my-image.jpg",
            mime_type: "image/jpeg",
            size: 1024000,
            url: "https://example.com/media/image.jpg",
            folder_id: null,
            created_at: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          total_pages: 1,
          has_more: false,
        },
      },
      null,
      2
    ),
    icon: Image,
  },

  // Private Content Types (requires auth)
  {
    method: "GET",
    path: "/api/content-types",
    description: "Mengambil semua content types (admin)",
    category: "Admin Content Types",
    requiresAuth: true,
    responseExample: JSON.stringify(
      {
        success: true,
        data: [
          {
            id: 1,
            name: "blog_post",
            display_name: "Blog Post",
            description: "Blog post content type",
            fields: [
              { name: "title", type: "text", required: true },
              { name: "content", type: "textarea", required: true },
            ],
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/content-types",
    description: "Membuat content type baru (admin)",
    category: "Admin Content Types",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        name: "blog_post",
        display_name: "Blog Post",
        description: "Blog post content type",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "content",
            type: "textarea",
            required: true,
          },
        ],
        is_active: true,
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "PUT",
    path: "/api/content-types/[id]",
    description: "Update content type berdasarkan ID (admin)",
    category: "Admin Content Types",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        display_name: "Updated Blog Post",
        description: "Updated blog post content type",
        fields: [
          {
            name: "title",
            type: "text",
            required: true,
          },
          {
            name: "content",
            type: "textarea",
            required: true,
          },
          {
            name: "author",
            type: "text",
            required: false,
          },
        ],
        is_active: true,
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "DELETE",
    path: "/api/content-types/[id]",
    description: "Hapus content type berdasarkan ID (admin)",
    category: "Admin Content Types",
    requiresAuth: true,
    icon: Lock,
  },

  // Private Content Entries (requires auth)
  {
    method: "GET",
    path: "/api/content-entries",
    description: "Mengambil content entries dengan filtering (admin)",
    category: "Admin Content Entries",
    requiresAuth: true,
    queryParams: [
      {
        name: "content_type",
        type: "string",
        required: false,
        description: "Filter berdasarkan content type",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Jumlah data per halaman",
      },
      {
        name: "offset",
        type: "number",
        required: false,
        description: "Offset untuk pagination",
      },
      {
        name: "status",
        type: "string",
        required: false,
        description: "Filter berdasarkan status",
      },
      {
        name: "search",
        type: "string",
        required: false,
        description: "Pencarian dalam data",
      },
    ],
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/content-entries",
    description: "Membuat content entry baru (admin)",
    category: "Admin Content Entries",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        content_type: "blog_post",
        slug: "my-first-blog-post",
        data: {
          title: "My First Blog Post",
          content: "This is the content of my first blog post...",
        },
        status: "published",
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "PUT",
    path: "/api/content-entries/[id]",
    description: "Update content entry berdasarkan ID (admin)",
    category: "Admin Content Entries",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        content_type: "blog_post",
        slug: "my-updated-blog-post",
        data: {
          title: "My Updated Blog Post",
          content: "This is the updated content...",
        },
        status: "published",
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "DELETE",
    path: "/api/content-entries/[id]",
    description: "Hapus content entry berdasarkan ID (admin)",
    category: "Admin Content Entries",
    requiresAuth: true,
    icon: Lock,
  },

  // Media Management (requires auth)
  {
    method: "POST",
    path: "/api/media",
    description: "Upload media file (admin)",
    category: "Admin Media",
    requiresAuth: true,
    bodyExample: "FormData dengan file upload",
    icon: Lock,
  },
  {
    method: "PUT",
    path: "/api/media/[id]",
    description: "Update media metadata (admin)",
    category: "Admin Media",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        filename: "new-filename.jpg",
        folder_id: 1,
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "DELETE",
    path: "/api/media/[id]",
    description: "Hapus media file (admin)",
    category: "Admin Media",
    requiresAuth: true,
    icon: Lock,
  },

  // Relations (requires auth)
  {
    method: "GET",
    path: "/api/relations",
    description: "Mengambil semua content relations (admin)",
    category: "Relations",
    requiresAuth: true,
    queryParams: [
      {
        name: "source_entry_id",
        type: "number",
        required: false,
        description: "Filter berdasarkan source entry",
      },
      {
        name: "target_entry_id",
        type: "number",
        required: false,
        description: "Filter berdasarkan target entry",
      },
      {
        name: "relation_name",
        type: "string",
        required: false,
        description: "Filter berdasarkan nama relasi",
      },
    ],
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/relations",
    description: "Membuat content relation baru (admin)",
    category: "Relations",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        relation_definition_id: 1,
        source_entry_id: 1,
        target_entry_id: 2,
        metadata: {},
      },
      null,
      2
    ),
    icon: Lock,
  },

  // Search (requires auth)
  {
    method: "GET",
    path: "/api/search",
    description: "Pencarian content entries (admin)",
    category: "Search",
    requiresAuth: true,
    queryParams: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Query pencarian",
      },
      {
        name: "content_type",
        type: "string",
        required: false,
        description: "Filter berdasarkan content type",
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Jumlah hasil",
      },
    ],
    icon: Lock,
  },
  {
    method: "GET",
    path: "/api/search/autocomplete",
    description: "Autocomplete untuk pencarian (admin)",
    category: "Search",
    requiresAuth: true,
    queryParams: [
      {
        name: "q",
        type: "string",
        required: true,
        description: "Query untuk autocomplete",
      },
      {
        name: "content_type",
        type: "string",
        required: false,
        description: "Filter berdasarkan content type",
      },
    ],
    icon: Lock,
  },

  // Team Management (requires auth)
  {
    method: "GET",
    path: "/api/team/members",
    description: "Mengambil anggota tim (admin)",
    category: "Team Management",
    requiresAuth: true,
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/team/members",
    description: "Invite anggota tim baru (admin)",
    category: "Team Management",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        email: "user@example.com",
        role: "editor",
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "PUT",
    path: "/api/team/members/[id]",
    description: "Update role anggota tim (admin)",
    category: "Team Management",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        role: "admin",
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "DELETE",
    path: "/api/team/members/[id]",
    description: "Hapus anggota tim (admin)",
    category: "Team Management",
    requiresAuth: true,
    icon: Lock,
  },

  // AI Features (requires auth)
  {
    method: "POST",
    path: "/api/ai/generate-content",
    description: "Generate content menggunakan AI (admin)",
    category: "AI Features",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        prompt: "Write a blog post about AI",
        content_type: "blog_post",
        field_mapping: {
          title: "title",
          content: "content",
        },
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/ai/generate-fields",
    description: "Generate fields untuk content type menggunakan AI (admin)",
    category: "AI Features",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        description: "A blog post content type for technology articles",
        existing_fields: [],
      },
      null,
      2
    ),
    icon: Lock,
  },

  // Schema Management (requires auth)
  {
    method: "POST",
    path: "/api/schema/generate",
    description: "Generate database schema menggunakan AI (admin)",
    category: "Schema Management",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        description:
          "Create a schema for an e-commerce website with products, categories, and orders",
      },
      null,
      2
    ),
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/schema/apply",
    description: "Apply generated schema ke database (admin)",
    category: "Schema Management",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        schema_id: 1,
        confirm: true,
      },
      null,
      2
    ),
    icon: Lock,
  },

  // Webhooks (requires auth)
  {
    method: "GET",
    path: "/api/webhooks",
    description: "Mengambil konfigurasi webhooks (admin)",
    category: "Webhooks",
    requiresAuth: true,
    icon: Lock,
  },
  {
    method: "POST",
    path: "/api/webhooks",
    description: "Membuat webhook baru (admin)",
    category: "Webhooks",
    requiresAuth: true,
    bodyExample: JSON.stringify(
      {
        name: "Content Update Webhook",
        url: "https://example.com/webhook",
        events: ["content.created", "content.updated"],
        is_active: true,
      },
      null,
      2
    ),
    icon: Lock,
  },
];

const categories = [
  { name: "Content Types", icon: FileText, color: "text-blue-400" },
  { name: "Content Entries", icon: Database, color: "text-green-400" },
  { name: "Media", icon: Image, color: "text-purple-400" },
  { name: "Admin Content Types", icon: Lock, color: "text-red-400" },
  { name: "Admin Content Entries", icon: Lock, color: "text-red-400" },
  { name: "Admin Media", icon: Lock, color: "text-red-400" },
  { name: "Relations", icon: LinkIcon, color: "text-orange-400" },
  { name: "Search", icon: Search, color: "text-cyan-400" },
  { name: "Team Management", icon: Users, color: "text-pink-400" },
  { name: "AI Features", icon: Code, color: "text-yellow-400" },
  { name: "Schema Management", icon: Settings, color: "text-indigo-400" },
  { name: "Webhooks", icon: Globe, color: "text-teal-400" },
];

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [testEndpoint, setTestEndpoint] = useState<ApiEndpoint | null>(null);
  const [testUrl, setTestUrl] = useState("");
  const [testMethod, setTestMethod] = useState<
    "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  >("GET");
  const [testBody, setTestBody] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredEndpoints = API_ENDPOINTS.filter((endpoint) => {
    const matchesCategory =
      selectedCategory === "all" || endpoint.category === selectedCategory;
    const matchesSearch =
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const copyToClipboard = async (text: string, endpoint: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const testApiEndpoint = async () => {
    if (!testEndpoint) return;

    setIsLoading(true);
    setTestResponse("");

    try {
      const url = testUrl || `${window.location.origin}${testEndpoint.path}`;
      const options: RequestInit = {
        method: testMethod,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (testMethod !== "GET" && testBody) {
        options.body = testBody;
      }

      const response = await fetch(url, options);
      const data = await response.json();

      setTestResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResponse(
        JSON.stringify(
          { error: error instanceof Error ? error.message : "Unknown error" },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-900 text-green-300";
      case "POST":
        return "bg-blue-900 text-blue-300";
      case "PUT":
        return "bg-yellow-900 text-yellow-300";
      case "DELETE":
        return "bg-red-900 text-red-300";
      case "PATCH":
        return "bg-purple-900 text-purple-300";
      default:
        return "bg-gray-900 text-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-white hover:text-primary transition-colors"
              >
                <BookOpen className="h-6 w-6" />
                <span className="text-xl font-bold">AI CMS</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <h1 className="text-2xl font-bold text-white">
                API Documentation
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="text-gray-300 hover:text-white"
                >
                  ← Back to Home
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Search */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Search APIs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Input
                    placeholder="Search endpoints..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                  />
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant={selectedCategory === "all" ? "default" : "ghost"}
                    className={`w-full justify-start ${
                      selectedCategory === "all"
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-800"
                    }`}
                    onClick={() => setSelectedCategory("all")}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    All APIs
                    <span className="ml-auto text-xs opacity-70">
                      ({API_ENDPOINTS.length})
                    </span>
                  </Button>
                  {categories.map((category) => {
                    const count = API_ENDPOINTS.filter(
                      (ep) => ep.category === category.name
                    ).length;
                    return (
                      <Button
                        key={category.name}
                        variant={
                          selectedCategory === category.name
                            ? "default"
                            : "ghost"
                        }
                        className={`w-full justify-start ${
                          selectedCategory === category.name
                            ? "bg-primary text-white"
                            : "text-gray-300 hover:bg-gray-800"
                        }`}
                        onClick={() => setSelectedCategory(category.name)}
                      >
                        <category.icon
                          className={`h-4 w-4 mr-2 ${category.color}`}
                        />
                        {category.name}
                        <span className="ml-auto text-xs opacity-70">
                          ({count})
                        </span>
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>

              {/* API Testing */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">API Testing</CardTitle>
                  <CardDescription className="text-gray-400">
                    Test endpoints directly from documentation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Method
                    </label>
                    <select
                      value={testMethod}
                      onChange={(e) => setTestMethod(e.target.value as any)}
                      className="w-full p-2 bg-gray-800 border border-gray-700 rounded text-white"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      URL
                    </label>
                    <Input
                      placeholder="https://your-domain.com/api/..."
                      value={testUrl}
                      onChange={(e) => setTestUrl(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-2 block">
                      Request Body (JSON)
                    </label>
                    <Textarea
                      placeholder="{}"
                      value={testBody}
                      onChange={(e) => setTestBody(e.target.value)}
                      className="bg-gray-800 border-gray-700 text-white min-h-[100px]"
                    />
                  </div>
                  <Button
                    onClick={testApiEndpoint}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Test API
                  </Button>
                  {testResponse && (
                    <div>
                      <label className="text-sm text-gray-300 mb-2 block">
                        Response
                      </label>
                      <pre className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-300 overflow-auto max-h-40">
                        {testResponse}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Category Info */}
              {selectedCategory !== "all" && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary">
                      <Code className="h-5 w-5" />
                      <h2 className="text-lg font-semibold">
                        {selectedCategory} APIs
                      </h2>
                      <span className="text-sm opacity-70">
                        ({filteredEndpoints.length} endpoints)
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory("all")}
                      className="border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Code className="h-4 w-4 mr-2" />
                      Show All APIs
                    </Button>
                  </div>
                </div>
              )}

              {/* Introduction */}
              <Card className="bg-gray-900/50 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    API Documentation
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Comprehensive API documentation for AI-Powered Headless CMS.
                    Public endpoints can be used without authentication, while
                    admin endpoints require authentication.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 p-4 bg-gray-800/50 border border-gray-700 rounded">
                    <h4 className="text-sm font-medium text-white mb-2">
                      Base URL
                    </h4>
                    <p className="text-xs text-gray-400 mb-2">
                      All API endpoints are relative to your domain:
                    </p>
                      <code className="text-xs text-gray-300 bg-gray-900/50 px-2 py-1 rounded">
                        https://your-domain.com
                      </code>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-800 rounded">
                      <Globe className="h-4 w-4 text-green-400" />
                      <div>
                        <div className="text-sm font-medium text-green-300">
                          Public APIs
                        </div>
                        <div className="text-xs text-green-400">
                          No authentication required
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800 rounded">
                      <Lock className="h-4 w-4 text-red-400" />
                      <div>
                        <div className="text-sm font-medium text-red-300">
                          Admin APIs
                        </div>
                        <div className="text-xs text-red-400">
                          Authentication required
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-blue-900/20 border border-blue-800 rounded">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">
                        Authentication
                      </h4>
                      <p className="text-xs text-blue-400 mb-2">
                        Admin endpoints require authentication using Bearer
                        token in Authorization header:
                      </p>
                      <code className="text-xs text-blue-300 bg-blue-900/30 px-2 py-1 rounded">
                        Authorization: Bearer YOUR_API_TOKEN
                      </code>
                    </div>

                    <div className="p-4 bg-yellow-900/20 border border-yellow-800 rounded">
                      <h4 className="text-sm font-medium text-yellow-300 mb-2">
                        Rate Limiting
                      </h4>
                      <p className="text-xs text-yellow-400 mb-2">
                        API requests are rate limited to prevent abuse:
                      </p>
                      <div className="text-xs text-yellow-400">
                        <div>• Public APIs: 100 requests per minute per IP</div>
                        <div>
                          • Admin APIs: 1000 requests per minute per user
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-green-900/20 border border-green-800 rounded">
                      <h4 className="text-sm font-medium text-green-300 mb-2">
                        Response Format
                      </h4>
                      <p className="text-xs text-green-400 mb-2">
                        All successful responses follow this format:
                      </p>
                      <pre className="text-xs text-green-300 bg-green-900/30 px-2 py-1 rounded">
                        {`{
                        "success": true,
                        "data": { ... },
                        "pagination": {  // Only for list endpoints
                            "page": 1,
                            "limit": 20,
                            "total": 100,
                            "total_pages": 5,
                            "has_more": true
                        }
                        }`}
                      </pre>
                    </div>

                    <div className="p-4 bg-red-900/20 border border-red-800 rounded">
                      <h4 className="text-sm font-medium text-red-300 mb-2">
                        Error Handling
                      </h4>
                      <p className="text-xs text-red-400 mb-2">
                        All errors return consistent JSON format:
                      </p>
                      <pre className="text-xs text-red-300 bg-red-900/30 px-2 py-1 rounded">
                        {`{
                        "success": false,
                        "error": "Error message",
                        "code": "ERROR_CODE"
                        }`}
                      </pre>
                    </div>

                    <div className="p-4 bg-purple-900/20 border border-purple-800 rounded">
                      <h4 className="text-sm font-medium text-purple-300 mb-2">
                        HTTP Status Codes
                      </h4>
                      <div className="text-xs text-purple-400 space-y-1">
                        <div>• 200 - Success</div>
                        <div>• 201 - Created</div>
                        <div>• 400 - Bad Request</div>
                        <div>• 401 - Unauthorized</div>
                        <div>• 403 - Forbidden</div>
                        <div>• 404 - Not Found</div>
                        <div>• 429 - Rate Limited</div>
                        <div>• 500 - Server Error</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endpoints */}
              {filteredEndpoints.map((endpoint, index) => (
                <motion.div
                  key={`${endpoint.method}-${endpoint.path}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="bg-gray-900/50 border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getMethodColor(endpoint.method)}>
                            {endpoint.method}
                          </Badge>
                          <code className="text-lg font-mono text-white">
                            {endpoint.path}
                          </code>
                          {endpoint.requiresAuth ? (
                            <Lock className="h-4 w-4 text-red-400" />
                          ) : (
                            <Globe className="h-4 w-4 text-green-400" />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              endpoint.path,
                              `${endpoint.method}-${endpoint.path}`
                            )
                          }
                          className="text-gray-400 hover:text-white"
                        >
                          {copiedEndpoint ===
                          `${endpoint.method}-${endpoint.path}` ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <CardDescription className="text-gray-400 mt-2">
                        {endpoint.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Query Parameters */}
                      {endpoint.queryParams &&
                        endpoint.queryParams.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-white mb-2">
                              Query Parameters
                            </h4>
                            <div className="space-y-2">
                              {endpoint.queryParams.map((param) => (
                                <div
                                  key={param.name}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <code className="text-blue-300 bg-blue-900/20 px-2 py-1 rounded">
                                    {param.name}
                                  </code>
                                  <span className="text-gray-400">
                                    ({param.type})
                                  </span>
                                  {param.required && (
                                    <Badge
                                      variant="outline"
                                      className="text-red-300 border-red-800"
                                    >
                                      Required
                                    </Badge>
                                  )}
                                  <span className="text-gray-500 text-xs">
                                    {param.description}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Request Body Example */}
                      {endpoint.bodyExample && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            Request Body
                          </h4>
                          <div className="relative">
                            <pre className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-300 overflow-auto">
                              {endpoint.bodyExample}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  endpoint.bodyExample!,
                                  `body-${endpoint.method}-${endpoint.path}`
                                )
                              }
                              className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Response Example */}
                      {endpoint.responseExample && (
                        <div>
                          <h4 className="text-sm font-medium text-white mb-2">
                            Response Example
                          </h4>
                          <div className="relative">
                            <pre className="bg-gray-800 border border-gray-700 rounded p-3 text-xs text-gray-300 overflow-auto">
                              {endpoint.responseExample}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  endpoint.responseExample!,
                                  `response-${endpoint.method}-${endpoint.path}`
                                )
                              }
                              className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Test Button */}
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTestEndpoint(endpoint);
                            setTestUrl(
                              `${window.location.origin}${endpoint.path}`
                            );
                            setTestMethod(endpoint.method);
                            setTestBody(endpoint.bodyExample || "");
                          }}
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Test This Endpoint
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {filteredEndpoints.length === 0 && (
                <Card className="bg-gray-900/50 border-gray-800">
                  <CardContent className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No endpoints found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your search query or category filter.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
