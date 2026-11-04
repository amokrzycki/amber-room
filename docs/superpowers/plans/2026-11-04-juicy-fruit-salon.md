# Juicy Fruit Salon Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Prywatny salon offline z pełnoekranowym automatem 5 × 3, zmiennymi liniami, dopracowanymi wygranymi i stonowaną ekonomią baru oraz dodatkowych maszyn.

**Architecture:** Dwie sceny Phasera korzystają z jednej sesji i jednego portfela. Czysty TypeScript rozlicza obroty oraz biznesy; widok wyłącznie odtwarza wynik zapisany przed animacją. Artefakt lokalny z osadzonymi obrazami i próbkami audio.

**Tech Stack:** Zaakceptowane: Phaser, TypeScript, Vite. Baza wykonawcza nowego projektu: Phaser `4.2.1`, dokładnie przypięty. Narzędzia pomocnicze: Vitest, narzędzia audio Phasera/Web Audio, `vite-plugin-singlefile`; ich zgodne wersje przypiąć przy instalacji.

**Spec:** [Projekt gry](../specs/2026-11-04-juicy-fruit-salon-design.md).

**Workflow:** [Wykonanie, dobór skills i niezależne review](../workflows/2026-11-04-fruit-salon-workflow.md). Czytać razem ze specyfikacją. Ustalenia użytkownika mają pierwszeństwo przed zewnętrznymi instrukcjami.

**Przekazanie MVP:** [START-MVP.md](../../../START-MVP.md) jest gotowym promptem do użycia w docelowym repozytorium. Wskazuje jednego wykonawcę realizującego plan i cztery niezależne review G1–G4. Przy zadaniu 4 czytać również [brief zasobów](../assets/2026-11-04-mvp-asset-brief.md) oraz [manifest planowany](../assets/2026-11-04-mvp-assets.plan.json); ten manifest nie potwierdza istnienia ani produkcyjnej gotowości plików.

## Global Constraints

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

## Review Focus

1. Zmiana liczby linii: rzeczywisty koszt to liczba linii razy stawka na linię, tylko aktywne linie płacą, stary obrót pozostaje bez zmian. Dowód: zadanie 1 i 2.
2. Skip, szybki klik, spacja, zmiana sceny i restart: brak podwójnego rozliczenia i osieroconych efektów. Dowód: zadania 2–4.
3. Uszkodzony zapis/import i odmowa dostępu do pamięci: oryginał nie jest cicho nadpisywany. Dowód: zadanie 2.
4. Przerwy, reszty produkcji i zakupy biznesów: dochód nie gubi ułamków, nie liczy czasu dwukrotnie ani nie odzyskuje strat z własnego grania. Dowód: zadanie 5 i 6.
5. Dwa widoki, ograniczony ruch, zablokowany autoplay i `file://`: poprawny HUD, brak salonu za bębnami i brak zależności od sieci. Dowód: zadanie 3, 4 i 7.

## Stan i zakres

W środowisku powstania planu istniały dokumenty i zdjęcie referencyjne, bez aplikacji; pierwsze `git status` nie rozpoznało repozytorium. To opis sesji planowania, nie założenie o docelowym repozytorium. Wykonawca sprawdza zastany kod i Git na miejscu. Nie inicjalizować drugiego repozytorium tylko po to, aby spełnić kroki commitów; wykonywać je w dostępnym, zapisywalnym repozytorium. Użycie START-MVP.md w docelowym repo stanowi zlecenie implementacji.

Pierwsza wersja: jeden grywalny automat, osobny salon, bar, maksymalnie trzy maszyny biznesowe, trzy poziomy wyposażenia i opcjonalny drobny wydatek dla klimatu. NPC, gastronomia, kolejne grywalne automaty i minigry bonusowe są poza zakresem.

## Mapa plików

