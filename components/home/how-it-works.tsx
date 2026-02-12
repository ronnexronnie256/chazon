'use client'

import { Search, UserCheck, Calendar, CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const steps = [
  {
    icon: Search,
    title: 'Describe Your Task',
    description: 'Tell us what you need done, when and where it works for you.',
    color: 'bg-blue-500'
  },
  {
    icon: UserCheck,
    title: 'Choose Your Steward',
    description: 'Browse trusted Stewards by skills, reviews, and price. Chat with them to get more details.',
    color: 'bg-green-500'
  },
  {
    icon: Calendar,
    title: 'Schedule & Pay',
    description: 'Book your Steward and pay securely through our platform. Your payment is protected.',
    color: 'bg-purple-500'
  },
  {
    icon: CheckCircle,
    title: 'Get It Done',
    description: 'Your Steward arrives and gets the job done. Rate your experience when complete.',
    color: 'bg-orange-500'
  }
]

export function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How Chazon Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Getting help has never been easier. Follow these simple steps to get your task done.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <div key={index} className="relative">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gray-200 z-0">
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gray-200 rounded-full"></div>
                  </div>
                )}
                
                <Card className="relative z-10 h-full border-0 shadow-lg hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-8 text-center">
                    {/* Step Number */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-chazon-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 mt-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-chazon-primary to-chazon-blue rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to get started?
            </h3>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers who trust Chazon for their everyday tasks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-chazon-primary px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200">
                Post a Task
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 transition-colors duration-200">
                Become a Steward
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}