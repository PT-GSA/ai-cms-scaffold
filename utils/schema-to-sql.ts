interface Column {
  name: string
  type: string
  nullable?: boolean
  primary_key?: boolean
  unique?: boolean
  default?: any
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

export function validateSchema(schema: any): boolean {
  if (!schema || typeof schema !== "object") {
    return false
  }

  if (!Array.isArray(schema.tables)) {
    return false
  }

  for (const table of schema.tables) {
    if (!table.name || typeof table.name !== "string") {
      return false
    }

    if (!Array.isArray(table.columns)) {
      return false
    }

    for (const column of table.columns) {
      if (!column.name || !column.type) {
        return false
      }
    }
  }

  return true
}
