'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { user } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        window.location.href = '/admin'; // Hard reload triggers middleware
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid admin credentials.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-200 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-surface-900 mb-4">Admin Login</h1>
          <p className="text-surface-600 mb-6">
            You must be signed in with a normal account first before elevating to Admin.
            Please go to the home page and sign in.
          </p>
          <Button fullWidth onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-surface-200 max-w-md w-full">
        <h1 className="text-2xl font-bold text-surface-900 mb-6 text-center">Admin Access</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-danger-50 text-danger-700 text-sm rounded-lg border border-danger-100">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="off"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" fullWidth className="mt-6">
            Log in as Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
