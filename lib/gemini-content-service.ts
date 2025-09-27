import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface ContentGenerationRequest {
  topic: string
  contentType: 'blog_post' | 'article' | 'product_description' | 'news' | 'tutorial'
  tone: 'professional' | 'casual' | 'friendly' | 'formal' | 'creative'
  length: 'short' | 'medium' | 'long'
  language: 'id' | 'en'
  keywords?: string[]
  targetAudience?: string
  additionalInstructions?: string
}

export interface GeneratedContent {
  title: string
  content: string
  excerpt: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  suggestedImages: string[]
}

class GeminiContentService {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    try {
      const prompt = this.buildPrompt(request)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseResponse(text)
    } catch (error) {
      console.error('Error generating content with Gemini:', error)
      throw new Error('Failed to generate content')
    }
  }

  private buildPrompt(request: ContentGenerationRequest): string {
    const {
      topic,
      contentType,
      tone,
      length,
      language,
      keywords = [],
      targetAudience = 'general audience',
      additionalInstructions = ''
    } = request

    const lengthInstructions = {
      short: 'sekitar 200-300 kata',
      medium: 'sekitar 500-800 kata',
      long: 'sekitar 1000-1500 kata'
    }

    const toneInstructions = {
      professional: 'profesional dan formal',
      casual: 'santai dan mudah dipahami',
      friendly: 'ramah dan hangat',
      formal: 'formal dan resmi',
      creative: 'kreatif dan menarik'
    }

    const contentTypeInstructions = {
      blog_post: 'artikel blog yang informatif dan engaging',
      article: 'artikel yang mendalam dan well-researched',
      product_description: 'deskripsi produk yang persuasif',
      news: 'berita yang objektif dan faktual',
      tutorial: 'tutorial step-by-step yang mudah diikuti'
    }

    return `
Buatkan ${contentTypeInstructions[contentType]} dengan spesifikasi berikut:

**Topik**: ${topic}
**Tone**: ${toneInstructions[tone]}
**Panjang**: ${lengthInstructions[length]}
**Bahasa**: ${language === 'id' ? 'Bahasa Indonesia' : 'English'}
**Target Audience**: ${targetAudience}
${keywords.length > 0 ? `**Keywords**: ${keywords.join(', ')}` : ''}
${additionalInstructions ? `**Instruksi Tambahan**: ${additionalInstructions}` : ''}

Tolong berikan response dalam format JSON berikut:
{
  "title": "Judul yang menarik dan SEO-friendly",
  "content": "Konten utama dalam format HTML dengan struktur yang baik (heading, paragraph, list, dll)",
  "excerpt": "Ringkasan singkat 1-2 kalimat",
  "metaTitle": "Meta title untuk SEO (max 60 karakter)",
  "metaDescription": "Meta description untuk SEO (max 160 karakter)",
  "tags": ["tag1", "tag2", "tag3"],
  "suggestedImages": ["deskripsi gambar 1", "deskripsi gambar 2"]
}

Pastikan konten:
- Informatif dan memberikan nilai
- SEO-friendly
- Struktur yang jelas dengan heading dan paragraph
- Menggunakan format HTML yang proper
- Sesuai dengan tone yang diminta
- Panjang sesuai permintaan
`
  }

  private parseResponse(text: string): GeneratedContent {
    try {
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])
      
      return {
        title: parsed.title || '',
        content: parsed.content || '',
        excerpt: parsed.excerpt || '',
        metaTitle: parsed.metaTitle || '',
        metaDescription: parsed.metaDescription || '',
        tags: parsed.tags || [],
        suggestedImages: parsed.suggestedImages || []
      }
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      
      // Fallback response
      return {
        title: 'Generated Content',
        content: '<p>Content generated successfully</p>',
        excerpt: 'Generated excerpt',
        metaTitle: 'Generated Title',
        metaDescription: 'Generated description',
        tags: ['generated'],
        suggestedImages: ['Generated image suggestion']
      }
    }
  }

  async generateMultipleTitles(topic: string, count: number = 5): Promise<string[]> {
    try {
      const prompt = `
Buatkan ${count} judul yang menarik dan SEO-friendly untuk topik: "${topic}"

Berikan response dalam format array JSON:
["Judul 1", "Judul 2", "Judul 3", "Judul 4", "Judul 5"]

Pastikan setiap judul:
- Menarik dan clickable
- SEO-friendly
- Maksimal 60 karakter
- Berbeda satu sama lain
- Menggunakan Bahasa Indonesia
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return [`${topic} - Artikel Terbaru`]
    } catch (error) {
      console.error('Error generating titles:', error)
      return [`${topic} - Artikel Terbaru`]
    }
  }

  async improveContent(content: string, instructions: string): Promise<string> {
    try {
      const prompt = `
Perbaiki dan tingkatkan konten berikut berdasarkan instruksi yang diberikan:

**Konten Asli:**
${content}

**Instruksi Perbaikan:**
${instructions}

Tolong berikan konten yang sudah diperbaiki dalam format HTML yang sama.
`

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Error improving content:', error)
      return content
    }
  }
}

export const geminiContentService = new GeminiContentService()
