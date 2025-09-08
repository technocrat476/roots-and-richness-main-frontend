import { useNavigate, useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Calendar, User, Clock, ArrowLeft, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import StickyCheckoutButton from '@/components/ui/StickyCheckoutButton';
import SocialShare from '@/components/ui/SocialShare';
import PageSEO from '@/components/SEO/PageSEO';
import apiClient from '@/services/api';

interface BlogPostData {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  author: string;
  date?: string;
  category: string;
  status: string;
  featuredImage?: {
    url: string;
    alt: string;
  };
  readTime?: string;
  relatedKeywords?: string[];
}

const BlogPost = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const navigate = useNavigate();
  const { dispatch } = useCart();
  const handleAddToCart = (product: any, selectedVariant?: any, quantity = 1) => {
  const itemToAdd = {
    _id: product._id,
    name: `${product.name}${selectedVariant ? ` - ${selectedVariant.size}` : ""}`,
    price: selectedVariant?.price || product.price,
    image: product.images?.[0]?.url || "",
    slug: product.slug,
    variant: selectedVariant?.id || selectedVariant?.name || "default",
    quantity,
  };
  dispatch({ type: 'ADD_ITEM', payload: itemToAdd });
};
const extractKeywords = (content: string) => {
  if (!content) return [];

  // Strip HTML tags
  const text = content.replace(/<[^>]*>/g, ' ');

  // Split into words, lowercase
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove punctuation
    .split(/\s+/);

  // Optional: filter out short/common words (stopwords)
  const stopwords = ['the', 'and', 'of', 'in', 'a', 'is', 'to', 'with', 'for', 'are'];
  const keywords = words.map(word => word.endsWith('s') ? word.slice(0, -1) : word);

  // Return top 10 unique keywords
  return Array.from(new Set(keywords)).slice(0, 10);
};
// Fetch blog post
useEffect(() => {
  async function fetchPost() {
    try {
      setLoading(true);
      const res = await apiClient.getSingleBlog(slug);
      setPost(res.blog);
    } catch (err: any) {
      setError(err.message || 'Error loading blog post');
    } finally {
      setLoading(false);
    }
  }
  fetchPost();
}, [slug]);

useEffect(() => {
  async function fetchProducts() {
    try {
      const res = await apiClient.getProducts();
      console.log('API response:', res);
      const productsData = res.products || [];
      console.log('Fetched products:', productsData);
      setProducts(productsData);
    } catch (err: any) {
      console.error(err);
    }
  }
  fetchProducts();
}, []);

// Compute related products whenever post or products change
useEffect(() => {
  if (!post || !products.length) return;

  const keywords = extractKeywords(post.content || post.excerpt);
  console.log('Extracted keywords:', keywords);
  const matched = products.filter((product: any) => {
   const productText = `${product.name} ${product.shortDescription || ''} ${product.description || ''}`.toLowerCase().replace(/[^a-z0-9\s]/g, '');
   return keywords.some(keyword => productText.includes(keyword.replace(/[^a-z0-9\s]/g, '')));
  }).slice(0, 3);

  setRelatedProducts(matched);
}, [post, products]);

  // Find related products based on blog content keywords
/*  const getRelatedProducts = (keywords: string[]) => {
    return products.filter(product => {
      const productText = `${product.name} ${product.shortDescription} ${product.description}`.toLowerCase();
      return keywords.some(keyword => productText.includes(keyword.toLowerCase()));
    }).slice(0, 3);
  }; */

//  const relatedProducts = post?.relatedKeywords
//    ? getRelatedProducts(post.relatedKeywords)
//    : [];

  const relatedPosts = [
    {
      id: '2',
      title: 'Supporting Tribal Communities: Our Direct Trade Journey',
      slug: 'supporting-tribal-communities',
      image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=300&h=200&fit=crop',
      category: 'Sustainability',
    },
    {
      id: '3',
      title: '10 Health Benefits of Raw Forest Honey',
      slug: 'health-benefits-raw-forest-honey',
      image: 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=300&h=200&fit=crop',
      category: 'Health & Wellness',
    },
  ];

  const currentUrl = window.location.href;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-medium">
        Loading blog...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-playfair font-bold text-secondary">
            {error || 'Post Not Found'}
          </h1>
          <Link to="/blog">
            <Button className="btn-primary">
              <ArrowLeft size={16} className="mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PageSEO
        title={post.title}
        description={post.excerpt}
        image={post.featuredImage?.url}
        url={currentUrl}
      />

      {/* Breadcrumb */}
      <div className="bg-neutral-light py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-neutral-medium hover:text-primary">
              Home
            </Link>
            <span className="text-neutral-medium">/</span>
            <Link to="/blog" className="text-neutral-medium hover:text-primary">
              Blog
            </Link>
            <span className="text-neutral-medium">/</span>
            <span className="text-secondary font-medium">{post.title}</span>
          </div>
        </div>
      </div>

      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Article Header */}
          <header className="space-y-6 mb-12">
            <div className="flex items-center space-x-4">
              <Link to="/blog">
                <Button variant="outline" size="sm">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Blog
                </Button>
              </Link>
              <Badge>{post.category}</Badge>
            </div>

            <h1 className="text-3xl lg:text-5xl font-playfair font-bold text-secondary leading-tight">
              {post.title}
            </h1>

            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-6 text-sm text-neutral-medium">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>By {post.author}</span>
                </div>
    	{/* Date and Reading Time */}
	{post.publishedAt && (
 	 <div className="flex items-center space-x-2">
    	<Calendar size={16} />
    	<span>
      	{(() => {
        	const d = new Date(post.publishedAt);
        	const mm = String(d.getMonth() + 1).padStart(2, '0');
        	const dd = String(d.getDate()).padStart(2, '0');
        	const yyyy = d.getFullYear();
        	return `${mm}/${dd}/${yyyy}`;
      	})()}
    	</span>
  	</div>
	)}
                {post.readingTime && (
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>{post.readingTime} min read</span>
                  </div>
                )}
              </div>

              <SocialShare
                variant="blog-header"
                url={currentUrl}
                title={post.title}
                className="pt-2 border-t border-neutral-light"
              />
            </div>
          </header>

          {/* Featured Image */}
          {post.featuredImage?.url && (
            <div className="relative mb-12">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-64 lg:h-96 object-cover rounded-lg shadow-lg"
              />
            </div>
          )}

          {/* Article Content */}
          <div className="prose prose-lg max-w-none">
            {post.content ? (
              <div
                className="text-neutral-medium leading-relaxed space-y-6"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            ) : (
              <p className="text-neutral-medium">{post.excerpt}</p>
            )}
          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <section className="mt-12 p-8 bg-neutral-light rounded-2xl">
              <h3 className="text-2xl font-playfair font-bold text-secondary mb-6">
                Featured Products Mentioned in This Article
              </h3>
              <p className="text-neutral-medium mb-6">
                Experience the premium wood-pressed oils we discussed in this article. Each product is traditionally processed and sourced directly from farmers.
              </p>

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {relatedProducts.map((product: any) => (
    <Card key={product._id} className="group hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/products/${product.slug}`)}>
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={product.images[0]?.url}
                        alt={`${product.name} - As featured in ${post.title}`}
                        className="w-full h-48 object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.originalPrice && (
                        <Badge className="absolute top-3 left-3 bg-accent text-white">
                          Save ₹{product.originalPrice - product.price}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h4 className="font-playfair font-semibold text-secondary mb-2 line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-sm text-neutral-medium mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold text-secondary">
                            ₹{product.price}
                          </span>
                          {product.originalPrice && (
                            <span className="text-sm text-neutral-medium line-through ml-2">
                              ₹{product.originalPrice}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Link to={`/products/${product.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Product
                          </Button>
                        </Link>
                        <Link to={`/products/${product.slug}`}>
                          <Button   onClick={() => handleAddToCart(product)}
  disabled={!product.isActive}  // Only active products can be added
  className="btn-primary min-h-[44px] sm:w-auto w-full"
  aria-label={`Add ${product.name} to cart`}>
                            <ShoppingCart size={14} />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center mt-8">
                <Link to="/products">
                  <Button className="btn-primary">
                    Explore All Our Premium Products
                  </Button>
                </Link>
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-neutral-light space-y-6">
            <SocialShare variant="blog-footer" url={currentUrl} title={post.title} />

            <Separator />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <h3 className="font-playfair font-semibold text-secondary">
                  About the Author
                </h3>
                <p className="text-sm text-neutral-medium">
                  {post.author} is our Quality Head with expertise in traditional processing methods and quality assurance.
                </p>
              </div>

              <Button variant="outline">
                View All Posts by {post.author}
              </Button>
            </div>
          </footer>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 bg-neutral-light">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-playfair font-bold text-secondary mb-8">
                Related Articles
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group hover:shadow-lg transition-shadow"
                  >
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={relatedPost.image}
                        alt={relatedPost.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-6">
                      <Badge variant="outline" className="mb-3">
                        {relatedPost.category}
                      </Badge>
                      <Link to={`/blog/${relatedPost.slug}`}>
                        <h3 className="font-playfair font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="py-16 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl font-playfair font-bold">Stay Informed</h2>
            <p className="text-gray-300">
              Get the latest articles on wellness, sustainability, and natural living delivered
              to your inbox
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-neutral-dark"
              />
              <Button className="btn-primary">Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
      {/* Sticky Checkout Button */}
      <StickyCheckoutButton />
    </div>
  );
};

export default BlogPost;
