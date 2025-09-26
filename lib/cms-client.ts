/**
 * CMS Client SDK untuk integrasi dengan Next.js frontend
 * Menyediakan interface yang mudah untuk mengakses CMS API
 */

export interface ContentType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  schema: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentEntry {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
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
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  /**
   * Mengambil semua content types
   */
  async getContentTypes(): Promise<ContentType[]> {
    const response = await fetch(`${this.baseUrl}/api/public/content-types`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content types: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Mengambil content type berdasarkan slug
   */
  async getContentType(slug: string): Promise<ContentType> {
    const response = await fetch(`${this.baseUrl}/api/public/content-types?slug=${slug}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content type: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Mengambil content entries berdasarkan content type
   */
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

  /**
   * Mengambil single content entry berdasarkan slug
   */
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

  /**
   * Mengambil media files
   */
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

  /**
   * Helper method untuk generate static paths di Next.js
   */
  async generateStaticPaths(contentType: string): Promise<{ params: { slug: string } }[]> {
    const entries = await this.getContentEntries(contentType, { 
      limit: 1000, // Ambil semua entries
      status: 'published' 
    });
    
    return entries.data.map(entry => ({
      params: { slug: entry.slug }
    }));
  }

  /**
   * Helper method untuk generate static props di Next.js
   */
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

/**
 * Factory function untuk membuat CMS client instance
 */
export function createCMSClient(baseUrl: string): CMSClient {
  return new CMSClient(baseUrl);
}

/**
 * Default client instance menggunakan environment variable
 */
export const cmsClient = createCMSClient(
  process.env.NEXT_PUBLIC_CMS_URL || 'http://localhost:3000'
);