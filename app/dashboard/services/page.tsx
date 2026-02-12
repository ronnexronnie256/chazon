"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { useAuthStore } from "@/store/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import toast from "react-hot-toast";
import type { Service } from "@/types/service";

export default function StewardServicesPage() {
  const { isAuthenticated, user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      redirect("/auth/signin");
    }

    if (user.role !== "STEWARD") {
      redirect("/dashboard");
    }

    fetchServices();
  }, [isAuthenticated, user]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services?stewardId=me");
      if (response.ok) {
        const data = await response.json();
        setServices(data.data || []);
      } else {
        toast.error("Failed to load services");
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service?")) {
      return;
    }

    try {
      setDeleting(serviceId);
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Service deleted successfully");
        fetchServices();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("Failed to delete service");
    } finally {
      setDeleting(null);
    }
  };

  if (!isAuthenticated || user?.role !== "STEWARD") {
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
            <div className="text-center py-12">
              <p className="text-gray-500">Loading services...</p>
            </div>
          ) : services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {services.map((service) => (
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
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No services
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first service offering.
              </p>
              <div className="mt-6">
                <Link href="/dashboard/services/create">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Service
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

