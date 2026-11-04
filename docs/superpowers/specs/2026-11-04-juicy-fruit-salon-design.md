# Owocowy salon offline — projekt gry

Data aktualizacji: 2026-11-04. Status: uzgodniony kierunek produktu, robocze parametry balansu, bez implementacji.

Pakiet wykonawczy MVP: [prompt startowy](../../../START-MVP.md), [brief zasobów](../assets/2026-11-04-mvp-asset-brief.md) i [lista planowanych zasobów](../assets/2026-11-04-mvp-assets.plan.json). Zlecenie implementacji następuje po użyciu promptu w docelowym repozytorium; dokumenty w tej sesji przygotowują przekazanie.

## Intencja i zaakceptowane decyzje

Prywatna gra dla jednego gracza, ewentualnie do wysłania znajomemu. Bez backendu i prawdziwych pieniędzy. Priorytetem są płynne, satysfakcjonujące obroty i wygrane; pełnowartościowe idle dostarcza budżet oraz cele zakupowe przy niewielkiej obsłudze.

Użytkownik zaakceptował:

- **Phaser + TypeScript + Vite.**
- **Dwa osobne widoki:** salon właściciela i automat. Otwarty automat zajmuje cały obszar gry; salonu nie widać za bębnami.
- **Klasyczny HUD automatu:** środki po lewej, stawka po prawej, wypłata pośrodku.
- **Stały układ 5 × 3 i zmienną liczbę aktywnych linii.**
- Kierunek idle: zaplecze salonu zarabia; żetony można wydać na granie albo trwały rozwój. Bar i dodatkowe automaty są wskazanymi przez użytkownika przykładami dochodu.
- Spójną oprawę własnych symboli i krótkie próbki dźwięków uzupełnione syntezą, zgodnie z propozycją z poprzedniego etapu.
- Swobodę wykonawcy w szczegółach implementacji, niezależne sprawdzanie kodu i logiki oraz powtarzalne scenariusze odbioru.
- **Stonowaną skalę pieniędzy.** Rozwój nie prowadzi do typowych dla idle kwot milionowych/bilionowych i mnożników bez końca.

Wcześniejsze wymaganie pozostaje aktualne: „Większa wygrana powinna też być satysfakcjonująca dopaminowa ale nie przesadzona, salon powinien się cieszyć”. Opisuje to oczekiwane wrażenie, nie medyczną obietnicę. W widoku automatu radość salonu przekazują dźwięk spoza kadru i światła jego obudowy; nie pokazujemy sąsiednich maszyn za bębnami.

## Referencje i granice odwzorowania

