import { createServiceClient } from "./supabase"

export async function executeQuery(query: string): Promise<{ success: boolean; data: unknown }> {
  const supabase = createServiceClient()

  try {
    const { data, error } = await supabase.rpc("execute_sql", { sql_query: query })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("SQL execution error:", error)
    throw error
  }
}

export async function logSchema(schemaName: string, schemaJson: unknown, sqlQuery: string) {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("cms_schemas")
    .insert({
      schema_name: schemaName,
      schema_json: schemaJson,
      sql_query: sqlQuery,
      created_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    throw new Error(`Failed to log schema: ${error.message}`)
  }

  return data
}
