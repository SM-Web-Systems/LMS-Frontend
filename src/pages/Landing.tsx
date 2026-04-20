import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  MessageCircle,
  ClipboardList,
  Target,
  ArrowRight,
  Sparkles,
  Layers,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

const DottedSurface = lazy(() =>
  import('@/components/ui/dotted-surface').then((m) => ({ default: m.DottedSurface })),
);

const LEARNING_PATHS = [
  {
    name: 'Stellar & Soroban',
    level: 'Available now',
    description: 'Structured weeks, materials, and outcomes inside the LMS — sign in to start.',
    available: true,
    href: '/login',
    external: false,
  },
  {
    name: 'Blockchain for Beginners',
    level: 'Open companion site',
    description:
      'Multi-format path with modules, media, and quizzes — aligned with how we teach on the web.',
    available: true,
    href: 'https://blockchain-vibe-coding.smwebsystems.com',
    external: true,
  },
  {
    name: 'Ethereum & security',
    level: 'Coming soon',
    description: 'Crash courses and security-minded patterns for EVM — on the roadmap.',
    available: false,
    href: '#topics',
    external: false,
  },
  {
    name: 'Solana & automation',
    level: 'Coming soon',
    description: 'On-chain programs and trading workflows — planned expansions.',
    available: false,
    href: '#topics',
    external: false,
  },
] as const;

