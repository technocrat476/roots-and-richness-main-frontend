import React from "react";
import PageSEO from "@/components/SEO/PageSEO";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

const ShippingPolicy = () => {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Shipping Policy" },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* SEO */}
      <PageSEO
        title="Shipping Policy | Roots & Richness"
        description="Read Roots & Richness' shipping policy regarding order processing, delivery timelines, courier partners, and customer support."
        canonicalUrl="https://rootsandrichness.in/shipping-policy"
        ogType="website"
      />

      {/* Header Section */}
      <div className="bg-neutral-light py-6 border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <Breadcrumbs items={breadcrumbItems} />
          <h1 className="mt-2 text-3xl font-playfair font-bold text-secondary">
            Shipping Policy
          </h1>
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-10">
        <div className="prose prose-lg max-w-none text-neutral-dark leading-relaxed">
          <p>
            The orders for the user are shipped through registered domestic
            courier companies and/or speed post only. Orders are shipped within{" "}
            <strong>3 to 5 days</strong> from the date of the order and/or
            payment, or as per the delivery date agreed at the time of order
            confirmation, subject to courier company / post office norms.
          </p>

          <p>
            Roots & Richness (the “Platform Owner”) shall not be held liable for
            any delay in delivery by the courier company or postal authority.
            All deliveries will be made to the shipping address provided by the
            customer at the time of purchase.
          </p>

          <p>
            Confirmation of delivery of our services will be sent to the
            customer’s registered email ID, as specified at the time of account
            creation or order placement.
          </p>

          <p>
            Any shipping cost(s) charged by the seller or the Platform Owner (as
            applicable) <strong>are non-refundable</strong>.
          </p>

          <p>
            For any issues regarding order delivery, tracking, or assistance in
            utilizing our services, you may contact our support team at:
          </p>

          <p className="font-semibold text-primary">
            support@rootsandrichness.in
          </p>
        </div>
      </div>

      {/* Footer spacing */}
      <div className="h-10" />
    </div>
  );
};

export default ShippingPolicy;
