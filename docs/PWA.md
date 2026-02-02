# Progressive Web App (PWA) Features

This application is a fully installable Progressive Web App optimized for tablet devices.

## Features

### 📱 Installation

The app can be installed on tablets and mobile devices as a native-like application:

- **Android/Chrome**: Tap "Add to Home Screen" from the browser menu
- **iOS/Safari**: Tap the Share button and select "Add to Home Screen"
- **Desktop**: Look for the install icon in the address bar

### 🎨 App Identity

- **Name**: TreadTrack - Treadmill Training Program
- **Short Name**: TreadTrack
- **Theme Color**: Cyan (#0ea5e9)
- **Background Color**: Dark Navy (#0f172a)
- **Orientation**: Landscape (optimized for tablets in group session view)

### 📲 Icons

The app includes high-quality icons in multiple sizes:

- 192x192px
- 256x256px
- 384x384px
- 512x512px
- Apple Touch Icon (180x180px)

All icons feature a modern treadmill design with cyan gradient on dark background.

### 🚀 Quick Access Shortcuts

When installed, the app provides quick access shortcuts:

1. **Athletes** - View and manage athletes
2. **Group Session** - Start a group training session
3. **Programs** - View training programs

### ⚡ Offline Support

The service worker provides:

- Aggressive caching of navigation and assets
- Offline functionality for previously visited pages
- Automatic updates when online
- Fast load times after first visit

### 🔄 Updates

The app automatically updates when:

- A new version is deployed
- User returns online after being offline
- Service worker detects changes

## Technical Details

### Configuration

PWA features are configured in:

- `public/manifest.json` - Web app manifest
- `src/app/layout.tsx` - Meta tags and viewport settings
- `next.config.ts` - Service worker configuration

### Service Worker

The service worker is generated automatically during production builds using `@ducanh2912/next-pwa`.

**Development Mode**: Service worker is disabled for easier debugging

**Production Mode**: Service worker is enabled with:

- Front-end navigation caching
- Aggressive caching strategies
- Automatic reloading when online
- Workbox for cache management

### Testing PWA Features

#### Local Testing

1. Build the production version:

```bash
npm run build
npm start
```

2. Open in browser (must use HTTPS or localhost)
3. Check for install prompt
4. Test installation and offline mode

#### Production Testing

1. Deploy to production (Vercel automatically serves over HTTPS)
2. Visit the deployed URL on a tablet
3. Look for the "Add to Home Screen" prompt
4. Install and test as native app

### Lighthouse PWA Audit

Run Lighthouse audit to verify PWA compliance:

```bash
# In Chrome DevTools
1. Open DevTools (F12)
2. Go to Lighthouse tab
3. Select "Progressive Web App"
4. Click "Generate report"
```

Expected scores:

- ✅ Fast and reliable
- ✅ Installable
- ✅ PWA optimized
- ✅ Accessible

## Tablet Optimization

### Landscape Mode

The manifest is configured for landscape orientation, ideal for:

- Group training sessions (6 athletes simultaneously)
- Workout tracking with multiple metrics
- Dashboard overview

### Touch Targets

All interactive elements meet minimum touch target sizes:

- Buttons: 44x44px minimum
- Form inputs: Appropriately sized
- Navigation: Easy to tap

### Viewport

Configured for tablets:

```typescript
width: 'device-width'
initialScale: 1
maximumScale: 1
userScalable: false
```

This prevents unwanted zooming during touch interactions.

## Browser Support

### Full PWA Support

- ✅ Chrome/Edge (Android, Desktop)
- ✅ Safari (iOS 16.4+, macOS)
- ✅ Firefox (Android, Desktop)
- ✅ Samsung Internet

### Limited Support

- ⚠️ iOS Safari (pre-16.4): No service worker support
- ⚠️ Firefox iOS: Uses Safari engine, same limitations

## Best Practices

### For Users

1. **Install the app** for the best experience
2. **Keep the app updated** by reopening when prompted
3. **Use in landscape mode** for group sessions
4. **Pre-load data** while online for offline access

### For Developers

1. **Test on real devices** - PWA features behave differently than desktop browsers
2. **Check service worker registration** in DevTools
3. **Verify offline functionality** by toggling network in DevTools
4. **Clear cache** when testing updates: DevTools > Application > Clear storage
5. **Monitor bundle size** - PWA should load fast on slower networks

## Troubleshooting

### App Won't Install

- Verify HTTPS is enabled (required for PWA)
- Check that manifest.json is accessible
- Ensure all required manifest fields are present
- Clear browser cache and try again

### Service Worker Not Updating

- Close all app instances
- Clear service worker in DevTools: Application > Service Workers > Unregister
- Reload page
- Wait for new service worker to activate

### Offline Mode Not Working

- Verify production build (service worker disabled in dev)
- Check service worker is registered: DevTools > Application > Service Workers
- Ensure pages were visited while online (cached)
- Check browser console for service worker errors

### Icons Not Showing

- Verify icon files exist in public folder
- Check manifest.json references correct paths
- Clear browser cache
- Try reinstalling the app

## Future Enhancements

Potential PWA improvements:

- [ ] Push notifications for session reminders
- [ ] Background sync for offline data submission
- [ ] Share target for importing athlete data
- [ ] Periodic background sync for updates
- [ ] Advanced caching strategies per route
- [ ] Offline data persistence with IndexedDB

## Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Next.js PWA Documentation](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/)
- [@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa)

---

_Last updated: February 2026_
