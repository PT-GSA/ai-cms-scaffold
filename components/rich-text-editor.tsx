'use client'

import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Placeholder } from '@tiptap/extension-placeholder'
import { createLowlight } from 'lowlight'

import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Palette,
  Highlighter,
  Table as TableIcon
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface RichTextEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function RichTextEditor({ 
  content = '', 
  onChange, 
  placeholder = 'Mulai menulis...',
  className = '',
  editable = true
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      CodeBlockLowlight.configure({
        lowlight: createLowlight(),
        HTMLAttributes: {
          class: 'bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse border border-gray-300 dark:border-gray-600',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none dark:prose-invert ${className}`,
      },
    },
  })

  const addImage = useCallback(() => {
    const url = window.prompt('Masukkan URL gambar:')
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addLink = useCallback(() => {
    const url = window.prompt('Masukkan URL:')
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Button
              variant={editor.isActive('bold') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className="h-8 w-8 p-0"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('italic') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className="h-8 w-8 p-0"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('underline') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className="h-8 w-8 p-0"
            >
              <UnderlineIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('strike') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className="h-8 w-8 p-0"
            >
              <Strikethrough className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('code') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className="h-8 w-8 p-0"
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Button
              variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className="h-8 w-8 p-0"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Button
              variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="h-8 w-8 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="h-8 w-8 p-0"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="h-8 w-8 p-0"
            >
              <Quote className="h-4 w-4" />
            </Button>
          </div>

          {/* Alignment */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Button
              variant={editor.isActive({ textAlign: 'left' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: 'center' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: 'right' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              variant={editor.isActive({ textAlign: 'justify' }) ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              className="h-8 w-8 p-0"
            >
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Media & Links */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={addLink}
              className="h-8 w-8 p-0"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addImage}
              className="h-8 w-8 p-0"
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={addTable}
              className="h-8 w-8 p-0"
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center border-r border-gray-200 dark:border-gray-600 pr-2 mr-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant={editor.isActive('textStyle') ? 'default' : 'ghost'}
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Text Color</DialogTitle>
                  <DialogDescription>
                    Pilih warna untuk teks yang dipilih
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-8 gap-2">
                  {['#000000', '#374151', '#6B7280', '#9CA3AF', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316', '#84CC16', '#06B6D4', '#6366F1', '#A855F7', '#F43F5E'].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border border-gray-200 dark:border-gray-600"
                      style={{ backgroundColor: color }}
                      onClick={() => editor.chain().focus().setColor(color).run()}
                    />
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => editor.chain().focus().unsetColor().run()}
                  className="w-full"
                >
                  Reset Color
                </Button>
              </DialogContent>
            </Dialog>
            <Button
              variant={editor.isActive('highlight') ? 'default' : 'ghost'}
              size="sm"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className="h-8 w-8 p-0"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </div>

          {/* History */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="h-8 w-8 p-0"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="h-8 w-8 p-0"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[200px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
