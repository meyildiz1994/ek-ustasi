/**
 * The 100 stops (spec §10): 81 provinces region by region (Marmara → Ege → Akdeniz → İç Anadolu →
 * Karadeniz → Doğu Anadolu → Güneydoğu Anadolu), well-known places first inside each region, then
 * 19 world cities starting with those that have close cultural ties to Türkiye.
 */
import { trLower } from '../../src/utils/tr';

export type Region =
  'marmara' | 'ege' | 'akdeniz' | 'icAnadolu' | 'karadeniz' | 'doguAnadolu' | 'guneydogu' | 'dunya';

export interface StopSeed {
  /** Plate code for provinces; 82–100 for world cities. */
  code: number;
  name: string;
  region: Region;
}

const P = (region: Region, list: [number, string][]): StopSeed[] =>
  list.map(([code, name]) => ({ code, name, region }));

export const STOP_SEEDS: readonly StopSeed[] = [
  ...P('marmara', [
    [34, 'İstanbul'],
    [22, 'Edirne'],
    [16, 'Bursa'],
    [17, 'Çanakkale'],
    [10, 'Balıkesir'],
    [41, 'Kocaeli'],
    [77, 'Yalova'],
    [54, 'Sakarya'],
    [59, 'Tekirdağ'],
    [39, 'Kırklareli'],
    [11, 'Bilecik'],
  ]),
  ...P('ege', [
    [35, 'İzmir'],
    [48, 'Muğla'],
    [9, 'Aydın'],
    [20, 'Denizli'],
    [45, 'Manisa'],
    [3, 'Afyonkarahisar'],
    [43, 'Kütahya'],
    [64, 'Uşak'],
  ]),
  ...P('akdeniz', [
    [7, 'Antalya'],
    [33, 'Mersin'],
    [31, 'Hatay'],
    [1, 'Adana'],
    [32, 'Isparta'],
    [15, 'Burdur'],
    [46, 'Kahramanmaraş'],
    [80, 'Osmaniye'],
  ]),
  ...P('icAnadolu', [
    [50, 'Nevşehir'],
    [6, 'Ankara'],
    [42, 'Konya'],
    [26, 'Eskişehir'],
    [38, 'Kayseri'],
    [58, 'Sivas'],
    [68, 'Aksaray'],
    [51, 'Niğde'],
    [40, 'Kırşehir'],
    [66, 'Yozgat'],
    [70, 'Karaman'],
    [18, 'Çankırı'],
    [71, 'Kırıkkale'],
  ]),
  ...P('karadeniz', [
    [61, 'Trabzon'],
    [53, 'Rize'],
    [8, 'Artvin'],
    [78, 'Karabük'],
    [55, 'Samsun'],
    [5, 'Amasya'],
    [57, 'Sinop'],
    [37, 'Kastamonu'],
    [14, 'Bolu'],
    [28, 'Giresun'],
    [52, 'Ordu'],
    [74, 'Bartın'],
    [67, 'Zonguldak'],
    [81, 'Düzce'],
    [60, 'Tokat'],
    [19, 'Çorum'],
    [29, 'Gümüşhane'],
    [69, 'Bayburt'],
  ]),
  ...P('doguAnadolu', [
    [25, 'Erzurum'],
    [36, 'Kars'],
    [65, 'Van'],
    [44, 'Malatya'],
    [23, 'Elazığ'],
    [4, 'Ağrı'],
    [24, 'Erzincan'],
    [13, 'Bitlis'],
    [62, 'Tunceli'],
    [75, 'Ardahan'],
    [76, 'Iğdır'],
    [49, 'Muş'],
    [12, 'Bingöl'],
    [30, 'Hakkari'],
  ]),
  ...P('guneydogu', [
    [63, 'Şanlıurfa'],
    [47, 'Mardin'],
    [27, 'Gaziantep'],
    [21, 'Diyarbakır'],
    [2, 'Adıyaman'],
    [72, 'Batman'],
    [56, 'Siirt'],
    [79, 'Kilis'],
    [73, 'Şırnak'],
  ]),
  ...P('dunya', [
    [82, 'Bakü'],
    [83, 'Saraybosna'],
    [84, 'Üsküp'],
    [85, 'Selanik'],
    [86, 'Semerkant'],
    [87, 'Budapeşte'],
    [88, 'Viyana'],
    [89, 'Berlin'],
    [90, 'Amsterdam'],
    [91, 'Londra'],
    [92, 'Paris'],
    [93, 'Roma'],
    [94, 'Kahire'],
    [95, 'Marakeş'],
    [96, 'Dubai'],
    [97, 'Pekin'],
    [98, 'Tokyo'],
    [99, 'Rio de Janeiro'],
    [100, 'New York'],
  ]),
];

const ASCII: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

export function slug(name: string): string {
  return [...trLower(name)]
    .map((ch) => ASCII[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** "tr-50-nevsehir" for provinces (spec §9), "w-82-baku" for world cities. */
export function stopIdOf(s: StopSeed): string {
  return s.region === 'dunya'
    ? `w-${s.code}-${slug(s.name)}`
    : `tr-${String(s.code).padStart(2, '0')}-${slug(s.name)}`;
}
