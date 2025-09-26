/**
 * CMS Client untuk Next.js Blog Example
 * Copy dari lib/cms-client.ts di main CMS project
 */

export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  schema: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
  content: {
    excerpt?: string;
    body?: string;
    featured_image?: string;
    tags?: string[];
    [key: string]: any;
  };
  status: 'published' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  created_at: string;
  folder_id?: string;
  public_url: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ContentEntryResponse {
  data: ContentEntry;
  meta: {
    content_type: ContentType;
  };
}

export interface ContentEntriesResponse extends PaginatedResponse<ContentEntry> {
  meta: PaginatedResponse<ContentEntry>['meta'] & {
    content_type: ContentType;
  };
}

export class CMSClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getContentTypes(): Promise<ContentType[]> {
    const response = await fetch(`${this.baseUrl}/api/public/content-types`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content types: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getContentType(slug: string): Promise<ContentType> {
    const response = await fetch(`${this.baseUrl}/api/public/content-types?slug=${slug}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content type: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getContentEntries(
    contentType: string,
    options: {
      limit?: number;
      offset?: number;
      status?: 'published' | 'draft' | 'archived';
      sort?: string;
      order?: 'asc' | 'desc';
    } = {}
  ): Promise<ContentEntriesResponse> {
    const params = new URLSearchParams({
      content_type: contentType,
      ...Object.fromEntries(
        Object.entries(options).map(([key, value]) => [key, String(value)])
      )
    });

    const response = await fetch(`${this.baseUrl}/api/public/content-entries?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content entries: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getContentEntry(
    contentType: string,
    slug: string
  ): Promise<ContentEntryResponse> {
    const params = new URLSearchParams({ content_type: contentType });
    const response = await fetch(`${this.baseUrl}/api/public/content-entries/${slug}?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content entry: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getMediaFiles(options: {
    limit?: number;
    offset?: number;
    type?: string;
    folder_id?: string;
  } = {}): Promise<PaginatedResponse<MediaFile>> {
    const params = new URLSearchParams(
      Object.fromEntries(
        Object.entries(options).map(([key, value]) => [key, String(value)])
      )
    );

    const response = await fetch(`${this.baseUrl}/api/public/media?${params}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch media files: ${response.statusText}`);
    }
    
    return response.json();
  }

  async generateStaticPaths(contentType: string): Promise<{ params: { slug: string } }[]> {
    const entries = await this.getContentEntries(contentType, { 
      limit: 1000,
      status: 'published' 
    });
    
    return entries.data.map(entry => ({
      params: { slug: entry.slug }
    }));
  }

  async generateStaticProps(
    contentType: string,
    slug: string
  ): Promise<{ props: { entry: ContentEntry; contentType: ContentType } }> {
    const response = await this.getContentEntry(contentType, slug);
    
    return {
      props: {
        entry: response.data,
        contentType: response.meta.content_type
      }
    };
  }
}

export function createCMSClient(baseUrl: string): CMSClient {
  return new CMSClient(baseUrl);
}

export const cms = createCMSClient(
  process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000'
);