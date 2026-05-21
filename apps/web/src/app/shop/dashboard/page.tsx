'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Printer, Users, Settings, Activity } from 'lucide-react';
import Link from 'next/link';

export default function ShopDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Shop Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your print station</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <h3 className="text-2xl font-bold">4</h3>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
              <h3 className="text-2xl font-bold">12</h3>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <h3 className="text-2xl font-bold">148</h3>
            </div>
          </div>
          <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-lg flex items-center justify-center">
              <span className="font-bold text-xl">₹</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue Today</p>
              <h3 className="text-2xl font-bold">₹1,240</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h3 className="font-semibold text-lg">Quick Actions</h3>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4">
              <Link href="/shop/queue" className="block">
                <Button variant="outline" className="w-full h-24 flex flex-col gap-2 rounded-xl">
                  <Printer className="w-6 h-6 text-brand-accent" />
                  Manage Queue
                </Button>
              </Link>
              <Button variant="outline" className="w-full h-24 flex flex-col gap-2 rounded-xl" disabled>
                <Settings className="w-6 h-6 text-muted-foreground" />
                Shop Settings
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
