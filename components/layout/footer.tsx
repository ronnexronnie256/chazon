'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

const footerLinks = {
  services: [
    { name: 'Furniture Assembly', href: '/services?category=furniture-assembly' },
    { name: 'Moving Help', href: '/services?category=moving' },
    { name: 'Cleaning', href: '/services?category=cleaning' },
    { name: 'Handyman', href: '/services?category=handyman' },
    { name: 'TV Mounting', href: '/search?q=tv%20mounting' },
    { name: 'Delivery', href: '/search?q=delivery' }
  ],
  company: [
    { name: 'About Us', href: '/' },
    { name: 'How It Works', href: '/become-steward#how-it-works' },
    { name: 'Careers', href: '/' },
    { name: 'Press', href: '/' },
    { name: 'Blog', href: '/' },
    { name: 'Contact', href: '/' }
  ],
  support: [
    { name: 'Help Center', href: '/' },
    { name: 'Safety', href: '/' },
    { name: 'Trust & Safety', href: '/' },
    { name: 'Terms of Service', href: '/' },
    { name: 'Privacy Policy', href: '/' },
    { name: 'Cookie Policy', href: '/' }
  ],
  stewards: [
    { name: 'Become a Steward', href: '/become-steward' },
    { name: 'Steward App', href: '/become-steward' },
    { name: 'Steward Resources', href: '/become-steward' },
    { name: 'Community Guidelines', href: '/become-steward' },
    { name: 'Success Stories', href: '/become-steward#testimonials' }
  ]
}

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com/chazon' },
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/chazon' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com/chazon' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/chazon' }
]

export function Footer() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      // Handle newsletter subscription
      setIsSubscribed(true)
      setEmail('')
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Stay updated with Chazon
            </h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Get the latest news, tips, and exclusive offers delivered to your inbox.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto flex gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                required
              />
              <Button 
                type="submit" 
                className="bg-chazon-primary hover:bg-chazon-primary-dark"
                disabled={isSubscribed}
              >
                {isSubscribed ? 'Subscribed!' : 'Subscribe'}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-chazon-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CH</span>
              </div>
              <span className="text-xl font-bold">Chazon</span>
            </Link>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Chazon connects you with skilled Stewards to help with everyday tasks, 
              from Home cleaning to home repairs and everything in between.
            </p>
            <div className="space-y-3">
              <div className="flex items-center text-gray-400">
                <Phone className="w-4 h-4 mr-3" />
                <span>+256788433163</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Mail className="w-4 h-4 mr-3" />
                <span>info@chazon.com</span>
              </div>
              <div className="flex items-center text-gray-400">
                <MapPin className="w-4 h-4 mr-3" />
                <span>AAA Complex, Bukoto-Kisaasi, Kampala, Uganda</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Popular Services</h4>
            <ul className="space-y-2">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Stewards */}
          <div>
            <h4 className="font-semibold mb-4">For Stewards</h4>
            <ul className="space-y-2">
              {footerLinks.stewards.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    prefetch={false}
                    className="text-gray-400 hover:text-chazon-primary transition-colors"
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
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 Chazon. All rights reserved.
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-chazon-primary transition-colors"
                    aria-label={social.name}
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