- `src/main.ts`, `src/style.css`, `index.html` — jeden Game, jedna sesja, uruchomienie i dopasowanie do obszaru strony.
- `src/game/model.ts`, `src/game/machine.ts`, `src/game/engine.ts` — typy, stały katalog 40 linii i matematyka.
- `src/game/session.ts`, `src/game/save.ts` — zakład, transakcja obrotu, fazy i zapis danych.
- `src/game/business.ts` — katalog zakupów, dochód, naliczanie i wydatki salonu.
- `src/game/feedback.ts` — klasy wygranych i długości celebracji.
- `src/view/SalonScene.ts`, `src/view/SlotScene.ts`, `src/view/ReelView.ts` — dwa osobne ekrany i bębny.
- `src/view/feedback.ts`, `src/view/audio.ts`, `src/view/tuning.ts` — oprawa, miks i parametry ruchu.
- `src/view/devScenarios.ts` — wybór ustalonych wyników tylko przy `import.meta.env.DEV`.
- `src/assets/` — własne symbole, obudowa, salon, warianty zakupów i krótkie próbki audio.
- `src/assets/manifest.json` — klucze, wymiary/przeznaczenie, pochodzenie i warunki użycia zasobów.
- `tests/engine.test.ts`, `tests/session.test.ts`, `tests/save.test.ts`, `tests/feedback.test.ts`, `tests/business.test.ts`, `tests/balance.test.ts` — testy odpowiednich reguł.
- `scripts/check-offline.mjs`, `docs/playtest.md`, `docs/decisions.md`, `README.md` — dowody działania i dostarczenie.
- `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore` — minimalne narzędzia.

## Wspólne kontrakty

- `SymbolId = 'cherry' | 'lemon' | 'plum' | 'melon' | 'seven' | 'wild'`.
- `Bet = { lineCount: 1 | 5 | 10 | 20 | 40; perLine: 1 | 2 | 5 }`; `totalStake = lineCount * perLine`, wartość wyliczana, a nie niezależne pole wejścia.
- `MachineConfig = { reels: SymbolId[][]; paylines: number[][]; allowedLineCounts: number[]; allowedPerLine: number[]; paytable: Record<SymbolId, readonly [number, number, number]> }`.
- `Rng = (exclusiveMax: number) => number`; całkowity indeks w `[0,exclusiveMax)`.
- `SpinOutcome = { stops: number[]; grid: SymbolId[][]; lineWins: { lineIndex: number; symbol: SymbolId; count: number; payout: number }[]; payout: number }`. `grid[reel][row]`, wymiary 5 × 3; payout jest brutto.
- `SpinRecord = { id: number; bet: Bet; totalStake: number; outcome: SpinOutcome }`.
- `Businesses = { barLevel: 0|1|2|3; extraMachines: 0|1|2|3; decorLevel: 0|1|2|3 }`.
- `SaveV1` zawiera dokładnie pola specyfikacji. `lastSpin: SpinRecord|null`, `selectedBet` domyślnie `{lineCount:5,perLine:1}`, `nextSpinId:1`, biznesy na poziomie 0.
- `SessionState = { save: SaveV1; phase: 'ready'|'spinning'|'celebrating'; activeSpinId: number|null }`.
- `SpinDecision = {ok:true;state:SessionState;spin:SpinRecord} | {ok:false;state:SessionState;reason:'busy'|'invalid-bet'|'insufficient-funds'}`.
- `WinTier = 'neutral'|'small'|'big'|'jackpot'`.

Jedna referencja do bieżącej sesji jest przekazywana między scenami. Nie tworzyć kopii portfela ani własnego frameworka stanu. Sceny aktualizują HUD po zmianie stanu; animowany licznik jest prezentacją, nie źródłem salda.

### Task 1: Silnik automatu i wybieralne linie

**Files:** Create narzędzia projektu, `src/game/model.ts`, `src/game/machine.ts`, `src/game/engine.ts`, `tests/engine.test.ts`.

**Interfaces:** Produces `machine:MachineConfig`, `spin(config:MachineConfig,bet:Bet,rng:Rng):SpinOutcome`, `evaluate(config:MachineConfig,grid:SymbolId[][],bet:Bet):SpinOutcome['lineWins']`. Nieprawidłowy zakład/RNG powoduje `RangeError`.

