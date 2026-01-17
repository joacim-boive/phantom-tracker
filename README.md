# Phantom Tracker

A modern web application for tracking phantom pain patterns and discovering correlations with weather, lunar cycles, and environmental factors.

## Features

### Pain Tracking
- **Interactive 3D Foot Model**: Select pain locations by tapping/clicking on a 3D foot model
- **Pain Level Slider**: Rate pain intensity from 1-10 with visual feedback
- **Quick Add**: One-tap duplicate entry with fresh environmental data
- **Entry Management**: Edit and delete pain entries

### Environmental Data Collection
- **Weather**: Temperature, pressure, humidity, wind, clouds, air quality (OpenWeatherMap)
- **Lunar**: Moon phase, illumination, distance from Earth
- **Geomagnetic**: Kp index, storm level (NOAA Space Weather)
- **Solar**: X-ray flux class, flare probability (NOAA)
- **Tidal**: Current height, high/low predictions (NOAA CO-OPS)
- **Temporal**: Day length, sunrise/sunset, days since solstice

### Dashboard & Visualizations
- **Pain Timeline**: Area chart showing pain over 7/30/90 days
- **Pressure Correlation**: Scatter plot of barometric pressure vs pain
- **Lunar Phase Chart**: Radial chart showing pain by moon phase
- **Calendar Heatmap**: GitHub-style activity grid
- **Correlation Insights**: Auto-generated pattern detection
- **Current Conditions**: Live environmental data display

### Mobile-First Design
- Responsive layout optimized for mobile
- Touch-friendly controls with haptic feedback
- Floating action button for quick entries
- Glass-morphism dark theme

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui (Radix primitives)
- **3D Rendering**: React Three Fiber + Drei
- **Database**: Supabase (PostgreSQL)
- **Styling**: TailwindCSS 4
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **i18n**: next-intl

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/phantom-tracker.git
cd phantom-tracker

# Install dependencies
pnpm install

# Copy environment variables
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start development server
pnpm dev
```

### Environment Variables

```env
# Supabase (optional - app works without for local testing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenWeatherMap (free tier: 1000 calls/day)
OPENWEATHERMAP_API_KEY=your_api_key

# NOAA Tide Station (optional)
NOAA_TIDE_STATION_ID=9414290
```

### Database Setup

Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to set up the database schema.

## Development

```bash
# Start dev server
pnpm dev

# Type checking
pnpm tc

# Linting
pnpm lint

# Build for production
pnpm build
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/entries` | GET | List all pain entries |
| `/api/entries` | POST | Create new pain entry |
| `/api/entries/[id]` | GET | Get single entry |
| `/api/entries/[id]` | PATCH | Update entry |
| `/api/entries/[id]` | DELETE | Delete entry |
| `/api/environmental` | POST | Fetch environmental data |

## Future Enhancements

- [ ] Clerk authentication
- [ ] Prediction engine with ML
- [ ] Push notifications
- [ ] Data export (CSV/JSON)
- [ ] PWA offline support
- [ ] Multi-limb support
- [ ] Community insights

## License

MIT
