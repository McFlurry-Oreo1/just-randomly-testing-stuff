# Design Guidelines: Diamond Currency Store

## Design Approach
**Reference-Based: Apple Ecosystem** - Drawing from Apple's liquid glass aesthetic, SF typography, and premium interaction patterns while creating a unique diamond-themed currency system.

## Core Design Principles

### 1. Apple Liquid Glass Aesthetic
- **Frosted glass effects** throughout the interface using backdrop-blur
- **Translucent layers** with subtle transparency (80-95% opacity)
- **Soft shadows** and depth to create floating card effects
- **Smooth gradients** with subtle color shifts
- **Rounded corners** consistently (12-16px for cards, 8-10px for buttons)

### 2. Typography
- **Primary Font**: SF Pro Display (via system fonts: -apple-system, BlinkMacSystemFont)
- **Hierarchy**: 
  - Hero/Display: 48-64px, weight 600-700
  - Section Headers: 32-40px, weight 600
  - Product Titles: 20-24px, weight 500
  - Body Text: 16px, weight 400
  - Labels/Meta: 14px, weight 400

### 3. Layout System
- **Spacing Units**: Tailwind spacing of 2, 4, 6, 8, 12, 16, 24 (consistent rhythm)
- **Container**: max-w-7xl for main content areas
- **Grid**: Product catalog uses responsive grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- **Cards**: Generous padding (p-6 to p-8) with glass morphism effects

## Component Specifications

### Diamond Currency System
- **Diamond Icon**: Use Heroicons' gem/sparkles icon with custom styling
- **Balance Display**: Large, prominent in header with animated counter
- **Visual Treatment**: Shimmering effect on diamond icons, gradient overlays
- **Format**: "💎 1,500 Diamonds" with comma separators

### Product Cards (Starting with Chair - 500 Diamonds)
- Frosted glass background with backdrop-blur-xl
- Product image at top (aspect-ratio 4:3)
- Product name in bold (text-xl font-semibold)
- Diamond price prominently displayed with icon
- "Purchase" button with Apple-style pill shape
- Hover state: subtle lift (translate-y-1) and enhanced glow

### Purchase Flow Animation
- **Trigger**: Apple-style scale animation on button press (scale-95)
- **Confirmation Modal**: Slides up from bottom with spring animation
- **Success State**: 
  - Checkmark icon with scale-in animation
  - Confetti/sparkle particle effects around diamond icon
  - "Your item will arrive soon" message in elegant typography
  - Auto-dismiss after 3 seconds with fade-out

### Order Tracking Display
- Real-time status indicator with pulsing dot animation
- Progress bar showing delivery stages
- "Please check your hatch for your item" appears on completion with slide-in animation

### Admin Dashboard Layout
- **Sidebar Navigation**: Fixed left sidebar (w-64) with glass effect
  - User Management
  - Diamond Management
  - Order Control
  - Analytics (optional)
- **Main Content Area**: Full-width with sections for:
  - User table with search/filter
  - Add/Delete user controls
  - Diamond adjustment interface (+/- buttons)
  - Pending orders with "Mark Completed" button
  - Order history

### Navigation
- **User Navigation**: Fixed top header with frosted glass
  - Logo/Brand (left)
  - Diamond balance (center or right)
  - User profile dropdown (right)
- **Admin Navigation**: Sidebar with icon + label pattern

## Animations & Interactions

### Purchase Animations (Apple-Style)
1. Button press: Quick scale-down (scale-95) with haptic feel
2. Modal entrance: Slide-up with ease-out timing (duration-300)
3. Success checkmark: Scale from 0 to 1 with bounce
4. Diamond deduction: Count-down animation with blur effect
5. Confirmation dismiss: Fade + slide-down

### Live Updates (WebSocket)
- Toast notifications for balance changes (slide-in from top-right)
- Real-time order status updates with color-coded badges
- Smooth transitions between delivery states

### Sound Effects Integration Points
- Purchase button click (Apple Pay chime placeholder)
- Transaction success (confirmation sound placeholder)
- Order completion (delivery notification placeholder)
- Admin actions (subtle UI feedback sounds placeholder)

## Admin Dashboard Specific

### User Management Panel
- Table layout with frosted glass rows
- Actions: "Add Diamonds" button (green glass), "Delete User" (red glass)
- Inline editing for diamond amounts
- Real-time user activity indicators

### Order Management
- Card-based layout for pending deliveries
- "Mark Completed" button with confirmation dialog
- Status badges: Pending (yellow), In Transit (blue), Completed (green)
- Order details expandable with smooth accordion animation

## Images
**No hero image required** - This is a functional application focused on the store interface and admin dashboard. Use diamond-themed iconography and product images instead.

**Product Images**: Clean, white background product photos (starting with chair) with 1:1 aspect ratio for consistency

## Accessibility
- Focus states with visible outlines (2px, offset)
- ARIA labels for all interactive elements
- Keyboard navigation throughout admin panel
- Screen reader announcements for live updates

## WebSocket Integration
- Connection status indicator (small pulsing dot in header)
- Reconnection handling with user notification
- Optimistic UI updates with rollback on failure

This design creates a premium, Apple-inspired shopping experience with unique diamond currency mechanics and powerful admin controls, all wrapped in the signature liquid glass aesthetic.