# Thandizo Pharmacy System - Design Guidelines

## Design Approach

**Design System**: Material Design 3 principles with healthcare-optimized adaptations
**Rationale**: Medical/pharmacy systems require trust, clarity, and efficient information processing. Material Design provides proven patterns for complex data interfaces while maintaining accessibility and professional appearance suitable for healthcare contexts in Malawi.

## Core Design Principles

1. **Trust & Professionalism**: Clean, medical-grade interface that instills confidence
2. **Information Clarity**: Dense data presented with clear hierarchy and scanability
3. **Role-Specific Optimization**: Tailored layouts for Admin/Pharmacist/Customer/Driver workflows
4. **Offline-Resilient**: Visual indicators for sync status and offline mode
5. **Bandwidth Consideration**: Efficient layouts suitable for varying connectivity in Malawi

## Typography System

**Font Family**: 
- Primary: Inter (via Google Fonts CDN) - excellent readability for data-dense interfaces
- Fallback: system-ui, -apple-system, sans-serif

**Type Scale**:
- Hero/Page Titles: text-4xl (36px), font-bold
- Section Headings: text-2xl (24px), font-semibold
- Card/Component Titles: text-lg (18px), font-semibold
- Body Text: text-base (16px), font-normal
- Supporting/Meta Text: text-sm (14px), font-normal
- Dense Data Tables: text-sm (14px), font-medium
- Labels/Input Text: text-sm (14px), font-medium
- Critical Alerts/Warnings: text-base (16px), font-semibold

## Layout System

**Spacing Scale**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4, p-6
- Section spacing: gap-6, gap-8
- Card margins: m-4, m-6
- Form field spacing: space-y-4
- Table cell padding: p-2, p-3
- Button padding: px-6 py-3 (primary), px-4 py-2 (secondary)

**Grid System**:
- Admin Dashboard: 12-column grid with sidebar (w-64 fixed sidebar, remaining flex-1 content)
- Data Tables: Full-width with horizontal scroll on mobile
- Forms: Single column mobile, 2-column desktop (md:grid-cols-2)
- Product Grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
- Cards: Consistent max-w-7xl container with responsive padding

**Container Widths**:
- Main content: max-w-7xl mx-auto px-4
- Forms: max-w-2xl
- Reading content: max-w-4xl
- Full-width tables/dashboards: w-full

## Component Library

### Navigation Components

**Admin/Pharmacist Sidebar**:
- Fixed left sidebar (w-64) with collapsible mobile drawer
- Hierarchical menu with icon + label
- Active state with subtle background indicator
- Role badge at top showing user role and branch
- Sync status indicator at bottom

**Customer Top Navigation**:
- Sticky header with logo, search, cart icon, user menu
- Breadcrumb navigation for multi-step processes
- Mobile: Hamburger menu with full-screen overlay

**Driver App Navigation**:
- Bottom tab bar (fixed) with 4 tabs: Deliveries, Active, History, Profile
- Large tap targets (min h-16) for use while driving

### Data Display Components

**Inventory Tables**:
- Sticky header row with sortable columns
- Batch number, expiry date, quantity in clearly labeled columns
- Color-coded expiry warnings (visual indicators only, not color-dependent)
- Inline actions (Edit, Transfer, View)
- Pagination with items-per-page selector
- Search and filter bar above table

**Product Cards**:
- Image placeholder (aspect-ratio-square) with prescription badge overlay if required
- Product name (text-lg font-semibold, 2-line clamp)
- Generic name (text-sm)
- Stock indicator with quantity
- Price (text-xl font-bold)
- Quick add to cart button

**Dashboard Cards**:
- Elevated cards with rounded-lg borders
- Icon + metric number (text-3xl font-bold) + label (text-sm)
- Trend indicator (arrow + percentage) beneath
- Compact spacing (p-6) for dense dashboard layouts

### Form Components

**Prescription Upload Form**:
- Large drag-and-drop zone with file preview
- Patient info fields (2-column on desktop)
- Medical history checkboxes with clear labels
- Submit button prominent (w-full md:w-auto)
- Progress indicator for multi-step submission

**POS Interface**:
- Split screen: Product search + selection (60%) | Cart + total (40%)
- Large product search with autocomplete dropdown
- Cart items list with quantity adjusters
- Prominent total display (text-4xl font-bold)
- Payment method selector with large buttons
- Print receipt and complete sale CTAs

