# Brand & Aesthetic Reference — SM Web Systems

This project uses the **SM Web Systems** brand and aesthetic from [smwebsystems.com](https://smwebsystems.com) for visual consistency across products.

## Palette (from smwebsystems.com)

| Token | Hex | Usage |
|-------|-----|--------|
| **Primary dark** | `#1b3a4b` | Dark sections, nav, footer, primary buttons |
| **Primary medium** | `#2d5a6b` | Hover states, secondary surfaces |
| **Primary light** | `#4a7c8c` | Borders, subtle accents |
| **Accent teal** | `#3d7a8c` | CTAs, links, focus rings |
| **Accent hover** | `#2d6a7c` | Button/link hover |
| **Text primary** | `#1f2e35` | Body, headings on light bg |
| **Text secondary** | `#4a5a62` | Muted text |
| **Text light** | `#9ba8ae` | Placeholders, captions |
| **Neutral 50–100** | `#f8fafb`, `#f1f5f7` | Page/section backgrounds |
| **Neutral 200–300** | `#e5eaed`, `#d1d9dd` | Borders |
| **White** | `#fff` | Cards, content surfaces |

## Typography

- **Sans:** Geist Sans (or system-ui fallback)
- **Mono:** Geist Mono (or monospace fallback)
- Clean, readable hierarchy; section headings stand out on dark or light backgrounds.

## Aesthetic notes

- Light default backgrounds with dark blue–grey text.
- Teal accent for actions and links.
- Dark (`primary-dark`) used for hero sections and footer with white text.
- Subtle shadows and borders; minimal but clear separation of sections.
- Trust/transparency feel: clear structure, good contrast, professional.

## Usage in this app

- **Tailwind** and **`src/index.css`** define the same tokens. The Tailwind theme extends `primary` (with scale 50–900), `accent`, and `neutral`; `gray` is aliased to `neutral` so existing `gray-*` classes use the brand palette.
- Prefer semantic classes for new UI: `bg-primary-dark`, `text-neutral-800`, `border-neutral-200`, `bg-accent-teal` for buttons/links.
- Existing `primary-500`/`primary-600` and `gray-*` classes continue to work and now resolve to the SM Web Systems palette.
