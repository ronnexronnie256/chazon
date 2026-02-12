'use client'

import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { CheckCircle, DollarSign, Clock, Shield, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { StewardApplicationForm } from './steward-application-form'

export default function BecomeStewardPage() {
  const benefits = [
    {
      icon: DollarSign,
      title: 'Earn on Your Terms',
      description: 'Set your own rates and keep 100% of your tips. Get paid securely and quickly.'
    },
    {
      icon: Clock,
      title: 'Flexible Schedule',
      description: 'Be your own boss. Work as much or as little as you want, whenever you want.'
    },
    {
      icon: Shield,
      title: 'Safe & Secure',
      description: 'We verify all clients and provide insurance for every job. Your safety is our priority.'
    }
  ]

  const steps = [
    {
      title: 'Sign Up',
      description: 'Create your profile and tell us about your skills and experience.'
    },
    {
      title: 'Get Vetted',
      description: 'Complete a quick background check and online orientation.'
    },
    {
      title: 'Start Earning',
      description: 'Browse tasks, accept jobs, and get paid directly to your bank account.'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-gradient-to-br from-chazon-primary via-chazon-primary-dark to-chazon-blue text-white">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-block px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                  <span className="font-semibold text-sm tracking-wide uppercase">Join the Community</span>
                </div>
                <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
                  Turn Your Skills into <span className="text-yellow-300">Income</span>
                </h1>
                <p className="text-xl lg:text-2xl text-white/90 mb-8 leading-relaxed max-w-lg">
                  Become a Steward and connect with people who need your help. 
                  Flexible work, great pay, and a supportive community.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-white text-chazon-primary hover:bg-gray-100 text-lg px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    Start Earning Now
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-white text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl bg-transparent"
                  >
                    How it Works
                  </Button>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                 <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 transform rotate-2 hover:rotate-0 transition-all duration-500">
                  <Image
                    src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1632&q=80"
                    alt="Happy Steward working"
                    width={600}
                    height={800}
                    className="object-cover h-[600px] w-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-8">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-full">
                        <DollarSign className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg">Earn 130,000+ UGX/hr</p>
                        <p className="text-white/80 text-sm">Average for top Stewards</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-gray-200">
              {[
                { label: 'Active Stewards', value: '5,000+' },
                { label: 'Tasks Completed', value: '150k+' },
                { label: 'Average Rating', value: '4.8/5' },
                { label: 'Cities Covered', value: '25+' },
              ].map((stat, index) => (
                <div key={index} className="p-4">
                  <p className="text-3xl lg:text-4xl font-bold text-chazon-primary mb-1">{stat.value}</p>
                  <p className="text-gray-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">Why Partner with Chazon?</h2>
              <p className="text-xl text-gray-600">
                We provide the platform, insurance, and clients. You bring your skills and passion.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-3xl p-8 hover:shadow-xl transition-shadow duration-300 border border-gray-100"
                >
                  <div className="w-16 h-16 bg-chazon-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <benefit.icon className="w-8 h-8 text-chazon-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('/pattern.png')]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold mb-8">How to Get Started</h2>
                <div className="space-y-12">
                  {steps.map((step, index) => (
                    <div key={index} className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-chazon-primary flex items-center justify-center font-bold text-xl border-4 border-gray-800">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                        <p className="text-gray-400 text-lg">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-chazon-primary to-purple-600 rounded-2xl opacity-30 blur-xl"></div>
                <div className="relative bg-gray-800 rounded-2xl p-8 border border-gray-700">
                   <div className="aspect-video rounded-xl overflow-hidden bg-gray-900 flex items-center justify-center">
                      <p className="text-gray-500">Video Placeholder: Steward Success Story</p>
                   </div>
                   <div className="mt-6">
                     <p className="text-xl italic text-gray-300">"Chazon changed my life. I went from struggling to find gigs to being fully booked weeks in advance."</p>
                     <p className="mt-4 font-bold text-chazon-primary">- Sarah M., Seattle</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Application Form Section */}
        <section id="application-form" className="py-24 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ready to Join?</h2>
              <p className="text-xl text-gray-600">Complete the form below to start your application.</p>
            </div>
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
              <StewardApplicationForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
