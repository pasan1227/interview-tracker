import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Check,
  ClipboardList,
  Lock,
  MessageSquareQuote,
  Shield,
  Sparkles,
  Star,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';

/* Cross-app navigation. Marketing lives at the apex domain
 * (example.com / localhost:3001); the dashboard at app.example.com
 * (localhost:3000). NEXT_PUBLIC_APP_URL is the dashboard's public
 * base — the dashboard reads the same var for its own outbound
 * email links, so values stay in sync. */
const DASHBOARD_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
const SIGN_IN_HREF = `${DASHBOARD_URL}/login`;
const REGISTER_HREF = `${DASHBOARD_URL}/register`;

/* ──────────── Design tokens ────────────
   Palette: warm-white canvas, ink black, deep forest accent.
   Typography: Geist sans + Geist mono (loaded globally in layout.tsx).
   Voice: confident, restrained, software-grade.                 */

const BG = '#FAFAF7';
const SURFACE = '#FFFFFF';
const INK = '#0A0A0A';
const MUTED = '#5F6470';
const BORDER = '#E8E6DE';
const FOREST = '#0E3B2E';
const FOREST_2 = '#0A2D22';

const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Customers', href: '#customers' },
  { label: 'Security', href: '#security' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Calendar,
    title: 'Coordinated scheduling',
    body: 'Resolve interviewer availability across timezones and panels in one pass. No more reply-all calendar tennis.',
    bullets: ['Panel auto-balancing', 'Calendar-native invites', 'Buffer & travel rules'],
  },
  {
    icon: ClipboardList,
    title: 'Structured feedback',
    body: 'Calibrated rubrics, scoped questions, and a single source of truth attached to every candidate.',
    bullets: ['Custom rubrics per role', 'Interviewer auto-reminders', 'Audit-friendly history'],
  },
  {
    icon: Workflow,
    title: 'Configurable workflows',
    body: 'Build the stages your team actually runs. Re-order, fork, and version without leaving the product.',
    bullets: ['Drag-and-drop stages', 'Per-role variants', 'Template library'],
  },
  {
    icon: MessageSquareQuote,
    title: 'Calibrated debriefs',
    body: 'A debrief surface that resists groupthink. Independent scores first, discussion second, decision documented.',
    bullets: ['Independent scoring', 'Disagreement surfacing', 'Decision audit trail'],
  },
];

const METRICS = [
  { value: '73%', label: 'Reduction in time-to-hire', foot: 'Average, teams of 50+' },
  { value: '4.2×', label: 'Faster interviewer feedback', foot: 'Measured at week six' },
  { value: '12 days', label: 'Median first call to offer', foot: 'Engineering & product' },
  { value: '99.98%', label: 'Platform uptime', foot: 'Trailing twelve months' },
];

const STEPS = [
  {
    num: '01',
    title: 'Define the workflow',
    body: 'Map your stages, panels, and rubrics once. Reuse and version per role.',
  },
  {
    num: '02',
    title: 'Run the interview',
    body: 'A focused surface for questions, notes, and rubrics — no tab juggling.',
  },
  {
    num: '03',
    title: 'Decide with confidence',
    body: 'Independent scores, structured debrief, and a decision everyone can stand behind.',
  },
];

const LOGOS = [
  'NORTHWIND',
  'MERIDIAN',
  'ARTEMIS',
  'BLACKWOOD',
  'CASCADE',
  'LANTERN',
  'PRISM',
  'OAKMARK',
];

const TESTIMONIALS = [
  {
    quote:
      'We replaced four tools with one. Our interviewers actually fill out feedback now, and our debriefs take half the time.',
    name: 'Sarah Tate',
    role: 'Head of People',
    company: 'Northwind Studios',
    initials: 'ST',
  },
  {
    quote:
      'The calibrated debrief alone paid for the platform. Disagreement is now a feature of our process, not a liability.',
    name: 'Marcus Chen',
    role: 'VP Engineering',
    company: 'Meridian Labs',
    initials: 'MC',
  },
  {
    quote:
      'Our time-to-hire dropped from 41 days to 18. Candidates remark on how organized the process feels.',
    name: 'Priya Anand',
    role: 'Talent Lead',
    company: 'Cascade',
    initials: 'PA',
  },
];

