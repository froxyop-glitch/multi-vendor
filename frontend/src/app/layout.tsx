import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { CartProvider } from '../context/CartContext';
import { WishlistProvider } from '../context/WishlistContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: "ShopEzy - India's Trusted Online Shopping Platform | Flipkart Clone",
  description:
    'Shop smartphones, electronics, fashion, home essentials & more with lightning-fast delivery across India.',
  keywords: 'ecommerce, flipkart clone, online shopping, electronics, fashion, mobile phones, shopezy',
  metadataBase: new URL('https://shopezy.com'),
  openGraph: {
    title: "ShopEzy - India's Online Shopping Destination",
    description: 'Explore million+ products with exclusive discounts, verified reviews and express delivery.',
    url: 'https://shopezy.com',
    siteName: 'ShopEzy',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
        width: 1200,
        height: 630,
        alt: 'ShopEzy Mega Sale',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLdOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ShopEzy Commerce India Private Limited',
    url: 'https://shopezy.com',
    logo: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=100',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9876543210',
      contactType: 'Customer Service',
      areaServed: 'IN',
      availableLanguage: ['English', 'Hindi', 'Bengali'],
    },
  };

  const jsonLdWebSite = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ShopEzy',
    url: 'https://shopezy.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://shopezy.com/products?search={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#f1f3f6]">
        <AuthProvider>
          <LanguageProvider>
            <CartProvider>
              <WishlistProvider>
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </WishlistProvider>
            </CartProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
