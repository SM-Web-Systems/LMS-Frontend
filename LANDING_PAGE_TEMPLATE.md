# Landing Page Template

A reusable structure and content guide for product or app landing pages. Use this to brief designers and copywriters, or to implement a new landing in code.

---

## Purpose

- **Convert** visitors into sign-ups, logins, or next-step actions.
- **Communicate** what the product is, who it’s for, and why it’s worth using.
- **Build trust** with clear structure, professional tone, and optional social proof.

---

## Section-by-section structure

### 1. Header (sticky or static)

| Element | Purpose |
|--------|----------|
| **Logo / product name** | Brand identity; often links to `/` or scroll-to-top. |
| **Primary CTA** | One main action (e.g. “Sign in”, “Get started”). Right-aligned or in a nav. |
| **Optional** | Secondary nav (About, Pricing, Contact) if you have those pages. |

- Keep the header simple. One primary CTA is enough for most apps.
- On scroll, you can keep the header visible (sticky) so the CTA is always available.

---

### 2. Hero

| Element | Purpose |
|--------|----------|
| **Headline (H1)** | One clear promise or value in 5–10 words. Benefit-focused, not feature-focused. |
| **Subheadline** | 1–2 sentences that clarify who it’s for and what they get. |
| **Primary CTA** | Same action as header (e.g. “Get started”, “Sign in”). |
| **Optional** | Secondary link (e.g. “Learn more” that scrolls to features, or “See how it works”). |

- Headline: active voice, no jargon. E.g. “Learning management for teams that build” not “A platform that provides learning management”.
- Subheadline: audience + outcome. E.g. “Courses, quizzes, and discussions in one place. Built for [audience].”

---

### 3. Features / value proposition

| Element | Purpose |
|--------|----------|
| **Section title (H2)** | E.g. “What you get”, “Why [product name]”, “Features”. |
| **Feature cards or list** | 3–6 items. Each: short title + 1–2 sentence description. Optional icon or image. |
| **Layout** | Grid (2–3 columns on desktop) or alternating image/text rows. |

- Focus on **benefits**, not just features. “Submit work and get clear feedback” not “Submission upload system”.
- Keep copy scannable: short paragraphs, one idea per card.

---

### 4. How it works (optional)

| Element | Purpose |
|--------|----------|
| **Section title (H2)** | E.g. “How it works”, “Get started in three steps”. |
| **Steps** | 3–4 numbered steps: sign up → do X → get Y. Short and visual. |

- Use when the product flow isn’t obvious from the hero and features alone.
- Can be replaced by a short video or one “See how it works” link to a demo.

---

### 5. Social proof (optional)

| Element | Purpose |
|--------|----------|
| **Testimonials** | 1–3 short quotes: who (name, role), what they said, optional photo. |
| **Logos** | “Used by” or “Trusted by” with client/org logos (if applicable). |
| **Stats** | E.g. “X users”, “Y courses”, “Z completions” if you have real numbers. |

- Only include if you have real quotes or data. Avoid placeholder “Lorem” testimonials.
- One strong line (e.g. “Built for teams that ship real products”) can stand in for full testimonials.

---

### 6. Final CTA

| Element | Purpose |
|--------|----------|
| **Short headline** | E.g. “Ready to start?”, “Get access today”. |
| **One sentence** | Reinforce the next step. E.g. “Sign in to access your dashboard.” |
| **Single primary button** | Same action as header and hero (Sign in / Get started). |

- One action only. No competing buttons.
- Visually distinct (e.g. full-width or centered, or in a lightly tinted section).

---

### 7. Footer

| Element | Purpose |
|--------|----------|
| **Copyright** | E.g. “© 2025 [Company]. All rights reserved.” |
| **Optional** | Links: About, Contact, Privacy, Terms (if you have those pages). |
| **Optional** | Small tagline or product name. |

- Keep it minimal unless you have a multi-page marketing site. For an app landing, copyright + optional 1–2 links is enough.

---

## Content guidelines

- **Tone:** Clear, professional, confident. Avoid hype (“revolutionary”, “game-changing”) unless it fits the brand.
- **Audience:** Write for one primary audience (e.g. “students and instructors”, “developers”). If you have two, mention both in the subheadline.
- **Length:** Short. Prefer one strong sentence over long paragraphs. Bullets and short blocks are easier to scan.
- **CTAs:** Same label everywhere (e.g. always “Sign in” or always “Get started”) so the next step is obvious.

---

## Design notes

- **Hierarchy:** One clear H1, then H2 per section. Don’t skip levels.
- **Contrast:** Dark text on light background for body; white (or light) text on dark for hero/footer if that fits the brand.
- **Primary CTA:** One color (e.g. accent or primary). Same style in header, hero, and final CTA.
- **Spacing:** Consistent vertical rhythm between sections (e.g. py-16 or py-20). Enough padding so sections don’t feel cramped.
- **Mobile:** Stack grids into one column; keep CTAs full-width or centered; ensure tap targets are large enough.

---

## Checklist before launch

- [ ] Headline states benefit or promise in under 10 words.
- [ ] Primary CTA is the same in header, hero, and final CTA.
- [ ] Feature section has 3–6 items with clear titles and short copy.
- [ ] No placeholder “Lorem” or “Testimonial from X”.
- [ ] Footer has at least copyright and year.
- [ ] Page works on small viewports and loads quickly.

---

## Example outline (fill in for your product)

```text
HEADER
- Logo: [Product name]
- CTA: [Sign in / Get started]

HERO
- H1: [One sentence value proposition]
- Subhead: [Who it’s for + what they get.]
- CTA: [Same as header]
- Optional: [Learn more → #features]

FEATURES (H2: What you get)
1. [Feature name] — [One sentence benefit.]
2. [Feature name] — [One sentence benefit.]
3. [Feature name] — [One sentence benefit.]
(Add up to 3 more if needed.)

FINAL CTA
- Headline: [Ready to start?]
- Line: [Sign in to access your dashboard.]
- Button: [Sign in]

FOOTER
- © [Year] [Company]. [Optional tagline or links.]
```

Use this outline in a doc or directly in your React/Vue/HTML and replace bracketed text with your real copy.
