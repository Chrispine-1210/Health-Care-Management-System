# Thandizo Pharmacy - Cross-Platform Healthcare Management System

A comprehensive pharmacy management platform for Thandizo Pharmacy in Malawi, available on Web, Android, iOS, and Desktop (Windows/Mac/Linux).

## Features

### Multi-Platform Support
- **Web**: Progressive Web App (PWA) - installable on any device
- **Android**: APK + Play Store - native Android app
- **iOS**: App Store - native iOS app  
- **Desktop**: Electron - Windows, Mac, Linux desktop app

### Core Features
- **Medication Management**: Browse, search, and order medications
- **Prescription Management**: Upload, review, and track prescriptions
- **Multi-Role System**: Admin, Pharmacist, Staff, Customer, Driver
- **Order Management**: Place orders, track deliveries, manage payments
- **Malawi-Specific Mobile Money**: Airtel Money, TNM Mpamba integration
- **Real-Time Tracking**: GPS-enabled delivery tracking
- **Offline Support**: Service worker enables offline functionality
- **Healthcare Dashboard**: Performance metrics and merit badges

## Installation

### Web/PWA
1. Visit `https://thandizo-pharmacy.replit.dev`
2. Click "Install" in browser or share menu
3. App installs on home screen (Android/iOS) or as desktop app (Windows/Mac)

### Desktop (Electron)
```bash
npm run electron-pack
# Creates installers in dist/electron/
# - Windows: NSIS installer
# - Mac: DMG installer
# - Linux: AppImage + deb package
```

### Android (APK)
```bash
npm run electron-build
# Use Electron builder or build APK from web manifest
```

## Development

### Setup
```bash
npm install
npm run dev          # Start web development server
npm run electron-dev # Start Electron development
npm run db:push      # Initialize database
```

### Scripts
- `npm run dev` - Development server (Vite + Express)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run electron` - Build and launch Electron app
- `npm run electron-dev` - Dev with hot reload
- `npm run electron-pack` - Package for distribution
- `npm run db:push` - Database schema push

## Architecture

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn UI
- **Backend**: Express.js, TypeScript, PostgreSQL, Drizzle ORM
- **Mobile**: PWA (Web), Electron (Desktop)
- **Auth**: Replit Auth with OIDC
- **Payments**: Malawi Mobile Money (Airtel, TNM Mpamba), Stripe

### Project Structure
```
├── client/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components by role
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utilities and API client
│   │   └── main.tsx          # React entry point
│   └── public/               # Static assets & manifest
├── server/
│   ├── index.ts              # Express server
│   ├── routes.ts             # API endpoints
│   ├── storage.ts            # Database operations
│   ├── payment-gateway.ts    # Payment processing
│   └── replitAuth.ts         # Authentication
├── shared/
│   └── schema.ts             # Database schema & types
├── electron-main.ts          # Electron main process
├── preload.ts                # Electron preload script
└── vite.config.ts            # Build configuration
```

## Database

### Schema
- Users (multi-role: admin, pharmacist, staff, customer, driver)
- Branches (pharmacy locations)
- Products (medication catalog)
- Stock Batches (inventory with batch numbers)
- Orders & Order Items
- Prescriptions (digital prescription management)
- Deliveries (GPS tracking)
- Appointments (teleconsultations)
- Content (health articles/blog)
- Audit Logs (compliance tracking)

### Migrations
```bash
npm run db:push       # Apply schema changes
npm run db:push --force  # Force apply (careful!)
```

## API Endpoints

### Authentication
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Initiate login
- `POST /api/logout` - Logout

### Products & Inventory
- `GET /api/products` - List all products
- `GET /api/products/featured` - Featured products
- `GET /api/products/categories` - Product categories
- `GET /api/products/:id` - Product details
- `GET /api/admin/inventory` - All stock batches
- `GET /api/inventory/low-stock` - Low stock alerts
- `GET /api/inventory/expiring` - Expiring items

### Orders
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user's orders
- `GET /api/orders/:id` - Order details
- `PATCH /api/orders/:id` - Update order
- `PATCH /api/orders/:id/approve` - Approve order (staff)
- `PATCH /api/orders/:id/reject` - Reject order (staff)

### Prescriptions
- `GET /api/prescriptions/pending` - Pending prescriptions (pharmacist)
- `GET /api/prescriptions/patient/:id` - Patient prescriptions
- `POST /api/prescriptions` - Upload prescription
- `PATCH /api/prescriptions/:id/review` - Review/approve (pharmacist)

### Payments
- `POST /api/payments/process` - Process mobile money payment
- `GET /api/payments/check/:transactionId` - Check payment status
- `GET /api/payments/operators/:phoneNumber` - Supported operators

### Deliveries
- `GET /api/driver/deliveries/active` - Active deliveries (driver)
- `GET /api/deliveries` - All deliveries (admin/staff)
- `PATCH /api/deliveries/:id/status` - Update delivery status
- `POST /api/deliveries` - Create delivery

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/branches` - Branch management
- `GET /api/admin/users` - User management
- `PATCH /api/admin/users/:id/role` - Update user role

## Mobile Money Integration

### Supported Providers
1. **Airtel Money** - +265-1 (first digit after country code)
2. **TNM Mpamba** - +265-6, +265-8, +265-9 (first digits)

### Payment Processing
Phone numbers are automatically validated and normalized:
- Accepts: `+265123456789`, `0123456789`, `123456789`
- Returns: `+265123456789` format

```typescript
// API request
POST /api/payments/process
{
  "orderId": "order-123",
  "method": "airtel_money",  // or "tnm_mpamba"
  "phoneNumber": "0961234567"
}

// Response
{
  "success": true,
  "transactionId": "AT_1234567890_abc123",
  "message": "Payment initiated",
  "status": "pending"
}
```

## Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
PAYMENT_API_KEY=your-payment-gateway-key
VITE_STRIPE_PUBLIC_KEY=pk_...
```

## Deployment

### Web
```bash
npm run build
npm run start
# App runs on http://localhost:3000
```

### Desktop Distribution
- Windows: NSIS installer
- Mac: DMG file
- Linux: AppImage + deb packages

See `electron-builder.yml` for configuration.

## Performance & Optimization

- Service Worker for offline support
- Image optimization
- Code splitting
- Lazy loading for pages
- Database query optimization
- Caching strategies (network-first for API, cache-first for assets)

## Security

- HTTPS/TLS encryption
- Replit Auth (OIDC)
- Role-based access control
- Audit logging for compliance
- Phone number validation
- Secure session management

## Compliance

- PMRA/MRA pharmaceutical regulations
- Complete audit trails
- Prescription validation
- Drug interaction checks (AI-powered)
- Data privacy

## Support

For issues or feature requests, contact development team or submit via app.

## License

MIT License - See LICENSE file
