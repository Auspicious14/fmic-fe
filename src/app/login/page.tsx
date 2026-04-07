"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/ui/Button';
import { Card } from '@/shared/ui/Card';
import apiClient from '@/shared/lib/api-client';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('fmic_token', response.data.access_token);
      localStorage.setItem('fmic_user', JSON.stringify(response.data.user));
      toast.success('Welcome back!');
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black text-foreground tracking-tight font-syne uppercase">FMIC</h1>
          <p className="text-muted font-medium mt-2">Financial Memory for Shop Owners</p>
        </div>
        
        <Card className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/5 transition-all"
                placeholder="owner@shop.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent/5 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
              Sign In
            </Button>
          </form>
        </Card>
        
        <p className="text-center mt-8 text-sm text-muted font-medium">
          Don't have an account? <span className="text-foreground font-bold cursor-pointer" onClick={() => router.push('/register')}>Register your shop</span>
        </p>
      </div>
    </div>
  );
}
