'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Star, Shield, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { motion } from 'framer-motion'

const popularServices = [
  'Furniture Assembly',
  'TV Mounting',
  'Moving Help',
  'Cleaning',
  'Handyman',
  'Delivery'
]

export function Hero() {
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handlePopularServiceClick = (service: string) => {
    router.push(`/search?q=${encodeURIComponent(service)}`)
  }

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-chazon-primary/10 via-white to-chazon-blue/10">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-chazon-primary/5 to-transparent skew-x-12 transform origin-top" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-r from-chazon-blue/5 to-transparent -skew-x-12 transform origin-bottom" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* Left Content */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-chazon-primary/10 text-chazon-primary font-medium text-sm mb-6"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Trusted by 10,000+ neighbors</span>
            </motion.div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight tracking-tight">
              Expert help for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-chazon-primary to-chazon-blue">
                everyday tasks
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Connect with skilled Stewards in your neighborhood for cleaning, moving, handyman work, and more. Trusted, vetted, and ready to help.
            </p>

            {/* Search Form */}
            <div className="relative max-w-xl mx-auto lg:mx-0 mb-10 group">
              <div className="absolute -inset-1 bg-gradient-to-r from-chazon-primary to-chazon-blue rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
              <form onSubmit={handleSearch} className="relative flex p-2 bg-white rounded-xl shadow-xl ring-1 ring-gray-900/5">
                <div className="flex-1 flex items-center pl-4">
                  <Search className="w-5 h-5 text-gray-400 mr-3" />
                  <Input
                    type="text"
                    placeholder="What do you need help with?"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 text-lg placeholder:text-gray-400 h-12"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="bg-chazon-primary hover:bg-chazon-primary-dark text-white rounded-lg px-8 h-12 text-base font-semibold shadow-md transition-all duration-200"
                >
                  Search
                </Button>
              </form>
            </div>

            {/* Popular Services */}
            <div>
              <p className="text-gray-500 text-sm font-medium mb-4 uppercase tracking-wider">Popular Services</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {popularServices.map((service, index) => (
                  <motion.button
                    key={service}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    onClick={() => handlePopularServiceClick(service)}
                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-600 text-sm font-medium hover:border-chazon-primary hover:text-chazon-primary transition-colors shadow-sm hover:shadow-md"
                  >
                    {service}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 text-gray-500 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-chazon-primary" />
                <span>Vetted Stewards</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-chazon-primary" />
                <span>Same-day Service</span>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Image
                src="https://www.cdc.gov/natural-disasters/media/images/cleaningsuppliesinbucket.jpg"
                alt="Professional Steward helping"
                width={800}
                height={900}
                className="object-cover w-full h-[600px]"
                priority
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* Floating Card 1 */}
              <motion.div 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="absolute bottom-10 left-10 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-lg max-w-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">100% Secure</p>
                    <p className="text-xs text-gray-500">Protected payments & insurance</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Card 2 */}
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute top-10 right-10 bg-white/95 backdrop-blur p-4 rounded-2xl shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white overflow-hidden">
                        <Image 
                          src={`https://randomuser.me/api/portraits/men/${i+20}.jpg`} 
                          alt="User" 
                          width={32} 
                          height={32} 
                        />
                      </div>
                    ))}
                  </div>
                  <div className="text-xs font-bold text-gray-900 pl-2">
                    500+ Stewards <br/> active now
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
