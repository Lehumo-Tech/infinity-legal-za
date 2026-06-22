---
Task ID: 2
Agent: auth-fixer
Task: Fix sign-in infinite loading, profile fetch failures, and auth initialization

Work Log:
- Fixed INITIAL_SESSION race condition in useAuth.tsx - removed initRef/initResolvedRef and initAuth(), now onAuthStateChange handles all events including INITIAL_SESSION
- Added buildMinimalProfile() helper to create profile from auth user data when profiles table row doesn't exist
- Applied profile ?? buildMinimalProfile() fallback in 4 places: onAuthStateChange, signIn normal path, signIn auto-confirm retry, signUp auto sign-in
- Reduced loading timeout from 15s to 8s in HomePageClient.tsx

Stage Summary:
- Sign-in no longer hangs infinitely - INITIAL_SESSION events are processed
- Profile fetch failure no longer blocks sign-in - fallback to minimal profile from auth metadata
- Loading timeout reduced for better UX

---
Task ID: 3-5
Agent: main
Task: Fix Get Started button, fix pricing mismatch, overhaul intranet flow

Work Log:
- Verified Get Started button flow works: LandingPage → handleSignUpWithEmail() → onSignUp → setShowLogin(true), setInitialSignup(true) → LoginScreen in signup mode
- Seeded correct pricing data via POST /api/admin/seed-pricing: Civil R99/mo, Labour R99/mo, Extensive R139/mo
- Verified pricing API returns correct data from database
- Added 'subscription' to View type union
- Added subscription state and loadSubscription() function to HomePageClient
- Added subscription fetch on auth (parallel with notifications)
- Overhauled getNavItems() for clients: My Cases, Consultations, My Documents, My Tasks, Subscribe/My Plan
- Staff navigation unchanged: Cases, Leads, Documents, Tasks, Staff Portal, Org Structure, Analytics, Pricing
- Added subscription CTA banner for clients without a plan ("Get Legal Coverage from R99/month")
- Added subscription status card for clients with an active plan
- Updated client quick actions: My Cases, Consultations, My Documents, My Tasks, Subscribe Now/My Plan
- Added PaymentWall integration for subscription view with PayFast checkout
- Added subscription management card (plan details, cancel subscription)
- Added PaymentWall import and ArrowRight import
- Updated PricingView to include onSubscribe and onLoginClick props

Stage Summary:
- Get Started button works correctly (tested with Agent Browser)
- Sign-in works for both staff and clients (tested with Agent Browser)
- Pricing matches database: Civil R99, Labour R99, Extensive R139
- Client intranet completely overhauled:
  - Simplified sidebar with client-focused navigation
  - Subscription CTA banner on workbench
  - Quick actions relevant to clients
  - PaymentWall integration for subscribing to plans
  - Subscription management (view plan, cancel)
- Staff intranet unchanged (Cases, Leads, Staff Portal, Analytics, etc.)
- Lint passes with zero errors
