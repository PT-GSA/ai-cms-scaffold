import Link from 'next/link';
import { cms, ContentEntry } from '../lib/cms';

/**
 * Homepage - menampilkan latest blog posts
 */
export default async function HomePage() {
  // Fetch latest blog posts
  const { data: posts } = await cms.getContentEntries('blog', {
    limit: 6,
    status: 'published',
    sort: 'published_at',
    order: 'desc'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Welcome to My Blog
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing stories, insights, and tutorials powered by AI CMS Scaffold
          </p>
          <Link 
            href="/blog"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Read All Posts
          </Link>
        </div>
      </section>

      {/* Latest Posts */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Latest Posts
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post: ContentEntry) => (
              <article key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {post.content.featured_image && (
                  <div className="aspect-video bg-gray-200">
                    <img
                      src={post.content.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    <Link 
                      href={`/blog/${post.slug}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {post.title}
                    </Link>
                  </h3>
                  
                  {post.content.excerpt && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.content.excerpt}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <time>
                      {new Date(post.published_at || post.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    
                    {post.content.tags && post.content.tags.length > 0 && (
                      <div className="flex gap-2">
                        {post.content.tags.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          
          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Belum ada blog posts. Silakan buat content di CMS dashboard.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Powered by AI CMS Scaffold
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            This blog is built with Next.js and powered by AI CMS Scaffold. 
            Create, manage, and publish content with ease.
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/blog"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Browse Posts
            </Link>
            <a 
              href="https://github.com/your-repo/ai-cms-scaffold"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}