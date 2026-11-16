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

## D-013 — Siyasi ve dini kelimeler hedef olamaz; fiil çekimleri sonraya (2026-11-16)

Emre: "siyasi ve dini kelimeler olmasın". `blocklist.txt` içindeki siyasi/dini bölüm genişletildi (din adları,
ibadet ve kurum adları, ideolojiler, siyasi kurumlar, etnik/mezhep adları). Spec 7.2 gereği bu kelimeler bonus olarak
kabul edilmeye devam ediyor. Fiil çekimleri (`geldi`, `alır`) bonus sözlüğüne Aşama 5'ten sonra eklenecek (öneri,
Emre itiraz etmedi).

## D-014 — Görseller: GPT ile üretilmiş raster + prosedürel ayrıntı (hibrit) (2026-11-16)

Spec görsellerin tamamen prosedürel (Skia) çizilmesini öngörüyordu. Emre görselleri OpenAI GPT ile üretti ve 9 arka
planı gönderdi; bu, önerilen hibrit yaklaşımın kabulü sayıldı:

- 9 bölge arka planı (ana ekran, 7 coğrafi bölge, dünya), arayüz ikonları, çark tabağı, maskot (hüdhüd kuşu),
  uygulama ikonu ve açılış amblemi raster olarak `assets/images/` altında.
- Her durağın (il/ülke) kendine özgü ayrıntıları, ızgara karoları, harfler ve animasyonlar prosedürel kalıyor.
- Görsel dil: "Anadolu İznik çinisi + kâğıt kesme", palet `src/theme/palette.ts`.
- Boyutlar: arka planlar 1024×1536 JPG (q82), ikonlar 256 px, maskot 512 px, çark tabağı 1024 px; PNG'ler 256 renge
  indirildi. Toplam ≈4,3 MB. Orijinal 1254/1536 px dosyalar Emre'de duruyor.
- Ekranda yazı içeren görsel yok; bütün metinler `i18n/tr.json` üzerinden çiziliyor.

## D-015 — Zorluk puanı normları ve harf sayısı dağılımı (Aşama 4)

Spec 8.4 formülü aynen kullanılıyor; `norm()` aralıkları belgede yoktu, eğrinin gerçekten kullandığı aralığa göre
seçildi (`tools/levelgen/difficulty.ts`):

| Özellik             | Aralık                                         |
| ------------------- | ---------------------------------------------- |
| harf sayısı         | 4–7 (8 harf = 1)                               |
| hedef kelime sayısı | 3–12 (12+ = 1)                                 |
| en uzun kelime      | 4–7                                            |
| tekrar eden harf    | 0–2                                            |
| frekans persentili  | hedef listesindeki Zipf sırası (1 = en yaygın) |
| kesişim yoğunluğu   | kesişen hücre / dolu hücre, 0,1–0,5            |

Daha geniş aralıklarla (ör. 3–8 harf, 3–16 kelime) üst bantlar (65–80, 75–95) erişilemiyordu. 75–95 bandında
gerçekçi tavan ≈ 88; son katmanın hedefi bandın %60'ında (≈ 87) kesiliyor.

Ana kelime uzunluğu aralıklı katmanlarda ilerlemeye göre seçiliyor: 7 harfli kelime kümeleri en kıt kaynak ve
3001–4000 yalnızca 7 harf kullanıyor, bu yüzden 2001–3000 önce 6, 4001–5000 önce 8 harfli ana kelime alıyor.
1–20 aralığında 3 harfli ana kelimeyle 3 hedef kelime kurulamadığı için pratikte 4 harf kullanılıyor.

## D-016 — Bölüm üreticisi ayrıntıları (Aşama 4)

- Ana kelime: hedef listesindeki herhangi bir kelime (önce madde başları, sonra çekimli biçimler). 1–3. bölümler
  elle seçildi: `elma`, `kale`, `okul` (uymazsa üretici kendi seçer).
- Kelime seçimi hedef zorluğa göre yapılıyor (yaygın ↔ nadir karışımı, kelime sayısı); daha önce kullanılmış
  kelimeler kullanım sayısıyla cezalandırılıyor ki yaygın kısa kelimeler 5000 bölüme yayılsın (en fazla 12 kez).
- "Ardışık 30 bölüm içinde tekrar etmez" = aynı kelimenin iki kullanımı arasında en az 31 bölüm.
- Izgara: en fazla 200 yeniden başlatma; bütün kelimeler yerleştiyse 20 denemeden sonra duruluyor (en iyi düzen
  zaten bulunmuş oluyor, süre ≈ 10× kısalıyor). Hedef en-boy oranı sütun/satır = 1,2.
- Bonus kelimeler = `valid_words.bin` içinden çark harfleriyle kurulabilen her kelime (çekimli biçimler dahil),
  ızgaradakiler hariç.
- `letters` karıştırılmış olarak saklanıyor (ana kelime çarkta okunmasın).
- Paketler `fflate` ile gzip (mtime 0): her işletim sisteminde aynı bayt; uygulama da aynı kütüphaneyle açacak.

## D-017 — Ek Turu verisi (Aşama 4)

