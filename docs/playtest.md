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
- 100 powtarzalnych ścieżek długich sesji na wariant. Mediany salda po30/180d: bez grania16360/93160;100 obrotów/dzień bez zakupów12784/71644;z zakupami18792/192860. Pełne rozkłady i oddzielne idle/stawki/wypłaty w JSON. Skończone zakupy ukończono we wszystkich ścieżkach, dzień11–15, mediana14.
- 24h przerwy daje bazowo512 żetonów (>=500 za100 domyślnych obrotów). 1 żeton od zera po56.25s. Reszta zachowywana w jednostkach1/3600000, stare stawki do zakupu. Wzrost portfela jest liniowy i długoterminowo nieograniczony, bez konfiskaty.
