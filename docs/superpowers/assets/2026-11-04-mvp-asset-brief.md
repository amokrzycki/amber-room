# MVP — brief produkcji grafiki i dźwięku

Status: gotowy brief do wykonania w repozytorium. Nie zawiera jeszcze wygenerowanych obrazów ani pobranych/odsłuchanych sampli.

Źródło wymagań: [specyfikacja](../specs/2026-11-04-juicy-fruit-salon-design.md). Towarzyszący [manifest planowanych zasobów](./2026-11-04-mvp-assets.plan.json) to lista produkcyjna, nie lista istniejących plików. Przed dostarczeniem uzupełnić runtime manifest rzeczywistymi plikami, pochodzeniem i wynikami kontroli.

## Wspólny kierunek

Klasyczny salonowy automat: ciemne pola bębnów, nasycone błyszczące owoce o wyraźnej sylwetce, czerwono-złota obudowa i turkusowe wyróżnienia wygranych. Wrażenie fizycznej maszyny z dopracowaną grafiką 2D. [Zdjęcie referencyjne](../references/salon-fruit-machine.png) opisuje materiały i czytelność; nie kopiować nazwy, logo ani gotowych symboli producenta.

Scena odniesienia 1600 × 900. Bębny zawsze 5 × 3. Automat wypełnia cały obszar gry, bez salonu za nim. Salon jest drugim ekranem. Tekst po polsku, font i wartości renderowane kodem.

Proponowana paleta ról, do drobnego strojenia w kontekście: tło pola `#171214`, bordo obudowy `#A9142D`, ciepłe złoto `#D8AF55`, turkus wygranej `#35E6D1`, jasny tekst `#FFF2CC`. Nie stosować tej palety jako limitu liczby kolorów owoców. Materiały: lakierowana czerwień, metaliczne złoto, gładka skórka owoców; jedno światło z góry i lewej. Owoce duże, czytelne i zbliżone optycznie pod względem ciężaru, bez fotorealistycznego szumu.

## Pierwszy wzorzec i rodzina symboli

Wykonawca ma zgodę samodzielnie wybrać najlepszy kierunek zgodny ze zdjęciem i zapisać uzasadnienie. Najpierw przygotować wiśnie i mały fragment obudowy; ocenić je na ciemnym polu bębna przy rozmiarze ekranowym. Po wyborze wzorca przygotować pozostałe symbole jako warianty tej samej rodziny. Nie zatrzymywać prac w oczekiwaniu na osobne zatwierdzenie każdego owocu.

Minimalne źródła symboli: osobne PNG 512 × 512 lub większe, rzeczywiste alpha, centralny pivot, bez przyciętych refleksów. Po normalizacji docelowe kafle 512 × 512 z bezpiecznym marginesem około 10% i podobnym rozmiarem optycznym. Filtrowanie liniowe/antyaliasing, nie pixel art. Sześć symboli: wiśnie, cytryna, śliwka, arbuz, siódemka i wild. Siódemkę/wild można złożyć z oryginalnego kodowego znaku i efektów, jeśli daje to lepszą kontrolę niż tekst z generatora.

### Prompt bazowy do wygenerowania wiśni

> Production 2D slot-machine symbol: a pair of ripe red cherries with one glossy green leaf, centered and fully visible. Front-facing with subtle dimensional volume. Bold clean dark outline, rounded forms, saturated red, restrained specular highlights, consistent light from the upper left. Classic polished fruit-machine art, highly readable at small size. Transparent background with genuine alpha. No lettering, no logo, no slot cabinet, no scene, no checkerboard, no duplicate symbols, no cropped edges. Square source image with generous clean padding.

Gdy narzędzie udostępnia opcję przezroczystości, użyć jej. Sam zapis „transparent” w prompcie nie jest dowodem alpha. Do rzeczywistego generowania lub edycji przeczytać dostępny skill imagegen; referencje przekazać mechanizmem obsługiwanym przez narzędzie, nie samą nazwą pliku w opisie.

### Warianty rodziny

Używać wybranego obrazu wzorcowego jako referencji stylistycznej. Zachować kontur, kierunek światła, materiał, gęstość detali i skalę. Zmieniać wyłącznie temat: żółta cytryna, fioletowa śliwka, charakterystyczny arbuz oraz własne warianty siódemki/wilda. Nie ufać wygenerowanemu atlasowi z równymi polami; każdy symbol sprawdzić osobno, a atlas złożyć deterministycznie.

## Obudowa i salon

**Obudowa:** obraz dekoracyjny z pustym/transparentnym obszarem bębnów, bez wypalonych cyfr, napisów, przycisków i imitacji ekranu z gotowym wynikiem. Światła, refleksy reagujące na wygraną i ramki powstają w kodzie. Jeżeli generowanie pełnej ramy daje złą geometrię, narysować dokładną ramę kodowo i użyć bitmap jako ornamentów; geometria bębnów ma pierwszeństwo przed przypadkową dekoracją.

