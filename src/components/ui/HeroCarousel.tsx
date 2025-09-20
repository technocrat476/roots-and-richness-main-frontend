import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

interface Slide {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  heroImageDesktop: string; // Desktop image URL
  heroImageMobile: string;  // Mobile image URL
  heroImageAlt: string;
  productImageSrc?: string;
  productImageAlt?: string;
}

const HeroCarousel: React.FC = () => {
  // ✅ Define slides directly inside the component
  const slides: Slide[] = [
    {
      title: "From Farmers' Hands to Your Home.",
      subtitle: "Authentic, chemical-free oils delivered to your door.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      heroImageDesktop: "https://ik.imagekit.io/rrcdn/Homepage/1.webp",
      heroImageMobile: "https://ik.imagekit.io/rrcdn/Homepage/1.webp",
      heroImageAlt: "Roots and Richness - Premium Oils",
      productImageSrc: "",
      productImageAlt: "Wood-pressed Groundnut Oil",
    },
    {
      title: "Purity from the Source",
      subtitle: "Farm-sourced, untouched, and natural",
      ctaText: "Explore About Us",
      ctaLink: "/about",
      heroImageDesktop: "https://ik.imagekit.io/rrcdn/Homepage/Desktop-2.webp",
      heroImageMobile: "https://ik.imagekit.io/rrcdn/Homepage/Mobile-2.webp",
      heroImageAlt: "Roots and Richness - Wood-pressed Oils",
      productImageSrc: "",
      productImageAlt: "Roots and Richness - Wood-pressed Oils",
    },
    {
      title: "Natural Wellness Products",
      subtitle: "Organic, authentic, and traditionally crafted.",
      ctaText: "Discover Wellness",
      ctaLink: "/products",
      heroImageDesktop: "https://ik.imagekit.io/rrcdn/Homepage/Desktop-3.webp",
      heroImageMobile: "https://ik.imagekit.io/rrcdn/Homepage/Mobile-3.webp",
      heroImageAlt: "Roots and Richness - Wellness",
      productImageSrc: "",
      productImageAlt: "Wellness Bundle",
    },
  ];

  return (
    <section className="w-full relative">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={true}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        className="w-full"
      >
        {slides.map((slide, index) => (
    <SwiperSlide key={index}>
      <div className="relative w-full h-[500px] md:h-[700px] bg-[#FFF8F0]">
    {/* Background Image with <picture> for mobile/desktop */}
    <picture>
    {/* Desktop Image */}
    <source media="(min-width: 768px)" srcSet={slide.heroImageDesktop} />
    {/* Mobile Image */}
    <img
    src={slide.heroImageMobile}
    alt={slide.heroImageAlt}
    className="w-full h-full object-cover object-center"
    />
   </picture>
              {/* Gradient overlay for premium look */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/10" />

              {/* Overlay Text & Product */}
              <div className="absolute inset-0 flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between px-6 md:px-20">
                {/* Text Section */}
                <div className="max-w-xl text-center md:text-left">
                  <h1 className="hidden md:block text-5xl font-bold text-white drop-shadow-lg leading-tight">
                    {slide.title}
                  </h1>
                  <p className="hidden md:block mt-4 text-2xl text-white drop-shadow-md">
                    {slide.subtitle}
                  </p>
	<a
  	href={slide.ctaLink}
  	className="mt-6 hidden md:inline-block bg-[#d4a441] text-white px-8 py-4 text-lg rounded-xl	font-semibold hover:bg-[#d4a441] transition-all shadow-lg"
	>
  	{slide.ctaText}
	</a>
                </div>

                {/* Product Image (Desktop only) */}
                {slide.productImageSrc && (
                  <div className="hidden md:block md:ml-12 transform transition-transform duration-500 hover:scale-105">
                    <img
                      src={slide.productImageSrc}
                      alt={slide.productImageAlt || "Product Image"}
                      className="w-96 h-auto object-contain drop-shadow-xl"
                    />
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default HeroCarousel;
