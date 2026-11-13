# Anatomy Lens

An installable, offline-first, mobile-first Progressive Web App (PWA) that turns your phone or notebook camera into a simulated **X-ray anatomy lens** for fitness coaches and physiotherapy learners.

> Educational approximation only — not a medical diagnostic tool.

## Key Features
- **100% On-Device Privacy & Offline Ready**: Uses local MediaPipe Pose Landmarker (`pose_landmarker_full.task` with automatic `pose_landmarker_lite.task` FPS fallback) and WASM binaries precached by Workbox. Zero frames, landmarks, or analytics ever leave the device.
- **2.5D X-Ray Focus Circle**: Drag, pinch-to-zoom, scroll-wheel, resize via handle, or double-tap to reset. Inside the circle, switch with one tap between glowing blue-white **Bones** and striated **Muscles** aligned to the person's 10 body segments.
- **136 Anatomical Structures (Single Source of Truth)**: 104 fitness- and physio-relevant superficial/deep muscles and tendons + 32 major bones and bony landmarks in [`src/data/anatomyData.ts`](src/data/anatomyData.ts), with Terminologia Anatomica (Latin), German, and English names plus DE/EN functional descriptions.
- **Coach-Friendly Usability**:
  - **Automatic Front/Back View Detection** with hysteresis and manual override.
  - **True Anatomical Left/Right** (`Left/Right`, `Links/Rechts`, `Sinister/Dexter`) preserved even when the front camera is displayed mirrored.
  - **Freeze Frame** to pause and show the screen to a client without losing alignment.
  - **Tap-to-Pin** & **Overlapping Structure Switcher Chips** to inspect adjacent/deep muscles.
  - **Dev Input Mode** (`?devInput=anterior`, `?devInput=posterior`, `?devInput=upper_body`, `?devInput=motion_loop`, or custom photo/video upload) for testing without a camera.

## Development & Testing

```bash
npm install
npm run dev         # Local dev server
npm run test:unit   # Vitest unit tests (12 tests)
npm run build       # TypeScript check + Vite PWA production build
npm run test:e2e    # Playwright E2E test using still-image Dev Input Mode
```