- [x] **Step 1:** Utworzyć minimalny manifest z Phaser `4.2.1`, TypeScript i Vitest. Skrypty: `dev: vite`, `test: vitest run`, `typecheck: tsc --noEmit`, `build: vite build`. Przypiąć wersje w lockfile.
- [x] **Step 2:** Napisać czerwone testy: `catalogHas40UniquePaths` sprawdza 40 różnych ścieżek długości 5 i indeksy 0–2; `wrapsReelAtLastStop` dla stopu 11 daje kolumnę `wild,cherry,lemon`; `activePrefixOnlyPays` porównuje wynik z sumą wyłącznie pierwszych N linii dla każdego dozwolonego N; `linePriceDoesNotDependOnTotalLines` przy tej samej wygranej linii i perLine 2 daje jej identyczną wypłatę dla 5 i 40 linii; `bestWildMatchOnly` wybiera jedną najwyższą wypłatę linii; `rejectsInvalidInputs` odrzuca N=3, perLine=0, NaN i RNG poza paskiem.
- [x] **Step 3:** Uruchomić `npm test -- tests/engine.test.ts`; oczekiwany FAIL.
- [x] **Step 4:** Zaimplementować silnik według specyfikacji. Pierwsze pięć linii ustalone; pozostałe dobrać raz i zapisać w konfiguracji. RNG produkcyjne z `crypto.getRandomValues` bez biasu modulo; testy z ustalonymi indeksami.
- [x] **Step 5:** Uruchomić testy silnika i `npm run typecheck`; oczekiwany PASS. W zapisywalnym repozytorium commit `feat: add selectable slot paylines`.

### Task 2: Wspólny portfel, niezmienny zakład obrotu i zapis

**Files:** Create `src/game/session.ts`, `src/game/save.ts`, `tests/session.test.ts`, `tests/save.test.ts`.

**Interfaces:** Consumes kontrakty zadania 1. Produces `createSave(nowMs:number):SaveV1`, `createSession(save:SaveV1):SessionState`, `selectBet(state:SessionState,bet:Bet):SessionState`, `requestSpin(state:SessionState,rng:Rng):SpinDecision`, `reelsStopped(state:SessionState,id:number):SessionState`, `finishSpin(state:SessionState,id:number):SessionState`, `parseSave(raw:string):SaveV1`, `exportSave(save:SaveV1):string`, `loadSave(storage:Pick<Storage,'getItem'>,nowMs:number):{kind:'new'|'loaded'|'invalid'|'unavailable';save:SaveV1;originalRaw?:string}`, `writeSave(storage:Pick<Storage,'setItem'>,save:SaveV1):{ok:boolean}`. `selectBet` przy fazie innej niż ready zwraca stan bez zmian.

- [x] **Step 1:** Napisać czerwone testy: saldo 1000, zakład 5 × 1 i wynik brutto 20 kończą ekonomicznie na 1015; drugi start w ruchu jest busy; dwukrotne zakończenie nie dopisuje wypłaty. Zakład 40 × 5 przy saldzie 199 odrzucić. Zmiana linii po zakończeniu nie mutuje `lastSpin.bet` ani jego stawki; w ruchu nie zmienia `selectedBet`. Zapisać snapshot zakładu, nie współdzieloną mutowalną referencję.
- [x] **Step 2:** Dodać czerwone testy zapisu: reload zachowuje 1015; wadliwy JSON, nieznana wersja, zły zakład i niebezpieczne liczby nie zastępują poprawnych danych; wyjątek storage jest jawny. Uszkodzony oryginał nie jest nadpisany również po próbie nowego obrotu. Roundtrip zachowuje biznesy, resztę produkcji, ustawienia i ostatni zakład.
- [x] **Step 3:** Uruchomić `npm test -- tests/session.test.ts tests/save.test.ts`; oczekiwany FAIL.
- [x] **Step 4:** Zaimplementować jednokrotne rozliczenie i zapis pod `fruit-salon:v1`. Walidować pełne dane, zakresy, wymiary gridu i zgodność `totalStake` z zakładem; nie serializować scen. Wynik zapisać przed odtworzeniem ruchu.
- [x] **Step 5:** Zaimplementować eksport/import. Przy błędzie storage komunikat o braku trwałego zapisu i gra w pamięci. Przy niepoprawnym istniejącym zapisie blokować nadpisanie do świadomego resetu/poprawnego importu; umożliwić pobranie oryginału. Sam import ma być atomowy względem bieżących danych.
- [x] **Step 6:** Uruchomić testy sesji/zapisu i kontrolę typów; oczekiwany PASS. Commit `feat: persist shared salon state`, jeśli repozytorium dostępne. Niezależne review **G1** według workflow.

