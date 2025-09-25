"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Zap, Database, Copy, Check } from "lucide-react"

export function SchemaGenerator() {
  const [description, setDescription] = useState("")
  const [schemaName, setSchemaName] = useState("")
  const [generatedSchema, setGeneratedSchema] = useState<{
    tables: Array<{
      name: string;
      columns: Array<{
        name: string;
        type: string;
        nullable?: boolean;
        primary_key?: boolean;
        unique?: boolean;
        default?: string | null;
      }>;
    }>;
  } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast({
        title: "Error",
        description: "Please provide a description for your schema",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/schema/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ description }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate schema")
      }

      const data = await response.json()
      setGeneratedSchema(data.schema)
      toast({
        title: "Success",
        description: "Schema generated successfully!",
      })
    } catch (error: unknown) {
      console.error('Schema generation error:', error)
      toast({
        title: "Error",
        description: "Failed to generate schema. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = async () => {
    if (!generatedSchema || !schemaName.trim()) {
      toast({
        title: "Error",
        description: "Please provide a schema name and generate a schema first",
        variant: "destructive",
      })
      return
    }

    setIsApplying(true)
    try {
      const response = await fetch("/api/schema/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schema: generatedSchema,
          schemaName,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply schema")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: data.message,
      })

      // Reset form
      setDescription("")
      setSchemaName("")
      setGeneratedSchema(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply schema",
        variant: "destructive",
      })
    } finally {
      setIsApplying(false)
    }
  }

  const copyToClipboard = async () => {
    if (generatedSchema) {
      await navigator.clipboard.writeText(JSON.stringify(generatedSchema, null, 2))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast({
        title: "Copied",
        description: "Schema copied to clipboard",
      })
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-white">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold">Generate Schema</span>
            </CardTitle>
            <p className="text-gray-400 text-sm mt-2">
              Describe your database requirements in natural language
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="schema-name" className="text-gray-300 font-medium">
                Schema Name
              </Label>
              <Input
                id="schema-name"
                placeholder="e.g., blog_system, ecommerce_store"
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300 font-medium">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your database schema in natural language. For example: 'I need a blog system with users, posts, comments, and categories. Users can write posts, and posts can have multiple comments and belong to categories.'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={10}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 resize-none focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !description.trim()} 
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Schema...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-5 w-5" />
                  Generate Schema
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Output Section */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-6"
      >
        <Card className="bg-gray-900 border-gray-800 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold">Generated Schema</span>
              </div>
              {generatedSchema && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyToClipboard} 
                  className="text-gray-400 hover:text-white hover:bg-gray-800 p-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              )}
            </CardTitle>
            <p className="text-gray-400 text-sm mt-2">
              Review and apply your generated database schema
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedSchema ? (
              <div className="space-y-6">
                <div className="rounded-lg bg-gray-800 border border-gray-700 p-4">
                  <pre className="text-sm text-gray-300 overflow-auto max-h-96 whitespace-pre-wrap">
                    {JSON.stringify(generatedSchema, null, 2)}
                  </pre>
                </div>
                <Button
                  onClick={handleApply}
                  disabled={isApplying || !schemaName.trim()}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
                  variant="default"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Applying Schema...
                    </>
                  ) : (
                    <>
                      <Database className="mr-2 h-5 w-5" />
                      Apply Schema to Database
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center space-y-4">
                  <div className="p-4 bg-gray-800 rounded-full mx-auto w-fit">
                    <Database className="h-12 w-12 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-400">No Schema Generated</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Generated schema will appear here after processing
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
