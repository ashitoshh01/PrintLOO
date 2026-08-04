'use client';

import AuthContainer from '@/components/auth/AuthContainer';

export default function SignupPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background p-4 sm:p-6">
      <AuthContainer initialMode="signup" />
    </div>
  );
}
