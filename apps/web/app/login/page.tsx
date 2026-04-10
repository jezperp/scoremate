'use client'

import { createClient } from '@scoremate/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  const signInWith = async (provider: 'google' | 'apple') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0F0F11] px-4">
      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl bg-[#1A1A1F] p-8 shadow-2xl">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-extrabold tracking-tight text-white">
            Score<span className="text-[#F5A623]">mate</span>
          </span>
          <p className="mt-2 text-sm text-white/50">
            Fotbollsresultat i realtid
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Google */}
          <button
            onClick={() => signInWith('google')}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            <GoogleIcon />
            Fortsätt med Google
          </button>

          {/* Apple */}
          <button
            onClick={() => signInWith('apple')}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10 active:scale-[0.98]"
          >
            <AppleIcon />
            Fortsätt med Apple
          </button>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Genom att logga in godkänner du våra villkor och integritetspolicy.
        </p>
      </div>
    </main>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.8 0 663.3 0 541.8c0-202.1 131.9-308.8 261.4-308.8 70.8 0 129.9 46.5 173.6 46.5 41.9 0 108.2-49.1 186.2-49.1 29.8 0 108.2 2.6 168.9 80.8zm-198.4-176.3c31.2-37.1 53.5-88.8 53.5-140.5 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.9 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.1-70.5z" />
    </svg>
  )
}
