# Karakana Ledger

Offline-first PWA for tracking daily income (mapato) and expenses (matumizi)
at a mechanic garage. Built for zero/low internet use — after the first
install, it works with no connection at all.

## What it does
- Big-button entry for income and expenses (Chakula, Maji, Taka,
  Wafanyakazi, Vifaa vya Karakana, Nyingine)
- "Leo" gauge showing today's net position at a glance
- Weekly / monthly / all-time reports with category breakdown
- CSV export for backup or sharing with an accountant
- All data stored locally on the phone (localStorage) — nothing leaves
  the device unless you export it

## Fastest way to get this on the mechanic's phone (free, ~10 minutes)

### 1. Push to GitHub Pages (gives you a real HTTPS link, required for install)
```bash
cd karakana-ledger
git init
git add .
git commit -m "Karakana Ledger v1"
git remote add origin https://github.com/lonyoriconsulting-maker/karakana-ledger.git
git push -u origin main
```
Then on GitHub: **Settings → Pages → Source: main branch → Save.**
You'll get a link like `https://lonyoriconsulting-maker.github.io/karakana-ledger/`

### 2. Install on the Android phone
1. Open that link in Chrome on the phone.
2. Tap the **⋮ menu → "Add to Home screen" / "Install app"**.
3. It now behaves like a normal app icon — opens full-screen, no browser
   bar, works with the data connection off.

### 3. First-time walkthrough for the mechanic (do this together, once)
- Open the app, show the two big buttons: green = mapato in, red =
  matumizi out.
- Do 2–3 real entries together (e.g. today's fuel purchase, a service
  job paid for).
- Show the "Leo" gauge updating live.
- Show Ripoti tab briefly — this is mostly for you or an accountant
  later, not something they need daily.

## Notes for maintaining it
- No backend, no server costs, no login — reduces what can break.
- If you want multi-device sync later (e.g. owner + one employee both
  logging entries), that's a bigger step: would need a small backend
  (your Django/DRF stack fits well) with periodic sync when online.
  Don't add this until the paper-free habit is proven for a few weeks.
- To update the app after pushing changes to GitHub Pages, bump
  `CACHE_NAME` in `service-worker.js` (e.g. `karakana-ledger-v2`) or
  installed devices will keep serving the old cached version.
