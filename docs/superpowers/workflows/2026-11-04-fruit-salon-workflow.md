# Workflow: owocowy salon offline

Status: workflow przygotowany na podstawie ustaleń użytkownika i przeglądu źródeł; gra nie została jeszcze zaimplementowana.

Dokumenty wejściowe: [specyfikacja](../specs/2026-11-04-juicy-fruit-salon-design.md) i [plan](../plans/2026-11-04-juicy-fruit-salon.md). W razie rozbieżności najnowsza decyzja użytkownika ma pierwszeństwo; poprawić oba dokumenty zamiast rozwijać sprzeczne warianty.

Przenośny punkt startu to [START-MVP.md](../../../START-MVP.md). Wybrany w nim tryb wykonania MVP: jeden wykonawca pracujący przez plan i niezależni reviewerzy wyłącznie na czterech bramkach G1–G4. Ogólne domyślne zalecenia skills o liczbie delegacji lub wyborze najmocniejszego modelu nie zastępują tej instrukcji ani polityki użytkownika.

## Czym jest wskazane repozytorium

[awesome-gamedev-agent-skills](https://github.com/gamedev-skills/awesome-gamedev-agent-skills) to katalog instrukcji SKILL.md dla agentów wraz z routerem dobierającym silnik i zadanie. Nie jest silnikiem gry, biblioteką automatu ani gotowym systemem niezależnego code review. Repozytorium deklaruje 77 skills; sam walidator ich struktury nie dowodzi poprawności wygenerowanej gry.

Przejrzano README, osiem poniższych skills i dokument zasad wersjonowania. Oceniany commit: `19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9` z 2026-10-28. Licencja źródła Apache-2.0. Poniżej jest własna adaptacja procesu i linki do instrukcji; nie skopiowano pakietu ani jego skryptów do projektu i nie zainstalowano go globalnie.

## Wybrany zestaw i sposób użycia

Linki są przypięte do przeczytanego commita. Wykonawca czyta tylko instrukcję właściwą dla bieżącego zadania; nie ładuje całego katalogu ani wszystkich zestawów naraz.

| Instrukcja | Kiedy | Co wykorzystujemy w tej grze |
| --- | --- | --- |
| [phaser-core](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/web-engines/phaser-core/SKILL.md) | Zadania 3–5 | Jedno Game, cykl scen, preload/create, reset na init, sprzątanie i zgodność API. |
| [game-feel](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-feel/SKILL.md) | Zadanie 4 | Warstwy reakcji, krótkie efekty wracające do spoczynku, poziomy intensywności, oddzielenie oprawy od rozliczenia. |
| [audio-design](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/audio-design/SKILL.md) | Zadanie 4 | Prosty miks, zapas głośności, wyciszenie, łagodny ducking i odsłuch; bez wdrażania rozbudowanego middleware muzycznego. |
| [create-game-assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/create-game-assets/SKILL.md) | Zadanie 4 i zasoby salonu w 5 | Jedna referencja wizualna, spójna rodzina symboli, manifest, wymiary/alpha/pochodzenie i kontrola w grze. |
| [save-systems](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/save-systems/SKILL.md) | Zadanie 2 i zmiany danych | Zapisywanie danych zamiast scen, wersja, walidacja, granica transakcji, rzeczywisty test restartu. Wzorców plikowych Godota nie przenosić dosłownie do localStorage. |
| [game-ui-ux](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/game-ui-ux/SKILL.md) | Zadanie 3 i odbiór | Osobne ekrany, skalowanie, czytelny HUD i fokus. Projekt ma prosty przepływ dwóch scen; nie potrzebuje ogólnego frameworka stosu ekranów. |
| [performance-optimization](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/disciplines/performance-optimization/SKILL.md) | Zadanie 7 lub zmierzony problem | Powtarzalny przypadek, profil release buildu, jedna poprawka i ponowny pomiar. Pooling i własne shadery dopiero po wykazaniu potrzeby. |
| [prototype-fast](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/skills/workflows/prototype-fast/SKILL.md) | Tylko opcjonalny eksperyment z feelingiem | Jedno pytanie i mały zakres. W tej grze dźwięk/animacja są częścią badanego rdzenia, więc nie wolno usuwać ich pod pretekstem greyboxu. Nie tworzyć obowiązkowego prototypu do wyrzucenia ani przepisywania poprawnego kodu. |

Dodatkowo: [zasady wersjonowania źródła](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/19d93f97c9c1ea0f8b306e77aa81e0d3e352d3e9/docs/VERSION-SUPPORT.md). Baseline Phaser 4 zweryfikowano w [oficjalnym wykazie](https://phaser.io/download/phaser4). Wcześniejsze linki do dokumentacji Phaser 3 traktować jako opis idei, nie źródło gotowych wywołań rendererów dla wersji 4.

Nie są potrzebne instrukcje fizyki, 3D, multiplayer, publikacji Steam/itch, obsługi innych silników ani ekonomii Roblox z prestiżem/dużymi liczbami. Nie instalować całego repozytorium. Jeśli później potrzebne będą lokalne kopie wybranych skills, zachować licencję i NOTICE oraz użyć ścieżki dozwolonej przez środowisko; nie nadpisywać globalnych konfiguracji.

## Instalacja wybranego zestawu przez użytkownika

Użytkownik potwierdził instalację; siedem wybranych skills jest dostępnych w katalogu skills sesji planowania. Instalacja nie była wykonywana przez agenta. Poniższa komenda zostaje jako instrukcja odtworzenia zestawu; nie trzeba jej ponawiać, jeśli zestaw jest dostępny. Katalogi `.agents` i `.codex` były tylko do odczytu w środowisku planowania; w docelowym repozytorium sprawdzić faktyczne uprawnienia zamiast przenosić to założenie. W zwykłym terminalu użytkownika zestaw można zainstalować globalnie dla Codexa:

```bash
npx skills add gamedev-skills/awesome-gamedev-agent-skills \
  -g -a codex \
  --skill phaser-core game-feel audio-design create-game-assets \
    save-systems game-ui-ux performance-optimization \
  -y
```

W zapisywalnym katalogu docelowego projektu można usunąć `-g`, aby instalacja była projektowa. `-y` pomija pytania instalatora; lista po `--skill` ogranicza instalację do siedmiu wskazanych instrukcji. Router i opcjonalny `prototype-fast` nie są wymagane dla opisanego workflow. Komenda pobiera bieżącą wersję repozytorium; lista rekomendacji powyżej jest oparta na wskazanym, przeczytanym commicie, więc nowszą treść należy ponownie sprawdzić przed zastosowaniem.

Składnia potwierdzona w [dokumentacji CLI skills](https://github.com/vercel-labs/skills/blob/main/docs/commands.md). Zainstalowanie instrukcji nie instaluje silnika Phaser ani zależności gry; to osobny krok implementacji.

## Role i zasady modeli

- **Orkiestrator:** utrzymuje specyfikację, plan, kolejność zadań i dziennik decyzji. Pilnuje granic produktu i przedstawia wyniki użytkownikowi.
- **Wykonawca:** implementuje spójny fragment wraz z jego testami i dowodami działania. Może to być ten sam agent, który prowadzi rozmowę.
- **Niezależny reviewer:** nie jest autorem sprawdzanej zmiany. Czyta połączoną logikę oraz testy, nie tylko podsumowanie autora. Weryfikuje dowody i wskazuje konkretne błędy z lokalizacją oraz scenariuszem.

Domyślny model subagentów jest obowiązujący. Nie wybierać samodzielnie silniejszego modelu i nie używać GPT-6 Astra. Model głównego agenta pozostaje bez zmian. Przy zwykłym review w tym samym providerze używać natywnego subagenta; osobny checkout, inny provider lub jawnie wskazane ustawienia wymagają właściwego narzędzia delegacji środowiska. Nie tworzyć nowych top-level wątków ani worktree w shellu w ramach delegacji.

Każdy nowy niezależny review/re-check jest nowym zadaniem dla świeżego reviewera. Drobne poprawki wykonuje autor bez uruchamiania osobnego implementera. Nie budować łańcucha rekurencyjnych agentów. Niezależne prace można delegować dopiero przy rzeczywistym zleceniu implementacji; obecny workflow nie uruchamia żadnego implementera.

## Pętla wykonania

1. Przeczytać bieżące zadanie, jego interfejsy i wskazany fragment specyfikacji. Dobrać maksymalnie kilka potrzebnych instrukcji.
2. Zapisać krótko zakres plików, zmianę zachowania i dowód poprawności. Nie rozbudowywać architektury „na przyszłość”.
3. Dla zasad pieniężnych, RNG, zapisu i przejść stanu najpierw test z istotnym scenariuszem błędu, potem najmniejsza implementacja i test zielony. Efektów wizualnych nie zastępować snapshotami całego źródła ani testami kopiującymi implementację.
4. Uruchomić dotknięte testy oraz typecheck. Widoczne zachowanie sprawdzić w działającej grze w dostępnej przeglądarce zgodnie z zasadami narzędzi środowiska. Nie uznawać samego przejścia testów za dowód dobrego ruchu lub dźwięku.
5. Zaktualizować `docs/decisions.md` i `docs/playtest.md` tylko o istotne ustalenia i faktycznie uzyskane wyniki. W dostępnej infrastrukturze wersjonowania zrobić mały commit.
6. Na wyznaczonej bramce przekazać zakres reviewerowi. Poprawić istotne problemy, powtórzyć dotknięte sprawdzenia, dopiero wtedy zamknąć bramkę.
7. Kontynuować do końca uzgodnionej wersji. Brakujące narzędzie odsłuchu, sprzęt użytkownika lub subiektywny odbiór oznaczyć jako niesprawdzone; nie fabrykować akceptacji.

## Cztery bramki niezależnego review

**G1 — po zadaniu 2, matematyka i zapis:** aktywny prefiks linii, perLine kontra totalStake, wildy, integralność zapisanego zakładu, brak podwójnej wypłaty, import i odmowa storage. Reviewer przechodzi też ścieżkę wywołań, aby test helpera nie ukrywał błędu integracji.

**G2 — po zadaniu 4, sceny i oprawa:** salon niewidoczny za automatem, strony HUD, brak starych listenerów po powrotach, skip i wejście, wyciszenie, sprzątanie audio/animacji, warstwy wygranych. Ocena kodu nie zastępuje odsłuchu i opinii użytkownika.

**G3 — po zadaniu 6, ekonomia i logika salonu:** stałe/skończone tabele, zakup przed/po naliczeniu czasu, reszty, limity offline, brak drugiego przychodu ze strat gracza, oddzielenie RNG od biznesów, kompletna wypłata jackpotu, symulacje długiego okresu.

**G4 — po zadaniu 7, cała wersja:** przepływ salon → automat → salon, produkcyjny artefakt offline, zapis i przenoszenie postępu, brak narzędzi developerskich, wydajność, dowody wykonania wcześniejszych bramek i zgodność z najnowszymi decyzjami.

To cztery przeglądy spójnych fragmentów, nie osobny reviewer do każdego pliku, testu czy zmiany czasu animacji. Jeśli pojawi się nowy błąd wymagający re-checku, zlecić nowe krótkie zadanie z opisem zmiany i poprzedniego zastrzeżenia.

## Brief do reviewera

Przekazać konkretnie:

> Sprawdź [G1/G2/G3/G4]. Przeczytaj specyfikację, wskazane zadania planu, zmienione pliki oraz ich wywołania. Aktualne dowody: [polecenia, wyniki, scenariusze]. Znajdź błędy zachowania, rozliczeń, utraty danych lub integracji. Nie edytuj kodu. Zwróć tylko konkretne findings z wagą, plikiem i linią, scenariuszem, skutkiem oraz proponowaną poprawką. Oddziel potwierdzone błędy od niezweryfikowanych pytań. Sprawdź, czy testy chronią właściwy warunek i czy autor nie pominął niewygodnego scenariusza. Jeśli nie znalazłeś istotnych problemów, podaj zakres rzeczywiście sprawdzony i pozostałe ograniczenia.

Wagi: P0/P1 — blokujące błędy, np. utrata danych, błędny koszt/wypłata lub niemożność uruchomienia; P2 — inne odtwarzalne problemy produktu. Naprawiać błędy zgodnie z ich skutkiem. Pomysły na nowe funkcje i preferencje stylistyczne nie stają się automatycznie warunkiem przejścia.

## Kontrola zasobów i feelingu

Pierwszy reprezentatywny symbol i fragment obudowy wyznaczają rodzinę: połysk, kontur, materiały, paleta, światło i skala. Manifest opisuje klucz, rolę, rozmiar, alpha, plik źródłowy, autora/narzędzie, licencję i status. Dla rzeczywistego generowania/edycji bitmap stosować dostępny skill imagegen. Nie instalować generatorów ani pobierać wykonywalnych narzędzi z katalogu skills tylko dlatego, że są wymienione w instrukcji.

Każdy atlas obejrzeć przy rozmiarze używanym w grze. Kontrola wymiarów i przezroczystości jest deterministyczna; wygenerowana szachownica nie jest przezroczystością. Sprawdzić kontakt owoców z ramkami i brak przycinania przy skali animacji. Teksty i liczby pozostają kodowe.

Dla scenariuszy developer ma przyciski neutral/small/big/jackpot i powrót z idle. Panel nie trafia do produkcyjnego artefaktu. Wyniki wykorzystywane do demonstracji muszą być opisane jako wymuszone; nie przedstawiać ich jako dowodu częstości wygranych.

Oprawę oceniać jako zsynchronizowaną całość: ruch, dźwięk, światła i licznik. Każda warstwa wraca do spoczynku; audio nie zagłusza interfejsu i nie zostaje po zmianie sceny. Stabilną prędkość fazy przewijania bębnów można zachować liniową — ogólnej rady o easing nie stosować bezmyślnie do każdego fragmentu ruchu.

## Autonomia, konsultacje i stop condition

Wykonawca samodzielnie dobiera detale kodu i zasobów, pozostałe stałe linie, zgodne zależności, strojenie ruchu i tabel ekonomii w opisanych granicach. Dokumentuje większe korekty. Konsultacji wymagają zmiana silnika, waluty, pełnoekranowego układu, zakresu produktu lub dodanie backendu/płatności.

Po pierwszym dopracowanym obrocie użytkownik ocenia feeling. W oczekiwaniu wykonawca może kontynuować niezależną logikę biznesów i testy. Brak odpowiedzi nie uprawnia do uznania oprawy za zaakceptowaną.

Technicznie ukończona wersja ma zielone sprawdzenia, domknięte bramki, działający lokalny artefakt i jawny raport brakujących pomiarów. Odbiór feelingu i rzeczywisty pomiar na komputerze użytkownika są osobnymi pozycjami raportu. Po spełnieniu uzgodnionego zakresu zakończyć pracę; nie dodawać prestiżu, nowych walut, multiplayer ani kolejnych gier.
