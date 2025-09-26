import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface WebhookPayload {
  event: 'content.created' | 'content.updated' | 'content.deleted' | 'content.published';
  content_type: string;
  content_id: string;
  slug?: string;
  data?: Record<string, any>;
  timestamp: string;
}

/**
 * POST /api/webhooks
 * Trigger webhooks untuk notifikasi perubahan content
 * Digunakan untuk rebuild Vercel, sync dengan sistem lain, dll
 */
export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json();
    
    // Validasi payload
    if (!payload.event || !payload.content_type || !payload.content_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event, content_type, content_id' },
        { status: 400 }
      );
    }

    // Ambil webhook URLs dari database atau environment
    const webhookUrls = await getWebhookUrls();
    
    const results = await Promise.allSettled(
      webhookUrls.map(async (webhookUrl) => {
        return triggerWebhook(webhookUrl, payload);
      })
    );

    // Trigger Vercel rebuild jika ada deployment hook
    if (process.env.VERCEL_DEPLOY_HOOK_URL) {
      await triggerVercelRebuild(payload);
    }

    // Trigger ISR revalidation
    await triggerRevalidation(payload);

    // Log webhook activity
    await logWebhookActivity(payload, results);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      message: 'Webhooks triggered successfully',
      success_count: successCount,
      failure_count: failureCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger webhooks' },
      { status: 500 }
    );
  }
}

/**
 * Mengambil webhook URLs dari database
 */
async function getWebhookUrls(): Promise<string[]> {
  // Untuk sekarang, ambil dari environment variables
  // Nanti bisa dipindah ke database untuk management yang lebih baik
  const webhookUrls = process.env.WEBHOOK_URLS?.split(',') || [];
  return webhookUrls.filter(url => url.trim().length > 0);
}

/**
 * Trigger webhook ke URL tertentu
 */
async function triggerWebhook(url: string, payload: WebhookPayload): Promise<void> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-CMS-Webhook/1.0',
      'X-Webhook-Source': 'ai-cms-scaffold'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
  }
}

/**
 * Trigger Vercel rebuild
 */
async function triggerVercelRebuild(payload: WebhookPayload): Promise<void> {
  if (!process.env.VERCEL_DEPLOY_HOOK_URL) {
    return;
  }

  try {
    const response = await fetch(process.env.VERCEL_DEPLOY_HOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reason: `Content ${payload.event}: ${payload.content_type}/${payload.slug || payload.content_id}`,
        source: 'ai-cms-webhook'
      })
    });

    if (!response.ok) {
      console.error('Vercel rebuild failed:', response.status, response.statusText);
    } else {
      console.log('Vercel rebuild triggered successfully');
    }
  } catch (error) {
    console.error('Error triggering Vercel rebuild:', error);
  }
}

/**
 * Trigger ISR revalidation
 */
async function triggerRevalidation(payload: WebhookPayload): Promise<void> {
  try {
    const revalidationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/revalidate`;
    
    const response = await fetch(revalidationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REVALIDATION_TOKEN}`
      },
      body: JSON.stringify({
        type: 'content',
        content_type: payload.content_type,
        slug: payload.slug
      })
    });

    if (!response.ok) {
      console.error('ISR revalidation failed:', response.status, response.statusText);
    } else {
      console.log('ISR revalidation triggered successfully');
    }
  } catch (error) {
    console.error('Error triggering ISR revalidation:', error);
  }
}

/**
 * Log webhook activity untuk monitoring
 */
async function logWebhookActivity(
  payload: WebhookPayload,
  results: PromiseSettledResult<void>[]
): Promise<void> {
  try {
    // Simpan log ke database untuk monitoring
    const { error } = await supabase
      .from('webhook_logs')
      .insert({
        event: payload.event,
        content_type: payload.content_type,
        content_id: payload.content_id,
        payload: payload,
        success_count: results.filter(r => r.status === 'fulfilled').length,
        failure_count: results.filter(r => r.status === 'rejected').length,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to log webhook activity:', error);
    }
  } catch (error) {
    console.error('Error logging webhook activity:', error);
  }
}

/**
 * GET /api/webhooks
 * Health check dan info endpoint
 */
export async function GET() {
  const webhookUrls = await getWebhookUrls();
  
  return NextResponse.json({
    message: 'Webhook system is active',
    configured_webhooks: webhookUrls.length,
    vercel_deploy_hook: !!process.env.VERCEL_DEPLOY_HOOK_URL,
    revalidation_enabled: !!process.env.REVALIDATION_TOKEN,
    timestamp: new Date().toISOString()
  });
}