# Ek Ustası

Türkçenin eklemeli yapısını oyuna çeviren harf çarkı + çapraz bulmaca oyunu (iOS / Android, Expo).

```bash
pnpm install
pnpm start          # Expo geliştirme sunucusu
pnpm test           # Jest
pnpm test:coverage  # kapsam eşikleriyle
pnpm typecheck && pnpm lint
pnpm dict           # sözlük dosyalarını yeniden üret (assets/dict)
pnpm test:tools     # üretim hattı testleri (Vitest)
```

Belgeler: [PLAN.md](PLAN.md) · [DECISIONS.md](DECISIONS.md) · [MORPHOLOGY_NOTES.md](MORPHOLOGY_NOTES.md) ·
[LICENSES.md](LICENSES.md) · [CHANGELOG.md](CHANGELOG.md)

Morfoloji motoru örneği:

```ts
import { derive } from '@/morph';
derive('kalem', ['DER_LIK', 'PLURAL', 'POSS_1PL', 'CASE_ABL']);
// → { ok: true, surface: 'kalemliklerimizden', morphemes: ['kalem','lik','ler','imiz','den'], … }
```
