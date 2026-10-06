export type CategoryType = 
  | 'all' 
  | 'financial-models' 
  | 'excel-sheets' 
  | 'notion-templates' 
  | 'checklists-guides' 
  | 'startup-os';

export interface ProductReview {
  id: string;
  author: string;
  role: string;
  company?: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface DigitalFileDetail {
  format: 'Notion' | 'Excel (.xlsx)' | 'Google Sheets' | 'PDF & Notion' | 'PowerPoint + Notion' | 'ZIP Archive';
  size: string;
  pagesOrSheets: string;
  version: string;
  lastUpdated: string;
}

export interface Product {
  id: string;
  slug: string;
  title: {
    ru: string;
    en: string;
  };
  shortDescription: {
    ru: string;
    en: string;
  };
  fullDescription: {
    ru: string;
    en: string;
  };
  category: CategoryType;
  price: number;
  originalPrice: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  badge?: {
    ru: string;
    en: string;
  };
  tags: string[];
  gradient: string;
  fileDetails: DigitalFileDetail;
  features: {
    ru: string[];
    en: string[];
  };
  includedFiles: {
    ru: string[];
    en: string[];
  };
  notionDemoUrl?: string;
  sampleFileName: string;
  reviews: ProductReview[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface PromoCode {
  code: string;
  discountPercent: number;
  minAmount?: number;
  description: {
    ru: string;
    en: string;
  };
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  format: string;
  downloadToken: string;
  sampleFileName: string;
}

export interface Order {
  id: string;
  date: string;
  customerEmail: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: 'paid' | 'processing' | 'refunded';
  downloadToken: string;
  tokenExpiresAt: string;
  downloadCount: number;
  maxDownloads: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'buyer' | 'admin';
  joinedDate: string;
  purchasedProductIds: string[];
}
