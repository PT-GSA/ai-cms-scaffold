import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

/**
 * GET handler untuk mengambil history schema dari database
 * Mendukung pagination dan sorting berdasarkan created_at
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    const supabase = createServiceClient()

    // Ambil data history dengan pagination
    const { data: schemas, error, count } = await supabase
      .from("cms_schemas")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching schema history:", error)
      return NextResponse.json(
        { error: "Failed to fetch schema history" },
        { status: 500 }
      )
    }

    // Format data untuk response
    const formattedSchemas = schemas?.map((schema) => ({
      id: schema.id,
      schemaName: schema.schema_name,
      schemaJson: schema.schema_json,
      sqlQuery: schema.sql_query,
      createdAt: schema.created_at,
      updatedAt: schema.updated_at,
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedSchemas,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler untuk menghapus schema berdasarkan ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Schema ID is required" },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { error } = await supabase
      .from("cms_schemas")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting schema:", error)
      return NextResponse.json(
        { error: "Failed to delete schema" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Schema deleted successfully",
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}