import { Truck, Leaf, Users, Droplet } from "lucide-react";
import { useEffect, useState } from "react";

const usps = [
  { icon: Leaf, text: "100% Wood-Pressed Oils", ariaLabel: "Pure wood-pressed oils" },
  { icon: Users, text: "Sourced from Andhra Farmers", ariaLabel: "Directly sourced from local farmers" },
  { icon: Droplet, text: "No Additives or Refining", ariaLabel: "Pure unrefined oils without additives" },
  { icon: Truck, text: "Free Shipping Above ₹499", ariaLabel: "Free shipping on orders above 499 rupees" },
];

export const UspBar = () => {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % usps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [mounted]);

  return (
    <div 
      className={`sticky top-0 z-50 bg-[#FDF8F3] text-[#3B2F2F] border-b border-[#E6D8C5] ${
        mounted ? "transition-transform duration-300" : ""
      } ${mounted && isVisible ? "translate-y-0" : mounted ? "-translate-y-full" : "translate-y-0"}`}
      role="banner"
      aria-label="Brand unique selling points"
    >
      {/* Desktop View */}
      <div className="hidden md:flex justify-center items-center gap-8 lg:gap-12 py-3 px-4">
        {usps.map((usp, i) => (
          <div key={i} className="flex items-center gap-2">
            <usp.icon className="w-5 h-5 text-[#8B7355]" aria-hidden="true" />
            <span className="font-medium text-sm whitespace-nowrap" aria-label={usp.ariaLabel}>
              {usp.text}
            </span>
            {i < usps.length - 1 && (
              <div className="w-px h-4 bg-[#E6D8C5] ml-8 lg:ml-12" aria-hidden="true" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile Rotating View */}
      <div className="md:hidden py-3 px-4">
        <div className="flex items-center justify-center gap-2 transition-opacity duration-300">
          {usps.map((usp, i) => {
            const CurrentIcon = usp.icon;
            return (
              <div 
                key={i}
                className={`flex items-center gap-2 transition-opacity duration-300 ${
                  i === currentIndex ? "opacity-100" : "opacity-0 absolute"
                }`}
              >
                <CurrentIcon className="w-5 h-5 text-[#8B7355]" aria-hidden="true" />
                <span className="font-medium text-sm" aria-label={usp.ariaLabel}>
                  {usp.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};