# Dowody wykonania

Stan początkowy: dokumentacja bez kodu, czysty git, gałąź mvp. Node 26.12.1, Chromium i ffmpeg dostępne. Odbiór feelingu przez użytkownika i pomiar na jego komputerze: oczekują.

Scenariusz scen: salon → automat → salon → automat; saldo i zakład zachowane, jeden start na gest, brak auto-repeat, brak salonu za bębnami. Do wykonania po integracji.

## Zadania 1–2
`npm test` po poprawce G1: 16/16 PASS (w tym 2 testy feedback), `npm run typecheck`: PASS. Pierwszy test silnika był uruchomiony przed instalacją npm i nie dotarł do asercji; brak dowodu RED dla tego pierwszego modułu. Sesja/zapis/feedback miały testy przed modułami. Regresja G1 faktycznie RED→GREEN.

## Pierwszy build i sceny
`npm run build`: pojedynczy HTML ~6.6 MB. Lokalny Chromium przez Playwright, WebGL SwiftShader, file://, offline=true: salon → slot → obrót; brak pageerror, brak ostrzeżenia zapisu. Wspólny preview nie obsługuje file:// (`unsupported-protocol: file:`); użyto lokalnego Chromium poza ograniczeniem sandboxa. Obejrzano screenshot obu scen i arkusz symboli; salon nie jest tłem automatu. Sprzęt użytkownika, rzeczywisty dźwięk na głośnikach/słuchawkach i 60 FPS: niesprawdzone.

## G2 i korekta kierunku
Niezależne review G2: jeden P2 (tweeny symboli po skip), poprawiony z testem RED→GREEN. `browser-acceptance` ponownie PASS po poprawce i angielskim UI: brak pageerrors/HTTP, 1 AudioContext,0 źródeł po wyjściu. Użytkownik nie zaakceptował pierwszego feelingu: zażądał spokojniejszych/płynniejszych efektów i mniej generycznej oprawy; potwierdził język angielski. Korekty wdrożono (szczegóły decyzji). Nowy subiektywny odbiór oczekuje.

## Matematyka i ekonomia po tuningu
`npm test`: 29 testów PASS, w tym pełna enumeracja i symulacje (~20.3 s). Później testy offline2/2 PASS; typecheck po dodaniu typów Node PASS. Liczby pochodzą z `docs/math-report.json`, seed20261104.
- Enumeracja 248832 stopów × pięć ustawień linii × perLine1/5. RTP76.289223% dla wszystkich linii. Maksima przy perLine5: 1→10000,5→10400,10→11090,20→11960,40→13055; to osiągalne wartości, nie teoretyczny limit400000. Każda kwota bezpieczna, brak nieaktywnych wypłat i dokładne skalowanie5×.
- Domyślnie zysk19.258%, big1.922%, jackpot0.08319%. Neutral oznacza zysk<=0, niekoniecznie zerową wypłatę. Jackpot przy40liniach po tuningu osiągalny, częstość0.016075%.
- 10000 sesji po100 obrotów: 1000000 spinów,0 braków środków; średnie saldo881.2394, mediana868, min632,max3028; big19239,jackpot835. Początkowy budżet1000.
- 100 powtarzalnych ścieżek długich sesji na wariant. Mediany salda po30/180d: bez grania16360/93160;100 obrotów/dzień bez zakupów12784/71644;z biznesami23506/197603. Pełne rozkłady i oddzielne idle/stawki/wypłaty w JSON. Skończone biznesy (bar+maszyny, bez dekoracji) ukończono we wszystkich ścieżkach, dzień7–11, mediana10. Wszystkie9 zakupów, w tym dekoracje, sprawdzono oddzielnie w przeglądarce.
- 24h przerwy daje bazowo512 żetonów (>=500 za100 domyślnych obrotów). 1 żeton od zera po56.25s. Reszta zachowywana w jednostkach1/3600000, stare stawki do zakupu. Wzrost portfela jest liniowy i długoterminowo nieograniczony, bez konfiskaty.

## Integracja zapisu i zakupów
`browser-save-business`: PASS na rzeczywistym file:// offline. Osiem godzin limitu po imporcie24h, wszystkie9 zakupów, widoczne zmiany, round50 bez nagrody, exportdownload, poprawny import/reload, atomowe odrzucenie złego JSON, uszkodzony oryginał chroniony również po spinie, recoveryimport oraz odmowa localStorage z grą w pamięci. Pageerror0 i HTTP0.