const SECURITY = [
  { icon: Shield, label: 'SOC 2 Type II' },
  { icon: Lock, label: 'GDPR & CCPA aligned' },
  { icon: Check, label: 'SSO + SAML 2.0' },
  { icon: Star, label: 'AES-256 at rest' },
];

export default function LandingPage() {
  return (
    <main
      className="relative isolate min-h-screen overflow-x-hidden"
      style={{
        backgroundColor: BG,
        color: INK,
        fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
        fontFeatureSettings: '"ss01", "cv11"',
      }}
    >
      <PageStyles />

      {/* ──────────── ANNOUNCEMENT ──────────── */}
      <div
        className="relative z-30 flex items-center justify-center gap-2 border-b py-2 text-[12px]"
        style={{ borderColor: BORDER, backgroundColor: '#F2F1EA', color: INK }}
      >
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em]"
          style={{ backgroundColor: FOREST, color: '#EFEFE9' }}
        >
          <Sparkles className="size-3" strokeWidth={2} />
          New
        </span>
        <span style={{ color: MUTED }}>
          Calibrated debriefs are now generally available
        </span>
        <Link
          href="#features"
          className="inline-flex items-center gap-1 font-medium hover:underline"
          style={{ color: INK }}
        >
          Read the post
          <ArrowRight className="size-3" strokeWidth={2} />
        </Link>
      </div>

      {/* ──────────── NAV ──────────── */}
      <header
        className="sticky top-0 z-20 backdrop-blur-md"
        style={{
          backgroundColor: 'rgba(250,250,247,0.78)',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-10">
          <Link href="/" className="flex items-center gap-2.5" aria-label="InterviewPro home">
            <Logomark />
            <span className="text-[16px] font-semibold tracking-[-0.01em]">InterviewPro</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="nav-link text-[13.5px] font-medium"
                style={{ color: '#222' }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={SIGN_IN_HREF}
              className="hidden text-[13.5px] font-medium md:inline-flex md:items-center md:px-3 md:py-2"
              style={{ color: '#222' }}
            >
              Sign in
            </Link>
            <Link
              href={REGISTER_HREF}
              className="btn-primary inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-[13.5px] font-medium"
            >
              Start free
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────── HERO ──────────── */}
      <section className="relative">
        <div className="mx-auto max-w-[1200px] px-6 pt-20 pb-16 lg:px-10 lg:pt-28 lg:pb-20">
          <div
            className="anim-rise inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium"
            style={{ borderColor: BORDER, backgroundColor: SURFACE, color: '#333' }}
          >
            <span
              className="inline-block size-1.5 rounded-full"
              style={{ backgroundColor: FOREST }}
            />
            Trusted by 500+ hiring teams worldwide
          </div>

          <h1
            className="anim-rise mt-6 max-w-[20ch] text-[clamp(2.6rem,6vw,4.75rem)] font-medium leading-[1.02] tracking-[-0.035em]"
            style={{ animationDelay: '90ms' }}
          >
            The interview platform built for{' '}
            <span style={{ color: FOREST }}>considered</span> hiring decisions.
          </h1>

          <p
            className="anim-rise mt-6 max-w-[52ch] text-[17px] leading-[1.55]"
            style={{ animationDelay: '180ms', color: MUTED }}
          >
            Coordinate scheduling, capture structured feedback, and run calibrated
            debriefs — all in one workspace. Designed for teams who treat hiring as
            a craft, not a checklist.
          </p>

          <div
            className="anim-rise mt-9 flex flex-wrap items-center gap-3"
            style={{ animationDelay: '270ms' }}
          >
            <Link
              href={REGISTER_HREF}
              className="btn-primary inline-flex items-center gap-2 rounded-md px-5 py-3 text-[14px] font-medium"
            >
              Start free trial
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="#product"
              className="btn-ghost inline-flex items-center gap-2 rounded-md border px-5 py-3 text-[14px] font-medium"
              style={{ borderColor: BORDER, color: INK }}
            >
              See the product
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div
            className="anim-rise mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]"
            style={{ animationDelay: '360ms', color: MUTED }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5" style={{ color: FOREST }} strokeWidth={2.5} />
              Free for the first 30 days
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5" style={{ color: FOREST }} strokeWidth={2.5} />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="size-3.5" style={{ color: FOREST }} strokeWidth={2.5} />
              SOC 2 Type II
            </span>
          </div>
        </div>

        {/* product preview */}
        <div id="product" className="mx-auto max-w-[1200px] px-6 pb-24 lg:px-10">
          <ProductPreview />
        </div>
      </section>

      {/* ──────────── LOGOS ──────────── */}
      <section
        className="border-y py-12"
        style={{ borderColor: BORDER, backgroundColor: '#F4F2EB' }}
      >
        <div className="mx-auto max-w-[1200px] px-6 lg:px-10">
          <div
            className="text-center text-[12px] font-medium uppercase tracking-[0.18em]"
            style={{ color: MUTED }}
          >
            Trusted by hiring teams at
          </div>
          <div className="mt-7 grid grid-cols-2 items-center justify-items-center gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-8">
            {LOGOS.map((l) => (
              <div
                key={l}
                className="text-[14px] font-semibold tracking-[0.04em] opacity-60 transition-opacity hover:opacity-100"
                style={{ color: '#1A1A1A' }}
              >
                {l}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── FEATURES ──────────── */}
      <section id="features" className="relative">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
          <SectionEyebrow>What you get</SectionEyebrow>
          <div className="mt-3 grid grid-cols-12 items-end gap-6">
            <h2
              className="col-span-12 max-w-[20ch] text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em] lg:col-span-8"
            >
              Everything your team needs to hire well — and nothing it doesn&apos;t.
            </h2>
            <p
              className="col-span-12 max-w-[40ch] text-[15px] leading-[1.55] lg:col-span-4"
              style={{ color: MUTED }}
            >
              Four capabilities, designed to compose. Adopt one, or run the entire
              process end-to-end on InterviewPro.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2">
            {FEATURES.map((f) => (
              <article
                key={f.title}
                className="feat-card group relative flex flex-col gap-6 overflow-hidden rounded-2xl border p-7 lg:p-9"
                style={{ borderColor: BORDER, backgroundColor: SURFACE }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="inline-flex size-10 items-center justify-center rounded-lg border"
                    style={{
                      borderColor: BORDER,
                      backgroundColor: '#F4F2EB',
                    }}
                  >
                    <f.icon className="size-5" style={{ color: FOREST }} strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight
                    className="size-4 opacity-30 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
                    strokeWidth={1.75}
                  />
                </div>

                <div>
                  <h3 className="text-[20px] font-medium tracking-[-0.015em]">{f.title}</h3>
                  <p className="mt-2 text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
                    {f.body}
                  </p>
                </div>

                <ul className="mt-auto flex flex-col gap-1.5 border-t pt-5 text-[13.5px]" style={{ borderColor: BORDER }}>
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-2" style={{ color: '#3A3A3A' }}>
                      <Check className="size-3.5" style={{ color: FOREST }} strokeWidth={2.5} />
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── METRICS ──────────── */}
      <section className="relative" style={{ backgroundColor: FOREST, color: '#EFEFE9' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10 lg:py-24">
          <div className="grid grid-cols-12 items-end gap-6">
            <div className="col-span-12 lg:col-span-7">
              <SectionEyebrow tone="light">Outcomes that matter</SectionEyebrow>
              <h2 className="mt-3 max-w-[22ch] text-[clamp(1.85rem,3.6vw,2.8rem)] font-medium leading-[1.1] tracking-[-0.025em]">
                Hiring teams move faster, with more confidence, on InterviewPro.
              </h2>
            </div>
            <p
              className="col-span-12 max-w-[40ch] text-[14.5px] leading-[1.55] lg:col-span-5"
              style={{ color: '#EFEFE9B3' }}
            >
              Aggregated outcomes from forty design and engineering organizations
              over the last twelve months.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-xl lg:grid-cols-4" style={{ backgroundColor: '#FFFFFF1A' }}>
            {METRICS.map((m) => (
              <div
                key={m.label}
                className="metric flex flex-col gap-2 p-7"
                style={{ backgroundColor: FOREST_2 }}
              >
                <div className="text-[clamp(2.2rem,3.6vw,3rem)] font-semibold tracking-[-0.03em] leading-none">
                  {m.value}
                </div>
                <div className="mt-2 text-[14px] leading-[1.4]">{m.label}</div>
                <div className="mt-1 text-[12px] uppercase tracking-[0.12em]" style={{ color: '#EFEFE980', fontFamily: 'var(--font-geist-mono)' }}>
                  {m.foot}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── HOW IT WORKS ──────────── */}
      <section id="process" className="relative">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2
            className="mt-3 max-w-[22ch] text-[clamp(2rem,4.4vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em]"
          >
            Three steps, repeatable across every role.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.55]" style={{ color: MUTED }}>
            InterviewPro replaces seven tools and a dozen email threads with a
            single, considered workflow.
          </p>

          <ol className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li
                key={s.num}
                className="step-card relative flex flex-col gap-5 rounded-2xl border p-7 lg:p-8"
                style={{ borderColor: BORDER, backgroundColor: SURFACE }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="text-[13px] font-medium uppercase tracking-[0.12em]"
                    style={{ color: MUTED, fontFamily: 'var(--font-geist-mono)' }}
                  >
                    Step {s.num}
                  </div>
                  <div
                    className="text-[42px] font-semibold leading-none tracking-[-0.04em]"
                    style={{ color: '#0A0A0A0F' }}
                  >
                    {s.num}
                  </div>
                </div>
                <h3 className="text-[20px] font-medium tracking-[-0.015em]">{s.title}</h3>
                <p className="text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
                  {s.body}
                </p>
                {i < STEPS.length - 1 && (
                  <ArrowRight
                    className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 md:block"
                    style={{ color: FOREST }}
                    strokeWidth={1.75}
                    aria-hidden
                  />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ──────────── TESTIMONIALS ──────────── */}
      <section id="customers" className="relative border-y" style={{ borderColor: BORDER, backgroundColor: '#F4F2EB' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
          <SectionEyebrow>Customer stories</SectionEyebrow>
          <div className="mt-3 grid grid-cols-12 items-end gap-6">
            <h2 className="col-span-12 max-w-[22ch] text-[clamp(2rem,4.4vw,3.25rem)] font-medium leading-[1.06] tracking-[-0.03em] lg:col-span-8">
              Teams that have made hiring a competitive advantage.
            </h2>
            <Link
              href="#customers"
              className="col-span-12 inline-flex items-center gap-1.5 text-[14px] font-medium lg:col-span-4 lg:justify-end"
            >
              Read all case studies
              <ArrowUpRight className="size-4" strokeWidth={2} />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure
                key={t.name}
                className="testimonial flex flex-col gap-6 rounded-2xl border p-7 lg:p-8"
                style={{ borderColor: BORDER, backgroundColor: SURFACE }}
              >
                <div className="flex items-center gap-1" style={{ color: FOREST }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={`star-${t.name}-${i}`} className="size-3.5" fill="currentColor" strokeWidth={0} />
                  ))}
                </div>
                <blockquote className="text-[16px] leading-[1.55]" style={{ color: '#1A1A1A' }}>
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-auto flex items-center gap-3 border-t pt-5" style={{ borderColor: BORDER }}>
                  <div
                    className="inline-flex size-10 items-center justify-center rounded-full text-[13px] font-semibold"
                    style={{ backgroundColor: FOREST, color: '#EFEFE9' }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[14px] font-medium">{t.name}</div>
                    <div className="text-[12.5px]" style={{ color: MUTED }}>
                      {t.role} · {t.company}
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────── SECURITY ──────────── */}
      <section id="security" className="relative">
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-32">
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-5">
              <SectionEyebrow>Enterprise-ready</SectionEyebrow>
              <h2 className="mt-3 text-[clamp(1.85rem,3.6vw,2.6rem)] font-medium leading-[1.1] tracking-[-0.025em]">
                Built to meet the bar your security team draws.
              </h2>
              <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.55]" style={{ color: MUTED }}>
                SOC 2 Type II audited, GDPR and CCPA aligned, and engineered with
                least-privilege access from day one. SSO, audit logs, and a
                signed DPA are included on every plan.
              </p>
              <Link
                href="#security"
                className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium"
                style={{ color: FOREST }}
              >
                Review the trust center
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </div>

            <div className="col-span-12 grid grid-cols-2 gap-5 lg:col-span-7">
              {SECURITY.map((s) => (
                <div
                  key={s.label}
                  className="security flex flex-col gap-3 rounded-2xl border p-6"
                  style={{ borderColor: BORDER, backgroundColor: SURFACE }}
                >
                  <div
                    className="inline-flex size-10 items-center justify-center rounded-lg border"
                    style={{ borderColor: BORDER, backgroundColor: '#F4F2EB' }}
                  >
                    <s.icon className="size-5" style={{ color: FOREST }} strokeWidth={1.75} />
                  </div>
                  <div className="text-[15px] font-medium tracking-[-0.01em]">{s.label}</div>
                  <div className="text-[13px]" style={{ color: MUTED }}>
                    Continuously monitored, independently verified.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FINAL CTA ──────────── */}
      <section className="relative" style={{ backgroundColor: '#F4F2EB' }}>
        <div className="mx-auto max-w-[1200px] px-6 py-24 lg:px-10 lg:py-28">
          <div
            className="overflow-hidden rounded-3xl border p-10 lg:p-16"
            style={{
              borderColor: BORDER,
              backgroundColor: SURFACE,
              boxShadow: '0 1px 0 rgba(0,0,0,0.02), 0 30px 60px -30px rgba(14,59,46,0.16)',
            }}
          >
            <div className="grid grid-cols-12 items-center gap-8">
              <div className="col-span-12 lg:col-span-7">
                <h2 className="text-[clamp(2rem,4.4vw,3.25rem)] font-medium leading-[1.05] tracking-[-0.03em]">
                  Start hiring with{' '}
                  <span style={{ color: FOREST }}>more clarity</span> today.
                </h2>
                <p className="mt-4 max-w-[44ch] text-[15px] leading-[1.55]" style={{ color: MUTED }}>
                  Free for 30 days. No credit card. Migrate your existing
                  pipeline in under an hour with a guided onboarding session.
                </p>
              </div>

              <div className="col-span-12 flex flex-col items-stretch gap-3 lg:col-span-5 lg:items-end">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
                  <Link
                    href={REGISTER_HREF}
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 text-[14px] font-medium"
                  >
                    Start free trial
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                  <Link
                    href="#"
                    className="btn-ghost inline-flex items-center justify-center gap-2 rounded-md border px-5 py-3 text-[14px] font-medium"
                    style={{ borderColor: BORDER, color: INK }}
                  >
                    Book a demo
                    <ArrowUpRight className="size-4" strokeWidth={2} />
                  </Link>
                </div>
                <div className="text-[12.5px] lg:text-right" style={{ color: MUTED }}>
                  Or email us at <span style={{ color: INK }}>hello@interviewpro.app</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────── FOOTER ──────────── */}
      <footer className="relative border-t" style={{ borderColor: BORDER }}>
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:px-10">
          <div className="grid grid-cols-12 gap-8">
            <div className="col-span-12 md:col-span-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Logomark />
                <span className="text-[16px] font-semibold tracking-[-0.01em]">InterviewPro</span>
              </Link>
              <p className="mt-4 max-w-[32ch] text-[13.5px] leading-[1.55]" style={{ color: MUTED }}>
                The interview platform for hiring teams who treat decisions as craft.
              </p>
              <div className="mt-6 flex items-center gap-2 text-[12px]" style={{ color: MUTED }}>
                <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
                All systems operational
              </div>
            </div>
            <FooterCol title="Product" links={['Features', 'Workflows', 'Security', 'Pricing', 'Changelog']} />
            <FooterCol title="Company" links={['About', 'Customers', 'Careers', 'Contact', 'Press']} />
            <FooterCol title="Resources" links={['Documentation', 'API', 'Status', 'Trust center', 'Brand kit']} />
          </div>

          <div
            className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 text-[12.5px] md:flex-row md:items-center"
            style={{ borderColor: BORDER, color: MUTED }}
          >
            <span>© 2026 InterviewPro, Inc. All rights reserved.</span>
            <div className="flex items-center gap-5">
              <Link href="#" className="hover:underline">Terms</Link>
              <Link href="#" className="hover:underline">Privacy</Link>
              <Link href="#" className="hover:underline">Cookies</Link>
              <Link href="#" className="hover:underline">DPA</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ──────────── SUB-COMPONENTS ──────────── */

function Logomark() {
  return (
    <span
      aria-hidden
      className="relative inline-flex size-7 items-center justify-center rounded-md"
      style={{ backgroundColor: FOREST }}
    >
      <span
        className="block size-3 rounded-[3px]"
        style={{
          background: 'conic-gradient(from 135deg, #EFEFE9, #EFEFE9 25%, transparent 25%, transparent 50%, #EFEFE9 50%, #EFEFE9 75%, transparent 75%)',
        }}
      />
    </span>
  );
}

type EyebrowProps = Readonly<{ children: React.ReactNode; tone?: 'dark' | 'light' }>;
function SectionEyebrow({ children, tone = 'dark' }: EyebrowProps) {
  const dotColor = tone === 'light' ? '#7CC0A8' : FOREST;
  const textColor = tone === 'light' ? '#EFEFE9CC' : MUTED;
  return (
    <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: textColor }}>
      <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      {children}
    </div>
  );
}

type FooterColProps = Readonly<{ title: string; links: string[] }>;
function FooterCol({ title, links }: FooterColProps) {
  return (
    <div className="col-span-6 md:col-span-2 md:col-start-auto lg:col-span-2">
      <div
        className="mb-4 text-[12px] font-medium uppercase tracking-[0.12em]"
        style={{ color: MUTED }}
      >
        {title}
      </div>
      <ul className="space-y-2.5 text-[13.5px]">
        {links.map((l) => (
          <li key={l}>
            <Link
              href={`#${l.toLowerCase().replace(/\s+/g, '-')}`}
              className="footer-link"
              style={{ color: '#2A2A2A' }}
            >
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* The product preview: a stylized interview-management surface that
   reads as software at a glance — browser chrome, app sidebar, list,
   and a metric strip. Static, no JS. */
function ProductPreview() {
  return (
    <div
      className="anim-rise relative overflow-hidden rounded-2xl border"
      style={{
        animationDelay: '450ms',
        borderColor: BORDER,
        backgroundColor: SURFACE,
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.02), 0 30px 60px -30px rgba(14,59,46,0.22), 0 6px 18px -8px rgba(0,0,0,0.06)',
      }}
    >
      {/* browser chrome */}
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: BORDER, backgroundColor: '#FAFAF7' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="block size-2.5 rounded-full" style={{ backgroundColor: '#E5E5E0' }} />
          <span className="block size-2.5 rounded-full" style={{ backgroundColor: '#E5E5E0' }} />
          <span className="block size-2.5 rounded-full" style={{ backgroundColor: '#E5E5E0' }} />
        </div>
        <div
          className="mx-auto flex max-w-[420px] flex-1 items-center justify-center gap-2 rounded-md border px-3 py-1 text-[12px]"
          style={{ borderColor: BORDER, color: MUTED, fontFamily: 'var(--font-geist-mono)' }}
        >
          <Lock className="size-3" strokeWidth={2} /> app.interviewpro.com/dashboard
        </div>
      </div>

      <div className="grid grid-cols-12">
        {/* sidebar */}
        <aside
          className="col-span-12 border-b p-5 sm:col-span-3 sm:border-b-0 sm:border-r"
          style={{ borderColor: BORDER, backgroundColor: '#FBFAF5' }}
        >
          <div className="flex items-center gap-2">
            <Logomark />
            <span className="text-[13.5px] font-semibold tracking-[-0.01em]">InterviewPro</span>
          </div>

          <nav className="mt-7 flex flex-col gap-1 text-[13px]">
            <SideItem icon={Users} label="Dashboard" active />
            <SideItem icon={Calendar} label="Interviews" badge="3" />
            <SideItem icon={ClipboardList} label="Candidates" />
            <SideItem icon={MessageSquareQuote} label="Feedback" />
            <SideItem icon={Workflow} label="Workflows" />
            <SideItem icon={Shield} label="Settings" />
          </nav>

          <div className="mt-10 hidden rounded-lg border p-3 sm:block" style={{ borderColor: BORDER, backgroundColor: SURFACE }}>
            <div className="text-[11.5px] font-medium uppercase tracking-[0.12em]" style={{ color: MUTED }}>
              Active workflow
            </div>
            <div className="mt-1 text-[12.5px] font-medium">Senior Engineer · v3</div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px]" style={{ color: MUTED }}>
              <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: FOREST }} />
              4 stages · 6 panelists
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="col-span-12 p-5 sm:col-span-9 sm:p-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[12px] font-medium uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                This week
              </div>
              <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em]">Hiring overview</div>
            </div>
            <div
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium"
              style={{ backgroundColor: FOREST, color: '#EFEFE9' }}
            >
              <Zap className="size-3.5" strokeWidth={2} />
              New interview
            </div>
          </div>

          {/* metric pills */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Pill k="Scheduled" v="3" sub="this week" />
            <Pill k="In review" v="11" sub="candidates" />
            <Pill k="Avg. feedback" v="1.4d" sub="last 30 days" />
            <Pill k="Time to offer" v="12d" sub="median" />
          </div>

          {/* upcoming interviews */}
          <div className="mt-7 rounded-xl border" style={{ borderColor: BORDER }}>
            <div
              className="flex items-center justify-between border-b px-5 py-3 text-[12.5px] font-medium uppercase tracking-[0.12em]"
              style={{ borderColor: BORDER, color: MUTED }}
            >
              <span>Upcoming interviews</span>
              <span className="lowercase tracking-normal" style={{ color: MUTED, fontFamily: 'var(--font-geist-mono)' }}>
                3 scheduled
              </span>
            </div>
            <ul className="divide-y" style={{ borderColor: BORDER }}>
              <Row name="Maria Rodriguez" role="Senior Backend Engineer" when="Today · 2:30 PM" stage="Technical · Panel" status="Confirmed" />
              <Row name="Thomas Anderson" role="Senior Frontend Engineer" when="Tomorrow · 10:00 AM" stage="System Design" status="Pending" />
              <Row name="Anna Garcia" role="Product Manager" when="Thu · 11:30 AM" stage="Final · Leadership" status="Confirmed" />
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideItem({
  icon: Icon,
  label,
  active,
  badge,
}: Readonly<{ icon: typeof Users; label: string; active?: boolean; badge?: string }>) {
  return (
    <div
      className="flex items-center justify-between rounded-md px-2.5 py-1.5"
      style={{
        backgroundColor: active ? '#0E3B2E0F' : 'transparent',
        color: active ? INK : '#3A3A3A',
        fontWeight: active ? 500 : 400,
      }}
    >
      <span className="inline-flex items-center gap-2.5">
        <Icon className="size-3.5" strokeWidth={1.75} style={{ color: active ? FOREST : '#5F6470' }} />
        {label}
      </span>
      {badge && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[10.5px] font-medium"
          style={{ backgroundColor: FOREST, color: '#EFEFE9' }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function Pill({ k, v, sub }: Readonly<{ k: string; v: string; sub: string }>) {
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: BORDER, backgroundColor: '#FBFAF5' }}>
      <div className="text-[11.5px] font-medium uppercase tracking-[0.12em]" style={{ color: MUTED }}>
        {k}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-[24px] font-semibold tracking-[-0.025em]">{v}</span>
        <span className="text-[11.5px]" style={{ color: MUTED }}>{sub}</span>
      </div>
    </div>
  );
}

function Row({
  name,
  role,
  when,
  stage,
  status,
}: Readonly<{ name: string; role: string; when: string; stage: string; status: 'Confirmed' | 'Pending' }>) {
  const ok = status === 'Confirmed';
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('');
  return (
    <li className="flex items-center justify-between gap-4 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="inline-flex size-9 items-center justify-center rounded-full text-[12.5px] font-semibold"
          style={{
            backgroundColor: '#F4F2EB',
            color: INK,
            border: `1px solid ${BORDER}`,
          }}
        >
          {initials}
        </div>
        <div>
          <div className="text-[14px] font-medium">{name}</div>
          <div className="text-[12.5px]" style={{ color: MUTED }}>{role}</div>
        </div>
      </div>
      <div className="hidden text-right md:block">
        <div className="text-[13px]">{when}</div>
        <div className="text-[12px]" style={{ color: MUTED }}>{stage}</div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
        style={{
          backgroundColor: ok ? '#0E3B2E14' : '#A8651014',
          color: ok ? FOREST : '#A86510',
        }}
      >
        <span className="inline-block size-1.5 rounded-full" style={{ backgroundColor: ok ? FOREST : '#A86510' }} />
        {status}
      </span>
    </li>
  );
}

function PageStyles() {
  return (
    <style>{`
      .nav-link {
        position: relative;
        padding: 4px 0;
        transition: color 220ms ease;
      }
      .nav-link::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: -2px;
        height: 1.5px;
        background: ${FOREST};
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 320ms cubic-bezier(.2,.7,.2,1);
      }
      .nav-link:hover { color: ${INK}; }
      .nav-link:hover::after { transform: scaleX(1); }

      .btn-primary {
        position: relative;
        background: ${INK};
        color: #FAFAF7;
        transition: background-color 200ms ease, transform 200ms ease;
        box-shadow: 0 1px 0 rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .btn-primary:hover { background: ${FOREST}; }
      .btn-primary:active { transform: translateY(0.5px); }

      .btn-ghost {
        background: ${SURFACE};
        transition: background-color 200ms ease, border-color 200ms ease, transform 200ms ease;
      }
      .btn-ghost:hover { background: #F4F2EB; border-color: #D8D6CE; }
      .btn-ghost:active { transform: translateY(0.5px); }

      .footer-link {
        position: relative;
        transition: color 200ms ease;
      }
      .footer-link::after {
        content: '';
        position: absolute;
        left: 0; right: 0; bottom: -1.5px;
        height: 1px;
        background: currentColor;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 280ms cubic-bezier(.2,.7,.2,1);
        opacity: 0.4;
      }
      .footer-link:hover { color: ${INK}; }
      .footer-link:hover::after { transform: scaleX(1); }

      @keyframes rise {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .anim-rise { animation: rise 700ms cubic-bezier(.2,.7,.2,1) both; }

      .feat-card {
        transition: transform 320ms cubic-bezier(.2,.7,.2,1), box-shadow 320ms ease, border-color 320ms ease;
      }
      .feat-card:hover {
        transform: translateY(-2px);
        border-color: #D8D6CE;
        box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 20px 40px -28px rgba(14,59,46,0.18);
      }

      .step-card, .testimonial, .security {
        transition: transform 320ms cubic-bezier(.2,.7,.2,1), box-shadow 320ms ease, border-color 320ms ease;
      }
      .step-card:hover, .testimonial:hover, .security:hover {
        transform: translateY(-2px);
        border-color: #D8D6CE;
        box-shadow: 0 1px 0 rgba(0,0,0,0.02), 0 16px 32px -22px rgba(14,59,46,0.14);
      }

      .metric { transition: background-color 280ms ease; }
      .metric:hover { background-color: #0A3326; }

      @supports (animation-timeline: view()) {
        .feat-card, .step-card, .testimonial, .security, .metric {
          animation: rise 800ms cubic-bezier(.2,.7,.2,1) both;
          animation-timeline: view();
          animation-range: entry 0% cover 35%;
        }
      }

      ::selection { background: ${FOREST}; color: #FAFAF7; }
    `}</style>
  );
}