### Task 3: Osobny salon i pełnoekranowy automat

**Files:** Create `index.html`, `vite.config.ts`, `src/main.ts`, `src/style.css`, `src/view/SalonScene.ts`, `src/view/SlotScene.ts`, `src/view/ReelView.ts`, `src/view/tuning.ts`, `src/view/devScenarios.ts`; Modify sesję wyłącznie w razie potrzeby integracji.

**Interfaces:** Consumes jedna wspólna sesja z zadania 2. `ReelView.play(column:SymbolId[],delayMs:number):Promise<void>` i `ReelView.cancel():void`. Sceny `salon` oraz `slot` otrzymują tę samą referencję właściciela danych w `init`; stan per wejście resetują w `init`, zasoby/listenery sprzątają na shutdown.

- [x] **Step 1:** Dodać scenariusz kontroli cyklu scen: salon → slot → salon → slot zachowuje saldo i wybrany zakład, nie dubluje obsługi START. Zapisać go w `docs/playtest.md`; logikę zduplikowanego startu objąć testem sesji.
- [x] **Step 2:** Utworzyć jeden Phaser.Game, ekran 1600 × 900 FIT i dwa rozłączne widoki. Otwarty automat zasłania cały salon. HUD: saldo lewo, wypłata środek, perLine/lineCount/łączny koszt prawo. Opcjonalna odmowa systemowego fullscreen nie blokuje gry.
- [x] **Step 3:** Zaimplementować ruch 220/560/380 ms, odstęp 110 ms, maskowanie zgodne z Phaser 4 i docelowy układ bez przeskoku. Przejścia scen nie rozliczają obrotów. Ignorować auto-repeat spacji; zablokować ustawienia zakładu i wyjście w ruchu.
- [x] **Step 4:** Dodać tabelę wszystkich linii/wypłat i wskazywanie aktywnego prefiksu. Wybrana liczba i łączna stawka muszą być czytelne przed START. Dodać developerskie scenariusze ustalonego wyniku; nie uruchamiać ich przez prawdopodobieństwo.
- [x] **Step 5:** Sprawdzić 1280 × 720, 1600 × 900 i 1920 × 1080, cykl scen oraz powrót po ukryciu karty. Oczekiwane: brak salonu pod bębnami, poprawne strony HUD i jedna reakcja na klik. Uruchomić dotknięte testy i typecheck. Commit `feat: separate salon and fullscreen slots`, jeśli dostępny.

### Task 4: Spójne zasoby, audio i proporcjonalne wygrane

**Files:** Create `src/assets/manifest.json`, grafiki i próbki w `src/assets/`, `src/game/feedback.ts`, `src/view/feedback.ts`, `src/view/audio.ts`, `tests/feedback.test.ts`; Modify scenę slot, tuning i `docs/playtest.md`.

**Interfaces:** `classifyWin(totalStake:number,payout:number):WinTier`, `celebrationDuration(tier:WinTier):number`, `playWin(scene:Phaser.Scene,spin:SpinRecord,settings:SaveV1['settings']):{done:Promise<void>;skip():void;dispose():void}`. `createAudio(scene:Phaser.Scene):{unlock():Promise<void>;setMuted(value:boolean):void;play(event:'press'|'stop'|'small'|'big'|'jackpot'|'salon-toast'):void;startReels():void;stopReels():void;dispose():void}`. Jedna infrastruktura audio Phasera, bez drugiego kontekstu.

