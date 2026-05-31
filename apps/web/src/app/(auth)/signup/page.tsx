'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<'CUSTOMER' | 'OPERATOR'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authService.signup({
        name, email, password, role,
        shopName: role === 'OPERATOR' ? shopName : undefined,
        shopLocation: role === 'OPERATOR' ? shopLocation : undefined,
      });
      router.push('/login?registered=true');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Signup failed.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-10 px-4">
      <div className="w-full max-w-lg p-8 rounded-xl border border-border bg-card">
        <h1 className="text-2xl font-semibold mb-2">Create an account</h1>
        <p className="text-muted-foreground mb-6 text-sm">Join PrintLOO today</p>
        
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRole('CUSTOMER')}
            className={`flex-1 p-4 rounded-xl border text-left transition-colors ${role === 'CUSTOMER' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="font-semibold text-sm">Customer</div>
            <div className="text-xs text-muted-foreground mt-1">Print documents</div>
          </button>
          <button
            onClick={() => setRole('OPERATOR')}
            className={`flex-1 p-4 rounded-xl border text-left transition-colors ${role === 'OPERATOR' ? 'border-primary bg-primary/5' : 'border-border'}`}
          >
            <div className="font-semibold text-sm">Shop Owner</div>
            <div className="text-xs text-muted-foreground mt-1">Manage print queue</div>
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Full Name</label>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required minLength={8}
            />
          </div>
          
          {role === 'OPERATOR' && (
            <>
              <div>
                <label className="text-sm font-medium mb-1 block">Shop Name</label>
                <input
                  type="text" value={shopName} onChange={e => setShopName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Shop Location</label>
                <input
                  type="text" value={shopLocation} onChange={e => setShopLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors mt-4"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <a href="/login" className="text-primary hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div />}>
      <SignupForm />
    </Suspense>
  );
}
