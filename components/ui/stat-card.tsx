'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  link?: string;
  badge?: number | string;
  badgeColor?: string;
  trend?: number;
  trendLabel?: string;
  subtitle?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
  link,
  badge,
  badgeColor = 'bg-red-500',
  trend,
  trendLabel,
  subtitle,
  onClick,
}: StatCardProps) {
  const content = (
    <div
      onClick={onClick}
      className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-${color}/20 hover:-translate-y-1`}
    >
      {/* Gradient accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bgColor} to-transparent`}
      />

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>

            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}

            {trend !== undefined && (
              <div
                className={`flex items-center mt-2 text-sm font-medium ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? (
                  <TrendingUp className="h-4 w-4 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 mr-1" />
                )}
                <span>
                  {Math.abs(trend)}% {trendLabel || 'vs last period'}
                </span>
              </div>
            )}
          </div>

          <div
            className={`${bgColor} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className={`h-6 w-6 text-white`} />
          </div>
        </div>

        {/* Badge */}
        {badge !== undefined && (
          <div className="absolute top-4 right-4">
            <span
              className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm`}
            >
              {badge}
            </span>
          </div>
        )}
      </div>

      {/* Hover gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
    </div>
  );

  if (link) {
    return <Link href={link}>{content}</Link>;
  }

  return content;
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  href: string;
  badge?: number;
  onClick?: () => void;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  href,
  badge,
  onClick,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <div
        onClick={onClick}
        className={`group flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-${color}/30 hover:-translate-y-0.5 cursor-pointer`}
      >
        <div
          className={`p-3 rounded-xl bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}
        >
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {badge !== undefined && badge > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}

interface ActivityCardProps {
  title: string;
  items: {
    id: string;
    icon?: React.ElementType;
    iconColor?: string;
    content: string;
    time: string;
  }[];
  viewAllLink?: string;
}

export function ActivityCard({ title, items, viewAllLink }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="text-sm text-chazon-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      <div className="divide-y divide-gray-50">
        {items.map(item => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors"
            >
              {Icon && (
                <div
                  className={`p-2 rounded-full ${item.iconColor || 'bg-gray-100'}`}
                >
                  <Icon className="h-4 w-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 truncate">{item.content}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.time}</p>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="px-6 py-8 text-center text-gray-500">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = '',
}: ChartCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}
    >
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
