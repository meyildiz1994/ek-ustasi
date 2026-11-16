# Değişiklik günlüğü

## [0.2.0] — 2026-11-16 — Aşama 2: Morfoloji motoru

- `src/morph`: `phonology.ts`, `suffixes.ts` (17 ek), `lexicon.ts` (geçici çekirdek), `engine.ts`
  (`makeWord`, `applySuffix` + `strictVariant`, `derive`, `enumerateChains`, `bestChain`).
- Kurallar: büyük/küçük ünlü uyumu, ünsüz benzeşmesi, yumuşama (+ nk→ng, tek hece istisnaları), kaynaştırma,
  ünlü düşmesi, yabancı köken istisnası, ikizleşme, zamir n'si, `-ki` (+ bugünkü), morfotaktik sonlu durum makinesi,
  yapım eki sözlük kontrolü, 12 ek sınırı.
- Türkçe hata açıklamaları `i18n/tr.json` içinde.
- Testler önce yazıldı: Bölüm 6.6'nın tamamı + ~750 morfoloji testi; kapsam %100.

## [0.1.0] — 2026-11-16 — Aşama 1: Proje iskeleti

- Expo SDK 58 + React Native 0.88 + TypeScript strict, expo-router (`/app`), spec Bölüm 3 klasör yapısı.
- ESLint (expo flat config + `toUpperCase`/`toLowerCase` yasağı), Prettier, Jest (jest-expo) + RNTL.
- GitHub Actions: typecheck, lint, format, test (+ kapsam eşiği %95).
- `src/utils/tr.ts`: `trUpper`, `trLower`, `trCapitalize`, `trCompare`, `trNormalize`, `isTrWord` + 46 test.
- `src/i18n.ts` + `i18n/tr.json`.
