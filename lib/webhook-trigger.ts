/**
 * Webhook Trigger Utility
 * Helper functions untuk trigger webhooks dari berbagai bagian aplikasi
 */

interface WebhookPayload {
  event: 'content.created' | 'content.updated' | 'content.deleted' | 'content.published';
  content_type: string;
  content_id: string;
  slug?: string;
  data?: Record<string, any>;
  timestamp: string;
}

/**
 * Trigger webhook untuk perubahan content
 */
export async function triggerContentWebhook(
  event: WebhookPayload['event'],
  contentType: string,
  contentId: string,
  options: {
    slug?: string;
    data?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    const payload: WebhookPayload = {
      event,
      content_type: contentType,
      content_id: contentId,
      slug: options.slug,
      data: options.data,
      timestamp: new Date().toISOString()
    };

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks`;
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error('Failed to trigger webhook:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error triggering webhook:', error);
  }
}

/**
 * Trigger webhook ketika content dibuat
 */
export async function triggerContentCreated(
  contentType: string,
  contentId: string,
  slug?: string,
  data?: Record<string, any>
): Promise<void> {
  await triggerContentWebhook('content.created', contentType, contentId, { slug, data });
}

/**
 * Trigger webhook ketika content diupdate
 */
export async function triggerContentUpdated(
  contentType: string,
  contentId: string,
  slug?: string,
  data?: Record<string, any>
): Promise<void> {
  await triggerContentWebhook('content.updated', contentType, contentId, { slug, data });
}

/**
 * Trigger webhook ketika content dihapus
 */
export async function triggerContentDeleted(
  contentType: string,
  contentId: string,
  slug?: string
): Promise<void> {
  await triggerContentWebhook('content.deleted', contentType, contentId, { slug });
}

/**
 * Trigger webhook ketika content dipublish
 */
export async function triggerContentPublished(
  contentType: string,
  contentId: string,
  slug?: string,
  data?: Record<string, any>
): Promise<void> {
  await triggerContentWebhook('content.published', contentType, contentId, { slug, data });
}

/**
 * Batch trigger webhooks untuk multiple content
 */
export async function triggerBatchWebhooks(
  webhooks: Array<{
    event: WebhookPayload['event'];
    contentType: string;
    contentId: string;
    slug?: string;
    data?: Record<string, any>;
  }>
): Promise<void> {
  const promises = webhooks.map(webhook =>
    triggerContentWebhook(
      webhook.event,
      webhook.contentType,
      webhook.contentId,
      { slug: webhook.slug, data: webhook.data }
    )
  );

  await Promise.allSettled(promises);
}