**Salon:** spokojny, ciepły lokal w jednej stałej perspektywie, bez rozbudowanych postaci. Osobny bar i sprite dodatkowej maszyny muszą pasować do kamery i oświetlenia tła. Zarezerwować trzy miejsca na maszyny biznesowe; jeden spójny sprite można powtórzyć. Widoczny własny automat prowadzi do sceny slot.

Poziomy baru i wyposażenia mogą wykorzystywać ten sam bazowy asset z kodowymi dodatkami, zmianą oświetlenia i rozmieszczenia drobnych dekoracji. Trzy poziomy muszą być widoczne w salonie; nie wymagają trzech całkowicie nowych teł. Katalog zakupów jest czytelnym interfejsem, nie kolejną bitmapą.

## Lista audio i charakter brzmienia

Przygotować niewielki, spójny zestaw. Bez ciągłej głośnej muzyki jako obowiązkowego elementu MVP.

- `press`: krótki, suchy mechaniczny klik dający natychmiastową odpowiedź START.
- `reels`: krótka pętla mechanizmu, bez słyszalnego szwu i nagłego skoku głośności.
- `stop-a/b/c`: bliska rodzina trzech krótkich zatrzaśnięć, zsynchronizowana z osadzeniem bębna.
- `payout-tick`: delikatny, powtarzalny impuls licznika; tempo i polifonia ograniczone.
- `payout-end`: jedno czytelne zakończenie naliczania.
- `win-small`, `win-big`, `win-jackpot`: motywy z jednej palety/tonacji; skala przez warstwy i rozwinięcie, nie samą głośność.
- `salon-ambience`: dyskretna atmosfera urządzeń i lokalu, zrozumiała także przy cichym miksie.
- `salon-cheer`: krótka reakcja salonu spoza kadru na większą wygraną, bez przesadnej owacji przy każdym trafieniu.
- `salon-toast`: krótki akcent opcjonalnego wydatku „postaw kolejkę”.

### Skąd pozyskiwać

1. [Kenney Casino Audio](https://kenney.nl/assets/casino-audio) — kasynowe foley, CC0. Źródło żetonów i drobnych elementów, nie potwierdzony kompletny zestaw bębnów/jackpotów.
2. [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) / [UI Audio](https://kenney.nl/assets/ui-audio) — kliknięcia i potwierdzenia, CC0.
3. [Freesound](https://freesound.org/help/faq/) — uzupełniające mechanizmy i otoczenie; preferowane konkretne pliki CC0, z zachowanym adresem i kopią warunków. Przydatne hasła: mechanical latch, ratchet, switch, motor loop, arcade ambience, glass clink, small crowd cheer. Wybór po odsłuchu, nie po samym tytule.
4. Własna synteza — motywy tonalne i brakujące krótkie warstwy. Jeśli zewnętrzny zasób wymaga niedostępnego konta, wybrać legalnie dostępną alternatywę; nie blokować całej implementacji na jednym samplu.

Brak zgody na zakupy płatnych paczek. Licencja CC0 jest preferencją upraszczającą przekazanie gry; CC BY dopuszczalne po zapisaniu wymaganych credits. Nie kopiować dźwięków z istniejącego automatu ani gameplayu na YouTube.

Bezstratne źródła zachować przed obróbką. Runtime może na początek używać krótkich WAV; kompresję zastosować, jeśli rozmiar artefaktu tego wymaga i po sprawdzeniu dekodowania w docelowej przeglądarce. Odtwarzanie przez Phaser, jeden kontekst audio, proste grupy SFX/Ambience, bez nowej biblioteki audio.

## Kontrola jakości i dowody

Sprawdzić wymiary, alpha, stabilne pivots, marginesy i rozmiar optyczny. Zrobić arkusz kontaktowy na jasnym i ciemnym tle, następnie obejrzeć w rzeczywistej scenie przy skali gry. Ruch wykonywać w Phaserze; nie generować gotowego filmu kręcenia jako podstawy mechaniki.

Audio przyciąć, usunąć kliknięcia na granicach pętli, wyrównać głośności i sprawdzić mix z jednoczesnym licznikiem/ambience. Zachować zapas głośności; muted i skip mają zatrzymać wszystkie warstwy. Odsłuch na słuchawkach i głośnikach zapisać jako faktycznie wykonany albo niesprawdzony.

W `src/assets/manifest.json` podać rzeczywiste ścieżki, autora/narzędzie, URL lub zapis generowania, licencję, modyfikacje oraz wynik kontroli. Wpisy `planned`/`candidate` nie są dowodem dostarczenia assetu. Wygenerowane lub biblioteczne pliki można uznać za gotowe dopiero po sprawdzeniu ich w grze.
