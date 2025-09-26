import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { z } from "zod"
import { withRateLimit, strictRateLimit } from "@/lib/rate-limit-middleware"

// Type definitions
interface SchemaColumn {
  name: string
  type: string
  nullable: boolean
  primary_key?: boolean
  unique?: boolean
  default?: string | null
}

interface SchemaTable {
  name: string
  columns: SchemaColumn[]
}

interface GeneratedSchema {
  tables: SchemaTable[]
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

/**
 * Generate a fallback schema when Gemini API is unavailable
 * @param description - User's description of the schema
 * @returns A basic schema structure
 */
function generateFallbackSchema(description: string) {
  // Extract potential table names from description
  const words = description.toLowerCase().split(/\s+/)
  const commonEntities = ['user', 'product', 'order', 'category', 'item', 'post', 'comment', 'article', 'blog', 'news']
  
  // Find entities mentioned in description
  const foundEntities = commonEntities.filter(entity => 
    words.some(word => word.includes(entity) || entity.includes(word))
  )
  
  // Default to 'items' if no entities found
  const tableName = foundEntities[0] || 'items'
  
  return {
    tables: [
      {
        name: tableName,
        columns: [
          {
            name: "id",
            type: "SERIAL",
            constraints: ["PRIMARY KEY"],
            nullable: false
          },
          {
            name: "name",
            type: "VARCHAR(255)",
            constraints: ["NOT NULL"],
            nullable: false
          },
          {
            name: "description",
            type: "TEXT",
            constraints: [],
            nullable: true
          },
          {
            name: "created_at",
            type: "TIMESTAMP",
            constraints: ["DEFAULT CURRENT_TIMESTAMP"],
            nullable: false
          },
          {
            name: "updated_at",
            type: "TIMESTAMP",
            constraints: ["DEFAULT CURRENT_TIMESTAMP"],
            nullable: false
          }
        ]
      }
    ]
  }
}

const SchemaRequestSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
})

/**
 * POST /api/schema/generate
 * Generate database schema dari deskripsi natural language
 * Rate limited untuk mencegah abuse AI API
 */
