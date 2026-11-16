# Sözlük hattı

```bash
pnpm dict:fetch   # kaynakları yeniden indir (gerekirse) → sources/ + manifest.json
pnpm dict         # assets/dict dosyalarını üret
pnpm test:tools   # testler; üretilen dosyalar depodakiyle aynı olmalı
```

Elle düzenlenen girdiler:

- `blocklist.txt`: hedef olamayacak kelimeler (taslak, onay bekliyor)
- `derived-extra.txt`: kaynaklarda olmayan ama doğru türetmeler (Ek Turu)
- `overrides.json`: Zemberek kök bayraklarına düzeltmeler (gerekçeler `MORPHOLOGY_NOTES.md` içinde)

Bunlardan birini değiştirince `pnpm dict` çalıştırıp `assets/dict` değişikliklerini de commit et.
