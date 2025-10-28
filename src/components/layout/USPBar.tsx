// src/components/USPBar.tsx
import React from "react";

const USPBar = () => {
  return (
    <div className="usp-bar bg-[#d4a441] bg-gradient-to-r from-[#d4a441] via-[#e3bf4c] to-[#d4a441] text-white text-sm tracking-wide font-medium py-2 shadow-sm relative z-50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 px-4 text-center">
        <span className="flex items-center gap-1">
          🌿 <span>100% Natural Ingredients</span>
        </span>
        <span className="hidden sm:inline opacity-70">|</span>
        <span className="flex items-center gap-1">
          🚚 <span>Free Shipping over ₹499</span>
        </span>
        <span className="hidden sm:inline opacity-70">|</span>
        <span className="flex items-center gap-1">
          🔒 <span>Secure Payments</span>
        </span>
        <span className="hidden sm:inline opacity-70">|</span>
        <span className="flex items-center gap-1">
          🇮🇳 <span>Made in India</span>
        </span>
      </div>
    </div>
  );
};

export default USPBar;
