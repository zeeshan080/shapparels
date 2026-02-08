interface ProductJsonLdProps {
  product: {
    name: string;
    description: string | null;
    basePrice: string;
    images: { url: string }[];
    slug: string;
  };
  siteUrl: string;
}

export function ProductJsonLd({ product, siteUrl }: ProductJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || "",
    image: product.images.map((i) => i.url),
    url: `${siteUrl}/products/${product.slug}`,
    offers: {
      "@type": "Offer",
      price: product.basePrice,
      priceCurrency: "PKR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "SH Apparels",
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
