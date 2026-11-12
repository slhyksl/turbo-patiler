# Turbo Patiler – güncelleme deposu

Telefona/tablete kurulan Turbo Patiler uygulaması her açılışta bu depodaki
`version.json` dosyasına bakar. Buradaki sürüm numarası uygulamadakinden büyükse
`game.zip` dosyasını indirir ve oyun kendini yeniler.

- `version.json` – sürüm numarası ve game.zip'in parmak izi (SHA-256)
- `game.zip` – oyunun kendisi
- `kaynak/` – oyunun kaynak dosyaları ve `paketle.py` (yeni game.zip + version.json üretir)

Yeni sürüm yayınlamak: `kaynak/version.txt` ve `kaynak/js/ui.js` içindeki `WEB_VERSION`
sayısını 1 artırıp `python3 kaynak/paketle.py "ne değişti"` çalıştırın, sonra
`version.json`, `game.zip` ve değişen kaynak dosyalarını yükleyin.

Depo **Public** kalmalı, dal adı **main** olmalı.
