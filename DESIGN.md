---
version: alpha
name: "AZ Milli Təchizat"
description: "A compact blue-and-white sanitary supply storefront and operations platform for Azerbaijani B2B and B2C customers."
colors:
  primary: "#0878E8"
  primary-dark: "#075EBD"
  primary-soft: "#EAF4FF"
  navy: "#0C2F4F"
  ink: "#102A43"
  muted: "#64748B"
  surface: "#FFFFFF"
  canvas: "#F5F8FC"
  border: "#DDE7F1"
  success: "#0F9F74"
  warning: "#D97706"
  danger: "#DC3545"
typography:
  display:
    fontFamily: "Arial, Helvetica, sans-serif"
  body:
    fontFamily: "Arial, Helvetica, sans-serif"
  utility:
    fontFamily: "Arial, Helvetica, sans-serif"
rounded:
  DEFAULT: "0.5rem"
  sm: "0.375rem"
  md: "0.625rem"
  lg: "0.875rem"
spacing:
  control: "0.75rem"
  section-gap: "2rem"
  page-max: "75rem"
components:
  button: {}
  card: {}
  field: {}
  dialog: {}
  table: {}
---

# AZ Milli Təchizat Design System

## Overview

### Creative North Star

The interface should feel like a well-organized sanitary supply showroom catalogue: cool white ceramic, chrome fittings, precise blue labels, and efficient wholesaler shelving. The supplied 12-screen reference is the visual authority.

### Product context and register

- **Audience and primary job:** Azerbaijani homeowners, installers, procurement teams, and small businesses comparing sanitary products and requesting a quote.
- **Target market and evidence:** Azerbaijan, established by the brief, Azerbaijani language, AZN currency, and future `.az` domain.
- **Locale and language policy:** `az-AZ`; all owned interface copy is Azerbaijani. Product brand/model names retain their original casing.
- **Usage scene:** Quick catalogue scanning on desktop and mobile, with a denser authenticated operations view for administration.
- **Register:** Hybrid. Public pages balance product confidence and utility; admin pages prioritize dense, familiar controls.
- **Memorable signature:** Photorealistic bathroom imagery and clean, isolated product photography sit inside a crisp modular blue/white tile system.
- **Restraint:** Forms, filters, cart math, quotation status, and admin CRUD remain conventional and unambiguous.
- **Anti-references:** No luxury black-and-gold treatment, oversized editorial typography, glassmorphism, or playful consumer-app gradients.
- **Token ownership/runtime mapping:** This document is the durable source; `assets/css/styles.css` implements the variables directly. Drift is checked by the premium static audit and browser review.

## Colors

`primary` is the only expressive accent and owns links, calls to action, selected states, and focus support. `navy` anchors the admin shell and footer. White and pale blue-grey surfaces keep chrome and ceramic product photography legible. Success, warning, and danger are reserved for semantic states and always paired with text or icons.

## Typography

Arial/Helvetica is deliberately used to match the compact commerce reference and provide dependable Azerbaijani glyphs without a network font. Display text is bold rather than decorative. Prices use tabular numerals; interface labels use sentence case.

## Layout

Public content is capped at 1200px with a 12px–24px responsive gutter. Desktop category/search pages use a 220px filter column and fluid product grid. Below 780px the filter becomes a disclosure panel and product grids become two columns; below 480px key forms and carts become one column. Image and error regions reserve geometry to prevent layout jumps.

## Elevation & Depth

Hierarchy comes from borders, pale tonal layers, and one low shadow for floating/mobile navigation. Static catalogue cards stay predominantly flat. Dialogs and mobile drawers use a deeper shadow and dimmed overlay.

## Shapes

Controls use 6px radii, cards 8–10px, and semantic chips use pill geometry. Product image panels retain softly rounded corners; admin tables remain square-edged inside one rounded frame.

## Components

### Foundational visual states

All interactive components have distinct hover, focus-visible, active, disabled, busy, selected, and error states. Focus uses a 3px translucent primary ring. Server-backed actions expose stable busy states and actionable errors.

### Buttons and actions

Primary actions are solid blue, secondary actions are white with a blue/grey border, success actions are green, and archival/destructive actions are red only inside the owned confirmation dialog. Busy labels keep dimensions stable.

### Navigation and data display

Desktop navigation mirrors the compact reference header. Mobile uses a menu button and horizontal utility actions. Admin navigation uses a dark persistent sidebar, becoming a horizontal scroll row on narrow screens. Tables scroll horizontally without clipping actions.

### Forms and overlays

Fields use visible labels, 42px controls, inline error slots, `novalidate`, and first-error focus. Native selects are accepted for this no-build application; platform popup geometry is intentionally native. The shared modal provides focus management, Escape dismissal, and focus restoration.

### Iconography

Lucide is loaded as the icon vocabulary with 16–20px strokes. A small text/symbol fallback remains visible if the CDN is unavailable.

### Motion

Motion is limited to 160–220ms hover/overlay transitions. Reduced-motion mode removes transforms and shortens transitions.

### Content and data visualization

Copy is concise and practical. Currency is formatted with Azerbaijani number conventions and `AZN`. Unpublished prices are never converted to zero and are called out as “Qiymət soruşun”.

## Do's and Don'ts

- **Do:** Keep products, filters, price mode, and next actions visible at a glance.
- **Do:** Reuse shared components and the authenticated API across public and admin screens.
- **Do:** Keep uploaded media previews consistent with the public card crop.
- **Don't:** Invent company claims, addresses, delivery promises, or legal details not supplied by the owner.
- **Don't:** Hide required actions or product price state behind hover-only interactions.