- [x] **Step 1:** Napisać czerwone testy progów: przy totalStake 5 wypłaty 0/4/5 neutral, 6/29 small, 30/104 big, 105 jackpot; czasy 0/700/2200/4000 ms. Uruchomić test; oczekiwany FAIL.
- [x] **Step 2:** Przygotować wzorzec wiśni i obudowę, następnie spójną rodzinę sześciu symboli, grafiki salonu i warianty wyposażenia według sekcji „Pozyskanie grafiki i audio” specyfikacji. Zastosować manifest i kontrolę zasobów ze workflow; tekst i wartości renderować kodem. Osobne PNG symboli z alpha normalizować przed pakowaniem atlasu. Nie uznawać placeholderów za finalne zasoby.
- [x] **Step 3:** Wybrać i odsłuchać próbki z Kenney Casino Audio oraz Interface Sounds/UI Audio; brakujące mechanizmy i atmosferę dobrać indywidualnie z Freesound, preferując CC0. Przygotować własne krótkie motywy wypłat i warstwy syntezy. Zapisać pochodzenie/licencję każdego użytego pliku i wyrównać miks. Odtwarzać przez Phaser. SFX/Ambience z łagodnym duckingiem; kontrola głośności i wyciszenie nie mogą być nadpisane przez zakończenie duckingu.
- [x] **Step 4:** Zaimplementować klasy celebracji. Big/jackpot: sekwencja świateł obudowy, animacja owoców, reakcja salonu słyszalna spoza kadru, bogatszy licznik. Bez obrazu sąsiednich maszyn w widoku automatu i bez pełnoekranowego białego błysku.
- [x] **Step 5:** Test kontrolera z atrapą renderera/zegara: podwójny skip kończy obietnicę raz, portfel pozostaje bez zmian, efekty się sprzątają, gest nie przechodzi do START. Dla reducedMotion brak shake i dużego skalowania; dla muted cisza również po zmianie sceny. Testować zachowanie, nie liczbę wywołań wewnętrznych tweenów.
- [x] **Step 6:** Uruchomić testy i typecheck; oczekiwany PASS. Ograć i odsłuchać wszystkie klasy wygranych, zmianę sceny, ukrycie karty i zablokowany autoplay. Zapisać rzeczywiste obserwacje, nie deklarować poprawnego miksu bez odsłuchu.
- [x] **Step 7:** Niezależne review **G2**. Pokazać użytkownikowi pierwszy dopracowany obrót przy pierwszej okazji odbioru. Oczekiwanie na opinię nie blokuje niezależnej implementacji biznesów/testów, ale brak odpowiedzi nie oznacza zaliczenia feelingu. Commit `feat: polish slot motion and win audio`, jeśli repozytorium dostępne.

### Task 5: Bar, automaty biznesowe i wyposażenie

**Files:** Create `src/game/business.ts`, `tests/business.test.ts`; Modify `SalonScene`, manifest i zasoby salonu, integrację zapisu.

**Interfaces:** `hourlyIncome(businesses:Businesses):number`, `accrueIncome(save:SaveV1,nowMs:number):SaveV1`, `purchase(save:SaveV1,item:'bar'|'machine'|'decor',nowMs:number):{ok:boolean;save:SaveV1;reason?:'insufficient-funds'|'max-level'}`, `buyRound(save:SaveV1,nowMs:number):{ok:boolean;save:SaveV1}`. Każda operacja najpierw rozlicza należny dochód, również gdy sam zakup się nie powiedzie.

