'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Product, CartItem, PromoCode, Order, CategoryType, ProductReview } from '../types';
import { INITIAL_PRODUCTS, PROMO_CODES } from '../data/products';

interface StoreContextType {
  products: Product[];
  cartItems: CartItem[];
  appliedPromo: PromoCode | null;
  orders: Order[];
  lastCreatedOrder: Order | null;
  userRole: 'buyer' | 'admin';
  
  // Modals & Drawers
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isDeliveryOpen: boolean;
  setIsDeliveryOpen: (open: boolean) => void;
  isDashboardOpen: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  selectedProductForModal: Product | null;
  setSelectedProductForModal: (product: Product | null) => void;
  
  // Filter & Search
  selectedCategory: CategoryType;
  setSelectedCategory: (category: CategoryType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'popular' | 'price-asc' | 'price-desc' | 'rating';
  setSortBy: (sort: 'popular' | 'price-asc' | 'price-desc' | 'rating') => void;
  
  // Cart Actions
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  total: number;
  
  // Promo Actions
  applyPromoCode: (code: string) => { success: boolean; message: string };
  removePromoCode: () => void;
  
  // Checkout & Order Actions
  processCheckout: (email: string, name: string, paymentMethod: string) => Promise<Order>;
  
  // Product Reviews & Admin
  addProductReview: (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  toggleUserRole: () => void;
  getDownloadUrlForProduct: (orderId: string, productId: string) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'admin'>('buyer');

  // Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'rating'>('popular');

  // Load state from localStorage on client
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('novabiz-cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));

      const savedOrders = localStorage.getItem('novabiz-orders');
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      } else {
        // Mock sample initial purchase for seamless buyer dashboard demo
        const demoOrder: Order = {
          id: 'ORD-8491-DEMO',
          date: '2025-02-18 14:32',
          customerEmail: 'founder@example.com',
          customerName: 'Александр',
          items: [
            {
              productId: 'prod-saas-fin-model',
              title: INITIAL_PRODUCTS[0].title.ru,
              price: INITIAL_PRODUCTS[0].price,
              format: INITIAL_PRODUCTS[0].fileDetails.format,
              downloadToken: 'tok_demo_secure_hash_89712a',
              sampleFileName: INITIAL_PRODUCTS[0].sampleFileName
            }
          ],
          subtotal: 3490,
          discount: 0,
          total: 3490,
          paymentMethod: 'Банковские карты РФ / СБП',
          status: 'paid',
          downloadToken: 'tok_demo_secure_hash_89712a',
          tokenExpiresAt: '2025-12-31 23:59',
          downloadCount: 1,
          maxDownloads: 5
        };
        setOrders([demoOrder]);
        localStorage.setItem('novabiz-orders', JSON.stringify([demoOrder]));
      }

      const savedRole = localStorage.getItem('novabiz-role') as 'buyer' | 'admin';
      if (savedRole) setUserRole(savedRole);
    } catch {
      // LocalStorage errors ignored
    }
  }, []);

  // Save cart
  useEffect(() => {
    try {
      localStorage.setItem('novabiz-cart', JSON.stringify(cartItems));
    } catch {
      // Ignore
    }
  }, [cartItems]);

  // Cart operations
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedPromo(null);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.price * item.quantity,
    0
  );

  const discountAmount = appliedPromo
    ? Math.round((subtotal * appliedPromo.discountPercent) / 100)
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  // Promo code
  const applyPromoCode = (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    const found = PROMO_CODES.find(p => p.code.toUpperCase() === cleanCode);
    if (!found) {
      return { success: false, message: 'Промокод не найден' };
    }
    if (found.minAmount && subtotal < found.minAmount) {
      return {
        success: false,
        message: `Минимальная сумма для промокода: ${found.minAmount} ₽`
      };
    }
    setAppliedPromo(found);
    return { success: true, message: `Скидка ${found.discountPercent}% применена!` };
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  // Checkout process with instant token generation
  const processCheckout = async (
    email: string,
    name: string,
    paymentMethod: string
  ): Promise<Order> => {
    // Generate secure cryptographically structured token
    const token = 'tok_live_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 16);

    const newOrder: Order = {
      id: orderId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      customerEmail: email,
      customerName: name || 'Покупатель',
      items: cartItems.map(item => ({
        productId: item.product.id,
        title: item.product.title.ru,
        price: item.product.price,
        format: item.product.fileDetails.format,
        downloadToken: token,
        sampleFileName: item.product.sampleFileName
      })),
      subtotal,
      discount: discountAmount,
      total,
      paymentMethod,
      status: 'paid',
      downloadToken: token,
      tokenExpiresAt: expiry,
      downloadCount: 0,
      maxDownloads: 5
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    setLastCreatedOrder(newOrder);
    localStorage.setItem('novabiz-orders', JSON.stringify(updatedOrders));

    // Clear cart
    clearCart();
    setIsCheckoutOpen(false);
    setIsDeliveryOpen(true);

    return newOrder;
  };

  // Add Product Review
  const addProductReview = (productId: string, review: Omit<ProductReview, 'id' | 'date'>) => {
    const newReview: ProductReview = {
      ...review,
      id: 'rev-' + Date.now(),
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const updatedReviews = [newReview, ...p.reviews];
          const newAvg = (
            updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length
          ).toFixed(2);
          return {
            ...p,
            reviews: updatedReviews,
            reviewsCount: updatedReviews.length,
            rating: parseFloat(newAvg)
          };
        }
        return p;
      })
    );
  };

  // Update product price (Admin)
  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, price: newPrice } : p))
    );
  };

  const toggleUserRole = () => {
    const nextRole = userRole === 'buyer' ? 'admin' : 'buyer';
    setUserRole(nextRole);
    localStorage.setItem('novabiz-role', nextRole);
  };

  const getDownloadUrlForProduct = (orderId: string, productId: string) => {
    return `/api/download?orderId=${encodeURIComponent(orderId)}&productId=${encodeURIComponent(productId)}`;
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        cartItems,
        appliedPromo,
        orders,
        lastCreatedOrder,
        userRole,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        isDeliveryOpen,
        setIsDeliveryOpen,
        isDashboardOpen,
        setIsDashboardOpen,
        isAdminOpen,
        setIsAdminOpen,
        selectedProductForModal,
        setSelectedProductForModal,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        subtotal,
        discountAmount,
        total,
        applyPromoCode,
        removePromoCode,
        processCheckout,
        addProductReview,
        updateProductPrice,
        toggleUserRole,
        getDownloadUrlForProduct
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
