# Kararlar

Ana belgeden (spec) sapan ya da belgenin açık bıraktığı her karar burada, gerekçesiyle.

## D-001 — Expo SDK 58, React Native 0.88, TypeScript 6 (2026-11-16)

Spec "son kararlı sürüm" diyor. `create-expo-app@latest` → SDK 58. TS 6'da `types` varsayılanı boş
olduğu için `tsconfig.json` içinde `"types": ["jest"]` açıkça verildi; `baseUrl` (TS 6'da kullanımdan kalkıyor)
yerine yalnız `paths` kullanılıyor.

## D-002 — pnpm + `node-linker=hoisted`

Spec `pnpm test` / `pnpm levelgen` diyor. Metro'nun sembolik bağlı `node_modules` ile sorunsuz çalışması için
`.npmrc` içinde hoisted düzen seçildi.

## D-003 — `trUpper` / `trLower` i/ı'yı yerel ayardan önce elle eşler

Spec `toLocaleUpperCase('tr-TR')` istiyor. Bazı Hermes sürümlerinde Intl verisi `tr-TR`'yi yok sayabildiği için
önce `i→İ`, `ı→I` (ve tersi) elle dönüştürülüyor, sonra yerel ayarlı metod çağrılıyor. Sonuç her motorda aynı.
`trCompare` de Intl.Collator yerine 29 harflik alfabe sırasıyla yazıldı: üretim hattı (Node) ve cihaz aynı sırayı verir.
`toUpperCase`/`toLowerCase` ESLint kuralıyla yasak.

## D-004 — Şapkalı harfler normalize edilir, kelime atılmaz

Spec 7.2 "normalleştir ya da çıkar (tutarlı ol)". `trNormalize`: â→a, î→i, û→u. Gerekçe: kâğıt, hâlâ, millî gibi
yaygın kelimeleri kaybetmemek.

## D-005 — `ApplyResult` başarı durumunda `word` alanını da döner

Spec 6.4'teki `{ ok: true; surface; morphemes }` korunuyor; ek olarak zincire devam etmek için `word: Word`
(fonolojik durum: uyum istisnası, zamir n'si, sözlük bayrakları) dönüyor. `morphemes` yüzey parçalarıdır
(`["kitab","ı"]`), birleşimi her zaman `surface`'e eşittir; arayüzde ekleri renklendirmek için kullanılacak.

## D-006 — Aşama 2 için geçici çekirdek sözlük

Yapım eki kontrolü (6.5) ve kök istisnaları sözlük gerektiriyor ama sözlük Aşama 3'te geliyor. `src/morph/lexicon.ts`
içinde elle yazılmış küçük bir çekirdek (≈90 kök bayrağı, ≈75 türetilmiş kelime) var; motor `Lexicon` arayüzünü
enjeksiyonla alıyor (`createEngine(lexicon)`), Aşama 3'te gerçek veriyle değiştirilecek. Zemberek'in sözlük
nitelikleri (Voicing, NoVoicing, LastVowelDrop, Doubling, InverseHarmony) `RootInfo` alanlarına birebir karşılık geliyor.

## D-007 — Spec 6.2'ye eklenen ekler ve kurallar

- `POSS_2SG (I)n`, `POSS_2PL (I)nIz` eklendi (iyelik takımı tamam olsun diye).
- 3. çoğul iyelik (`-lArI`) eklenmedi: çoğul + 3. tekil (`evleri`) ile aynı yüzeyi veriyor, zincirde belirsizlik yaratır.
- Zamir n'si (evi**n**de, evdeki**n**i), ünsüz ikizleşmesi (hak→hakkı), `su → suyu` düzensizliği motorda var.
- `-ki` yalnızca bulunma (-DA) / tamlayan (-(n)In) ekinden sonra ya da zaman bildiren köklere (bugün, yarın…) gelir;
  başka yerde `ORDER`. Spec 6.3'teki "(hâl)? → (ki)?" bu şekilde daraltıldı.
- Zincir üst sınırı (12 ek, spec 5.2) motorda `ORDER` olarak uygulanıyor.

## D-008 — Ek Turu arayüzü çark mekaniğini kullanacak (bekliyor)

Emre (2026-11-16): Ek Turu "yine aynı mekanikle" olmalı. Spec 5.2–5.3 ek kartlarını köke sürüklemeyi tarif ediyor.
Aşama 6'da kartlar çark üzerinde (ya da çarka benzer bir halkada) seçilecek şekilde tasarlanacak; motor API'si
(`SuffixCard`, `strictVariant`) iki tasarıma da uyuyor. Ayrıntı Aşama 6 başında netleşecek.
