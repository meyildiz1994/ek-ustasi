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

## D-009 — Frekans verisi: Wikipedia dökümü yerine wordfreq (2026-11-16)

Emre "Türkçe Wikipedia sayımı" seçti. Bulut ortamının ağ politikası dumps.wikimedia.org ve Wikipedia API'sini
engelliyor. En yakın erişilebilir açık kaynak wordfreq'in Türkçe listesi: Wikipedia'yı da içeren birleşik bir sayım,
63.083 kelime, Zipf ≥ 3,0. Lisansı (CC BY-SA 4.0) Wikipedia ile aynı. Uyarlanan `target_words.txt` CC BY-SA 4.0
olarak işaretlendi; uygulama paketine girmiyor. Wikipedia'ya erişilen bir ortamda kendi sayımımızı üretmek ileride
mümkün (ör. Emre'nin bilgisayarında).

## D-010 — Hedef listesi: sözlük maddeleri + çok yaygın çekimli biçimler

Zemberek'teki 3–8 harfli, yaygın (Zipf ≥ 3; 3 harflilerde ≥ 3,5) maddeler 7.687 kelime veriyor; spec ≥ 10.000 istiyor.
Fark, çekirdek adların çok yaygın tek ekli biçimleriyle (Zipf ≥ 3,5: `evler`, `kitabı`, `masaya`) kapatıldı.
`target_words.txt`'nin 3. sütunu `L` (madde) / `I` (çekimli). Bölüm üretici `L`'yi tercih etmeli. Fiil kökleri
(`gel`, `bak`) bonus olarak geçerli ama hedef listesine girmiyor: kök dizgesinin frekansı başka biçimlerle karışıyor.

## D-011 — Bonus sözlüğü: maddeler + motorla üretilen çekimler, 3–8 harf

`valid_words.bin` = tüm Zemberek maddeleri + fiil kökleri + doğrulanmış türetmeler + her ad/sıfatın en çok 2 ekli
çekimleri (çoğul, iyelik, hâl ve bunların ikili birleşimleri). Çark en çok 8 harf olduğu için 8 harften uzunlar
atlanıyor. Sonuç: 197.598 kelime, 190 KB. Fiil çekimleri (`geldi`, `alır`) henüz yok; motor yalnız ad ekleri biliyor.

## D-012 — "Türetilmiş kelime sözlüğü" = Zemberek maddesi ∪ frekans listesinde geçen ∪ elle doğrulanan

Spec 6.5 yapım ekli her ara biçimin bir sözlükte olmasını istiyor. Zemberek türetmelerin çoğunu madde olarak
tutmuyor (`gözlükçü` yok). Bir türetme şu durumda geçerli: Zemberek maddesi ise, gerçek metinde geçiyorsa
(wordfreq) ya da `tools/dict/derived-extra.txt` içinde elle onaylanmışsa. Build, elle eklenen her kelimenin kökten
motorla yeniden üretilebildiğini doğruluyor. Sonuç: 1.707 kök, 2.175 türetilmiş biçim. Derin yapım zincirleri az;
Ek Turu zincirleri ağırlıkla çekim ekleriyle uzayacak.

## D-008 — Ek Turu arayüzü çark mekaniğini kullanacak (bekliyor)

Emre (2026-11-16): Ek Turu "yine aynı mekanikle" olmalı. Spec 5.2–5.3 ek kartlarını köke sürüklemeyi tarif ediyor.
Aşama 6'da kartlar çark üzerinde (ya da çarka benzer bir halkada) seçilecek şekilde tasarlanacak; motor API'si
(`SuffixCard`, `strictVariant`) iki tasarıma da uyuyor. Ayrıntı Aşama 6 başında netleşecek.
