# Diamond Currency E-Commerce Store

A premium e-commerce application featuring Apple liquid glass UI aesthetic, real-time WebSocket updates, and comprehensive admin controls.

## Project Overview

**Status**: ✅ Fully functional and tested  
**Last Updated**: November 7, 2025

### Core Features
- **Authentication**: Replit Auth (OIDC) integration with PostgreSQL user storage
- **Diamond Currency System**: Virtual currency for purchases with real-time balance updates
- **Real-time Updates**: WebSocket server for live balance and order status notifications
- **Admin Dashboard**: Complete user/diamond/order management interface
- **Apple Liquid Glass UI**: Frosted glass morphism, SF Pro typography, smooth animations

## Architecture

### Frontend
- **Framework**: React + Wouter (routing) + TanStack Query (data fetching)
- **UI**: Shadcn + Tailwind CSS with custom glass morphism styling
- **Design**: Apple-inspired liquid glass aesthetic with backdrop-blur effects
- **Real-time**: WebSocket client for balance/order updates

### Backend
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL via Neon (Drizzle ORM)
- **Auth**: Replit Auth middleware with session management
- **WebSocket**: Manual upgrade handling to bypass Express middleware
- **Validation**: Zod schemas on all mutating endpoints

## Technical Implementation

### Database Schema
```typescript
users {
  id: varchar (UUID)
  email: text
  firstName: text
  lastName: text  
  profileImageUrl: text
  isAdmin: boolean (default: false)
  diamondBalance: integer (default: 0)
}

products {
  id: varchar (UUID)
  name: text
  description: text
  price: integer
  imageUrl: text
}

orders {
  id: varchar (UUID)
  userId: varchar (FK -> users)
  productId: varchar (FK -> products)
  status: "pending" | "completed"
  createdAt: timestamp
  completedAt: timestamp (nullable)
}
```

### API Endpoints

**Public:**
- `GET /api/products` - List all products

**Authenticated:**
- `GET /api/auth/user` - Get current user
- `POST /api/purchase` - Create order & deduct diamonds (validates: productId)
- `GET /api/orders` - Get user's orders

**Admin Only:**
- `GET /api/admin/users` - List all users
- `POST /api/admin/adjust-diamonds` - Adjust user diamonds (validates: userId, amount)
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/orders` - List all orders
- `POST /api/admin/orders/:id/complete` - Mark order completed

### WebSocket
- **Path**: `/ws` (noServer: true with manual upgrade handling)
- **Messages**: 
  - Client → Server: `{type: "register", userId: string}`
  - Server → Client: `{type: "balance_update", userId, newBalance}`
  - Server → Client: `{type: "order_update", orderId, status}`

## Key Implementation Details

### Request Validation
All POST/PATCH/DELETE endpoints use Zod schemas for validation:
- `purchaseSchema`: validates productId (string, min 1 char)
- `adjustDiamondsSchema`: validates userId (string) and amount (integer)

### WebSocket Setup
WebSocket server is initialized AFTER Vite setup to prevent Express middleware from intercepting upgrade requests. Uses `server.on('upgrade')` for manual WebSocket handshake.

### Error Handling
React ErrorBoundary wraps entire app to prevent blank pages on errors. All API errors show user-friendly toast notifications.

### Component Hierarchy
```
App (ErrorBoundary + QueryClientProvider)
└── AppContent (useAuth hook)
    ├── Landing Page (public, no auth)
    └── Authenticated Routes
        ├── Sidebar + Header
        └── Router
            ├── Store (product catalog + purchase)
            ├── Orders (order history + tracking)
            ├── Admin/Users (user management + diamond adjustment)
            └── Admin/Orders (order management + completion)
```

## Design System

### Colors
Defined in `client/src/index.css` with full dark mode support:
- Primary: Blue gradient accents
- Background: Light/dark adaptive with glass morphism
- Borders: Subtle elevation with transparency
- Text: 3-level hierarchy (default, secondary, tertiary)

### Typography
- Headings: SF Pro Display (bold, tracking-tight)
- Body: SF Pro Text
- Sizes: Consistent scale from text-sm to text-6xl

### Glass Morphism
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.18);
}
```

### Interactions
- `hover-elevate`: Subtle background elevation on hover
- `active-elevate-2`: More dramatic elevation on press
- Smooth animations: 300ms ease-in-out transitions

## UI/UX Features

### Diamond Adjustment (Admin)
- **Increment/Decrement**: ± buttons adjust by 100 diamonds each click
- **Manual Input**: Direct numeric entry supported
- **Apply Button**: Sends adjustment delta to backend
- **Real-time Sync**: WebSocket updates balance immediately after apply

### Purchase Flow
1. Browse products in Store
2. Click "Purchase" → Modal opens with product details
3. Confirm purchase → Deducts diamonds, creates order
4. WebSocket broadcasts new balance
5. Navigate to Orders to track delivery status

### Order Management (Admin)
1. View all pending orders
2. Click "Mark as Completed" → Updates order status
3. WebSocket notifies user of completion
4. Completion timestamp recorded

## Testing & Verification

**End-to-End Test Results**:
- ✅ Landing page renders without errors
- ✅ Authentication flow works (Replit Auth)
- ✅ WebSocket connection succeeds (no 400 errors)
- ✅ Purchase flow completes successfully
- ✅ Diamond balance updates in real-time
- ✅ Orders display with correct status
- ✅ Admin can adjust user diamonds
- ✅ Admin can complete orders
- ✅ Validation rejects malformed requests
- ✅ Error boundary prevents app crashes

## Development Notes

### Important Decisions
1. **Diamond Increment**: ± buttons add/subtract 100 diamonds (not 1) for faster bulk adjustments
2. **WebSocket Path**: Uses `/ws` to avoid conflicts with Vite HMR
3. **QueryClient Placement**: Must wrap entire app before useAuth can be called
4. **NoServer WebSocket**: Prevents Express middleware from interfering with handshake

### Future Enhancements (User to Add)
- Text-to-speech announcements ("Your item will arrive soon")
- Sound effects for purchases and order completion
- Audio files will be added by user later

## Running the Project

```bash
npm run dev  # Starts Express server + Vite dev server on port 5000
```

Access: `http://localhost:5000`

## Security

- All admin routes protected by `isAdmin` middleware
- All authenticated routes require valid Replit Auth session
- Request body validation on all mutating endpoints
- No mock data in production paths
- Secrets managed via environment variables

## Project Structure

```
client/
  src/
    pages/           # Route components
    components/      # Reusable UI components
    hooks/           # Custom hooks (useAuth, useWebSocket)
    lib/             # Utilities (queryClient, authUtils)
    index.css        # Global styles + design tokens

server/
  routes.ts          # API endpoint definitions
  storage.ts         # Database interface (DatabaseStorage)
  websocket.ts       # WebSocket server setup
  replitAuth.ts      # Replit Auth middleware
  db.ts              # Drizzle connection

shared/
  schema.ts          # Drizzle schemas + TypeScript types
  validation.ts      # Zod validation schemas
```

## Credits

Built with Replit Agent using:
- React + TypeScript
- Shadcn UI + Tailwind CSS
- Express + PostgreSQL
- Drizzle ORM
- WebSockets
- Replit Auth
