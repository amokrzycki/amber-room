# The Amber Room · Orchard No. 7

Prywatna gra offline: jeden automat5×3 i osobny salon z barem, trzema maszynami biznesowymi oraz wyposażeniem. Interfejs angielski zgodnie z korektą użytkownika. Jedna fikcyjna waluta, bez backendu, kont i prawdziwych pieniędzy.

## Uruchomienie

Otwórz **[dist/index.html](dist/index.html)** dwuklikiem w aktualnej przeglądarce z WebGL (sprawdzono Chromium156). Nie potrzeba serwera ani sieci. Plik ma około6.6MB i zawiera wszystkie22 obrazy/dźwięki oraz kod i style. Pierwszy klik odblokowuje audio.

- `Play Orchard No. 7` otwiera automat. `START` lub spacja rozpoczynają jeden obrót; przytrzymanie nie daje auto-spin.
- `Bet / line` × `Lines` = `TOTAL BET`. Aktywne są pierwsze1/5/10/20/40 linii. `Lines & payouts` pokazuje dokładne ścieżki i tabelę.
- `SKIP` lub spacja skracają wygraną, bez kolejnego zakładu. `← Lounge` wraca do salonu po zatrzymaniu bębnów.
- `Settings & save`: wyciszenie, ograniczony ruch, intensywność efektów i kopia postępu. Tab/Shift+Tab i Enter/Space obsługują zwykłe przyciski; fokus jest widoczny.
- Salon zarabia automatycznie w obu widokach oraz po powrocie, do8h jednej nieobecności. Zakupy mają po3 skończone poziomy. `Buy the room a round` kosztuje50, daje tylko krótką reakcję.

## Kopia i przenoszenie zapisu

`Settings & save` → `Export JSON` pobiera plik. W innym katalogu/urządzeniu otwórz grę i użyj `Import JSON`. Import najpierw waliduje cały plik; nieprawidłowy nie zastępuje postępu. Import zastępuje bieżący postęp poprawną kopią.

localStorage używa klucza `fruit-salon:v1`. Dostęp do niego dla plików `file://` zależy od przeglądarki i lokalizacji HTML; eksport jest przenośną kopią. Przy uszkodzonym zapisie oryginał jest chroniony, można go pobrać przez `Download damaged original`. Przy odmowie storage gra działa w pamięci z ostrzeżeniem — eksportuj przed zamknięciem. Wynik i saldo zapisują się razem przed animacją; restart nie wypłaca drugi raz.

## Źródła i sprawdzenia

Wymagany Node24 lub26 (sprawdzono26.12.1). Pierwsze `npm ci` pobiera zależności; zbudowana gra ich nie pobiera.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run check:offline
```

`npm run dev` uruchamia Vite do pracy nad źródłami. Tylko development ma oznaczone przyciski wymuszonych scenariuszy; nie ma ich w `dist/index.html`. Phaser jest przypięty do4.2.1, zależności zapisane w lockfile. `build` generuje jeden samodzielny plik, bez katalogu `public` i zewnętrznych fontów.

Powtarzalny odbiór pliku offline w lokalnym Chromium:

```sh
node scripts/browser-acceptance.mjs
node scripts/browser-reel-clipping.mjs
node scripts/browser-save-business.mjs
node scripts/browser-idle.mjs
node scripts/browser-performance.mjs
```

Te skrypty używają zainstalowanego `/usr/bin/chromium`; na innym systemie dostosuj `executablePath`. Nie instalują przeglądarki i nie uruchamiają serwera. Test przycinania porównuje piksele klatek przez Python/Pillow. Testy wymuszają wyniki przez podmianę RNG **w swoim środowisku przeglądarkowym**, bez produkcyjnego panelu ani dopisywania salda w grze. Raport wydajności jest z headless SwiftShader, nie z docelowego GPU użytkownika.

## Zasoby i raport

Własna rodzina bitmap powstała w `image_gen`, liczby7/WILD i dokładna obudowa kodowo, audio to13 oryginalnych syntetycznych WAV. Nie wykorzystano sampli Kenney/Freesound — pobranie archiwum Kenney dało HTTP403. Szczegóły, źródła i modyfikacje: [runtime manifest](src/assets/manifest.json), [pochodzenie i prompty](docs/asset-generation.md), [noty Phaser MIT](docs/THIRD_PARTY_NOTICES.md). Bezstratne źródła i generatory są w repozytorium.

[Wykonane testy i ograniczenia](docs/playtest.md), [decyzje](docs/decisions.md), [dokładna matematyka](docs/math-report.json), [pomiar techniczny](docs/performance-report.json), niezależne review w `docs/reviews/`.

Odbiór poprawionej oprawy przez użytkownika, odsłuch na słuchawkach/głośnikach oraz60FPS na jego komputerze pozostają osobnymi, niesprawdzonymi pozycjami. Kod i pomiar headless tego nie zastępują.
