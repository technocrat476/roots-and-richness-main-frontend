import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PageSEO from '@/components/SEO/PageSEO'; 
import { ShoppingCart, Heart, Truck, Shield, Star, ArrowLeft, Zap} from 'lucide-react';
import { RotateCcw } from 'lucide-react';
import { Separator} from '@/components/ui/separator';
import apiClient from '@/services/api';
import products from '@/pages/products';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import StickyCheckoutButton from '@/components/ui/StickyCheckoutButton';
import variant from '@/components/admin/ProductManager';
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const ProductDetail = () => {
  const { slug } = useParams();
  const { dispatch } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<any>(null);
  const navigate = useNavigate();
// --- Timer & Social Proof State ---
const [timeLeft, setTimeLeft] = useState(0);
const [buyersToday, setBuyersToday] = useState(0);

// Helper: Format remaining time
const formatTimeLeft = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}h:${minutes.toString().padStart(2, '0')}m:${secs.toString().padStart(2, '0')}s`;
};

useEffect(() => {
  if (!product?.slug) return; // ✅ wait until product loads

  const BASE_BUYERS_KEY = "rr_buyers_today_";
  const TIMER_KEY = "rr_sale_timer";
  const today = new Date().toDateString();
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // next midnight
  const secondsUntilMidnight = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  // --- 🧮 Product-Specific Buyers Count ---
  const productBuyersKey = `${BASE_BUYERS_KEY}${product.slug}`;
  const savedData = localStorage.getItem(productBuyersKey);

  if (savedData) {
    const parsed = JSON.parse(savedData);
    if (parsed.date === today) {
      setBuyersToday(parsed.value); // ✅ Reuse today’s number
    } else {
      const newCount = Math.floor(50 + Math.random() * 100); // 🔢 50–150 range
      setBuyersToday(newCount);
      localStorage.setItem(productBuyersKey, JSON.stringify({ value: newCount, date: today }));
    }
  } else {
    const newCount = Math.floor(50 + Math.random() * 100);
    setBuyersToday(newCount);
    localStorage.setItem(productBuyersKey, JSON.stringify({ value: newCount, date: today }));
  }

  // --- ⏱ Timer (same for all products, resets daily) ---
  const savedTimer = localStorage.getItem(TIMER_KEY);
  if (savedTimer) {
    const parsed = JSON.parse(savedTimer);
    if (parsed.date === today && parsed.remaining > 0) {
      setTimeLeft(parsed.remaining);
    } else {
      setTimeLeft(secondsUntilMidnight);
      localStorage.setItem(TIMER_KEY, JSON.stringify({ date: today, remaining: secondsUntilMidnight }));
    }
  } else {
    setTimeLeft(secondsUntilMidnight);
    localStorage.setItem(TIMER_KEY, JSON.stringify({ date: today, remaining: secondsUntilMidnight }));
  }

  // --- ⏳ Countdown effect ---
  const interval = setInterval(() => {
    setTimeLeft((prev) => {
      const newTime = prev > 0 ? prev - 1 : 0;
      localStorage.setItem(TIMER_KEY, JSON.stringify({ date: today, remaining: newTime }));
      return newTime;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [product?.slug]);

  const handleThumbnailClick = (index) => {
    setSelectedImage(index);
    if (swiperRef.current) {
      swiperRef.current.slideTo(index); // tell main swiper to go to that slide
    }
  };
  const selectedVariant =
    product && product.variants
      ? product.variants.find((v) => v.size === selectedSize) || product.variants[0]
      : null;

  useEffect(() => {
    if (!slug) return; // avoid call if slug is undefined

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Slug from useParams:", slug, slug.length);
        // Fetch single product
        const productRes = await apiClient.getProduct(slug);
        console.log("Full API response:", productRes);
        const productData =
        productRes?.product || productRes?.data?.product || null;
        if (!productData) {
          throw new Error("Product not found");
        }
        setProduct(productData);
        // Fetch all products
        const listRes = await apiClient.getProducts();
        console.log("Raw response from getProducts =>", listRes);
        const allProducts = Array.isArray(listRes?.products) ? listRes.products : [];
console.log("All products =>", allProducts);
console.log("Current product =>", productData);
        // Filter related
        const related = allProducts
          .filter(
            (p: any) =>
              p.category === productData.category &&
              p.slug !== productData.slug
          )
          .slice(0, 4);
console.log("Related products =>", related);
        setRelatedProducts(related);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Product not found");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-playfair font-bold text-secondary">Product Not Found</h1>
          <Link to="/products">
            <Button className="btn-primary">
              <ArrowLeft size={16} className="mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

 const handleAddToCart = () => {
  if (!selectedSize && product?.sizes?.length) {
    alert("Please select a size");
    return;
  }

  // Normalize variant selection

  const variantId = `${product._id}-${selectedVariant?._id || selectedSize}`;

  const itemToAdd = {
    variantId: selectedVariant?._id || null, // ✅ unique per variant
    product: product._id,
    name: `${product.name}${selectedVariant ? ` - ${selectedVariant.size}` : ""}`,
    price: selectedVariant ? selectedVariant.price : product.price, // ✅ correct price
    image: product.images?.[0]?.url || "",
    slug: product.slug,
    size: selectedVariant?.size || selectedSize || "default",
    quantity,
  };

  console.log("Adding to cart:", itemToAdd);
  dispatch({
    type: "ADD_ITEM",
    payload: itemToAdd,
  });
};

  /* const relatedProducts = products.filter(p => 
    p.category === product.category && p.slug !== product.slug
  ).slice(0, 4); */

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Products', href: '/products' },
    { label: product.name }
  ];

  // Enhanced product structured data
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "brand": {
      "@type": "Brand",
      "name": "Roots and Richness"
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "INR",
      "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Roots and Richness"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "product.rating",
      "reviewCount": "product.numReviews"
    },
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Processing Method",
        "value": "Wood-Pressed"
      },
      {
        "@type": "PropertyValue", 
        "name": "Source",
        "value": "Direct from Indian Farms"
      }
    ]
  };

  // Enhanced meta description based on product type
  const getMetaDescription = () => {
    const baseDesc = `Buy authentic ${product.name} online at Roots and Richness. `;
    if (product.category === 'oils') {
      return baseDesc + `Wood-pressed, chemical-free, and traditionally processed. Rich in nutrients with high smoke point. Perfect for cooking and oil pulling. Free shipping on orders over ₹500.`;
    } else if (product.category === 'coffee') {
      return baseDesc + `Single-origin Arabica coffee from tribal farmers in Araku Valley. Bold flavor, ethically sourced, and sustainably grown at 3000+ feet elevation.`;
    }
    return baseDesc + `${product.description.substring(0, 100)}... Natural, pure, and directly sourced from Indian farms.`;
  };

  return (
    <div className="min-h-screen bg-white">
      <PageSEO 
        title={`Buy ${product.name} Online | Pure Wood-Pressed ${product.category === 'oils' ? 'Oil' : 'Products'} - Roots and Richness`}
        description={getMetaDescription()}
        keywords={`${product.name}, buy ${product.name} online, wood-pressed oil, cold-pressed oil, natural oil, organic oil, pure ${product.category}, traditional processing`}
        canonicalUrl={`https://rootsandrichness.in/products/${product.slug}`}
        ogType="product"
        structuredData={productStructuredData}
      />

      {/* Breadcrumb */}
      <div className="bg-neutral-light py-4">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
         {/* Product Images */}
