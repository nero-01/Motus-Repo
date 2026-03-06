# Start MotusTots (Expo) – QR code on phone

Use these from the project root when you want to run the app and load it on your phone via QR code.

## 1. Install dependencies (first time or after pull)

```bash
cd /Users/nero/Documents/MotusTots
npm install
```

## 2. Start the Expo dev server (shows QR code)

```bash
cd /Users/nero/Documents/MotusTots
npx expo start
```

- Open **Expo Go** on your phone and scan the QR code shown in the terminal.
- Same Wi‑Fi as your Mac required (or use tunnel: `npx expo start --tunnel`).

If port 8081 is already in use:

```bash
npx expo start --port 8082
```

## 3. Optional: run with tunnel (different network)

```bash
npx expo start --tunnel
```

## Summary – copy/paste to start again later

```bash
cd /Users/nero/Documents/MotusTots
npm install
npx expo start
```

Then scan the QR code with Expo Go on your phone.