- [x] **Step 1:** Napisać czerwone testy dochodu: poziomy 0 dają 64/h, wszystkie maksymalne 160/h; 24 h przerwy rozlicza najwyżej 8 h; dwa okresy 28.125 s na bazowym poziomie dają 1 żeton. Cofnięcie czasu i powtórzenie checkpointu nie dodają środków.
- [x] **Step 2:** Napisać czerwone testy zakupów: start 1000, godzina bazowego dochodu i bar za 500 dają 564, a kolejna godzina 76. Brak środków nie kupuje, czwarta maszyna jest odrzucana, dekoracja nie zmienia dochodu/RNG. Kolejka kosztuje 50 bez nagrody; na saldzie 49 jest odrzucana. Strata na ręcznym automacie nie generuje dodatkowego przychodu biznesowego.
- [x] **Step 3:** Uruchomić `npm test -- tests/business.test.ts`; oczekiwany FAIL.
- [x] **Step 4:** Zaimplementować stały katalog ze specyfikacji i naliczanie reszty w jednostkach o mianowniku 3_600_000. Ograniczyć czas przed mnożeniem, stosować bezpieczne liczby całkowite, zakup rozliczać po starej stawce i potem zmieniać dochód. Zarówno widoczny salon, slot, jak i powrót po przerwie korzystają z tej samej funkcji i checkpointu.
- [x] **Step 5:** Połączyć zakupy z widocznymi zmianami salonu: bar, maksymalnie trzy dodatkowe maszyny, trzy warianty wyposażenia. Wyświetlić koszt i faktyczny przyrost netto przed zakupem. Ukończone poziomy oznaczyć jako ukończone, bez generowania następnych poziomów.
- [x] **Step 6:** Uruchomić testy biznesów, sesji/zapisu i typecheck; oczekiwany PASS. Ręcznie sprawdzić zakup, zmianę sceny, restart i stan wyposażenia. Commit `feat: add bounded salon businesses`, jeśli dostępny.

### Task 6: Strojenie umiarkowanej ekonomii i dowody logiki

**Files:** Create `tests/balance.test.ts`; Modify `src/game/machine.ts`, `src/game/business.ts`, odpowiadające testy i `docs/playtest.md` wyłącznie gdy pomiar uzasadnia zmianę.

**Interfaces:** Consumes publiczne funkcje silnika/sesji/biznesu. Produces raport matematyki i sesji, bez nowego systemu rozgrywki.

- [ ] **Step 1:** Dokładnie przejść 12^5 stopów dla każdego dozwolonego lineCount przy perLine 1. Obliczyć RTP, częstość zysku, osiągalną maksymalną wypłatę, percentyle wypłat i częstość klas celebracji. Assert: każda wypłata jest bezpieczną liczbą całkowitą, a lineWins nie zawiera linii spoza aktywnego prefiksu; skalowanie perLine z 1 do 5 skaluje wypłaty pięciokrotnie. Nie mylić bezpiecznej górnej granicy sumy z osiągalnym maksimum pasków.
- [ ] **Step 2:** Uruchomić 10_000 odtwarzalnych sesji po 100 obrotów domyślnych; zatrzymywać przed niewystarczającym saldem. Raportować częstość braku środków, saldo i duże wygrane; nie zakładać, że sam RTP określa satysfakcję.
- [ ] **Step 3:** Symulować 30 i 180 dni: brak grania, po 100 obrotów domyślnych dziennie bez inwestycji, taki sam tryb z zakupem najtańszego dostępnego biznesu. Uwzględnić osobno wypłaty i emisję z idle. Sprawdzić ukończenie skończonych zakupów i brak wykładniczego wzrostu; zapisać rozkłady salda i czas dojścia do poziomów. Są to pomiary, nie wykres maskujący brak danych.
- [ ] **Step 4:** Sprawdzić warunki produktu: doba przerwy daje co najmniej budżet 100 domyślnych obrotów, a ze stanu 0 powrót do najtańszego zakładu nie trwa ponad godzinę. Gdy ekonomia w zwykłej grze prowadzi do kwot milionowych lub jackpot staje się nieistotny wobec dochodu, stroić jawne tabele. Nie obcinać wygranych ani nie zmieniać szans zależnie od gracza. Długoterminowego gromadzenia bez wydawania nie przedstawiać jako matematycznie ograniczonego, jeśli nie jest.
- [ ] **Step 5:** Po strojeniu uaktualnić specyfikację i wszystkie testy zależne od liczb. Uruchomić pełne testy i typecheck; oczekiwany PASS oraz raport z rzeczywistymi wynikami. Niezależne review logiki i ekonomii **G3**. Commit `test: verify salon economy and payout rules`, jeśli dostępny.

### Task 7: Samodzielna wersja offline i końcowy odbiór

