# Bölüm üretim hattı

```bash
pnpm levelgen --count 5000 --seed 20261116 --out assets/levels
pnpm scenes        # yalnızca tools/scenes/preview.html
pnpm test:tools    # ilk 100 bölüm yeniden üretilip depodaki paketlerle bayt bayt karşılaştırılır
```

Çıktılar:

- `assets/levels/pack_0001.json.gz` … `pack_0100.json.gz` (50 bölüm/paket), `manifest.json` (SHA-256), `stops.json`
- `tools/levelgen/report.html`: zorluk eğrisi, kelime tekrar histogramı, harf frekansı, elenen adaylar
- `tools/levelgen/review.html`: rastgele 200 bölüm, ızgara görselleriyle
- `tools/scenes/preview.html`: 100 durağın sahne tarifi önizlemesi

Modüller: `prng` (seed'li), `data` (sözlük), `letters`, `grid` (yerleşim), `difficulty` (8.4), `curve` (8.5),
`ekturu` (8.7), `generate` (akış + 8.6 tekrar kuralları), `validate` (8.8), `pack` (9), `report` (8.9), `stops`.
Kararlar: `DECISIONS.md` D-015 … D-018.