## Końcowa kontrola zachowania
Dodatkowe regresje: Space na fokusie Settings uruchamia natywny przycisk (nie spin), skip zatrzymuje także ambience, zwrot4przy stawce5 pokazuje linię bez fanfary i bez blokowania START, główna transakcja1000−5+20utrzymuje1015także po reload. Browser-idle RED→GREEN: zamknięcie ukrytej karty nie dzieli jednej nieobecności;24h daje dokładnie512 raz.

## Pomiar release
`browser-performance`: Chromium156.0.8078.73, Linux7.3.0-4-cachyos, Ryzen7 5800X3D, viewport1600×900, ANGLE/SwiftShader (brak /dev/dri i /dev/nvidia w środowisku). Bez nagrania i równoległych benchmarków. Release,40linii×5, trafienie5wild,12powrotów scen. DOM419→419, listenery99→99 po GC. Różnica względem wcześniejszych418/100 to osadzona nota licencyjna i usunięty pagehide listener. RAF~38.7354FPS; przedziały p50=33.3ms,p95=33.4ms,max50.0ms. Callback głównej pętli p95=1.5ms (nie jest to pomiar czasu GPU). **60FPS niepotwierdzone**, pomiar dotyczy software renderer; nie deklaruję osiągnięcia celu na GPU użytkownika. Pełny raport w performance-report.json. Odsłuch: NOT VERIFIED.

## Ostatnia pełna weryfikacja
`npm test`:35/35PASS,9plików (~20.77s). `npm run typecheck`, `npm run build`, `npm run check:offline`:exit0. Build6 625 207bajtów (6.625MB),22osadzone obrazy/audio. `browser-acceptance` na końcowym pliku PASS:5klas (neutral0,zwrot4,small15,big70,jackpot108),3rozdzielczości i okna ustawień w granicach,5ustawień linii i prefiks tabeli, Space na przycisku menu, brak auto-repeat/spin-po-skip,0źródeł po skip i wyjściu, masterMute=0 po pierwszym geście także po reload. Jedyny AudioContext. Pageerror0,HTTP(S)0. Wartość gain.value przed pierwszym gestem w suspended context nie jest dowodem dźwięku; po resume zapisana automatyka mute działa.

## Review końcowe i odbiór
G1–G4 wykonane przez4niezależnych reviewerów. Ich konkretne uwagi poprawione i udokumentowane w docs/reviews; G4 bez błędów produktu, dwie uwagi dokumentacyjne zamknięte. Plan odznaczony, ograniczenia jawne. Po G4 dodano także klik własnego sprite automatu, bo wcześniej wejście obsługiwał tylko przycisk pod nim; przeglądarkowy test kanału wejścia RED→GREEN.

Poprawiony checkpoint: `docs/first-spin-v2.webm`, krótki obrót z wymuszoną wypłatą70, bez ścieżki audio; `docs/slot-v2.png` pokazuje licznik w trakcie naliczania. Nagranie pochodzi z headless i nie dowodzi60FPS ani akceptacji feelingu. Użytkownik otrzymał wersję do oceny; brak nowej odpowiedzi nie jest akceptacją. Odsłuch na słuchawkach/głośnikach i pomiar docelowego GPU nadal NOT VERIFIED.

## Regresja zgłoszona po odbiorze — symbole poza obudową
Przed poprawką test `browser-reel-clipping` na zbudowanym file:// odtworzył widoczną zmianę pikseli nad oknem (285,100–1320,207), a test jednostkowy położeń wykazał widoczny symbol ody196 zamiast207. To faktyczny RED, nie wniosek z samego przeglądu kodu. Wcześniejsze PASS ruchu nie dowodziło poprawności przycinania.
Po poprawce: RED→GREEN testu klatek (`browser-reel-clipping`), cztery rzeczywiste klatki ruchu z niezmienionymi pikselami obudowy nad/pod oknem i zmiennymi pikselami wewnątrz; brak ostrzeżenia niewspieranej maski. Obejrzano klatkę ruchu z poprawnym przycięciem obu krawędzi. Test jednostkowy obejmuje początek, pośrednie przesunięcia i końcową kolumnę. Pełna suite36/36PASS (~20.89s), typecheck/build/check:offline PASS. Browser-acceptance ponownie PASS (trzy rozdzielczości, linie, wygrane, skip i powroty scen), pageerror0/HTTP0,1AudioContext i0źródeł po wyjściu. Użytkownik potwierdził płynność jako „spoko”; nie oznacza to akceptacji fontu ani odsłuchu.
