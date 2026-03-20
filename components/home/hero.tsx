'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, CheckCircle2, Clock, Award, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import Link from 'next/link';

const popularServices = [
  'Deep Cleaning',
  'Furniture Assembly',
  'Plumbing',
  'Moving Help',
  'Handyman',
  'Electrical',
];

const trustFeatures = [
  { icon: CheckCircle2, text: 'Verified Stewards' },
  { icon: Clock, text: 'Same-Day Service' },
  { icon: Award, text: 'Satisfaction Guaranteed' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/services?search=${encodeURIComponent(searchQuery)}`);
    } else {
      router.push('/services');
    }
  };

  const handlePopularServiceClick = (service: string) => {
    router.push(`/services?search=${encodeURIComponent(service)}`);
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 -right-20 w-[500px] h-[500px] bg-chazon-primary/5 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-20 -left-20 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1s' }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          {/* Left Content */}
          <motion.div
            variants={itemVariants}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chazon-primary/10 text-chazon-primary text-sm font-semibold mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chazon-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-chazon-primary"></span>
              </span>
              Available in Kampala &amp; surrounding areas
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              Expert help for{' '}
              <span className="gradient-text">everyday tasks</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Connect with trusted local Stewards for cleaning, repairs, moving,
              and more. Quality service, guaranteed satisfaction.
            </p>

            {/* Search Form */}
            <form
              onSubmit={handleSearch}
              className="relative max-w-xl mx-auto lg:mx-0 mb-10"
            >
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-2 focus-within:ring-2 focus-within:ring-chazon-primary/20 transition-all">
                <div className="flex-1 flex items-center pl-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="What do you need help with?"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-gray-400 h-12 bg-transparent"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 px-6 shadow-lg shadow-chazon-primary/25"
                >
                  Search
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>

            {/* Popular Services */}
            <div className="mb-10">
              <p className="text-sm text-gray-500 font-medium mb-4">Popular:</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {popularServices.map(service => (
                  <button
                    key={service}
                    onClick={() => handlePopularServiceClick(service)}
                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:border-chazon-primary hover:text-chazon-primary hover:bg-chazon-primary/5 transition-all"
                  >
                    {service}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 text-gray-500 text-sm">
              {trustFeatures.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-50">
                    <feature.icon className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            variants={itemVariants}
            className="relative hidden lg:block"
          >
            <div className="relative">
              {/* Main Image Card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-gray-300/50">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80"
                  alt="Professional cleaning service"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />
              </div>

              {/* Stats Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-5 border border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-chazon-primary to-chazon-primary-dark flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">4.9</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <svg
                          key={star}
                          className="w-4 h-4 text-yellow-400 fill-current"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">from 2,000+ reviews</p>
                  </div>
                </div>
              </motion.div>

              {/* Active Stewards Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-4 border border-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4].map(i => (
                      <img
                        key={i}
                        src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
                        alt="Active steward"
                        className="w-10 h-10 rounded-full border-2 border-white object-cover"
                      />
                    ))}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">500+</p>
                    <p className="text-xs text-gray-500">Active Stewards</p>
                  </div>
                </div>
              </motion.div>

              {/* Task Completed Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="absolute bottom-20 -right-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-4 text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">10K+</p>
                    <p className="text-xs text-white/80">Tasks Completed</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-500 text-sm mb-4">
            Looking to earn? Become a Steward today.
          </p>
          <Link href="/become-steward">
            <Button
              variant="outline"
              size="lg"
              className="border-2 font-semibold"
            >
              Join as a Steward
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
