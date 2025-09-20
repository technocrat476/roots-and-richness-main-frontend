import React from "react";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  heroImageSrc?: string;
  heroImageAlt?: string;
  productImageSrc?: string;
  productImageAlt?: string;
}

const HeroBanner: React.FC<HeroBannerProps> = ({
  title = "From Our Fields to Your Kitchen",
  subtitle = "Authentic, chemical-free, traditionally processed products delivered to your door.",
  ctaText = "Shop Now",
  ctaLink = "/shop",
  heroImageSrc = "/images/hero/hero-banner.webp",
  heroImageAlt = "Roots and Richness - Premium Natural Products",
  productImageSrc,
  productImageAlt,
}) => {
  return (
    <section className="relative w-full bg-[#FFF8F0] overflow-hidden">
      {/* Background Image */}
      <div className="relative w-full h-[500px] md:h-[700px]">
        <img
          src={heroImageSrc}
          alt={heroImageAlt}
          className="w-full h-full object-cover object-center"
        />
        {/* Optional gradient overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10" />
      </div>

      {/* Overlay Text and Product */}
      <div className="absolute inset-0 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between px-6 md:px-20">
        {/* Text Section */}
        <div className="max-w-xl text-center md:text-left">
          <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-lg leading-snug md:leading-tight">
            {title}
          </h1>
          <p className="mt-4 text-lg md:text-2xl text-white drop-shadow-md">
            {subtitle}
          </p>

        </div>

        {/* Product Image (Desktop only) */}
        {productImageSrc && (
          <div className="hidden md:block md:ml-12 transform transition-transform duration-500 hover:scale-105">
            <img
              src={productImageSrc}
              alt={productImageAlt || "Product Image"}
              className="w-96 h-auto object-contain drop-shadow-xl"
            />
          </div>
        )}
      </div>

      {/* Optional floating decorative element */}
      <div className="absolute -bottom-16 right-10 hidden md:block w-32 h-32 bg-yellow-100 rounded-full opacity-30 animate-pulse" />
    </section>
  );
};

export default HeroBanner;
