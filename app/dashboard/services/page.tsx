'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { ServiceCard } from '@/components/ui/service-card';
import { useAuthStore } from '@/store/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Service } from '@/types/service';
import { ServiceCardSkeleton } from '@/components/ui/skeleton';

export default function StewardServicesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Wait for auth to be fully loaded
    if (isAuthenticated === false) {
      redirect('/auth/signin');
      return;
    }

    if (user && user.role !== 'STEWARD') {
      redirect('/dashboard');
      return;
    }

    if (user && isAuthenticated) {
      fetchServices();
      setInitialized(true);
    }
  }, [isAuthenticated, user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Fetching services for current user...');
      const response = await fetch('/api/services?stewardId=me');
      console.log('[DEBUG] Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('[DEBUG] Services fetched:', data.data?.length || 0);
        setServices(data.data || []);
      } else {
        const error = await response.json();
        console.error('[DEBUG] Error response:', error);
        toast.error(error.error || 'Failed to load services');
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      setDeleting(serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Service deleted successfully');
        fetchServices();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated || !initialized) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-chazon-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading services...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (user?.role !== 'STEWARD') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your service offerings
              </p>
            </div>
            <Link href="/dashboard/services/create">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Service
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <ServiceCardSkeleton key={i} />
              ))}
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {services.map(service => (
                <div key={service.id} className="relative group">
                  <ServiceCard service={service} />
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/dashboard/services/${service.id}/edit`}>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-8 w-8 p-0"
                        title="Edit service"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDelete(service.id)}
                      disabled={deleting === service.id}
                      title="Delete service"
                    >
                      {deleting === service.id ? (
                        <Package className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-50 to-blue-50">
                  <Package className="h-12 w-12 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No services yet
              </h3>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Get started by creating your first service offering. Reach more
                customers and grow your business.
              </p>
              <Link href="/dashboard/services/create">
                <Button className="bg-chazon-primary hover:bg-chazon-primary-dark">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Service
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
