# Start: wykonaj MVP owocowego salonu offline

Ten plik jest gotowym promptem wykonawczym do użycia w katalogu docelowego repozytorium. Jego uruchomienie oznacza zlecenie implementacji opisanego MVP. Dokumenty zostały przygotowane w osobnej sesji planowania; stan repozytorium i dostępność narzędzi trzeba sprawdzić tutaj na nowo.

## Zlecenie

Zbuduj działające MVP gry z poniższych dokumentów. Zacznij od przeglądu repozytorium i przejdź do implementacji. Nie kończ na ponownym planie ani na samym szkielecie aplikacji. Pracuj do uzyskania kompletnego, sprawdzonego zakresu MVP; ewentualne konkretne blokady zgłoś z dowodami i kontynuuj niezależne części.

Ustalenia produktowe w załączonej specyfikacji są zatwierdzonym kierunkiem. Parametry oznaczone jako robocze wolno samodzielnie stroić w opisanych granicach, zapisując zmiany i wyniki. Nie potrzebujesz ponownej zgody na zwykłe, odwracalne kroki implementacji, przygotowanie lokalnych zasobów i uruchomienie testów.

## Przeczytaj na początku

1. Obowiązujące instrukcje `AGENTS.md` i stan bieżącego repozytorium.
2. [Specyfikację gry](docs/superpowers/specs/2026-11-04-juicy-fruit-salon-design.md).
3. [Plan implementacji](docs/superpowers/plans/2026-11-04-juicy-fruit-salon.md).
4. [Workflow oraz bramki review](docs/superpowers/workflows/2026-11-04-fruit-salon-workflow.md).
5. [Brief grafiki i audio](docs/superpowers/assets/2026-11-04-mvp-asset-brief.md) i [listę planowanych zasobów](docs/superpowers/assets/2026-11-04-mvp-assets.plan.json).
6. Obejrzyj [zdjęcie referencyjne](docs/superpowers/references/salon-fruit-machine.png). To referencja stylu, nie finalny asset.

Wszystkie wymagane pliki powinny znajdować się w tym repozytorium. Nie korzystaj ze ścieżek ani identyfikatorów załączników z wcześniejszej sesji. Nie zakładaj, że repozytorium jest puste, nie ma Git ani że jego katalogi `.agents` są tylko do odczytu — te informacje dotyczyły środowiska planowania. Zachowaj zastane zmiany i wykorzystaj pasującą istniejącą konfigurację.

## Co ma powstać

- Prywatna gra dla jednego gracza: Phaser + TypeScript + Vite, bez backendu, kont i prawdziwych pieniędzy. Dla nowego projektu bazą jest Phaser 4.2.1; pilnuj zgodności API i lockfile. Jeśli zastany kod wymagałby nieuzgodnionej migracji głównej wersji, zgłoś konkretny konflikt zamiast nadpisywać projekt.
- Dwa rozłączne widoki: salon oraz automat. Otwarty automat zajmuje cały obszar gry i nie pokazuje salonu w tle. Saldo po lewej, wypłata pośrodku, stawka po prawej.
- Jeden grywalny automat 5 × 3, wybieralne linie i stawki zgodnie ze specyfikacją, tabela wypłat, poprawne rozliczanie wildów oraz aktywnych linii.
- Priorytet jakości: płynny, responsywny obrót, wyczuwalne zatrzymania, zgrane audio i proporcjonalna oprawa wygranych. Duże trafienie wywołuje światła obudowy i reakcję salonu słyszalną spoza kadru. Celebrowanie można skrócić.
- Salon zarabiający podczas obecności i nieobecności, bar, dodatkowe automaty biznesowe, widoczne ulepszenia wyposażenia i skończone tabele zakupów. Kwoty umiarkowane, bez wykładniczego wzrostu, prestiżu i notacji K/M/B. Bez ukrytego obcinania wygranych.
- Lokalny zapis, walidacja, eksport/import, wyciszenie i ograniczony ruch.
- Gotowy artefakt `dist/index.html` uruchamiany lokalnie bez serwera i sieci, z osadzonymi obrazami i audio.

Pierwszy reprezentatywny owoc i udźwiękowiony obrót to etap kontroli kierunku. Końcowe MVP ma zawierać pełny opisany zakres i spójny zestaw zasobów, nie tylko tę próbkę.

