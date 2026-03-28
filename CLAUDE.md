# Snídaně — Czech Breakfast Planner

## Project overview
Expo (React Native) mobile app for iPhone. Weekly Czech breakfast planner with
Tinder-style swipe approval and Rohlik.cz shopping integration.
All UI text and content is in Czech.

## Tech stack
- Expo SDK 55 with expo-router (file-based routing in `app/`)
- TypeScript (strict mode)
- rn-swiper-list for card swiping (depends on react-native-reanimated + gesture-handler)
- AsyncStorage for local persistence
- date-fns for date logic
- Rohlik.cz integration via deep links (future: @tomaspavlin/rohlik-mcp)

## Project structure
- `app/`              — Routes (expo-router file-based)
- `src/components/`   — Reusable UI components
- `src/data/`         — Static breakfast data and holiday logic
- `src/hooks/`        — React hooks (useWeekPlan, useShoppingList)
- `src/lib/`          — Business logic (planGenerator, storage, rohlik)
- `src/types/`        — TypeScript type definitions
- `src/theme/`        — Colors, spacing, typography constants

## Key commands
- `npx expo start`          — Start dev server
- `npx expo start --ios`    — Start with iOS simulator
- `npx expo install <pkg>`  — Install Expo-compatible package version
- `npm run lint`             — Run linter

## Conventions
- All user-facing strings are in Czech, hardcoded (no i18n library)
- Component files use PascalCase, other files use camelCase
- Each component in its own file, default export
- Hooks return objects, not arrays
- Business logic in `src/lib/`, not in components
- Keep components under 150 lines; extract sub-components if longer
- Import from `src/` using `@/` alias (e.g. `import { colors } from '@/theme'`)

## Data
- Breakfast recipes: `src/data/breakfasts.ts` — typed array of Breakfast objects
- Czech holidays: `src/data/holidays.ts` — fixed holidays + Easter computation
- Adding a new breakfast: add to the array with all Ingredient fields + rohlikQuery

## State management
- AsyncStorage via `src/lib/storage.ts` wrapper
- `useWeekPlan` hook manages the current week's plan
- No Redux/Zustand — just hooks + AsyncStorage

## Design
- Warm & cozy palette: cream (#FFF8F0), orange (#FF9F43), soft shadows
- Green (#2ED573) = approved, Orange (#FFA502) = pending
- Rounded cards (16px radius), playful emoji-heavy
- Mobile-only, portrait orientation