- Kök: bölümün ızgaradaki kelimelerinden, `derivations.json` içinde türetim ağacı olan ve son 200 bölümde kök
  olmamış kelime; en yüksek, sonra en geniş ağaç seçiliyor.
- En iyi zincir: en derin türetim yolu + sabit çekim kuyruğu `-lAr → -(I)mIz → -DA → -ki → (-lAr → -DA → -ki)…`,
  `maxDepth`'e kadar. Her zincir motorla yeniden türetiliyor (8.8).
- Kartlar `{ id, form }` olarak saklanıyor (spec örneğinde düz metin): "i" hem belirtme hem iyelik olabildiği için
  biçim tek başına eki belirlemiyor. Kart sayısı maxDepth ≤ 3 → 8, ≤ 6 → 10, üstü → 12; en iyi zincirin her adımı
  için doğru biçim + en az bir yanıltıcı varyant (önce ince/kalın çevirmesi), geçerli kartlar ≥ %40.
- `targetScore` = zincirin son eki olmadan alınan puanın ⅔'ü, 10'a yuvarlanmış (spec örneği kalem → 160 tutuyor).
- Büyük Ek Turu (her durağın 50. bölümü): `maxDepth` + 2 (en çok 12), `big: true`; ödül çarpanı uygulamada.
- `archiphoneme: true` 1001. bölümden itibaren (spec 5.3).

## D-018 — Duraklar (Aşama 4)

- Sıra: bölgeler spec 10'daki sırayla, bölge içinde turistik tanınırlığa göre (tahminî sıralama, Emre değiştirebilir:
  `tools/levelgen/stops-list.ts`). 82–100: Bakü, Saraybosna, Üsküp, Selanik, Semerkant, Budapeşte, Viyana, Berlin,
  Amsterdam, Londra, Paris, Roma, Kahire, Marakeş, Dubai, Pekin, Tokyo, Rio de Janeiro, New York.
- `stopId`: iller `tr-50-nevsehir`, dünya şehirleri `w-82-baku`.
- Sahne tarifleri genel biçimlerden oluşuyor (kubbe, minare, kule, köprü, peri bacası…); gerçek bir yapının
  kopyası yok. Palet bölge tabanından + günün saatinden türetiliyor, durak başına küçük kaydırma.
- Tanıtım cümleleri özgün olarak yazıldı.

## D-019 — 3–4 harfli kelimeler için kullanım sınırı 24 (spec 8.6: 12)

5000 bölüm ≈ 53.000 hedef kelime yeri istiyor ve ızgaralar kısa kelimeye muhtaç. 3–4 harfli hedef kelime sayısı
yalnızca 1.849; hepsi 12 kez kullanılınca (~3.200. bölüm) 7 harfli çarklarda 10 kelimelik bölüm kurulamıyor.
Bu yüzden 3–4 harfli kelimelerin toplam sınırı 24'e çıkarıldı; 5+ harfli kelimeler için 12 aynen geçerli.
"30 bölüm içinde tekrar etmez" kuralı herkes için aynı. Üretici ayrıca kelimeleri kullanım sayısına göre
cezalandırıyor, böylece aynı kelimeler 24'e erken dayanmıyor.

## D-020 — Ek Turu oynanışı (Aşama 6)

- **Çark mekaniği (Emre, 2026-11-16):** Spec'teki "kartı köke sürükle" yerine ekler harf çarkındaki gibi bir
  halkaya dizilir. Oyuncu parmağını bir ya da birkaç ekin üzerinden geçirir; bıraktığında ekler sırayla takılır.
  İlk hatada zincir kırılır ve o ana kadarki puan korunur (spec 5.2). Aynı ek kartı sonraki hamlelerde yeniden
  kullanılabilir (zincirde -lAr, -DA, -ki birden çok kez geçiyor).
- **Önizleme** sürükleme sırasında ekleri olduğu gibi yan yana koyar (doğrulamaz). Böylece cevabı ele vermez.
- **Arşifonem kartları (1001+):** En iyi zincirde birden çok varyantla gelen en fazla iki ekin varyant kartları
  tek bir arşifonem kartıyla (-lXk, -DA…) değiştirilir. Bu ekler puanı ×2 yerine ×1,5 artırır. Hedef puan da aynı
  oranda düşürülür, böylece en iyi zincir her bölümde hedefe ulaşıyor (testte 1000 Ek Turunun hepsi oynatılıyor).
- **Ek ipucu (40 altın):** En iyi zincirin sıradaki eki, oyuncu zincirden saptıysa takılabilecek herhangi bir ek.
- **Açıklama kartları (5.4):** İlk Ek Turu (nasıl oynanır), ilk ünlü uyumu hatası, ilk ünsüz yumuşaması, ilk
  kaynaştırma harfi, ilk ünsüz benzeşmesi, ilk sıra hatası. Her biri bir kez gösterilir, ayarlardan kapatılabilir.
- **Kayıt:** Bölüm bitip Ek Turu oynanmadan uygulama kapanırsa, açılışta o bölümün Ek Turu yeniden açılır
  (`pendingEkTuru`). Tur içi durum kaydedilmiyor (tur kısa).
