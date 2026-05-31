'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(email, password);
      // Depending on API interceptor unwrapping data, `res` could be the data directly, or `res.data`.
      // By step 11 we unwrap `{ success, data }` in the interceptor, so `res.data` is the actual inner data object.
      // Wait, axios interceptor unwrap logic in Step 11: 
      // if (response.data?.success !== undefined) { response.data = response.data.data; }
      // Thus res.data is already unwrapped.
      const { user, token, refreshToken } = res.data;
      setUser(user);
      setToken(token);
      localStorage.setItem('refreshToken', refreshToken);
      if (user.role === 'CUSTOMER') router.push('/upload');
      else router.push('/shop/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Login failed. Check your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-xl border border-border bg-card">
        <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
        <p className="text-muted-foreground mb-6 text-sm">Sign in to your PrintLOO account</p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com" required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••" required
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <a href="/signup" className="text-primary hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
