# Ek Ustası — Geliştirme Planı

Kaynak: ana geliştirme promptu (tek doğruluk kaynağı). Belgeden sapan her karar `DECISIONS.md` içinde.
Durum işaretleri: `[x]` bitti · `[~]` sürüyor · `[ ]` başlamadı.

Her aşamanın çıkış şartı (Bölüm 0): testler geçer · `pnpm typecheck` hatasız · `pnpm lint` temiz ·
`CHANGELOG.md` güncel · aşama özeti + bir sonraki aşama için kararlar listesi.

## Aşama 1 — Proje iskeleti

- [x] Expo (SDK 58) + React Native 0.88 + TypeScript strict (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- [x] expo-router, kök `/app` dizini (Bölüm 3 klasör yapısı)
- [x] Klasör yapısı: `src/{game,morph,components,scenes,store,services,utils}`, `assets/{levels,dict,sfx,fonts}`, `tools/levelgen`, `i18n/tr.json`
- [x] ESLint (eslint-config-expo, flat) + Prettier; `toUpperCase`/`toLowerCase` lint ile yasak
- [x] Jest (jest-expo) + React Native Testing Library; `src/morph` ve `src/utils` için %95 kapsam eşiği
- [x] GitHub Actions: typecheck + lint + format + test
- [x] `src/utils/tr.ts`: `trUpper`, `trLower`, `trCompare`, `trCapitalize`, `trNormalize`, `isTrWord` + testler
- [x] `DECISIONS.md`, `CHANGELOG.md`, `LICENSES.md`, `MORPHOLOGY_NOTES.md`
- [ ] iOS simülatör / Android emülatörde boş ekranın açıldığının elle doğrulanması (bulut ortamında simülatör yok; `expo export` ile Android paketi derlendi — Emre'nin cihazında doğrulanacak)

## Aşama 2 — Morfoloji motoru (`src/morph`)

- [x] Bölüm 6.6 test vakaları önce yazıldı (test-first)
- [x] `phonology.ts`: ses sınıfları, son ünlü, hece sayısı, büyük/küçük ünlü uyumu, ünsüz benzeşmesi, yumuşama
- [x] `suffixes.ts`: ek tanımları (arşifonem şablonları), kategori, ek sırası yuvası (slot)
- [x] `lexicon.ts`: kök özellikleri (ünlü düşmesi, `frontOverride`, yumuşama istisnaları) + türetilmiş kelime sözlüğü (geçici çekirdek; Aşama 3'te gerçek veriyle değişecek)
- [x] `engine.ts`: `realize` (şablon → yüzey biçim), `applySuffix` (strictVariant), `derive`, `enumerateChains`
- [x] Morfotaktik sonlu durum makinesi (yapım* → çoğul? → iyelik? → hâl? → ki? → döngü) → `ORDER`
- [x] Yapım ekleri için sözlük kontrolü → `NOT_LEXICAL`
- [x] Türkçe açıklama metinleri (`VOWEL_HARMONY`, `CONSONANT`, `ORDER`, `NOT_LEXICAL`) `i18n/tr.json` içinde
- [x] 300+ test vakası, kapsam ≥ %95

## Aşama 3 — Sözlük hattı (`tools/dict`)

- [x] Kaynak seçimi ve lisans doğrulaması: Zemberek (Apache 2.0), wordfreq (CC BY-SA 4.0) → `LICENSES.md`
- [x] `pnpm dict:fetch` indirme (SHA-256 manifest) + `pnpm dict` deterministik üretim; kaynaklar depoda
- [x] Frekansla `target_words.txt`: 11.513 kelime (7.638 madde + 3.875 çekimli biçim)
- [x] `blocklist.txt` + uygulama; siyasi ve dini kelimeler Emre kararıyla hedef dışı
- [x] `valid_words.bin` DAWG kodlayıcı (`tools/dict/dawg-build.ts`) + cihaz çözücü (`src/dict/dawg.ts`), arama < 0,05 ms
- [x] `derivations.json` (motorla doğrulanmış) + `root_flags.json`; `src/dict/lexicon.ts` motora bağlıyor
- [x] Kök bayrakları Zemberek'ten + `overrides.json`; 6.6 ve paradigmalar üretilen sözlükle de geçiyor
- [ ] Uygulamada `.bin` / `.json` varlıklarının yüklenmesi (Metro assetExts + expo-file-system) → Aşama 5

## Aşama 4 — Bölüm üretim hattı (`tools/levelgen`, Vitest)

- [ ] Seed'li PRNG, deterministik çıktı
- [ ] Ana kelime + harf kümesi seçimi, aday kelimeler
- [ ] Izgara yerleşimi (geri izleme + 200 yeniden başlatma, ≤12×12)
- [ ] Zorluk puanı (8.4) + zorluk eğrisi / testere dişi (8.5)
- [ ] Tekrar kuralları (8.6), Ek Turu verisi (8.7), doğrulama listesi (8.8)
- [ ] Paketleme: 50 bölüm/paket, gzip, `manifest.json` SHA-256
- [ ] `report.html`, `review.html`; önce `--count 100`, sonra 5000
- [ ] `stops.json` (100 durak) + `tools/scenes/preview.html`

## Aşama 5 — Çekirdek oynanış

- [ ] `src/game`: grid, wheel (yol seçimi, ara örnekleme, geri alma), validate, scoring, hints — saf TS + testler
- [ ] Skia çark + ızgara bileşenleri, önizleme baloncuğu, üst bar
- [ ] zustand + immer store, MMKV kayıt (sürümlü şema, göç), yarım bölümün geri yüklenmesi
- [ ] Paket yükleme (ilk paket, tembel açma, SHA-256 doğrulama)
- [ ] İlk 20 bölüm uçtan uca oynanabilir, 60 fps
- [ ] Görsel referans: Emre'nin ekran görüntüleri + HTML prototip (türün düzeni, kopya değil)

## Aşama 6 — Ek Turu

- [ ] Ek Turu ekranı, kartlar, zincir, çarpan, "Topla", hata açıklamaları
- [ ] Büyük Ek Turu, arşifonem kartları (1001+)
- [ ] Eğitici açıklama kartları (ilk karşılaşmada)
- [ ] Puan formülü testleri

## Aşama 7 — Duraklar ve harita

- [ ] 100 durağın prosedürel Skia sahneleri, harita ekranı, kartpostal

## Aşama 8 — His, ses, haptik

- [ ] Özgün/CC0 sesler, pentatonik tıklar, haptik eşlemeleri, konfeti, ayarlar

## Aşama 9 — Ekonomi, satın alma, reklam

- [ ] Altın ekonomisi, RevenueCat, ödüllü reklam, ATT/UMP, geri yükleme

## Aşama 10 — Günlük modlar, analitik, ayarlar, erişilebilirlik

- [ ] Günlük Bulmaca, Günün Eki, analitik olayları, ayarlar, renk körlüğü / büyük yazı

## Aşama 11 — Yayına hazırlık

- [ ] Simge, ekran görüntüleri, mağaza metinleri, gizlilik politikası, EAS Build, TestFlight + Play iç test

---

## Görsel referans notları (Emre'nin 16 ekran görüntüsü, 2026-11-16)

Yalnızca düzen ve his için referans; hiçbir isim, logo, ikon, görsel ya da metin kopyalanmaz.

- **Ana ekran:** üstte para birimi hapları + ayarlar; ortada büyük yarı saydam daire içinde bölüm no + durak adı;
  altta büyük yeşil "BÖLÜM N" butonu ve altında "Günlük Bulmaca" hapı (takvim rozeti); iki yanda yuvarlak etkinlik
  simgeleri (geri sayımlı); tam ekran mevsimsel illüstrasyon.
- **Oyun ekranı:** üstte ızgara, altta yarı saydam büyük daire çark; çarkın ortasında karıştır; çarkın yanlarında
  yuvarlak yardımcı butonları (ipucu sayacı rozetli). → Bölüm 2 düzeniyle uyumlu.
- **Pop-up dili:** krem/turuncu paneller, kalın büyük başlık, yeşil yuvarlak CTA, ilerleme çubuğu + kademeli ödüller.
- **Uyulmayacak:** ekran görüntülerindeki banner reklamlar (spec Bölüm 13: yalnızca ödüllü reklam).
- **Ek Turu (Emre):** ayrı bir kart-sürükle arayüzü yerine aynı çark/ızgara mekaniğiyle oynanacak → Aşama 6
  tasarımı buna göre güncellenecek (DECISIONS.md D-008).

## Backlog — MVP sonrası meta özellikler (Emre istemedikçe MVP'ye girmez)

- [ ] Haftalık Etkinlik: toplanabilir tema nesnesi (ör. yaprak/lale) + kademeli ödül çubuğu (spec 11 "ileride")
- [ ] Yarış etkinliği: sınırlı süreli, bot/oyuncu rakiplerle ilerleme yarışı (çevrimiçi altyapı gerekir)
- [ ] Görev / bilet sistemi ("Yolculuk görevleri"): bölüm bitir, bonus kelime bul, Ek Turu zinciri kur…
- [ ] Koleksiyon / Kupa odası: durak kartpostalları ve başarımlar için vitrin (Bölüm 10 kartpostal ile bağlanır)
- [ ] Altın kumbarası: oynadıkça dolan, satın alınarak açılan kumbara (Bölüm 13 ekonomisiyle dengelenmeli)
- [ ] Tek seferlik teklif paketleri (fiyatlar mağaza katmanlarından)
- [ ] Arkadaş davet et / arkadaş listesi (sunucu + gizlilik değerlendirmesi gerekir)
- [ ] Şans çarkı (günlük ödül alternatifi)