<div className="space-y-4">
  {product.images && product.images.length > 0 && (
    <>
      {/* Main Image Carousel */}
      <div className="relative aspect-square bg-neutral-light rounded-lg overflow-hidden">
  {/* Badges */}
  {product.originalPrice && (
    <Badge className="absolute top-4 left-4 bg-accent text-white z-10">
      Save ₹{selectedVariant.originalPrice - selectedVariant.price}
    </Badge>
  )}
  {product?.isFeatured && (
    <Badge className="absolute top-4 right-4 bg-primary text-white z-10">
      Bestseller
    </Badge>
  )}
  <Swiper
    modules={[Pagination]}
    pagination={{ clickable: true }}
    spaceBetween={10}
    slidesPerView={1}
    initialSlide={selectedImage}
    onSwiper={(swiper) => (swiperRef.current = swiper)}    // capture instance
    onSlideChange={(swiper) => setSelectedImage(swiper.activeIndex)} // keep in sync when swiping
    className="h-full"
  >
    {product.images?.map((image, index) => {
      const src = typeof image === "string" ? image : image.url;
      const alt = typeof image === "string" ? `${product.name} - image ${index + 1}` : (image.alt || `${product.name} - image ${index + 1}`);
      return (
        <SwiperSlide key={index}>
          <img src={src} alt={alt} className="w-full h-full object-contain" />
        </SwiperSlide>
      );
    })}
  </Swiper>
      </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <>
              {/* Mobile - Swiper thumbnails */}
              <div className="block lg:hidden">
                <Swiper spaceBetween={-300} slidesPerView={4}>
                  {product.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <img
                        src={image.url}
                        alt={
                          image.alt || `${product.name} thumbnail ${index + 1}`
                        }
                        onClick={() => handleThumbnailClick(index)}
                        className={`w-20 h-20 object-cover rounded-lg cursor-pointer ${
                          selectedImage === index
                            ? "border-2 border-black ring-2 ring-black"
                            : "border border-gray-200"
                        }`}
                      />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              {/* Desktop - Grid thumbnails */}
              <div className="hidden lg:grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => handleThumbnailClick(index)}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer ${
                      selectedImage === index
                        ? "border-2 border-black ring-2 ring-black"
                        : "border border-gray-200"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={
                        image.alt || `${product.name} thumbnail ${index + 1}`
                      }
                      className="w-full h-full object-cover hover:opacity-80 transition"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>

        {/* Enhanced Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-playfair font-bold text-secondary mb-2">
                {product.name} – {product.tagline}
              </h1>
              <p className="text-lg text-neutral-medium">
                {product.shortDescription}
              </p>
              
              {/* Enhanced trust indicators */}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-green-700 border-green-300">
                  ✓ Wood-Pressed
                </Badge>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  ✓ Chemical-Free
                </Badge>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  ✓ Farm Direct
                </Badge>
              </div>
            </div>

{/* Rating with quarter/half/three-quarter star support */}
<div className="flex items-center space-x-4">
  <div
    className="flex items-center space-x-1"
    role="img"
    aria-label={`${product.rating} out of 5 stars`}
  >
    {[1, 2, 3, 4, 5].map((star) => {
      const diff = product.rating - (star - 1); // how much of this star should be filled?
      let fillWidth = 0;

      if (diff >= 1) {
        fillWidth = 100; // full star
      } else if (diff >= 0.75) {
        fillWidth = 75; // three-quarter
      } else if (diff >= 0.5) {
        fillWidth = 50; // half
      } else if (diff >= 0.25) {
        fillWidth = 25; // quarter
      }

      return (
        <span key={star} className="relative inline-block w-5 h-5">
          {/* Empty star base */}
          <Star size={20} className="text-gray-300" />

          {/* Filled portion */}
          {fillWidth > 0 && (
            <Star
              size={20}
              className="text-yellow-500 fill-yellow-500 absolute top-0 left-0"
              style={{ clipPath: `inset(0 ${100 - fillWidth}% 0 0)` }}
            />
          )}
        </span>
      );
    })}
  </div>

  <span className="text-sm text-neutral-medium">
    ({product.numReviews} verified reviews)
  </span>

  {product.isFeatured && (
    <Badge variant="outline" className="text-xs">Bestseller</Badge>
  )}
</div>            
            {/* Enhanced Price section */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-secondary">
                  ₹{selectedVariant.price}
                </span>
                {selectedVariant.originalPrice && (
                  <span className="text-xl text-neutral-medium line-through">
                    ₹{selectedVariant.originalPrice}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <p className="text-sm text-accent font-medium">
                  You save ₹{selectedVariant.originalPrice - selectedVariant.price} ({Math.round(((selectedVariant.originalPrice - selectedVariant.price) / selectedVariant.originalPrice) * 100)}% off) • Limited time offer
                </p>
              )}
              <p className="text-sm text-neutral-medium">
                Inclusive of all taxes • Free shipping on orders above ₹499
              </p>
            </div>
{product?.isSale && selectedVariant?.price > 498 && (
  <div className="mt-4 p-4 border rounded-2xl shadow-sm bg-gray-50">
    <h4 className="text-lg font-semibold text-green-700 mb-2 font-inter">
      🎉 You Get This At
    </h4>

    {(() => {
      const discountPercent = 5; // 🔥 hardcode your discount %
      const finalPrice = Math.ceil(
        selectedVariant.price - (selectedVariant.price * discountPercent) / 100
      );

      return (
        <>
          <div className="flex items-center gap-3">
            {/* ✅ Final discounted price */}
            <span className="text-2xl font-bold text-gray-900">₹{finalPrice}</span>

            {/* ✅ Show original price */}
            <span className="text-gray-500 line-through">
              ₹{selectedVariant.price}
            </span>

            {/* ✅ Show discount percentage */}
            <span className="text-sm font-medium text-green-600">
              {discountPercent}% OFF
            </span>
          </div>

          {/* ✅ Coupon line */}
          <p className="text-sm text-orange-600 font-medium mt-1">
            💳 Use coupon <span className="font-bold">FIRST5</span> for extra {discountPercent}% off
          </p>

          {/* ✅ Shipping / GST line */}
          <p className="text-sm text-gray-600 mt-1">
            ✅ Inclusive of GST 
          </p>
        </>
      );
    })()}
  </div>
)}
{/* --- Limited Time Offer & Social Proof --- 
<div className="mt-5">
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 bg-[#faf8f5] border border-[#eee3d6] rounded-2xl p-5 sm:p-6 shadow-sm transition-all"> */}
    
    {/* Countdown Timer 
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      <p className="text-sm sm:text-base font-medium text-[#8B5E3C]">
        ⏳ <span className="font-semibold text-red-600">{formatTimeLeft(timeLeft)}</span> left for today’s sale!
      </p>
    </div> */}

    {/* Divider on mobile 
    <div className="block sm:hidden border-t border-[#e7dfd2]"></div> */}

    {/* Social Proof *
    <div className="flex items-center gap-3 justify-start sm:justify-end">
      <span className="text-xl sm:text-xl leading-none">🔥</span>
      <p className="text-sm sm:text-base text-neutral-dark font-medium flex items-center gap-2">
        <span className="font-bold text-[#8B5E3C] text-xl sm:text-xl leading-none tabular-nums">
          {buyersToday.toString().padStart(2, '0')}
        </span>
        <span className="text-sm sm:text-base text-neutral-dark">
          people bought this today
        </span>
      </p>
    </div>
  </div>
</div> /}

            {/* Size Selection */}
            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-secondary">Size:</h3>
                <div className="flex space-x-2">
                  {product.variants.map((variant) => (
                    <Button
                      key={variant._id}
                      variant={selectedSize === variant.size ? "default" : "outline"}
                      disabled={variant.stock === 0} 
                      onClick={() => setSelectedSize(variant.size)}
                      className={selectedSize === variant.size ? "btn-primary" : ""}
                      aria-pressed={selectedSize === variant.size}
                    >
                      {variant.size}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="space-y-3">
              <h3 className="font-semibold text-secondary">Quantity:</h3>
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  aria-label="Decrease quantity"
                >
                  -
                </Button>
                <span className="px-4 py-2 border border-gray-300 rounded" aria-label={`Quantity: ${quantity}`}>{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </Button>
              </div>
            </div>

{/* --- Add to Cart & Buy Now Section --- */}
<div className="w-full mt-6">
  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">

    {/* Buy Now */}
    <Button
      onClick={(e) => {
        e.preventDefault();
        if (!product.isActive) return;
        handleAddToCart(product);
        window.location.href = "/checkout";
      }}
      disabled={!product.isActive}
      className="buy-now-shimmer flex-1 bg-amber-800 text-white font-medium 
                 rounded-xl sm:rounded-md px-5 py-3 sm:py-4 
                 shadow-sm hover:shadow-md hover:bg-amber-900 
                 transition-all duration-300 flex justify-center 
                 items-center gap-2"
    >
      <Zap className="w-4 h-4" />
      Buy Now
    </Button>

    {/* Add to Cart */}
    <Button
      onClick={handleAddToCart}
      disabled={!product.isActive}
      className="flex-1 bg-primary text-white font-medium 
                 rounded-xl sm:rounded-md px-5 py-3 sm:py-4 
                 shadow-sm hover:shadow-md hover:bg-primary/90 
                 transition-all duration-300 flex justify-center 
                 items-center gap-2"
    >
      <ShoppingCart size={18} />
      Add to Cart
    </Button>

  </div>

  {/* Out of Stock Message */}
  {!product.isActive && (
    <p className="text-destructive text-sm mt-3 text-center font-medium">
      This product is currently out of stock.
    </p>
  )}
</div>
            {/* Enhanced Trust Badges */}
            <div className="grid grid-cols-3 gap-4 py-6 bg-neutral-light rounded-lg px-4">
              <div className="text-center space-y-2">
                <Truck className="text-primary mx-auto" size={24} />
                <div className="text-xs">
                  <div className="font-medium">Free Shipping</div>
                  <div className="text-neutral-medium">Orders over ₹499</div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <Shield className="text-primary mx-auto" size={24} />
                <div className="text-xs">
                  <div className="font-medium">100% Natural</div>
                  <div className="text-neutral-medium">Lab tested purity</div>
                </div>
              </div>
              <div className="text-center space-y-2">
                <RotateCcw className="text-primary mx-auto" size={24} />
                <div className="text-xs">
                  <div className="font-medium">Easy Returns</div>
                  <div className="text-neutral-medium">7-day policy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Product Details Section */}
        <div className="mt-16 space-y-8">
          <Separator />
          
          {/* About This Product */}
          <div className="space-y-4">
            <h2 className="text-2xl font-playfair font-bold text-secondary">About This Product</h2>
            <div className="prose prose-lg max-w-none text-medium">
              <p className="leading-relaxed">{product.description}</p>
              
              {/* Origin story based on product type */}
              {product.category === 'oils' && (
                <div className="bg-neutral-light p-6 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold text-secondary mb-3">From Farm to Your Kitchen</h3>
                  <p>
                    Our {product.name.toLowerCase()} is sourced directly from small-scale farmers who have perfected 
                    traditional oil pressing techniques passed down through generations. Using wooden churns (kolhus) 
                    that rotate slowly at room temperature, we preserve the natural nutrients, aroma, and flavor that 
                    high-heat processing destroys.
                  </p>
                </div>
              )}
              
              {product.category === 'coffee' && (
                <div className="bg-neutral-light p-6 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold text-secondary mb-3">Tribal Excellence from Araku Valley</h3>
                  <p>
                    Grown by tribal farmers in the pristine Eastern Ghats at over 3,000 feet elevation, our Arabica 
                    coffee represents a partnership with indigenous communities who understand the art of sustainable 
                    cultivation. Every purchase supports fair trade and preserves traditional farming wisdom.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-playfair font-bold text-secondary">Why Choose Our {product.name}?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {product.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-neutral-light rounded-lg">
                    <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Ideas */}
          {product.howToUse && (
            <div className="space-y-4">
              <h2 className="text-2xl font-playfair font-bold text-secondary">How to Use</h2>
              <div className="bg-neutral-light p-6 rounded-lg">
                <p className="text-neutral-medium leading-relaxed"></p>
                
                {product.category === 'oils' && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl mb-2">🍳</div>
                      <div className="text-sm font-medium">{product.howToUse[0]}</div>
                      <div className="text-xs text-neutral-medium">Perfect for all Indian dishes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">💆‍♀️</div>
                      <div className="text-sm font-medium">{product.howToUse[1]}</div>
                      <div className="text-xs text-neutral-medium">Morning wellness routine</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl mb-2">🌿</div>
                      <div className="text-sm font-medium">Ayurvedic Use</div>
                      <div className="text-xs text-neutral-medium">Traditional wellness</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

{/* Customer Reviews Section */}
<div className="space-y-6">
  <h2 className="text-2xl font-playfair font-bold text-secondary">
    What Our Customers Say
  </h2>
  <div className="space-y-4">
    {product.pReview.map((pReview, index) => (
      <blockquote
        key={index}
        className="bg-white border-l-4 border-primary p-6 shadow-sm"
      >
        <p className="text-neutral-dark italic mb-3">
          "{pReview}"
        </p>
        {product.reviewBy[index] && (
          <footer className="text-sm text-neutral-medium">
            — {product.reviewBy[index]} • Verified Purchase
          </footer>
        )}
      </blockquote>
    ))}
  </div>
</div>

          {/* Ingredients */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-playfair font-bold text-secondary">Ingredients</h2>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ingredient, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {ingredient}
                  </Badge>
                ))}
              </div>
            </div>
          )}

{/* Related Products with Size Selection */}
{relatedProducts.length > 0 && (
  <div className="mt-16 space-y-8">
    <Separator />
    <div className="text-center space-y-4">
      <h2 className="text-3xl font-playfair font-bold text-secondary">Related Products</h2>
      <p className="text-neutral-medium">You might also like these products</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {relatedProducts.map((relatedProduct) => {
        // State to manage selected size for this card
const selectedSize = selectedSizes[relatedProduct._id] || relatedProduct.variants?.[0]?.size || "";

const setSize = (size: string) => {
  setSelectedSizes((prev) => ({ ...prev, [relatedProduct._id]: size }));
};

        const selectedVariant =
          relatedProduct.variants?.find((v) => v.size === selectedSize) ||
          relatedProduct.variants?.[0] ||
          null;

        const handleAddToCart = () => {
          if (!selectedSize && relatedProduct.variants?.length) {
            alert("Please select a size");
            return;
          }

          const itemToAdd = {
            variantId: selectedVariant?._id || null,
            product: relatedProduct._id,
            name: `${relatedProduct.name}${selectedVariant ? ` - ${selectedVariant.size}` : ""}`,
            price: selectedVariant ? selectedVariant.price : relatedProduct.price,
            image: relatedProduct.images?.[0]?.url || "",
            slug: relatedProduct.slug,
            size: selectedVariant?.size || selectedSize || "default",
            quantity: 1,
          };

          dispatch({ type: "ADD_ITEM", payload: itemToAdd });
        };

        return (
	<Card
  	key={relatedProduct._id}
  	className="group hover:shadow-lg transition-shadow cursor-pointer"
  	onClick={() => navigate(`/products/${relatedProduct.slug}`)}
	>
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              <img
                src={relatedProduct.images[0]?.url}
                alt={`${relatedProduct.name} - Premium natural product`}
                className="w-full h-72 object-contain group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-playfair font-semibold text-secondary mb-2">
                {relatedProduct.name}
              </h3>

              {/* Price */}
<div className="flex items-center gap-2">
  {/* Current price */}
  <span className="text-lg font-bold text-secondary">
    ₹{selectedVariant ? selectedVariant.price : relatedProduct.price}
  </span>

  {/* Original price, only show if there's a discount */}
  {((selectedVariant && selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price) ||
   (relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price)) && (
    <span className="text-sm text-neutral-medium line-through">
      ₹{selectedVariant ? selectedVariant.originalPrice : relatedProduct.originalPrice}
    </span>
  )}

  {/* Optional discount badge */}
  {((selectedVariant && selectedVariant.originalPrice && selectedVariant.originalPrice > selectedVariant.price) ||
   (relatedProduct.originalPrice && relatedProduct.originalPrice > relatedProduct.price)) && (
    <span className="text-xs text-white bg-accent px-2 py-0.5 rounded">
      Save ₹{selectedVariant 
        ? selectedVariant.originalPrice - selectedVariant.price
        : relatedProduct.originalPrice - relatedProduct.price}
    </span>
  )}
</div>


              {/* Size Selection */}
              {Array.isArray(relatedProduct.variants) && relatedProduct.variants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {relatedProduct.variants.map((variant) => (
                    <Button
                      key={variant._id}
                      size="sm"
                      variant={selectedSize === variant.size ? "default" : "outline"}
                      className={selectedSize === variant.size ? "btn-primary" : ""}
                      disabled={variant.stock === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSize(variant.size);
                      }}
                    >
                      {variant.size}
                    </Button>
                  ))}
                </div>
              )}

              {/* Add to Cart Button */}

              {relatedProduct.isActive ? (
              <Button
                className="mt-2 w-full btn-primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
              >
                Add to Cart
    </Button>
  	) : (
    <Button
      size="sm"
      variant="destructive"

      className="w-full cursor-not-allowed"
    >
      	Sold Out!
    </Button>
  	)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  </div>
)}
</div>

{/* FAQ Section for SEO and Conversion */}
<div className="mt-16 space-y-8">
  <Separator />
  <h2 className="text-2xl sm:text-3xl font-playfair font-bold text-secondary">
    Frequently Asked Questions
  </h2>
  <div className="space-y-5">
    
    {/* 1. Health Benefit */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        What makes wood-pressed oils healthier?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        Wood-pressed oils are extracted at low temperatures without chemicals or preservatives.
        This method preserves essential nutrients, antioxidants, and natural flavor —
        making it a pure, wholesome choice for everyday cooking and wellness.
      </p>
    </details>

    {/* 2. Cooking Use */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        Can I use this oil for high-heat cooking or deep frying?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        Absolutely. Our oils retain their natural smoke point and are perfect for
        traditional Indian dishes, including deep frying, sautéing, and tadka.
        You get a rich aroma without losing nutrients.
      </p>
    </details>

    {/* 3. Purity and Source */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        How do you ensure purity and quality?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        Every batch is wood-pressed in small quantities using carefully sourced, high-quality seeds or nuts.
        We don’t use chemicals, heat, or solvents — just pure, slow extraction and natural sedimentation.
        Our oils are lab-tested for purity before bottling.
      </p>
    </details>

    {/* 4. Shelf Life */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        What is the shelf life of your oils?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        Our wood-pressed oils stay fresh for up to 12 months when stored in a cool, dry place.
        Because they are 100% natural, some settling at the bottom is normal — it’s proof of authenticity.
      </p>
    </details>

   {/* 5. Packaging & Freshness */}
<details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
  <summary className="font-medium cursor-pointer text-secondary">
    What kind of packaging do you use?
  </summary>
  <p className="mt-3 text-medium leading-relaxed">
    We use high-quality, food-grade PET bottles that are 100% safe for edible oils and
    specially chosen to preserve purity and freshness. These bottles are lightweight,
    easy to handle, and completely recyclable — ensuring your oil stays fresh while being
    kind to the planet.
  </p>
</details>
    {/* 6. Sourcing */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        Where do you source your ingredients from?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        We work directly with trusted local farmers and small-scale producers who follow
        ethical and sustainable practices. Every seed is handpicked and wood-pressed in
        small batches to maintain traceability and authenticity.
      </p>
    </details>

    {/* 7. Shipping and Delivery */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        How soon will my order arrive?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        Orders are usually shipped within 24 hours and delivered in 3–5 working days across India.
        Each bottle is carefully packed to reach you safely, fresh and intact.
      </p>
    </details>

    {/* 8. Brand Trust */}
    <details className="bg-neutral-light p-5 rounded-xl border border-neutral-200 hover:border-amber-200 transition-all">
      <summary className="font-medium cursor-pointer text-secondary">
        Why should I choose Roots and Richness over other brands?
      </summary>
      <p className="mt-3 text-medium leading-relaxed">
        We stay true to purity — sourcing directly from Indian farmers and using traditional wooden
        churns to extract every drop. No shortcuts, no compromise. Our oils bring back the natural
        aroma, flavor, and health that your kitchen truly deserves.
      </p>
    </details>
  </div>
</div>
      </div>

      <StickyCheckoutButton />
    </div>
  );
};

export default ProductDetail;
