'use client';

import Link from 'next/link';
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  Clock,
  Shield,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const footerLinks = {
  services: [
    { name: 'Cleaning', href: '/services?category=cleaning' },
    { name: 'Handyman', href: '/services?category=handyman' },
    { name: 'Plumbing', href: '/services?category=plumbing' },
    { name: 'Moving Help', href: '/services?category=moving' },
    {
      name: 'Furniture Assembly',
      href: '/services?category=furniture-assembly',
    },
    { name: 'TV Mounting', href: '/search?q=tv+mounting' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'How It Works', href: '/#how-it-works' },
    { name: 'Careers', href: '/careers' },
    { name: 'Press', href: '/press' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Safety', href: '/safety' },
    { name: 'Trust & Safety', href: '/trust' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Cookie Policy', href: '/cookies' },
  ],
  stewards: [
    { name: 'Become a Steward', href: '/become-steward' },
    { name: 'Steward Resources', href: '/become-steward#resources' },
    { name: 'Community Guidelines', href: '/become-steward#guidelines' },
    { name: 'Success Stories', href: '/become-steward#testimonials' },
    { name: 'Earnings Calculator', href: '/become-steward#calculator' },
  ],
};

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/chazon' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/chazon' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/chazon' },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    href: 'https://linkedin.com/company/chazon',
  },
];

const trustBadges = [
  { icon: Shield, label: 'Secure Payments' },
  { icon: Clock, label: '24/7 Support' },
  { icon: Heart, label: 'Vetted Stewards' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setIsSubscribed(true);
    setEmail('');
    setTimeout(() => setIsSubscribed(false), 4000);
  };

  return (
    <footer className="bg-gray-900 text-white relative overflow-hidden">
      {/* Top decorative gradient */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-chazon-primary/50 to-transparent" />

      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-chazon-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
      </div>

      {/* Trust Badges Bar */}
      <div className="border-b border-gray-800/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {trustBadges.map((badge, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-400"
              >
                <badge.icon className="h-5 w-5 text-chazon-primary" />
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-b border-gray-800/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Stay updated with Chazon
            </h3>
            <p className="text-gray-400 mb-8">
              Get the latest news, tips, and exclusive offers delivered to your
              inbox.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-12 bg-gray-800 border-gray-700 text-white placeholder:text-gray-400 focus:border-chazon-primary focus:ring-chazon-primary/20"
                  required
                />
              </div>
              <Button
                type="submit"
                className="bg-gradient-to-r from-chazon-primary to-chazon-primary-dark hover:opacity-90 transition-opacity shadow-lg shadow-chazon-primary/25"
                disabled={isSubscribed}
              >
                {isSubscribed ? (
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Subscribed!
                  </span>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 mb-6 group"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-chazon-primary to-chazon-primary-dark rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <span className="text-white font-bold text-lg">CH</span>
              </div>
              <span className="text-2xl font-bold">Chazon</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed max-w-sm">
              Connecting you with trusted local Stewards for all your everyday
              tasks. Quality service, guaranteed.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400 hover:text-white transition-colors">
                <Phone className="w-4 h-4 mr-3 text-chazon-primary" />
                <span className="text-sm">+256 788 433 163</span>
              </div>
              <div className="flex items-center text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 mr-3 text-chazon-primary" />
                <span className="text-sm">info@chazon.com</span>
              </div>
              <div className="flex items-start text-gray-400 hover:text-white transition-colors">
                <MapPin className="w-4 h-4 mr-3 mt-0.5 text-chazon-primary flex-shrink-0" />
                <span className="text-sm">
                  AAA Complex, Bukoto-Kisaasi, Kampala, Uganda
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-5 text-white">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors text-sm inline-block hover:translate-x-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-5 text-white">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors text-sm inline-block hover:translate-x-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-5 text-white">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors text-sm inline-block hover:translate-x-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Stewards */}
          <div>
            <h4 className="font-semibold mb-5 text-white">For Stewards</h4>
            <ul className="space-y-3">
              {footerLinks.stewards.map(link => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors text-sm inline-block hover:translate-x-1"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Chazon. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socialLinks.map(social => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-gray-800 hover:bg-chazon-primary flex items-center justify-center transition-all duration-200 hover:scale-110"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
