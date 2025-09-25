import { type NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createServerSupabaseClient } from "@/lib/supabase"
import { z } from "zod"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const SchemaRequestSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters"),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { description } = SchemaRequestSchema.parse(body)

    // Generate schema with Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" })

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse and validate the JSON response
    let schemaJson
    try {
      schemaJson = JSON.parse(text)
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON response from AI" }, { status: 500 })
    }

    // Validate schema structure
    if (!schemaJson.tables || !Array.isArray(schemaJson.tables)) {
      return NextResponse.json({ error: "Invalid schema structure" }, { status: 500 })
    }

    return NextResponse.json({ schema: schemaJson })
  } catch (error) {
    console.error("Schema generation error:", error)
    return NextResponse.json({ error: "Failed to generate schema" }, { status: 500 })
  }
}
