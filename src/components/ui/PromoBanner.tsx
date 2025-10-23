import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PromoBannerProps {
  imageSrc?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
}

const PromoBanner = ({
  imageSrc = "/assets/banner.png",
  title = "",
  subtitle = "",
  buttonText = "",
  buttonLink = "/products",
}: PromoBannerProps) => {
  return (
    <section className="relative bg-neutral-light">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-500 group">
          <img
            src={imageSrc}
            alt="Seasonal promotional banner for Roots & Richness oils"
            className="w-full h-[220px] sm:h-[350px] lg:h-[500px] object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-in-out"
            width="1500"
            height="500"
            loading="eager"
          />

          {/* Subtle gradient overlay only at bottom for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Text content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h2 className="text-white text-2xl sm:text-4xl lg:text-5xl font-playfair font-bold drop-shadow-lg mb-3">
              {title}
            </h2>
            <p className="text-gray-100 text-sm sm:text-lg max-w-2xl mx-auto mb-4 drop-shadow-md">
              {subtitle}
            </p>
            <Link to={buttonLink}>
              <Button
                variant="default"
                size="lg"
                className="bg-gold text-white hover:bg-gold-dark transition-all duration-300 flex items-center gap-2 rounded-full px-6"
              >
                {buttonText} 
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
