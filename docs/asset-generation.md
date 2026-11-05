# Pochodzenie zasobów

Grafiki generowano wbudowanym `image_gen` 2026-11-04/05, bez użycia cudzych symboli/logo. Rekordy narzędzia i prompty poniżej. Własne źródła zachowano w `src/assets/sources`; runtime w `symbols` i `art`. Normalizacja: `scripts/prepare-assets.py` (deterministyczna, alpha bez usuwania tła, do 512×512 z marginesem symboli). Podgląd w skali: `docs/evidence/asset-contact.png`. W grze zaobserwowano owoce i salon przez lokalne Chromium; nie jest to subiektywna akceptacja użytkownika.

- Wiśnie, `exec-73242381-4bba-4e55-a684-1ea4482001f3.png`: Production 2D slot-machine symbol, pair of ripe red cherries, glossy green leaf, front facing rounded volume, bold dark outline, upper-left light, saturated red, restrained highlights, transparent alpha, 12% padding, no letters/logo/cabinet/checkerboard.
- Cytryna, `exec-c3abcc76-c3c0-482b-b097-a57158532eec.png`: reference cherries as style, change to ONE yellow lemon, same outline, volume, upper-left light, padding and genuine alpha.
- Śliwka, `exec-76521aee-656c-4694-a13b-df90e159cc79.png`: reference cherries as style, change to ONE plump purple plum with green leaf; preserve light/outline/volume/padding/alpha.
- Arbuz, `exec-93bb3b35-6af6-4f35-afcf-20dfa904c5ea.png`: reference cherries as style, change to ONE watermelon wedge, striped rind, coral red flesh and black seeds; preserve family and alpha.
- Salon, `exec-35f48941-ddbe-4a21-86a0-98769c6cde4c.png`: wide 16:9 cozy vintage fruit arcade lounge, burgundy/brass, polished parquet, wall sconces, straight-on slightly elevated view, empty center for machines and left for separate bar; no people, bar, machines or text.
- Bar, `exec-d2f3ca90-87bb-41e8-9260-c786633a8f84.png`: isolated compact vintage bar counter, burgundy lacquer/brass, bottle silhouettes and glass shelf, straight-on elevated view, polished dimensional game art, upper-left light, transparent alpha, no people/text.
- Automat salonu, `exec-b86de8a7-ac81-4f16-8644-7922e4f86e34.png`: isolated freestanding vintage fruit machine, burgundy/gold, tiny generic fruit grid, turquoise lights, slightly elevated front view, no letters/logo, upper-left light, genuine alpha.

Siódemka i WILD są oryginalnymi kodowo rysowanymi znakami (`scripts/prepare-assets.py`, DejaVu Sans Bold, Bitstream Vera/DejaVu license; font nie jest dołączony do runtime). Precyzyjna obudowa automatu i warianty zakupów są rysowane kodem Phasera. Własne oryginalne elementy kodowe i audio projektu udostępniono na CC0-1.0; wygenerowane grafiki pochodzą z zapisanych wywołań image_gen, bez deklaracji licencji zewnętrznego autora.

## Phase 2 cabinet material pass · 2026-11-05

The existing miniature `src/assets/art/salon-machine.png` is the visual reference for the playable cabinet. No raster artwork or fruit was replaced. `src/view/cabinet.ts` authors a static 1530×780 transparent CanvasTexture at scene coordinates (35,105), using the installed Phaser texture manager. It is generated once and retained across scene visits, with the same filtering as existing scene images. Instrumented WebGL observed two initial uploads (blank allocation, then painted refresh) and no further uploads across repeated scene visits. Its source is original project code, under the existing code provenance above; no external material or font is added.

Material roles: dark lacquered wood at the side returns; burgundy enamel on the front; warm, aged brass with narrow top/left highlights and dark return edges; a recessed dark gasket at the reel aperture; and a dark instrument deck beneath readable DOM controls. Fluted fittings, a stepped plinth and small fan ornaments derive from the miniature. The portrait machine is adapted to the existing landscape composition. Reel/symbol coordinates, scale, crop, timing and feedback remain unchanged.

Four cropped image quads leave the 1020×432 reel field out of texture sampling; its matching dark gradient bands and dividers use native Phaser Graphics. The texture requires 4,773,600 bytes (4.55 MiB) for its base RGBA pixels, plus a CPU canvas backing and renderer overhead; this is not a measured total-memory claim. It adds no download, additional raster source, shader, animation or dependency. The existing manifest continues to enumerate the 22 embedded image/audio files; this procedural texture is described here rather than pretending it is an embedded file.

## Dźwięki

Wszystkie 13 WAV to **własna synteza**, nie nagrania Kenney ani Freesound. Reprodukcja: `python scripts/make-audio.py`, seed 20261104, PCM mono 22050 Hz/16 bit, motywy C-dur. `salon-cheer` to syntetyczny bezsłowny akord chóralny, nie nagranie tłumu. Bezstratne runtime WAV są również źródłami; generator zachowany. Krawędzie mają rampy; pętle oparto o całkowite okresy i rampy. Źródła syntezy mają zapas poziomu. Miks końcowy wymaga odsłuchu na słuchawkach i głośnikach.

Próba pobrania oficjalnej paczki CC0 Kenney Casino Audio: `https://kenney.nl/media/pages/assets/casino-audio/2472606a04-1721639069/kenney_casino-audio.zip` zakończona HTTP 403. Strony licencji zweryfikowano, ale żadnego pliku z paczek nie wykorzystano. Nie deklarujemy pobrania ani odsłuchu. Własna synteza jest dopuszczoną alternatywą briefu.
