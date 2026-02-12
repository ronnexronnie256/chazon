'use client'

import { Star, Quote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const testimonials = [
  {
    id: '1',
    name: 'Jessica Kalungi',
    location: 'Kisaasi',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'Amazing experience! My Steward arrived on time and assembled my entire IKEA bedroom set perfectly. The quality of work was outstanding and the price was very reasonable.',
    service: 'Furniture Assembly',
    date: '2 weeks ago'
  },
  {
    id: '2',
    name: 'Robert Kimbowa',
    location: 'Najjera',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'I needed help moving my apartment and the Steward was incredibly professional. They handled everything with care and made the whole process stress-free.',
    service: 'Moving Help',
    date: '1 month ago'
  },
  {
    id: '3',
    name: 'Amanda Nabirye',
    location: 'Kyanja',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'The cleaning service was exceptional! My house has never looked better. The Steward was thorough, efficient, and used eco-friendly products as requested.',
    service: 'House Cleaning',
    date: '3 weeks ago'
  },
  {
    id: '4',
    name: 'Mark Kitaka',
    location: 'Komamboga',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'Quick and professional TV mounting service. The Steward even helped me hide all the cables for a clean look. Highly recommend!',
    service: 'TV Mounting',
    date: '1 week ago'
  },
  {
    id: '5',
    name: 'Lisa Musimenta',
    location: 'Kulambiro',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'Fantastic handyman service! Fixed multiple issues around my house in one visit. Very knowledgeable and fair pricing.',
    service: 'Handyman',
    date: '2 months ago'
  },
  {
    id: '6',
    name: 'Mwanje Alex',
    location: 'Kawempe',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    rating: 5,
    review: 'Needed same-day delivery and Chazon came through! The Steward was communicative and handled my items with care.',
    service: 'Delivery',
    date: '4 days ago'
  }
]

export function Testimonials() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what real customers have to say about their Chazon experience.
          </p>
        </div>

        {/* Stats Bar */}
        <div className="bg-gradient-to-r from-chazon-primary to-chazon-blue rounded-2xl p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">4.9★</div>
              <div className="text-white/90">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">98%</div>
              <div className="text-white/90">Customer Satisfaction</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">24/7</div>
              <div className="text-white/90">Customer Support</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold mb-2">100%</div>
              <div className="text-white/90">Happiness Guarantee</div>
            </div>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="w-8 h-8 text-chazon-primary" />
                </div>

                {/* Rating */}
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                {/* Review Text */}
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.review}"
                </p>

                {/* Service Badge */}
                <div className="mb-4">
                  <span className="inline-block bg-chazon-primary/10 text-chazon-primary px-3 py-1 rounded-full text-sm font-medium">
                    {testimonial.service}
                  </span>
                </div>

                {/* Customer Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback>
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.location}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {testimonial.date}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Trusted by millions, backed by guarantees
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Happiness Guarantee</h4>
              <p className="text-gray-600 text-center">If you're not satisfied, we'll work to make it right</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure Payments</h4>
              <p className="text-gray-600 text-center">Your payment is protected until the task is complete</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Vetted Stewards</h4>
              <p className="text-gray-600 text-center">All Stewards are background checked and reviewed</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}