const Landing: React.FC = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Course content',
      description: 'Videos, links, and PDFs in one place. Learn at your own pace with clear sections and outcomes.',
    },
    {
      icon: FileText,
      title: 'Submissions & feedback',
      description: 'Submit work and get clear feedback from instructors. Track status in one dashboard.',
    },
    {
      icon: ClipboardList,
      title: 'Quizzes',
      description: 'Check your understanding and track progress. Pass and optionally certify.',
    },
    {
      icon: MessageCircle,
      title: 'Forum & messages',
      description: 'Discuss with the class in the forum and message instructors directly.',
    },
    {
      icon: Target,
      title: 'Structured learning',
      description: 'Sections, objectives, and outcomes for each course so you know what you’ll achieve.',
    },
  ];

  const steps = [
    { step: 1, title: 'Sign in', text: 'Use your account or sign in with Google.' },
    { step: 2, title: 'Access courses & quizzes', text: 'Browse content and take quizzes when you’re ready.' },
    { step: 3, title: 'Track progress', text: 'See completions on your profile and stay in touch via messages.' },
  ];

  const heroStats = [
    { label: 'Formats', value: 'Video · PDF · links' },
    { label: 'Practice', value: 'Quizzes & submissions' },
    { label: 'Structure', value: 'Weeks & outcomes' },
  ];

  const platformStats = [
    { figure: 'One hub', caption: 'Courses, quizzes, forum, and messaging together.' },
    { figure: 'Clear paths', caption: 'Objectives and outcomes so you always know what’s next.' },
    { figure: 'Real feedback', caption: 'Submissions and instructor notes you can act on.' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      {/* Header — dark glass rail (Updraft-style over hero) */}
      <header className="lms-landing-header">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex justify-between items-center h-16 lg:h-[4.25rem]">
            <Link
              to="/"
              className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-primary-dark rounded-lg"
            >
              <img src="/logo.png" alt="" className="w-10 h-10 shrink-0 rounded-lg ring-1 ring-white/20" />
              <div>
                <span className="text-lg font-bold text-white block leading-tight tracking-tight">
                  SM Web Systems
                </span>
                <span className="text-[11px] text-white/55 hidden sm:block font-medium uppercase tracking-wider">
                  Learning platform
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="#topics"
                className="hidden sm:inline-flex items-center text-sm font-medium text-white/85 hover:text-white px-3 py-2 rounded-lg transition-colors"
              >
                Learning paths
              </a>
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-white text-primary-dark hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-dark shadow-lg shadow-black/15"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-[88vh] flex flex-col justify-center text-white overflow-hidden bg-gradient-to-b from-[#152a38] via-primary-dark to-primary-medium">
        <Suspense fallback={null}>
          <DottedSurface particlePalette="onDark" className="min-h-full w-full opacity-90" />
        </Suspense>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.14),transparent_50%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-primary-dark/90 via-transparent to-transparent"
        />

        <div className="relative z-20 w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 pt-6 pb-20 sm:pb-28">
          <div className="max-w-3xl">
            <p className="lms-kicker text-white/90 mb-5">Developer education · In-house LMS</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-6">
              Level up with structured blockchain learning —{' '}
              <span className="text-white/95">built for teams that ship.</span>
            </h1>
            <p className="text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl mb-10">
              The same clarity you expect from modern course platforms: paths, practice, and feedback — tuned for SM Web
              Systems and inspired by how leading Web3 educators structure their material.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              <Link
                to="/login"
                className="inline-flex justify-center items-center px-7 py-3.5 rounded-xl text-base font-semibold bg-white text-primary-dark hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark shadow-updraft"
              >
                Get started
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center items-center px-6 py-3.5 rounded-xl text-base font-semibold border border-white/35 text-white hover:bg-white/10 transition-colors"
              >
                Explore the platform
              </a>
            </div>
          </div>

          <div className="mt-14 sm:mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl">
            {heroStats.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/15 bg-white/[0.06] backdrop-blur-sm px-5 py-4"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-1">{s.label}</p>
                <p className="text-base font-semibold text-white">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value strip — dark panel like Updraft “What is…” */}
      <section className="relative py-16 sm:py-20 px-4 bg-[#0f1a22] text-white overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35] bg-grid-faint bg-[length:48px_48px]"
        />
        <div className="relative max-w-8xl mx-auto">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <p className="lms-kicker text-accent-teal mb-4">Why this platform</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Everything you need to run serious cohort-based learning
            </h2>
            <p className="text-white/70 text-lg leading-relaxed">
              Clear structure for instructors, a calm experience for learners — without losing the depth you’d expect
              from a dedicated education product.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {platformStats.map((s) => (
              <div
                key={s.figure}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8 shadow-updraft"
              >
                <Sparkles className="w-8 h-8 text-accent-teal mb-4 opacity-90" aria-hidden />
                <p className="text-xl font-bold tracking-tight mb-2">{s.figure}</p>
                <p className="text-sm text-white/65 leading-relaxed">{s.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning paths — course cards */}
      <section id="topics" className="py-16 sm:py-24 px-4 scroll-mt-24 bg-white">
        <div className="max-w-8xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-14">
            <div className="max-w-2xl">
              <p className="lms-kicker mb-3">Learning paths</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">
                Topics & courses
              </h2>
              <p className="text-neutral-600 text-lg leading-relaxed">
                Start with what’s live today. More tracks land here as we expand — same LMS, richer catalog.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center self-start lg:self-auto px-5 py-2.5 rounded-xl text-sm font-semibold text-accent-teal border border-accent-teal/40 hover:bg-primary-50 transition-colors"
            >
              <Layers className="w-4 h-4 mr-2" />
              Open your dashboard
            </Link>
          </div>

          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            {LEARNING_PATHS.map((path) => (
              <div
                key={path.name}
                className="group relative flex flex-col rounded-2xl border border-neutral-200/90 bg-neutral-50/50 p-6 sm:p-8 shadow-updraft transition-all duration-300 hover:shadow-updraft-hover hover:border-neutral-300/90 hover:-translate-y-0.5"
              >
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                      path.available
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        : 'bg-neutral-200/80 text-neutral-600 border border-neutral-300/80'
                    }`}
                  >
                    {path.level}
                  </span>
                  {!path.available && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      Roadmap
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight mb-2 group-hover:text-primary-dark transition-colors">
                  {path.name}
                </h3>
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed flex-1 mb-6">{path.description}</p>
                {path.external ? (
                  <a
                    href={path.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm font-semibold text-accent-teal hover:text-accent-teal-hover"
                  >
                    Visit companion site
                    <ExternalLink className="w-4 h-4 ml-1.5" />
                  </a>
                ) : path.available ? (
                  <Link
                    to={path.href}
                    className="inline-flex items-center text-sm font-semibold text-accent-teal hover:text-accent-teal-hover"
                  >
                    Sign in to learn
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-neutral-400">Notify your instructor when this opens</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-24 px-4 scroll-mt-20 relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-faint bg-[length:48px_48px] opacity-40"
        />
        <div className="relative max-w-8xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="lms-kicker mb-3">Platform capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight mb-3">What you get</h2>
            <p className="text-neutral-600 text-lg leading-relaxed">
              One place to learn, submit work, take quizzes, and stay in touch with your class.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-updraft transition-all duration-300 hover:shadow-updraft-hover hover:border-neutral-300/80"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-dark/10 to-accent-teal/15 flex items-center justify-center mb-5 ring-1 ring-neutral-900/5">
                  <Icon className="w-6 h-6 text-primary-dark" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 px-4 bg-white border-y border-neutral-200/90">
        <div className="max-w-8xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <p className="lms-kicker mb-3">Getting started</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight">How it works</h2>
          </div>
          <div className="grid gap-6 lg:gap-8 lg:grid-cols-3">
            {steps.map(({ step, title, text }) => (
              <div
                key={step}
                className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-8 text-center shadow-card"
              >
                <div className="w-12 h-12 rounded-full bg-primary-dark text-white font-bold flex items-center justify-center mx-auto mb-5 text-lg shadow-md">
                  {step}
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">{title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{text}</p>
                <CheckCircle2
                  className="w-5 h-5 text-accent-teal absolute top-6 right-6 opacity-40"
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 px-4 bg-gradient-to-br from-primary-dark via-[#1a3344] to-primary-medium text-white relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(61,122,140,0.35),transparent_55%)]"
        />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">Your next step starts here</h2>
          <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Sign in to open your courses, quizzes, and dashboard — the same account your organization already uses.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-8 py-3.5 rounded-xl text-base font-semibold bg-white text-primary-dark hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white/60 focus:ring-offset-2 focus:ring-offset-primary-dark shadow-updraft"
          >
            Sign in to the LMS
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#0c1419] text-white/75 border-t border-white/5">
        <div className="max-w-8xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="" className="w-9 h-9 rounded-lg ring-1 ring-white/15" />
            <div>
              <span className="font-bold text-white block">SM Web Systems</span>
              <span className="text-xs text-white/50">Learning Management System</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm">
            <a
              href="https://blockchain-vibe-coding.smwebsystems.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white inline-flex items-center gap-1.5"
            >
              Blockchain for Beginners
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
            <span className="hidden sm:inline text-white/25" aria-hidden>
              ·
            </span>
            <span>© {new Date().getFullYear()} SM Web Systems</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
