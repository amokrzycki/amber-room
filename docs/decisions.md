# Decyzje wykonawcze

- 2026-11-04: wykonawca główny, dokładnie cztery niezależne bramki G1–G4 na domyślnym modelu; bez nowych implementerów. Zatwierdzony plan zastępuje ponowne projektowanie. Istniejący czysty checkout gałęzi `mvp` jest miejscem pracy.
- Zakres: konfiguracja, czysta logika i testy, dwie sceny, zasoby, build offline i dokumentacja. Brak istniejących użytkowników/schematu do migracji. Ryzyka: błędna wypłata i nadpisanie zapisu; testy transakcji i walidacji przed integracją.
- Pre-flight: 1→2 wspólne Bet/SpinOutcome; 2→3 jeden właściciel sesji i zapis przed animacją; 3→4 sprzątanie efektów przy shutdown; 2→5 accrual przed zakupem i obrotem; 1/5→6 publiczne funkcje w symulacji; 3/4→7 osadzone zasoby. Brak sprzeczności kontraktów.
- Ruling: używam dodatkowego Playwright wyłącznie do powtarzalnego odbioru rzeczywistego pliku file:// i blokowania sieci; nie jest zależnością runtime. Koszt: większy zestaw developerski.
- G1: P2 kolejność pól JSON przy imporcie — poprawiono porównanie strukturalne i kanonizację wyniku; test RED→GREEN. Pozostały zakres G1 bez findings; integrację zapisu przed animacją ponownie sprawdzi G2.
- Ruling: pobranie wskazanego archiwum Kenney Casino Audio (oficjalny URL) zakończyło się HTTP 403; cały niewielki zestaw audio powstanie z własnej deterministycznej syntezy. Dopuszcza to brief jako alternatywę. Koszt: mechanika/reakcja salonu ma syntetyczny charakter, odsłuch wymaga osobnego odbioru.
- Ruling: pierwsze uruchomienie testu silnika było zablokowane brakiem instalacji npm; po uzyskaniu sieci testy od razu zielone. Dla tego zadania brak dowodu RED na zaimplementowanym silniku; kolejne moduły i poprawki są test-first. Nie przedstawiam tego jako pełnego TDD.
