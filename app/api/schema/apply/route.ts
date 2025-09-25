import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"
import { executeSQL, logSchema } from "@/lib/database"
import { schemaToSQL } from "@/utils/schema-to-sql"
import { z } from "zod"

const ApplySchemaRequestSchema = z.object({
  schema: z.object({
    tables: z.array(
      z.object({
        name: z.string(),
        columns: z.array(
          z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean().optional(),
            primary_key: z.boolean().optional(),
            unique: z.boolean().optional(),
            default: z.any().optional(),
          }),
        ),
      }),
    ),
  }),
  schemaName: z.string().min(1, "Schema name is required"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate request
    const body = await request.json()
    const { schema, schemaName } = ApplySchemaRequestSchema.parse(body)

    // Convert schema to SQL
    const sqlStatements = schemaToSQL(schema)

    // Execute SQL statements
    const results = []
    for (const sql of sqlStatements) {
      try {
        const result = await executeSQL(sql)
        results.push({ sql, success: true, result })
      } catch (error) {
        console.error("SQL execution failed:", error)
        results.push({
          sql,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    // Log the schema
    try {
      await logSchema(schemaName, schema, sqlStatements.join("\n\n"))
    } catch (error) {
      console.error("Failed to log schema:", error)
    }

    // Check if any statements failed
    const failedStatements = results.filter((r) => !r.success)
    if (failedStatements.length > 0) {
      return NextResponse.json(
        {
          error: "Some SQL statements failed",
          results,
          failedStatements,
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      success: true,
      message: `Schema "${schemaName}" applied successfully`,
      results,
    })
  } catch (error) {
    console.error("Schema application error:", error)
    return NextResponse.json({ error: "Failed to apply schema" }, { status: 500 })
  }
}