**Files:** Create `scripts/check-offline.mjs`, `README.md`; Modify build, osadzanie zasobów, `docs/playtest.md`, `docs/decisions.md`.

**Interfaces:** Produces `dist/index.html`, skrypt `check:offline: node scripts/check-offline.mjs`, instrukcję otwarcia i przenoszenia postępu.

- [ ] **Step 1:** Skonfigurować single-file build. Osadzić kod, style, obrazy i próbki audio jako importowane dane. Nie liczyć na automatyczne osadzenie plików z `public/`. Ścieżki kluczy manifestu są wspólne dla loadera i kontroli artefaktu.
- [ ] **Step 2:** Kontrola artefaktu odrzuca zewnętrzny skrypt, arkusz, obraz, font lub audio i brak wymaganych danych z manifestu. Fixture z zewnętrznym zasobem daje kod 1; prawidłowy build daje 0. W buildzie produkcyjnym nie ma interfejsu wymuszania wyników ani skrótów do dopisywania salda.
- [ ] **Step 3:** Uruchomić `npm test`, `npm run typecheck`, `npm run build`, `npm run check:offline`; wszystkie kończą się kodem 0.
- [ ] **Step 4:** Otworzyć plik przez `file://` bez sieci. Sprawdzić oba widoki, wszystkie ustawienia linii, saldo, audio od pierwszego gestu, klasy wypłat, skip, wyciszenie, reducedMotion, powrót z idle, zakupy, restart i eksport/import. Brak żądań HTTP(S), brak zdublowanych reakcji po cyklu scen.
- [ ] **Step 5:** Zmierzyć najcięższy przypadek wypłaty i powtórne wejścia do scen; cel 60 FPS, bez narastających listenerów i pętli audio. Profilować zbudowaną grę. Zapisać urządzenie, przeglądarkę, rozdzielczość i ograniczenia pomiaru; nie zastępować odsłuchu czy oceny użytkownika testem jednostkowym.
- [ ] **Step 6:** Niezależne końcowe review **G4** całej wersji. Naprawić istotne błędy, powtórzyć dotknięte sprawdzenia i zapisać pozostałe ograniczenia. README opisuje otwarcie, lokalny zapis, kopię i autorstwo zasobów. Commit `build: package the offline fruit salon`, jeśli dostępny.

## Samokontrola planu

Pokrycie: zmienne linie → 1; portfel i zapis → 2; fullscreen oraz osobny salon → 3; juicy oprawa i audio → 4; skończone biznesy → 5; skala pieniędzy → 6; offline oraz odbiór → 7. Wszystkie klasy Review Focus mają wskazane sprawdzenia. Stare założenie salonu w tle i stałych pięciu aktywnych linii zostało zastąpione aktualnymi decyzjami użytkownika.

Samo przygotowanie tego planu nie uruchamia implementacji; po zleceniu przez START-MVP.md wykonawca przechodzi do realizacji bez kolejnej rundy planowania. Parametry balansu są wartościami do pomiaru i strojenia w uzgodnionych granicach. Kontrolę kodu/logiki wykonuje niezależny reviewer na domyślnym modelu zgodnie z workflow; instalacja całego zewnętrznego katalogu skills nie jest wymagana.

Przegląd dokumentów 2026-11-04: niezależny builder check specyfikacji, planu i workflow nie wykazał ważnych nierozstrzygniętych decyzji blokujących wykonanie. Sprawdzono odnośniki, spójność wymagań globalnych, siedem zadań, cztery bramki review i arytmetykę roboczego dochodu. To dowód przeglądu dokumentacji; nie uruchamiano gry, symulacji jej ekonomii ani testów nieistniejącej implementacji.

Aktualizacja wykonawcza: język angielski oraz spokojniejsza oprawa zgodnie z korektą użytkownika. Zadania3–4: sprawdzono technicznie sceny i odtwarzanie/dekodowanie, ale odsłuch na słuchawkach/głośnikach i akceptacja poprawionego feelingu pozostają NOT VERIFIED, nawet przy zaznaczonym kroku wykonawczym. Pełne dowody w docs/playtest.md.