- [Zdjęcie użytkownika](../references/salon-fruit-machine.png), zachowane bez zmian: błyszczące owoce, wyraźne kontury, czerwono-złota obudowa, ciemne pola, czerwone 7 WILD, turkusowe wyróżnienia i centralna wypłata.
- [Hot Wild 7s — producent](https://wizard.games/project/hot-wild-7s/) jest referencją klimatu. Nasze 5 × 3 wynika z decyzji użytkownika; internetowy opis Hot Wild 7s nie ustala naszych zasad.
- Własna nazwa i spójne grafiki; dźwięki autorskie lub z bibliotek pozwalających wykorzystać je w grze. CloverPit jest ogólną inspiracją dla automatu z celami, nie wzorcem do kopiowania całej oprawy.
- Nie przeanalizowano nagrania ruchu ani audio wskazanej rzeczywistej maszyny. Czasy i brzmienia trzeba ocenić na prototypie.

## Technologia i zgodność wersji

Phaser odpowiada za sceny, rendering, animacje, wejście i odtwarzanie audio. Logika wypłat i salonu pozostaje czystym TypeScriptem. Wybrany stos jest zatwierdzony; Godot i PixiJS były rozważanymi alternatywami.

Proponowana baza nowego projektu: **Phaser 4.2.1**, potwierdzona w [oficjalnym wykazie wydań](https://phaser.io/download/phaser4). Wersję przypiąć dokładnie w manifestach/lockfile. Przykłady Phaser 3 dotyczące pipeline'ów, `preFX/postFX` i masek nie są bezpośrednią instrukcją dla Phaser 4; stosować [oficjalny przewodnik zmian](https://phaser.io/news/2026/04/migrating-from-phaser-3-to-phaser-4-what-you-need-to-know). Nie migrować istniejącego projektu na inną główną wersję w trakcie realizacji bez nowego ustalenia.

Pierwsza wersja na komputer, mysz i klawiatura, układ poziomy. Renderowanie WebGL. Całość działa lokalnie; proponowane dostarczenie to jeden HTML z osadzonymi zasobami. Osadzenie próbek audio też wymaga kontroli artefaktu.

## Wymagania globalne

- Jedna lokalna gra, bez backendu, kont, płatności i wymiany żetonów na rzeczywiste dobra.
- Automat zajmuje cały obszar gry; salon jest osobną sceną i nie jest tłem automatu.
- Układ 5 × 3 jest stały, aktywne linie można zmieniać przed obrotem.
- HUD: środki po lewej, wypłata pośrodku, stawka i jej składniki po prawej.
- Saldo, stawki, ceny i wypłaty to nieujemne bezpieczne liczby całkowite; brak ujemnego salda.
- Każdy obrót rozlicza się dokładnie raz i zapisuje wynik przed animacją.
- Wypłata niższa lub równa łącznej stawce nie uruchamia celebracji zysku.
- Parametry ekonomii są jawne i stałe; brak osobistego dostrajania szans do historii gracza.
- Dochód i ulepszenia mają skończone tabele; brak prestiżu, mnożników wykładniczych i notacji K/M/B.
- Cała wylosowana wypłata trafia do portfela; nie obcinać jej ukrytym limitem salda.
- Wyciszenie, ograniczony ruch, intensywność efektów i pomijanie celebracji działają w pierwszej wersji.
- Zapis lokalny, walidowany eksport/import JSON i czytelny błąd zapisu.
- Artefakt uruchamia się offline, bez zdalnych skryptów, fontów, obrazów i audio.

## Widoki i sterowanie

**Salon:** nieruchomy widok 2D własnego lokalu z barem, dodatkowymi automatami i wyposażeniem. Pokazuje saldo, aktualny dochód netto na godzinę oraz skończony katalog zakupów. Własny automat jest klikalnym wejściem do sceny gry. Nie symulujemy NPC, obsługi klientów ani gastronomii.

**Automat:** bębny i obudowa wypełniają scenę. Dolny panel ma saldo po lewej, wygraną pośrodku, stawkę po prawej i wyraźny przycisk START. Przy stawce rozróżnić „Stawka/linię”, „Linie” i „Stawka łączna”, aby zmiana liczby linii nie podnosiła kosztu niepostrzeżenie. Dostępny powrót do salonu, tabela wypłat i ustawienia.

Pełny obszar gry nie wymaga zgody przeglądarki na systemowy fullscreen. Opcjonalne przejście w prawdziwy fullscreen tylko na gest użytkownika; odmowa nie blokuje gry. Proponowana rozdzielczość odniesienia 1600 × 900, skalowanie FIT, zachowane proporcje i czytelne marginesy. Odbiór również przy 1280 × 720 i 1920 × 1080.

W trakcie ruchu blokować zmianę linii/stawki i powrót; po rozstrzygnięciu pozwolić skrócić celebrację i wrócić do salonu. Klik lub spacja kończące celebrację są zużywane; ten sam gest nie rozpoczyna kolejnego obrotu. Przytrzymana spacja nie daje auto-spin. Zmiana sceny nie zostawia pętli audio, listenerów ani tweenów.

## Automat, linie i stawki

Pierwsza wersja: jeden grywalny automat, sześć symboli: `cherry`, `lemon`, `plum`, `melon`, `seven`, `wild`. Dodatkowe maszyny biznesowe są źródłami dochodu, nie osobnymi grami do zaimplementowania.

Robocze ustawienia wybieralne: liczba aktywnych linii `1, 5, 10, 20, 40`, stawka na linię `1, 2, 5`. Domyślnie `5` linii i `1` żeton na linię; koszt obrotu `5`. Łączny koszt to `lineCount × perLine`, maksymalnie `200`. Wykonawca może stroić ten katalog w ramach skali ekonomii; zmianę zapisuje i aktualizuje testy.

Konfiguracja zawiera jeden uporządkowany katalog 40 unikatowych linii. Każda linia to pięć indeksów wierszy z zakresu `0–2`. Aktywne jest pierwszych N linii. Pierwsze pięć: `[1,1,1,1,1]`, `[0,0,0,0,0]`, `[2,2,2,2,2]`, `[0,1,2,1,0]`, `[2,1,0,1,2]`. Pozostałe 35 może dobrać wykonawca jako stałe, czytelne ścieżki; test zapewnia unikatowość i zgodność prezentacji z rozliczeniem. Nie losować kształtu linii podczas gry.

Początkowy pasek dla każdego bębna: `cherry, lemon, plum, cherry, melon, lemon, seven, cherry, plum, lemon, melon, wild`. Losować pięć pozycji zatrzymania; widoczne wiersze to kolejne pozycje z zawijaniem. To własna matematyka robocza.

Wygrywają ciągi minimum trzech symboli od lewej. Wild zastępuje symbol zwykły i może płacić jako własny symbol. Dla każdej aktywnej linii sprawdzić wszystkie dopasowania i wypłacić wyłącznie najwyższe. Sumować wypłaty aktywnych linii. Kwota stawki na linię mnoży wynik tabeli; nie dzielić łącznej stawki przez stałą pięć.

Robocze mnożniki stawki na linię za 3 / 4 / 5 symboli: cherry `2/5/15`, lemon `3/8/20`, plum `4/12/35`, melon `6/20/60`, seven `12/40/120`, wild `20/80/200`. Zmiana linii przed nowym obrotem nie zmienia wyniku ani kosztu poprzedniego. Rekord obrotu przechowuje zastosowany zakład.

Darmowe obroty, dodatkowe grywalne maszyny i bonusowe minigry pozostają poza pierwszą wersją.

## Pozyskanie grafiki i audio — propozycja produkcyjna

Grafiki charakterystyczne dla gry przygotować jako własną rodzinę, z użyciem generowania bitmap i kontroli opisanej w create-game-assets. Pierwszy wzorzec: wiśnie na przezroczystym tle, mocny kontur, zaokrąglona objętość, wyraźny refleks i zgodny ze zdjęciem kierunek światła. Oceniać na ciemnym polu bębna w docelowej skali. Z tego wzorca wyprowadzić pozostałe symbole; nie generować sześciu niezależnych kierunków stylistycznych.

Propozycja plików źródłowych symboli: osobne PNG z rzeczywistym alpha, co najmniej 512 × 512 na symbol. Atlas pakować deterministycznie dopiero po kontroli marginesów, skali i pivotów. Nie polegać na wygenerowanej siatce jako gotowym spritesheecie.

Obudowę podzielić na statyczną dekorację oraz rysowane kodem światła, przyciski, ramki linii i liczniki. Tekst, cyfry, stany i reakcje interfejsu pozostają kodowe. Salon przygotować w jednej perspektywie, z osobnym barem, miejscami dodatkowych maszyn i wariantami wyposażenia; zakup zmienia te elementy bez ponownego generowania całego pomieszczenia.

Dźwięki dobierać jako materiały do wspólnego sound designu:

- [Kenney Casino Audio](https://kenney.nl/assets/casino-audio): paczka CC0 z kasynowym foley, m.in. żetonami, kartami i kośćmi; źródło drobnych odgłosów, nie potwierdzony gotowy zestaw bębnów i jackpotów.
- [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) lub [UI Audio](https://kenney.nl/assets/ui-audio): paczki CC0 jako baza kliknięć i potwierdzeń.
- [Freesound](https://freesound.org/help/faq/): uzupełniające mechanizmy, szum urządzeń i atmosfera lokalu. Preferować pliki CC0; każdy konkretny plik sprawdzić oddzielnie. CC BY wymaga uwzględnienia wskazania autora w credits. Samo istnienie pliku w serwisie nie oznacza jeszcze jego wyboru do gry.

Minimalny zestaw dźwięków: przycisk START, krótka pętla ruchu, kilka wariantów zatrzymania, tick naliczania, zakończenie wypłaty, krótkie motywy small/big/jackpot, dyskretna atmosfera i reakcja salonu. Motywy wypłat zbudować w jednej palecie brzmienia i tonacji, używając własnej syntezy oraz wybranych sampli. Wrażenie mechanicznego stopu tworzyć z warstw, a nie dopasowywać go do przypadkowego długiego nagrania.

Zachować bezstratne pliki źródłowe; warianty runtime przycinać, wyrównywać głośności i kodować do wspieranego formatu po sprawdzeniu przeglądarki. Każdy użyty plik ma wpis w manifeście: autor/źródło, adres konkretnego zasobu, licencja i wykonane modyfikacje. Zapis pochodzenia obejmuje również narzędzie generujące własne grafiki.

Nie wybrano jeszcze konkretnych plików audio, nie wykonano odsłuchu i nie wygenerowano grafik. Powyższy dobór źródeł jest rekomendacją do wykonania, a nie deklaracją gotowego pakietu produkcyjnego.

## Ruch, dźwięk i reakcja salonu

Profil roboczy: rozruch `180 ms`, wspólny ruch `650 ms`, hamowanie `220 ms`, odstęp startu hamowania kolejnych bębnów `140 ms`; całość około `1610 ms`. Bębny przewijają się w jednym kierunku, z lekkim rozmyciem, kontrolowanym wyhamowaniem i osadzeniem symboli. Wynik jest ustalony przed animacją. Ruch zależy od czasu, nie liczby klatek.

Po zatrzymaniu wskazać zwycięskie symbole i turkusowe ścieżki; licznik wypłaty pokazuje kwotę brutto. Poziom celebracji zależy od zysku `payout - totalStake`:

- `neutral`: zysk `<= 0`, bez fanfar.
- `small`: zysk `> 0` i `< 5 × totalStake`, do `700 ms`.
- `big`: zysk `>= 5 × totalStake` i `< 20 × totalStake`, do `2200 ms`.
- `jackpot`: zysk `>= 20 × totalStake`, do `4000 ms`.

Dla dużej wygranej i jackpotu obudowa odpowiada sekwencją świateł, zwycięskie owoce krótką animacją, a odgłosy salonu spoza kadru łagodną reakcją. Ciepła poświata może objąć obudowę, lecz nie odsłania widoku salonu. Dodatkowa warstwa dźwięku i końcowy akcent licznika domykają wygraną. Nie uruchamiać każdego efektu jednocześnie z maksymalną siłą.

Autorskie lub licencjonowane krótkie próbki przycisku, mechanizmu, zatrzymania, wypłat i atmosfery salonu; synteza uzupełnia ich warstwy i może tworzyć własne motywy wypłat. Wykorzystać narzędzia audio Phasera, jeden kontekst audio i proste grupy SFX/Ambience. Gdy ważna wypłata gra, ambience lekko cichnie, po czym wraca do poziomu wynikającego z ustawień gracza. Nie zwiększać głośności w nieskończoność wraz z kwotą. Pętle kończą się przy skipie, ukryciu karty i zamknięciu sceny.

Pierwszy gest odblokowuje dźwięk. Wyciszenie obejmuje wszystkie aktywne źródła. Ograniczony ruch usuwa potrząsanie, duże skalowanie i intensywne błyski, zachowując czytelny wynik. Unikać szybkiego migotania i pełnoekranowych białych błysków.

## Salon i ekonomia o umiarkowanej skali

Jeden portfel żetonów. Dochód biznesu jest stałym **dochodem netto**; nie dodawać drugiego systemu ręcznego rozliczania czynszu/pracowników. Saldo początkowe `1000`, bazowy dochód `120/h`, maksymalnie `8 h` rozliczenia jednej przerwy. Dochód trafia automatycznie do portfela; bez obowiązku klikania „odbierz”.

Poniższe skończone tabele są propozycją wykonawczą do symulacji:

- **Bar, poziomy 0–3:** kolejne zakupy `500,1000,2000`; dodatkowy dochód dla poziomów `0,40,80,120/h`.
- **Dodatkowe automaty, liczba 0–3:** ceny kolejnych sztuk `750,1500,3000`; każda dodaje `60/h`. Przyrost dochodu jest liniowy.
- **Wyposażenie salonu, poziomy 0–3:** kolejne zakupy `300,900,1800`; widoczna zmiana wyglądu, bez mnożnika dochodu i bez zmiany szans automatu.
- **Opcjonalne „Postaw kolejkę”, koszt `50`:** krótka reakcja w widoku salonu, bez nagrody i statystycznego bonusu. To proponowany niewielki wydatek dla klimatu właściciela, nie obowiązek ani nowa mechanika alkoholu/postaci.

Najwyższy dochód z powyższej tabeli wynosi `420/h`, czyli maksymalnie `3360` za ośmiogodzinną przerwę. Żaden zakup nie odblokowuje nieograniczonego automatycznego mnożenia. Bar, automaty i wyposażenie mają trwałą reprezentację w salonie, a nie wyłącznie większy numer w menu.

Dochód z biznesów nie odzyskuje bezpośrednio żetonów przegranych przez właściciela w ręcznych obrotach. Nie dopisywać straty drugi raz jako „zarobku własnego kasyna”. Ulepszenia nie zmieniają RNG, stawek ani tabeli wypłat.

Pieniądze pokazywać zwykłymi liczbami z separatorem tysięcy, bez K/M/B. Cel balansu: codzienne operacje w dziesiątkach, setkach i tysiącach; duże jednorazowe wygrane mogą wejść w dziesiątki tysięcy. Przy obecnej tabeli bezpieczna górna granica sumy wypłat to `40_000` przy zakładzie `40 × 5` (40 linii razy stawka 5 razy najwyższy mnożnik 200). Faktyczny osiągalny maksymalny wynik zależy od pasków i katalogu ścieżek; policzyć go przy enumeracji. Nie jest to limit odcinający wynik.

Nie wprowadzać ukrytego twardego limitu portfela ani konfiskaty nadwyżki. Skończone ulepszenia i stawki ograniczają wzrost, ale sam liniowy dochód nie daje matematycznej gwarancji małego salda przez dowolnie długi czas. Symulacja długich sesji ma wykrywać nadmierną akumulację; korygować jawne ceny, dochód i wydatki, nie odzyskiwać już zdobytych żetonów. Twardy limit bogactwa wymagałby osobnej decyzji użytkownika.

Dla strojenia przyjąć roboczo: budżet powrotu po dobie wystarcza na co najmniej 100 obrotów przy ustawieniach domyślnych; od zera najtańszy obrót jest ponownie dostępny najpóźniej po godzinie bez zakupu. Oczekiwaną długość sesji i częstość dużych wygranych ustalić na podstawie symulacji i ogrania, nie zmieniać szans zależnie od gracza.

Naliczanie zachowuje resztę ułamkowej produkcji jako licznik całkowity o mianowniku `3_600_000`. Czas do zakupu rozliczyć według starej stawki; po zakupie obowiązuje nowa. Cofnięcie zegara nie daje ujemnego ani podwójnego dochodu. To lokalna obsługa czasu, nie system antycheat.

## Zapis i odporność

Wersja pierwszego, jeszcze niewydanego schematu pozostaje `1`. Pola: `version`, `balance`, `businesses: {barLevel, extraMachines, decorLevel}`, `lastAccrualAtMs`, `remainderUnits`, `nextSpinId`, `lastSpin`, `selectedBet`, `settings`. Rekord `lastSpin` zawiera ID, zastosowany zakład, stawkę łączną i wynik. Poziomy i liczby biznesów są w zakresie `0–3`.

Ustawienia obejmują `muted`, `reducedMotion`, `effectsIntensity` w `[0,1]`. Sceny używają jednego wspólnego właściciela danych; zmiana sceny nie tworzy drugiego portfela. Nie zapisujemy obiektów Phasera. Po restarcie otworzyć salon, zachować ostatnią wypłatę jako historię, bez ponownego rozliczenia i bez automatycznego odtwarzania fanfar.

Wynik i końcowe saldo zapisać razem przed animacją; skip nigdy nie zmienia portfela. Uszkodzonego zapisu nie nadpisywać automatycznie. Przy braku dostępu do pamięci pozwolić grać w pamięci i eksportować JSON z widocznym ostrzeżeniem. Import waliduje całość przed zastąpieniem danych. Zmiana katalogu/lokalizacji HTML może zmienić dostęp do localStorage; postęp przenosi się eksportem/importem.

## Autonomia i kryteria odbioru

Wykonawca sam dobiera szczegóły komponentów, zgodne narzędzia, stałe ścieżki linii, parametry ruchu i ceny w opisanej skali. Zapisuje istotne decyzje i wyniki strojenia. Nie zmienia zaakceptowanego stosu, dwóch widoków, układu HUD, zasad waluty ani zakresu gry.

Workflow i role przeglądu opisuje [workflow implementacji](../workflows/2026-11-04-fruit-salon-workflow.md). Review kodu/logiki jest niezależne od wykonawcy, na skonfigurowanym domyślnym modelu subagentów. Mocniejszy model wyłącznie na wyraźne polecenie użytkownika; nie używać GPT-6 Astra.

Kontrola feelingu po pierwszym dopracowanym obrocie pozostaje punktem opinii użytkownika. Brak odpowiedzi nie jest akceptacją. W oczekiwaniu można pracować nad niezależną logiką i testami salonu; końcowej subiektywnej oceny nie wolno zastąpić raportem PASS.

Kryteria odbioru: spójne sceny bez salonu za bębnami; poprawna cena i wypłata dla wszystkich ustawień linii; brak podwójnego rozliczenia; właściwa reakcja na każdą klasę wyniku; pełne wyciszenie i skip; widoczne zakupy w salonie; poprawny powrót z idle; działający zapis i offline. Cel płynności `60 FPS` na komputerze użytkownika; pomiar pozostaje do wykonania.

## Nadal do sprawdzenia w wykonaniu

Rzeczywiste odczucie dźwięku i animacji, ostateczne tempo zakupów oraz akumulacja waluty w długim okresie. Nazwę roboczą, kształty pozostałych linii i drobne detale wyposażenia wybiera wykonawca w zaakceptowanym stylu. Liczby ekonomii są punktami startowymi, a nie już zweryfikowanym balansem.
