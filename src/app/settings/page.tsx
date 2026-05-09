"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/ui/Card';
import { BottomNav } from '@/shared/ui/BottomNav';
import { User, Shield, Bell, HelpCircle, LogOut, ChevronRight, Globe, Loader2, Palette } from 'lucide-react';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { useRouter } from 'next/navigation';
import apiClient from '@/shared/lib/api-client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/auth/profile');
        console.log({response})
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fmic_token');
    localStorage.removeItem('fmic_user');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const settings = [
    { 
      icon: User, 
      label: 'Profile', 
      desc: isLoading ? 'Loading...' : `${profile?.name || 'User'}, ${profile?.shopName || 'Shop Owner'}` 
    },
    { icon: Shield, label: 'Security', desc: 'Fingerprint & PIN' },
    { icon: Bell, label: 'Notifications', desc: 'Daily summary alerts' },
    { icon: Globe, label: 'Language', desc: 'English & Pidgin' },
    { icon: HelpCircle, label: 'Support', desc: 'Help & Training' },
  ];

  return (
    <div className="pt-8 min-h-screen bg-background">
      <header className="px-6 mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground leading-none tracking-tight font-syne">Settings</h1>
      </header>

      <div className="px-6 space-y-4">
        <div className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-elevated rounded-xl text-muted">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-foreground text-lg leading-none">Appearance</p>
              <p className="text-sm text-muted font-medium mt-1.5">Dark & Light Mode</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {settings.map((s) => (
          <div key={s.label} className="flex items-center justify-between p-5 bg-surface rounded-2xl border border-border shadow-sm active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-elevated rounded-xl text-muted">
                <s.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-foreground text-lg leading-none">{s.label}</p>
                <p className="text-sm text-muted font-medium mt-1.5">{s.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-border" />
          </div>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-5 bg-danger/10 text-danger border border-danger/20 rounded-2xl font-bold text-lg mt-8 active:scale-[0.98] transition-transform"
        >
          <LogOut className="w-6 h-6" />
          Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
