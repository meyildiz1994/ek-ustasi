# Değişiklik günlüğü

## [0.8.1] — 2026-11-16 — Durak görselleri

- 100 durağın her birine fotoğraf gibi bir görsel (`assets/images/scenes/*.webp`, ~7,2 MB): oyun arka planı,
  durak tanıtımı, harita kartı ve kartpostalda. Kodla çizilen sahne yedek. Kararlar: D-023.

## [0.8.0] — 2026-11-16 — Aşama 8: His, ses, titreşim

- `tools/audio/synth.ts`: 29 özgün ses efekti ve müzik döngüsü kodla üretiliyor (`pnpm sounds`).
- Ses ve titreşim servisi (`src/services/sound.ts`, `feedback.ts`); her olayın kendi sesi ve titreşimi.
- Pentatonik harf tıkları, karo dolum notaları, bonus kelimede uçan yıldız.
- Ek Turu: ek başına yükselen nota, mıknatıs animasyonu, kırılma ve toplama sesleri.
- Bölüm sonu: konfeti, tek tek düşen yıldızlar. Ana sayfada Ayarlar. Kararlar: D-022.

## [0.7.0] — 2026-11-16 — Aşama 7: Duraklar ve harita

- `src/scenes/scene.ts`: 100 durağın kâğıt kesme sahneleri tek çiziciden; Skia bileşeni (`Scene`) ve SVG önizleme.
- Harita ekranı (`/map`): 100 durak, yıldız toplamları, kilitli duraklar, durak kartı.
- Yeni durağa girişte tanıtım kartı; durak bitince kartpostal (Skia yazılı, paylaşılabilir).
- Ana sayfaya "Harita" butonu. Kararlar: D-021.

## [0.6.0] — 2026-11-16 — Aşama 6: Ek Turu

- `src/game/ekturu.ts`: Ek Turu turu (kartları sırayla takma, katı varyant kontrolü, zincir kırılması, Topla),
  puan (×2, arşifonem ×1,5), Büyük Ek Turu 3× ödül, Ek ipucu, açıklama tetikleyicileri.
- Her 5. bölümün sonunda "Ek Turu'na geç"; yarıda kapanırsa açılışta yeniden açılır.
- Ekranlar: ek çarkı (çark bileşeninin kart modu), renkli ek parçalarıyla büyüyen kelime, çarpan rozeti,
  hata açıklaması, sonuç kartı, 6 eğitici açıklama kartı.
- Uygulama içi morfoloji motoru üretilen sözlükle (`src/services/morph.ts`). Kararlar: D-020.

## [0.5.0] — 2026-11-16 — Aşama 5: Çekirdek oynanış

- `src/game`: ızgara modeli, çark yolu (isabet, ara örnekleme, geri alma), kelime sınıflandırma (hedef / bonus /
  zaten bulundu / geçersiz), puan + kombo, yıldız, altın kuralları, üç ipucu, oyun oturumu, paket çözücü.
- `src/store`: zustand + immer oyun deposu, sürümlü MMKV kaydı; yarım bölüm aynen devam eder.
- `src/services/levels.ts`: yalnız gereken paketi okur, SHA-256 doğrular, 3 paket önbellekte.
- Ekranlar: ana sayfa ("Bölüm N"), oyun ekranı (bölgeye göre arka plan, ızgara dolma animasyonu, Skia çark
  çizgisi, önizleme baloncuğu, karıştır + 3 ipucu), bölüm sonu kartı (yıldız, puan, altın).
- Web: Skia için CanvasKit yükleyici, `pnpm export:web`.
- Yazı tipi: Baloo 2 (OFL), 3 sabit ağırlık, Latin + Türkçe alt küme (≈68 KB her biri).

## [0.4.0] — 2026-11-16 — Aşama 4: Bölüm üretim hattı

- `tools/levelgen`: seed'li PRNG, ana kelime + kelime seçimi, ızgara yerleşimi (geri izleme + 200 yeniden
  başlatma), zorluk puanı (8.4), testere dişi zorluk eğrisi (8.5), tekrar kuralları (8.6), Ek Turu verisi (8.7),
  otomatik doğrulama (8.8), paketleme (50 bölüm/paket, gzip, SHA-256 manifest), `report.html` + `review.html`.
- `assets/levels`: 5000 bölüm (100 paket, ≈1,4 MB), `manifest.json`, `stops.json`.
- `stops.json`: 81 il + 19 dünya şehri; özgün tanıtım cümlesi, palet, prosedürel sahne tarifi;
  `tools/scenes/preview.html` önizlemesi.
- `src/game/level.ts`: bölüm veri tipleri (spec 9).
- Kararlar: D-015 (zorluk normları), D-016 (üretici ayrıntıları), D-017 (Ek Turu), D-018 (duraklar),
  D-019 (kısa kelime kullanım sınırı).

## [0.3.1] — 2026-11-16 — Görsel varlıklar

- Emre'nin GPT ile ürettiği 29 görsel eklendi: 9 arka plan, 13 arayüz ikonu/rozeti, çark tabağı, 3 maskot pozu,
  uygulama ikonu (iOS + Android adaptive + monokrom), açılış amblemi (`expo-splash-screen`), favicon.
- `src/theme/palette.ts`, `src/theme/images.ts` (tek yerden `require` haritası).
- Lisans kaydı (LICENSES.md), promptlar (docs/ASSET_PROMPTS.md), D-014.

## [0.3.0] — 2026-11-16 — Aşama 3: Sözlük hattı

- `tools/dict`: Zemberek ayrıştırıcı, wordfreq okuyucu, engelleme listesi, elle doğrulanmış türetmeler,
  kök bayrağı düzeltmeleri, deterministik `pnpm dict` hattı.
- `assets/dict`: `target_words.txt` (11.513), `valid_words.bin` (197.598 kelime, 190 KB),
  `derivations.json` (1.707 kök), `root_flags.json` (2.590 kök), `STATS.md`.
- `src/dict/dawg.ts`: EKDW DAWG çözücü (`has`, `words`, `wordsFromLetters`); `src/dict/lexicon.ts`.
- Vitest ile üretim hattı testleri; CI yeniden üretilen dosyaların depodakiyle bit düzeyinde aynı olduğunu doğruluyor.

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
