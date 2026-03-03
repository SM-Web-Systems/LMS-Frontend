import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, MessageCircle, ClipboardList, Target, ArrowRight } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header — SM Web Systems: clean, primary-dark accent */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2 rounded-lg">
              <img src="/logo.png" alt="SM Web Systems" className="w-10 h-10 shrink-0" />
              <div>
                <span className="text-xl font-bold text-primary-dark block leading-tight">SM Web Systems</span>
                <span className="text-xs text-neutral-500 hidden sm:block">Learning Management System</span>
              </div>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-accent-teal hover:bg-accent-teal-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — dark gradient, single promise, one CTA */}
      <section className="bg-gradient-to-br from-primary-dark to-primary-medium text-white py-20 sm:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
            Learning management for teams that build
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Courses, quizzes, submissions, and discussions in one place. Built for SM Web Systems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 rounded-md text-lg font-medium bg-white text-primary-dark hover:bg-neutral-100 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-dark"
            >
              Get started
            </Link>
            <a
              href="#features"
              className="inline-flex items-center text-white/90 hover:text-white text-base font-medium transition-colors"
            >
              See what’s included
              <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
          <p className="mt-10 text-sm text-white/70 max-w-lg mx-auto">
            Built for teams that ship real products. Clear structure, real feedback, and a path from learning to doing.
          </p>
        </div>
      </section>

      {/* Features — value prop grid */}
      <section id="features" className="py-16 sm:py-20 px-4 scroll-mt-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-neutral-800 text-center mb-4">
            What you get
          </h2>
          <p className="text-neutral-600 text-center mb-12 max-w-2xl mx-auto">
            One place to learn, submit work, take quizzes, and stay in touch with your class.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white rounded-lg border border-neutral-200 p-6 shadow-card hover:shadow-md hover:border-neutral-300 transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-primary-dark/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-accent-teal" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works — 3 steps */}
      <section className="py-16 sm:py-20 px-4 bg-white border-y border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-800 text-center mb-12">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map(({ step, title, text }) => (
              <div key={step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-accent-teal text-white font-bold flex items-center justify-center mx-auto mb-4 text-sm">
                  {step}
                </div>
                <h3 className="text-lg font-semibold text-neutral-800 mb-2">{title}</h3>
                <p className="text-neutral-600 text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — single action */}
      <section className="py-16 sm:py-20 px-4 bg-neutral-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-800 mb-4">
            Ready to start?
          </h2>
          <p className="text-neutral-600 mb-8">
            Sign in to access your courses, quizzes, and dashboard.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 rounded-md text-base font-medium text-white bg-accent-teal hover:bg-accent-teal-hover transition-colors focus:outline-none focus:ring-2 focus:ring-accent-teal focus:ring-offset-2"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Footer — minimal */}
      <footer className="py-8 px-4 bg-primary-dark text-white/80">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SM Web Systems" className="w-6 h-6 brightness-0 invert opacity-90" />
            <span className="font-semibold text-white">SM Web Systems</span>
          </div>
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} SM Web Systems. Learning Management System.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