## Sposób wykonania

Użyj `superpowers:executing-plans` jako trybu pracy jednego wykonawcy. Wykonuj zadania planu po kolei. Niezależnych subagentów używaj do czterech przeglądów G1–G4 wskazanych we workflow, bez nowego implementera i dodatkowego review do każdego drobnego kroku. To jawnie wybrana organizacja pracy dla tego zlecenia, również gdy ogólny skill proponuje inny domyślny rytm.

Wszyscy delegaci korzystają ze skonfigurowanego domyślnego modelu subagentów. Nie wybieraj silniejszego modelu i nie używaj GPT-6 Astra. Nie zmieniaj głównego modelu. Przestrzegaj reguł natywnej delegacji i narzędzi środowiska; ten prompt nie zleca tworzenia nowych top-level wątków ani publikacji.

Załaduj zainstalowane `phaser-core`, `create-game-assets`, `game-feel`, `audio-design`, `save-systems`, `game-ui-ux` tylko tam, gdzie dotyczą zadania. `performance-optimization` stosuj na etapie pomiarów lub po odtworzeniu problemu. Nie instaluj całego katalogu skills. Użyj również właściwych instrukcji TDD, diagnozowania błędów i weryfikacji przed deklaracją ukończenia.

Przygotuj grafiki i dźwięki samodzielnie według briefu. Dobór wzorca w zaakceptowanym stylu jest delegowany wykonawcy. Dla bitmap korzystaj z dostępnego imagegen zgodnie z jego instrukcjami; assety oceniaj w docelowej skali i w grze. Dla audio wybierz dostępne materiały zgodnie z briefem, zachowaj pochodzenie i wykonaj własne warstwy/motywy. Nie kupuj paczek. Brak jednego sampla nie blokuje pozostałych prac; wybierz dopuszczalną alternatywę. Nie deklaruj wygenerowanych, pobranych lub odsłuchanych zasobów, których rzeczywiście nie przygotowano.

Zachowaj checkpoint opinii o pierwszym dopracowanym obrocie, ale nie zatrzymuj na braku odpowiedzi niezależnej logiki i testów salonu. Nie pytaj „czy kontynuować?” między zadaniami. Brak odpowiedzi nie jest zatwierdzeniem feelingu — oznacz tę część odbioru jako oczekującą i doprowadź techniczną wersję MVP do końca.

Istotne decyzje i odstępstwa zapisuj w `docs/decisions.md`, rzeczywiste testy, pomiary i ograniczenia w `docs/playtest.md`. Aktualizuj checkboxy planu. Przy wznowieniu czytaj te zapisy i kontynuuj od pierwszej niedokończonej czynności zamiast zaczynać od zera.

Korzystaj z istniejącego checkoutu/izolacji i zasad repozytorium. Rób małe lokalne commity, jeśli repozytorium pozwala. Nie kasuj zmian użytkownika, nie twórz drugiego repozytorium i nie publikuj ani nie pushuj na współdzieloną gałąź bez osobnego zlecenia.

## Warunek zakończenia

Wykonaj testy planu, kontrolę typów, build i kontrolę offline. Przeprowadź cztery niezależne review i popraw istotne błędy. Uruchom rzeczywisty zbudowany plik lokalny bez sieci w dostępnym środowisku przeglądarkowym; sprawdź oba widoki, wszystkie ustawienia linii, klasy wygranych, skip, zmianę scen, zapis, idle i zakupy. Zweryfikuj sprzątanie efektów i audio oraz brak interfejsu wymuszania wyników w wersji produkcyjnej.

Kontrola kodu nie zastępuje obejrzenia animacji, odsłuchu ani pomiaru na komputerze użytkownika. Jeśli któreś sprawdzenie nie jest możliwe, podaj dokładnie czego nie sprawdzono i dlaczego; nie oznaczaj go PASS. Nie rozbudowuj zakresu, żeby zastąpić brakujący dowód.

Oddaj: działający plik gry, źródła, runtime manifest pochodzenia zasobów, README z uruchomieniem i kopią zapisu oraz krótki raport testów, review, decyzji i ograniczeń. Po wykonaniu MVP zakończ pracę; dodatkowe automaty grywalne, nowe waluty i kolejne systemy wymagają nowego zakresu.
