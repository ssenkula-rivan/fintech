# GMG Uganda - Assets Structure

Organized asset structure for cross-platform compatibility (Web, PWA, Mobile).

## Directory Structure

```
assets/
├── images/
│   ├── photos/          → User photos, product images
│   ├── illustrations/   → UI illustrations, empty states, onboarding
│   ├── backgrounds/     → Background patterns, gradients, textures
│   ├── splash/          → Splash screen images (multiple resolutions)
│   └── screenshots/     → App store screenshots, PWA manifest
├── icons/
│   ├── app/             → App icons (all sizes for PWA/mobile)
│   ├── ui/              → UI icons (navigation, actions, status)
│   ├── payment/         → Payment method logos (MTN, Airtel, Visa)
│   └── social/          → Social media icons (share, login)
├── fonts/               → Custom fonts (WOFF2, WOFF, TTF)
├── audio/               → Notification sounds, alerts, feedback
├── videos/              → Tutorials, splash animations, demos
├── css/                 → Stylesheets
└── js/                  → JavaScript files
    ├── gmg-api-client.js    → API client for backend
    └── production-app.js    → Main application logic
```

## Icon Sizes Required

### App Icons (PWA/Mobile)
- 72x72   → Android legacy
- 96x96   → Android legacy
- 128x128 → Chrome Web Store
- 144x144 → Android
- 152x152 → iOS
- 192x192 → Android/PWA (required)
- 384x384 → Android
- 512x512 → PWA (required)

### Splash Screens
- 640x1136   → iPhone 5
- 750x1334   → iPhone 6/7/8
- 1125x2436  → iPhone X/11 Pro
- 1242x2688  → iPhone 11 Pro Max
- 1536x2048  → iPad

## Naming Conventions

- Use lowercase with hyphens: `icon-home.svg`
- Include size in filename: `icon-192.png`
- Use descriptive names: `bg-gradient-purple.png`
