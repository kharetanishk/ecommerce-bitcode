import Link from "next/link";
import { type JSX } from "react";

export default function Home(): JSX.Element {
  return (
    <div className="min-h-screen bg-white text-zinc-950 selection:bg-black selection:text-white flex flex-col font-sans">
      {/* 1. Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold tracking-tight">
              BitCode
            </Link>
            <div className="hidden gap-6 text-sm font-medium text-zinc-600 md:flex">
              <Link href="#" className="hover:text-zinc-950 transition-colors">
                Home
              </Link>
              <Link href="#" className="hover:text-zinc-950 transition-colors">
                Products
              </Link>
              <Link href="#" className="hover:text-zinc-950 transition-colors">
                About
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-950 md:block transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-zinc-950 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          {/* Subtle Abstract CSS Background (Gradients) */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
          <div className="absolute top-0 right-0 -z-10 h-[500px] w-[500px] translate-x-1/3 -translate-y-1/2 rounded-full bg-zinc-100 blur-[100px]" />
          <div className="absolute bottom-0 left-0 -z-10 h-[500px] w-[500px] -translate-x-1/3 translate-y-1/3 rounded-full bg-zinc-50 blur-[100px]" />

          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold tracking-tighter text-zinc-950 sm:text-7xl">
              Shop Smarter. <br className="hidden sm:block" />
              Live Better.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-600 sm:text-xl">
              Discover curated, premium products built for the modern lifestyle.
              Experience seamless checkout and dynamic catalogs designed for you.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="#"
                className="w-full sm:w-auto rounded-full bg-zinc-950 px-8 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 hover:shadow-md active:scale-95"
              >
                Browse Products
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-full border border-zinc-200 bg-white px-8 py-3.5 text-sm font-medium text-zinc-950 transition-all hover:bg-zinc-50 active:scale-95"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </section>

        {/* 3. Features Section */}
        <section className="bg-zinc-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                Everything you need
              </h2>
              <p className="mt-4 text-lg leading-8 text-zinc-600">
                A platform designed from the ground up for speed, security, and simplicity.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {/* Feature 1 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-950">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-zinc-900">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                      </svg>
                    </div>
                    Dynamic Catalog
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600">
                    <p className="flex-auto">Real-time inventory updates and intelligent search to help you find exactly what you're looking for, instantly.</p>
                  </dd>
                </div>

                {/* Feature 2 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-950">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-zinc-900">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                    </div>
                    Secure Checkout
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600">
                    <p className="flex-auto">Enterprise-grade encryption and seamless payment integrations ensure your data is always protected.</p>
                  </dd>
                </div>

                {/* Feature 3 */}
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-950">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-zinc-900">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    </div>
                    Fast Delivery
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600">
                    <p className="flex-auto">Optimized logistics networks ensuring your premium products arrive at your doorstep faster than ever.</p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        {/* 4. CTA Banner */}
        <section className="bg-zinc-950 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to elevate your experience?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
              Join thousands of satisfied customers today.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="#"
                className="rounded-full bg-white px-8 py-3.5 text-sm font-medium text-zinc-950 shadow-sm transition-all hover:bg-zinc-100 active:scale-95"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 5. Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center md:order-2 space-x-6 text-sm font-medium text-zinc-500">
            <Link href="#" className="hover:text-zinc-950 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-zinc-950 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-zinc-950 transition-colors">Contact</Link>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-sm leading-5 text-zinc-500">
              &copy; {new Date().getFullYear()} BitCode, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
