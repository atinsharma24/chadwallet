# Assets

These are **placeholder** images so the app builds out of the box:

| File | Size | Replace with |
|------|------|--------------|
| `icon.png` | 1024×1024 | ChadWallet app icon |
| `adaptive-icon.png` | 1024×1024 | Android adaptive foreground |
| `splash.png` | 1242×2436 | ChadWallet splash artwork |

Drop the real brand assets from the shared Drive folder
(<https://drive.google.com/drive/folders/1j4PZng-sJHxqAATUF1WYw1jm8nyQwCE>)
here, keeping the same filenames, then re-run `npx expo prebuild` (or rebuild
on EAS). Also update the accent hexes in `src/theme/index.ts` to match the
official palette.
