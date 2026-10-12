# UX Contract

## Product context

- Audience: Azerbaijani B2B and B2C sanitary-supply shoppers and authenticated administrators.
- Primary jobs: discover products, request prices with optional attachments, contact the company, and manage catalogue/site data.
- Locale: `az-AZ`; timezone: `Asia/Baku`; currency: AZN.
- Accessibility target: WCAG 2.2 AA.

## Runtime ownership

| Capability | Canonical owner | Persistence |
|---|---|---|
| Public catalogue | PHP API + MySQL | catalogue tables |
| Cart | `storage.js` | customer browser only |
| Quote/contact submission | PHP API | MySQL + protected attachments |
| Admin authentication | PHP session | secure HttpOnly cookie |
| Site content, logo, contact and footer data | Admin settings API | settings/link/media tables |
| Toast/dialog/forms | `ui.js` + shared CSS | runtime UI |

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native `select` + field styles | `assets/css/styles.css` | public filter, admin status | keyboard/browser |
| Scrollbar | Global CSS scrollbar tokens | `assets/css/styles.css` | page and table overflow | computed/browser |
| Form | Shared field/form styles + page controllers | `pages.js`, `admin.js` | quote, contact, login, CRUD | validation/browser |
| Toast | `ui.js#toast` | `assets/js/ui.js` | success, info, error | live region/browser |
| Dialog | `ui.js#openModal` | `assets/js/ui.js` | edit, archive confirmation | focus/Escape/browser |
| CRUD | Authenticated admin API | `api/index.php` | product, category, brand, user, quote, contact | API/browser |
| File upload | API upload helpers + image editor | `bootstrap.php`, `admin.js` | public image, private attachment | type/size/browser |

## Navigation and data behavior

- Public search/filter state uses query parameters; cart state stays local until quote submission.
- Legacy cart product slugs are reconciled to current database product IDs on catalogue load; missing products are removed without breaking the cart page.
- Saving site content writes directly to database settings. New frontend requests read the new values immediately, and public tabs open in the same browser refresh through the cross-tab content-update signal.
- Product brand is optional. Removing a brand retains its products as brendless records.
- Admin CRUD stays in the owning list after success and refreshes from the server.
- Admin request tables are server-paginated in batches of 20.
- Loading, empty, no-results, validation, authentication, authorization, conflict, and server-error states are distinct.

## Flow ledger

| Operation | Pending | Success | Failure recovery |
|---|---|---|---|
| Admin login | disabled busy button | dashboard | inline error; preserve username |
| Create/edit entity | stable modal action | stay + toast | preserve modal and image preview |
| Archive entity | warning dialog | stay + toast | conflict/error toast; no data loss |
| Permanently delete quote/contact | danger dialog with Cancel focused | stay + toast; refresh list/stats | keep dialog open; retry or cancel |
| Quote/contact | disabled busy button | confirmation/toast | inline/API error; preserve inputs |
| Image edit/upload | local preview | media attached | type/size error; preserve form |
| Session expiry | app-owned 401 state | login screen | re-authenticate |

## Files and media

- Entity images: JPG/JPEG, PNG, WEBP; maximum 8 MB; minimum 120×120.
- Admin editor: cover crop, zoom, rotation, and 4:3 public-card preview.
- Customer attachments: JPG/JPEG, PNG, WEBP, PDF, DOC, DOCX, XLS, XLSX; maximum 12 MB.
- Public media lives under the public upload directory; customer attachments live outside the web root.

## Security and feedback

- Mutations require CSRF; admin endpoints require session and role checks.
- Passwords are hashed; repeated failed logins create a temporary lockout.
- No native `alert`, `confirm`, or `prompt`; owned modal/toast primitives are canonical.
- Product, category, and brand removal uses soft archive. A referenced category cannot be archived.
- Quote requests and contact messages use permanent deletion after an explicit danger confirmation. Related database rows cascade, private attachments are removed from protected storage, the operation is audited, and no Undo is offered.
- Server messages never expose secrets, SQL, or filesystem paths.

## Verification

- Strict premium UI audit, JavaScript syntax checks, and remote PHP/runtime health checks.
- Desktop/mobile checks for catalogue, quote/contact upload, admin login, CRUD, settings, and session expiry.
- Keyboard focus, modal Escape/focus restoration, labels, live-region feedback, and visible error states.
