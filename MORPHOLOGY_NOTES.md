# Morfoloji notları

Emin olunmayan ya da tartışmaya açık her dilbilgisi kararı burada; her biri `src/morph/*.test.ts` içinde bir test
vakasıyla sabitlendi. Kaynak: standart Türkiye Türkçesi kuralları (genel dilbilgisi bilgisi); toplu TDK verisi kullanılmadı.

| Konu                                  | Karar                                                                                                                                          | Test                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| `oğul` + yönelme                      | `oğla` (ünlü düşmesi tüm ünlüyle başlayan eklerde)                                                                                             | paradigm: oğul             |
| `su`                                  | `suyu, suyun, suyum, suyumuz`; `sular, suda, suya` normal                                                                                      | paradigm: su               |
| `saat`, `hayal`, `rol`, `gol`, `kalp` | ince ek alır (`frontOverride`); istisna yalnız kökün son ünlüsünü etkiler, ünlülü bir ek geldikten sonra uyum ekten devam eder (`saatlerimiz`) | paradigm: saat…            |
| `saat`, `bilet`, `sepet`              | çok heceli ama yumuşamaz (`noSoften`)                                                                                                          | paradigm: bilet…           |
| Tek heceli yumuşayanlar               | `dip, kap, uç, gök, dert, renk, kalp, tat, yurt, kurt, but, denk`                                                                              | paradigm: dip…             |
| `nk → ng`                             | `renk → rengi`; `k` sonrası `n` varsa `ğ` yerine `g`                                                                                           | paradigm: renk             |
| Yapım eki sonu `-lIk`                 | ek kaynaklı son ünsüz her zaman yumuşar (`gözlüğü`, `kalemliği`)                                                                               | chains                     |
| Ünlü düşmesi + ünsüzle başlayan ek    | düşme olmaz (`ağızda`, `akıllı`)                                                                                                               | paradigm: ağız, derivation |
| `-ki` uyumu                           | yalnız `bugün, dün, öbür` → `-kü`; diğer her yerde `-ki` (`yarınki`, `sabahki`)                                                                | pronominal n and -ki       |
| `-ki` nereye gelir                    | -DA / -(n)In sonrası ya da zaman kökleri; `-ki`den sonra çoğul ve hâl (döngü) gelebilir, iyelik ve yapım gelemez                               | ORDER errors               |
| Zamir n'si                            | 3. tekil iyelik ve `-ki`den sonra -DA/-DAn → `-nDA/-nDAn`, -(y)A/-(y)I → `-nA/-nI`; vasıta `-(y)lA` almaz (`eviyle`)                           | pronominal n               |
| Kaynaştırma ünlüsü `(I)` hatası       | `strictVariant`'ta `kapı + ım` hatası `CONSONANT` sınıfında raporlanır (spec'teki 4 neden arasında en yakını)                                  | strictVariant              |
| Hata önceliği                         | `ORDER` → `VOWEL_HARMONY`/`CONSONANT` → `NOT_LEXICAL`                                                                                          | strictVariant              |
| Fiil ekleri                           | Kapsam dışı (spec 6.2 yalnız ad ekleri tanımlıyor); `-lA` fiil yapım eki eklenmedi                                                             | —                          |

Açık sorular (Aşama 3'te sözlükle netleşecek): yumuşamayan çok heceli kelimelerin tam listesi, `frontOverride`
listesinin tamamı, ikizleşen kökler (`ret → reddi` gibi yumuşama + ikizleşme birleşimi henüz desteklenmiyor).