async function handleSchemaGenerate(request: NextRequest) {
  try {
    console.log('🚀 Schema generation request received')
    
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('❌ Session error:', sessionError)
      return NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }

    if (!session) {
      console.log('⚠️ No session found - unauthorized request')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('✅ User authenticated:', session.user.email)

    // Parse request body
    let body
    try {
      body = await request.json()
      console.log('📝 Request body parsed:', { description: body?.description?.substring(0, 50) + '...' })
    } catch (error) {
      console.error('❌ Failed to parse request body:', error)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    // Validate input
    let validatedData
    try {
      validatedData = SchemaRequestSchema.parse(body)
      console.log('✅ Input validation passed')
    } catch (error) {
      console.error('❌ Input validation failed:', error)
      return NextResponse.json({ 
        error: "Validation failed", 
        details: error instanceof Error ? error.message : "Invalid input"
      }, { status: 400 })
    }

    const { description } = validatedData

    // Generate schema with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })
    console.log('🤖 Initializing Gemini model')

    const prompt = `
You are a database schema generator. Based on the following description, generate a JSON schema for database tables.

Description: ${description}

Requirements:
1. Return ONLY valid JSON, no markdown or explanations
2. Use this exact structure:
{
  "tables": [
    {
      "name": "table_name",
      "columns": [
        {
          "name": "column_name",
          "type": "VARCHAR(255)" | "INTEGER" | "BOOLEAN" | "TEXT" | "TIMESTAMP" | "DECIMAL(10,2)",
          "nullable": true | false,
          "primary_key": true | false,
          "unique": true | false,
          "default": "default_value" | null
        }
      ]
    }
  ]
}

3. Always include an 'id' column as primary key for each table
4. Use appropriate PostgreSQL data types
5. Consider relationships between tables
6. Include created_at and updated_at timestamps where appropriate

Generate the schema now:
`

    let schemaJson: GeneratedSchema
    try {
      console.log('🔄 Calling Gemini API...')
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()
      console.log('✅ Gemini API response received, length:', text.length)

      // Parse and validate the JSON response
      try {
        // Clean the response text by removing markdown code blocks
        let cleanedText = text.trim()
        
        // Remove markdown code blocks (```json ... ```)
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '')
        }
        
        // Remove any leading/trailing whitespace
        cleanedText = cleanedText.trim()
        
        console.log('🧹 Cleaned response text, length:', cleanedText.length)
        
        schemaJson = JSON.parse(cleanedText)
        console.log('✅ JSON parsing successful, tables count:', schemaJson?.tables?.length || 0)
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError)
        console.log('Raw response:', text.substring(0, 300) + '...')
        console.log('Cleaned text attempt:', text.trim().replace(/^```json\s*/, '').replace(/\s*```$/, '').substring(0, 300) + '...')
        
        // Try to extract JSON from markdown if possible
        const jsonMatch = text.match(/```json\s*(\{[\s\S]*?\})\s*```/) || text.match(/(\{[\s\S]*\})/)
        if (jsonMatch) {
          try {
            console.log('🔄 Attempting to extract JSON from markdown...')
            schemaJson = JSON.parse(jsonMatch[1])
            console.log('✅ JSON extraction successful, tables count:', schemaJson?.tables?.length || 0)
          } catch (extractError) {
            console.error('❌ JSON extraction also failed:', extractError)
            return NextResponse.json({ error: "Invalid JSON response from AI" }, { status: 500 })
          }
        } else {
          return NextResponse.json({ error: "Invalid JSON response from AI" }, { status: 500 })
        }
      }
    } catch (error: unknown) {
      console.error('❌ Gemini API error:', error)
      
      // Type guard for API error
      const isApiError = (err: unknown): err is { status: number; message?: string } => {
        return (
          typeof err === 'object' &&
          err !== null &&
          'status' in err &&
          typeof (err as Record<string, unknown>).status === 'number'
        );
      };

      const apiError = error as { status?: number; message?: string };
      
      // Handle quota exceeded or other API errors with fallback
      if (isApiError(error) && (error.status === 429 || (error.message && error.message.includes('quota')))) {
        console.log('⚠️ Gemini API quota exceeded, using fallback schema')
        
        // Generate a fallback schema based on the description
        const fallbackSchema = generateFallbackSchema(description)
        schemaJson = fallbackSchema
      } else {
        console.error('💥 Gemini API critical error:', apiError.message || String(error))
        return NextResponse.json({ 
          error: "AI service temporarily unavailable. Please try again later.",
          details: process.env.NODE_ENV === 'development' ? (apiError.message || String(error)) : undefined
        }, { status: 503 })
      }
    }

    // Validate schema structure
    if (!schemaJson || !schemaJson.tables || !Array.isArray(schemaJson.tables)) {
      console.error('❌ Invalid schema structure:', schemaJson)
      return NextResponse.json({ error: "Invalid schema structure" }, { status: 500 })
    }

    console.log('✅ Schema structure validation passed')

    // Add metadata to indicate if fallback was used
    const isUsingFallback = schemaJson.tables.length === 1 &&
                           schemaJson.tables[0].columns.length === 5 &&
                           schemaJson.tables[0].columns.some((col: SchemaColumn) => col.name === 'id' && col.type === 'SERIAL')

    console.log('🎯 Schema generation completed successfully', {
      tablesCount: schemaJson.tables.length,
      isUsingFallback
    })

    return NextResponse.json({ 
      schema: schemaJson,
      fallback: isUsingFallback,
      message: isUsingFallback ? "Generated using fallback due to API quota limits" : "Generated using AI"
    })
  } catch (error) {
    console.error("💥 Schema generation critical error:", error)
    
    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
      console.error("Stack trace:", error instanceof Error ? error.stack : 'No stack trace available')
    }
    
    return NextResponse.json({ 
      error: "Failed to generate schema. Please try again later.",
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    }, { status: 500 })
  }
}

/**
 * Export POST dengan rate limiting
 */
export const POST = withRateLimit(handleSchemaGenerate, strictRateLimit);
