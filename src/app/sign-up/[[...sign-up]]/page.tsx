import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo_legal.png" alt="Infinity Legal SA" className="mx-auto h-12 object-contain mb-4" />
          <h1 className="text-2xl font-bold text-[#0c1e3c]" style={{ fontFamily: 'Georgia, serif' }}>
            Create your account
          </h1>
          <p className="text-slate-500 text-sm mt-1">Start your legal journey with Infinity Legal SA</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: 'bg-[#c9a84c] text-[#0c1e3c] hover:bg-[#dfc475] font-semibold',
              card: 'shadow-xl border border-slate-100',
              headerTitle: 'text-[#0c1e3c] font-bold',
              headerSubtitle: 'text-slate-500',
            },
          }}
        />
      </div>
    </div>
  );
}
