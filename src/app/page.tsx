'use client';

import React from 'react';
import Navbar from '../components/layout/Navbar';
import HeroSection from '../components/home/HeroSection';
import StatsBanner from '../components/home/StatsBanner';
import FeaturesSection from '../components/home/FeaturesSection';
import CatalogSection from '../components/catalog/CatalogSection';
import ReviewsSection from '../components/home/ReviewsSection';
import SecurityBanner from '../components/home/SecurityBanner';
import FaqSection from '../components/home/FaqSection';
import Footer from '../components/layout/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors duration-300">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsBanner />
        <CatalogSection />
        <FeaturesSection />
        <ReviewsSection />
        <SecurityBanner />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}