**Stock Receiving Form**:
- Barcode scanner input (large text-2xl input field)
- Batch information grid (2-column: batch no, expiry, qty, cost)
- Add batch button with inline validation
- Summary table of received items
- Submit for approval workflow

### Action Components

**Buttons**:
- Primary: Large (px-8 py-4), rounded-md, font-semibold
- Secondary: Outlined variant with same sizing
- Danger/Warning: Use for critical actions (reject prescription, delete batch)
- Icon buttons: Square (w-10 h-10) with centered icon for table actions
- Floating Action Button (FAB): For primary action on mobile (fixed bottom-right)

**Pharmacist Review Interface**:
- Prescription image viewer (full height, zoomable)
- Review form in side panel (w-1/3)
- Drug interaction warnings in prominent alert box
- Approve/Reject buttons (equal prominence, distinct styling)
- Comments textarea (min-h-32)

### Notification & Status Components

**Delivery Tracking**:
- Stepper/timeline component showing order → assigned → in transit → delivered
- Driver info card with photo, name, phone, vehicle
- Live map embed (if available) or static map with route
- ETA countdown (text-2xl font-bold)
- Proof of delivery image upload

**Stock Alerts**:
- Alert banners at top of inventory pages
- Grouped by severity: Critical (expiring <7 days), Warning (expiring <30 days), Low stock
- Dismissible with action buttons (Reorder, Transfer, Extend)

**System Sync Indicator**:
- Fixed bottom banner showing last sync time
- "Offline Mode" badge with queue count
- Manual sync trigger button

### Content & Media Components

**Blog/Health Articles**:
- Hero image (aspect-ratio-video, max-h-96)
- Article title (text-4xl font-bold, max-w-4xl)
- Author info with avatar and publication date
- Rich text content with proper spacing (prose class equivalent)
- Related articles grid at bottom (3-column)

**License/Certificate Display**:
- Document viewer with zoom controls
- Metadata sidebar: issue date, expiry, authority
- Download and share buttons
- Expiry countdown for active monitoring

## Role-Specific Layout Patterns

**Admin Portal**:
- Dense multi-panel dashboard with 6-8 metric cards
- Full-width data tables with advanced filters
- Multi-tab interfaces for complex management (Users, Branches, Products)
- Audit log viewer with timeline and search

**Pharmacist Workspace**:
- Queue-based workflow (pending prescriptions list)
- Split-screen review interface
- Quick access to drug database and interaction checker
- Minimal distractions, focus on current task

**Customer Portal**:
- Clean e-commerce style with generous whitespace
- Large product imagery and clear CTAs
- Simplified checkout flow (3 steps max)
- Order history with reorder shortcuts

**Driver App**:
- Map-first interface showing delivery locations
- Large buttons suitable for gloved hands
- Minimal text, maximum clarity
- Offline-capable with clear queue indicators

## Images

**Product Images**: Square thumbnails (200x200px) for listings, larger hero (600x600px) for detail pages. Use placeholder boxes with medicine bottle/pill icons if actual images unavailable.

**Hero Section (Customer Portal)**: Full-width hero (h-96) featuring pharmacy storefront or pharmacist with patient consultation. Overlay with primary CTA "Order Your Medicines" with backdrop-blur effect.

**Blog Articles**: Landscape images (16:9 aspect ratio, max 1200px wide) showing health topics - avoid stock photos, prefer authentic healthcare scenarios relevant to Malawi.

**No hero images needed**: Admin, Pharmacist, and Driver interfaces - these are functional dashboards prioritizing data density over visual marketing.

## Responsive Breakpoints

- Mobile: Base (< 768px) - Stack all multi-column layouts, full-width tables with horizontal scroll
- Tablet: md (768px) - 2-column forms, sidebar becomes drawer
- Desktop: lg (1024px) - Full multi-column layouts, persistent sidebar
- Wide: xl (1280px) - Optimized dashboard layouts with more visible data

## Accessibility & Safety

- Minimum touch target: 44x44px (critical for POS and driver interfaces)
- High contrast text ratios throughout (WCAG AA minimum)
- Clear focus indicators on all interactive elements
- Consistent icon usage paired with text labels
- Loading states for all async operations
- Error messages with clear resolution steps
- Confirmation dialogs for destructive actions (delete, reject prescription)