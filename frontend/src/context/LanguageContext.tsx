'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'bn';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    searchPlaceholder: 'Search for Products, Brands and More',
    login: 'Login',
    logout: 'Logout',
    account: 'My Account',
    orders: 'Orders',
    wishlist: 'Wishlist',
    cart: 'Cart',
    sellerHub: 'Become a Seller / Dashboard',
    adminPanel: 'Super Admin Control',
    explore: 'Explore',
    flashSale: 'Flash Deals',
    endsIn: 'Ends in',
    freeDelivery: 'Free Delivery',
    rating: 'ratings',
    reviews: 'reviews',
    addToCart: 'ADD TO CART',
    buyNow: 'BUY NOW',
    specifications: 'Specifications',
    deliveryOptions: 'Delivery Options',
    checkPincode: 'Check Pincode',
    enterPincode: 'Enter 6-digit Pincode',
    verifiedBuyers: 'Verified Buyer Reviews',
    askQuestion: 'Have a question? Ask here',
    similarProducts: 'Similar Products You May Like',
    frequentlyBoughtTogether: 'Frequently Bought Together',
    bundleDiscount: 'Bundle & Save Extra 5%',
    addAllToCart: 'Add All to Cart',
    recentlyViewed: 'Recently Viewed',
    applyCoupon: 'Apply Coupon',
    couponsAvailable: 'Coupons Available',
    orderSummary: 'Price Details',
    totalAmount: 'Total Payable',
    saved: 'You will save',
    proceedToCheckout: 'PLACE ORDER',
    trackShipment: 'Track Courier',
    downloadInvoice: 'Tax Invoice (PDF)',
    cancelOrder: 'Cancel Item',
    returnOrder: 'Return Item',
    needHelp: '24/7 Customer Helpdesk',
  },
  hi: {
    searchPlaceholder: 'उत्पाद, ब्रांड और अधिक खोजें',
    login: 'लॉग इन करें',
    logout: 'लॉग आउट',
    account: 'मेरा खाता',
    orders: 'मेरे ऑर्डर',
    wishlist: 'पसंदीदा सूची',
    cart: 'कार्ट',
    sellerHub: 'विक्रेता डैशबोर्ड',
    adminPanel: 'सुपर एडमिन कंट्रोल',
    explore: 'खोजें',
    flashSale: 'फ़्लैश डील्स',
    endsIn: 'समाप्त होने में शेष',
    freeDelivery: 'मुफ्त डिलीवरी',
    rating: 'रेटिंग्स',
    reviews: 'समीक्षाएं',
    addToCart: 'कार्ट में जोड़ें',
    buyNow: 'अभी खरीदें',
    specifications: 'विशेष विवरण',
    deliveryOptions: 'डिलीवरी विकल्प',
    checkPincode: 'पिनकोड जांचें',
    enterPincode: '6 अंकों का पिनकोड दर्ज करें',
    verifiedBuyers: 'सत्यापित खरीदार समीक्षाएं',
    askQuestion: 'कोई प्रश्न है? यहां पूछें',
    similarProducts: 'समान उत्पाद जो आपको पसंद आ सकते हैं',
    frequentlyBoughtTogether: 'अक्सर एक साथ खरीदे जाने वाले',
    bundleDiscount: 'बंडल पर अतिरिक्त 5% छूट',
    addAllToCart: 'सभी को कार्ट में जोड़ें',
    recentlyViewed: 'हाल ही में देखे गए उत्पाद',
    applyCoupon: 'कूपन लागू करें',
    couponsAvailable: 'उपलब्ध कूपन',
    orderSummary: 'मूल्य विवरण',
    totalAmount: 'कुल देय राशि',
    saved: 'आपकी कुल बचत',
    proceedToCheckout: 'ऑर्डर करें',
    trackShipment: 'कूरियर ट्रैक करें',
    downloadInvoice: 'जीएसटी चालान (PDF)',
    cancelOrder: 'आइटम रद्द करें',
    returnOrder: 'आइटम वापस करें',
    needHelp: '24/7 सहायता केंद्र',
  },
  bn: {
    searchPlaceholder: 'পণ্য, ব্র্যান্ড এবং আরও খুঁজুন',
    login: 'লগ ইন করুন',
    logout: 'লগ আউট',
    account: 'আমার অ্যাকাউন্ট',
    orders: 'আমার অর্ডার',
    wishlist: 'উইশলিস্ট',
    cart: 'কার্ট',
    sellerHub: 'সেলার ড্যাশবোর্ড',
    adminPanel: 'সুপার অ্যাডমিন কন্ট্রোল',
    explore: 'অন্বেষণ করুন',
    flashSale: 'ফ্ল্যাশ ডিল',
    endsIn: 'শেষ হতে বাকি',
    freeDelivery: 'ফ্রি ডেলিভারি',
    rating: 'রেটিং',
    reviews: 'রিভিউ',
    addToCart: 'কার্টে যোগ করুন',
    buyNow: 'এখনই কিনুন',
    specifications: 'বিশেষ বিবরণী',
    deliveryOptions: 'ডেলিভারি বিকল্প',
    checkPincode: 'পিনকোড চেক করুন',
    enterPincode: '৬ সংখ্যার পিনকোড লিখুন',
    verifiedBuyers: 'যাচাইকৃত ক্রেতা রিভিউ',
    askQuestion: 'কোন প্রশ্ন আছে? এখানে জিজ্ঞাসা করুন',
    similarProducts: 'অনুরূপ পণ্য যা আপনার পছন্দ হতে পারে',
    frequentlyBoughtTogether: 'একসাথে প্রায়ই কেনা হয়',
    bundleDiscount: 'বান্ডেলে অতিরিক্ত ৫% ছাড়',
    addAllToCart: 'সবগুলি কার্টে যোগ করুন',
    recentlyViewed: 'সম্প্রতি দেখা পণ্য',
    applyCoupon: 'কুপন প্রয়োগ করুন',
    couponsAvailable: 'উপলব্ধ কুপন',
    orderSummary: 'মূল্য বিবরণ',
    totalAmount: 'মোট প্রদেয় অর্থ',
    saved: 'আপনার মোট সঞ্চয়',
    proceedToCheckout: 'অর্ডার সম্পন্ন করুন',
    trackShipment: 'কুরিয়ার ট্র্যাক করুন',
    downloadInvoice: 'ট্যাক্স ইনভয়েস (PDF)',
    cancelOrder: 'আইটেম বাতিল করুন',
    returnOrder: 'আইটেম ফেরত দিন',
    needHelp: '২৪/৭ গ্রাহক সহায়তা',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('shopezy_lang') as Language;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'bn')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('shopezy_lang', lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
