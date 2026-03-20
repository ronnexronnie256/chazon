'use client';

import {
  Search,
  UserCheck,
  Calendar,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Link from 'next/link';

const steps = [
  {
    icon: Search,
    title: 'Describe Your Task',
    description: 'Tell us what you need done, when and where it works for you.',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: UserCheck,
    title: 'Choose Your Steward',
    description:
      'Browse trusted Stewards by skills, reviews, and price. Chat with them to get more details.',
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Calendar,
    title: 'Schedule & Pay',
    description:
      'Book your Steward and pay securely through our platform. Your payment is protected.',
    color: 'from-violet-500 to-violet-600',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
  },
  {
    icon: CheckCircle,
    title: 'Get It Done',
    description:
      'Your Steward arrives and gets the job done. Rate your experience when complete.',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      delay: 0.4,
    },
  },
};

export function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-chazon-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span className="inline-block px-4 py-1.5 bg-chazon-primary/10 text-chazon-primary text-sm font-semibold rounded-full mb-4">
            Simple Process
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How <span className="gradient-text">Chazon</span> Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Getting help has never been easier. Follow these simple steps to get
            your task done.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="relative"
        >
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-20 left-[12.5%] right-[12.5%] h-0.5">
            <motion.div
              variants={lineVariants}
              className="absolute inset-0 bg-gradient-to-r from-blue-200 via-emerald-200 via-violet-200 to-orange-200 rounded-full"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="relative group"
                >
                  <div className="relative z-10 h-full">
                    <Card className="h-full border-0 shadow-xl bg-white overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
                      <CardContent className="p-8 text-center relative">
                        {/* Step Number Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-chazon-primary to-chazon-primary-dark text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg shadow-chazon-primary/30 z-20">
                          {index + 1}
                        </div>

                        {/* Icon Container */}
                        <div
                          className={`w-20 h-20 mx-auto mb-6 mt-4 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                        >
                          <IconComponent className="w-9 h-9 text-white" />
                        </div>

                        {/* Content */}
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Hover Glow Effect */}
                        <div
                          className={`absolute inset-0 ${step.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10`}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="relative overflow-hidden bg-gradient-to-r from-chazon-primary via-chazon-primary to-violet-600 rounded-3xl p-1">
            <div className="absolute inset-0 bg-gradient-to-r from-chazon-primary via-chazon-primary to-violet-600 rounded-3xl">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl animate-pulse" />
                <div
                  className="absolute bottom-0 right-1/4 w-48 h-48 bg-white rounded-full blur-3xl animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
              </div>
            </div>

            <div className="relative bg-gradient-to-r from-chazon-primary via-chazon-primary to-violet-600 rounded-[22px] p-10 md:p-14 text-center">
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </h3>
              <p className="text-white/90 text-lg mb-10 max-w-2xl mx-auto">
                Join thousands of satisfied customers who trust Chazon for their
                everyday tasks.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/services">
                  <Button
                    size="lg"
                    className="bg-white text-chazon-primary hover:bg-white/90 shadow-xl font-semibold px-8 py-4 text-lg w-full sm:w-auto"
                  >
                    Find a Service
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/become-steward">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white text-white hover:bg-white/10 hover:text-white font-semibold px-8 py-4 text-lg w-full sm:w-auto backdrop-blur-sm"
                  >
                    Become a Steward
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
