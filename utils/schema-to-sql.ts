interface Column {
  name: string
  type: string
  nullable?: boolean
  primary_key?: boolean
  unique?: boolean
  default?: string | number | boolean | null
}

interface Table {
  name: string
  columns: Column[]
}

interface Schema {
  tables: Table[]
}

export function schemaToSQL(schema: Schema): string[] {
  const sqlStatements: string[] = []

  for (const table of schema.tables) {
    const tableName = sanitizeIdentifier(table.name)
    const columns: string[] = []

    for (const column of table.columns) {
      const columnName = sanitizeIdentifier(column.name)
      let columnDef = `${columnName} ${column.type}`

      // Add constraints
      if (column.primary_key) {
        columnDef += " PRIMARY KEY"
      }

      if (column.nullable === false || column.primary_key) {
        columnDef += " NOT NULL"
      }

      if (column.unique && !column.primary_key) {
        columnDef += " UNIQUE"
      }

      if (column.default !== undefined && column.default !== null) {
        if (typeof column.default === "string") {
          columnDef += ` DEFAULT '${column.default.replace(/'/g, "''")}'`
        } else {
          columnDef += ` DEFAULT ${column.default}`
        }
      }

      columns.push(columnDef)
    }

    const createTableSQL = `CREATE TABLE IF NOT EXISTS ${tableName} (\n  ${columns.join(",\n  ")}\n);`
    sqlStatements.push(createTableSQL)
  }

  return sqlStatements
}

function sanitizeIdentifier(identifier: string): string {
  // Remove any non-alphanumeric characters except underscores
  const sanitized = identifier.replace(/[^a-zA-Z0-9_]/g, "_")

  // Ensure it starts with a letter or underscore
  if (!/^[a-zA-Z_]/.test(sanitized)) {
    return `_${sanitized}`
  }

  return sanitized
}

export function validateSchema(schema: unknown): schema is Schema {
  if (!schema || typeof schema !== "object" || schema === null) {
    return false
  }

  const schemaObj = schema as Record<string, unknown>
  if (!Array.isArray(schemaObj.tables)) {
    return false
  }

  for (const table of schemaObj.tables) {
    if (!table || typeof table !== "object" || !table.name || typeof table.name !== "string") {
      return false
    }

    const tableObj = table as Record<string, unknown>
    if (!Array.isArray(tableObj.columns)) {
      return false
    }

    for (const column of tableObj.columns) {
      if (!column || typeof column !== "object" || !column.name || !column.type) {
        return false
      }
    }
  }

  return true
}
