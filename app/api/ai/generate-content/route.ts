import { NextRequest, NextResponse } from 'next/server'
import { geminiContentService, ContentGenerationRequest } from '@/lib/gemini-content-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      topic,
      contentType = 'blog_post',
      tone = 'professional',
      length = 'medium',
      language = 'id',
      keywords = [],
      targetAudience = 'general audience',
      additionalInstructions = ''
    } = body

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'Topic is required'
      }, { status: 400 })
    }

    const generationRequest: ContentGenerationRequest = {
      topic,
      contentType,
      tone,
      length,
      language,
      keywords,
      targetAudience,
      additionalInstructions
    }

    const generatedContent = await geminiContentService.generateContent(generationRequest)

    return NextResponse.json({
      success: true,
      data: generatedContent
    })

  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate content'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const count = parseInt(searchParams.get('count') || '5')

    if (!topic) {
      return NextResponse.json({
        success: false,
        error: 'Topic is required'
      }, { status: 400 })
    }

    const titles = await geminiContentService.generateMultipleTitles(topic, count)

    return NextResponse.json({
      success: true,
      data: titles
    })

  } catch (error) {
    console.error('Error generating titles:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate titles'
    }, { status: 500 })
  }
}
