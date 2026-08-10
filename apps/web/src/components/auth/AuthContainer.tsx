'use client';

import Image from 'next/image';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Infinity, ShieldCheck, Mail, KeyRound, User as UserIcon, Store, ArrowRight, CheckCircle2 } from 'lucide-react';
import logoImg from '../../../public/logo.png';

const LocationPicker = dynamic(() => import('@/components/map/LocationPicker'), { ssr: false });

interface AuthContainerProps {
  initialMode?: 'login' | 'signup';
  onSuccess?: () => void;
}

export default function AuthContainer({ initialMode = 'login', onSuccess }: AuthContainerProps) {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Signup Multi-Step State
  // Step 1: Info (Name, Email) -> Step 2: Verify OTP -> Step 3: Set Password & Role -> Complete
  const [signupStep, setSignupStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState<'CUSTOMER' | 'OPERATOR'>('CUSTOMER');
  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopLocation, setShopLocation] = useState('');
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await authService.login(loginEmail, loginPassword);
      const { user, token, refreshToken } = res.data;
      setUser(user);
      setToken(token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setLoginError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Invalid credentials. Please check and try again.'));
    } finally {
      setLoginLoading(false);
    }
  };

  // Step 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !signupEmail) {
      setSignupError('Please provide your name and email');
      return;
    }
    setSignupLoading(true);
    setSignupError('');
    try {
      const res = await authService.sendOtp(signupEmail);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
      }
      setSignupSuccessMsg(`OTP sent to ${signupEmail}`);
      setSignupStep(2);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setSignupError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Failed to send OTP.'));
    } finally {
      setSignupLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      setSignupError('Please enter a valid 6-digit OTP');
      return;
    }
    setSignupLoading(true);
    setSignupError('');
    try {
      await authService.verifyOtp(signupEmail, otp);
      setOtpVerified(true);
      setSignupSuccessMsg('OTP verified successfully!');
      setSignupStep(3);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setSignupError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Invalid OTP.'));
    } finally {
      setSignupLoading(false);
    }
  };

  // Step 3: Complete Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) {
      setSignupError('Password must be at least 8 characters long');
      return;
    }
    if (role === 'OPERATOR' && (!shopName || !shopLocation)) {
      setSignupError('Shop name and location are required for shop owners');
      return;
    }

    setSignupLoading(true);
    setSignupError('');
    try {
      const signupRes = await authService.signup({
        name,
        email: signupEmail,
        password,
        role,
        shopName: role === 'OPERATOR' ? shopName : undefined,
        shopLocation: role === 'OPERATOR' ? shopLocation : undefined,
        shopLatitude: role === 'OPERATOR' && shopLat ? shopLat : undefined,
        shopLongitude: role === 'OPERATOR' && shopLng ? shopLng : undefined,
      });

      const { user, token, refreshToken } = signupRes.data;
      setUser(user);
      setToken(token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setSignupError(Array.isArray(msg) ? msg.join(', ') : (typeof msg === 'string' ? msg : 'Signup failed.'));
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2 flex-wrap">
          <span>Welcome to</span>
          <Image src={logoImg} alt="PrintLOO" className="h-8 sm:h-9 w-auto object-contain inline-block align-middle" priority />
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {mode === 'login' ? 'Sign in to access print shops near you' : 'Create an account to get started'}
        </p>
      </div>

      {/* Auth Card */}
      <div className="bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 backdrop-blur-md">
        {/* Toggle Mode */}
        <div className="flex p-1 bg-muted rounded-xl mb-6">
          <button
            onClick={() => { setMode('login'); setSignupError(''); setLoginError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => { setMode('signup'); setSignupError(''); setLoginError(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {loginError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Password</label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-6"
            >
              {loginLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* SIGNUP MULTI-STEP FORM */}
        {mode === 'signup' && (
          <div>
            {/* Step Progress Indicator */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${signupStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  1
                </div>
                <span className="text-xs font-medium">Details</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${signupStep >= 2 ? 'bg-primary' : 'bg-border'}`} />
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${signupStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  2
                </div>
                <span className="text-xs font-medium">Verify OTP</span>
              </div>
              <div className={`h-0.5 flex-1 mx-2 ${signupStep >= 3 ? 'bg-primary' : 'bg-border'}`} />
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${signupStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  3
                </div>
                <span className="text-xs font-medium">Account</span>
              </div>
            </div>

            {signupError && (
              <div className="p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {signupError}
              </div>
            )}
            {signupSuccessMsg && signupStep < 3 && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{signupSuccessMsg}</span>
              </div>
            )}

            {/* STEP 1: Enter Name & Email */}
            {signupStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Full Name</label>
                  <div className="relative">
                    <UserIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-6"
                >
                  {signupLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: Verify OTP */}
            {signupStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">6-Digit Verification Code</label>
                    <button
                      type="button"
                      onClick={() => setSignupStep(1)}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Change Email
                    </button>
                  </div>
                  <div className="relative">
                    <ShieldCheck className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-base tracking-widest font-mono text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  {devOtpHint && (
                    <div className="mt-2 text-xs p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-medium flex items-center justify-between">
                      <span><strong>Dev Hint OTP:</strong> <span className="font-mono font-bold tracking-wider text-sm ml-1">{devOtpHint}</span></span>
                      <button
                        type="button"
                        onClick={() => setOtp(devOtpHint)}
                        className="text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-semibold transition-colors"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={signupLoading || otp.length < 6}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-6"
                >
                  {signupLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            {/* STEP 3: Complete Account */}
            {signupStep === 3 && (
              <form onSubmit={handleCreateAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Account Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('CUSTOMER')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === 'CUSTOMER' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <UserIcon className="w-4 h-4 mb-1 text-primary" />
                      <div className="font-semibold text-xs">Customer</div>
                      <div className="text-[11px] text-muted-foreground">Print documents</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('OPERATOR')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        role === 'OPERATOR' ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border'
                      }`}
                    >
                      <Store className="w-4 h-4 mb-1 text-primary" />
                      <div className="font-semibold text-xs">Shop Owner</div>
                      <div className="text-[11px] text-muted-foreground">Manage print queue</div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Set Password</label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                {role === 'OPERATOR' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Shop Name</label>
                      <input
                        type="text"
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        placeholder="e.g. Express Print Kothrud"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Shop Location</label>
                      <input
                        type="text"
                        value={shopLocation}
                        onChange={(e) => setShopLocation(e.target.value)}
                        placeholder="e.g. Paud Road, Kothrud, Pune"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    <LocationPicker
                      latitude={shopLat}
                      longitude={shopLng}
                      compact
                      onLocationChange={(lat, lng, address) => {
                        setShopLat(lat);
                        setShopLng(lng);
                        if (address && !shopLocation) setShopLocation(address);
                      }}
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-6"
                >
                  {signupLoading ? 'Creating Account...' : 'Complete Account'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
