import marcellusLicense from "../assets/fonts/Marcellus-OFL.txt?raw";
import sourceLicense from "../assets/fonts/SourceSans3-OFL.txt?raw";
import type Phaser from "phaser";
import { owner, number } from "../runtime";
import { machine } from "../game/machine";
import { audioMix, type GameAudio } from "./audio";
import { symbolNames } from "./spinResult";
import { livingLounge } from "../runtimeMode";
const playtest = import.meta.env.DEV && livingLounge;
export function download(raw: string, name: string) {
  const url = URL.createObjectURL(new Blob([raw], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const backToLounge = `<button type="button" class="nav-back" id="back" aria-label="Back to lounge"><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"><path d="M13 8H3m4.5-4.5L3 8l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Lounge</button>`;
/** `back` adds the lounge link to the shared navigation; only the machine view has somewhere to go back to. */
export function mountUI(
  scene: Phaser.Scene,
  audio: GameAudio,
  content: string,
  options: { back?: boolean; extraWarning?: () => string } = {},
) {
  const root = document.createElement("section");
  root.className = playtest ? "screen living-lounge" : "screen";
  root.innerHTML = `<header class="topbar"><span class="brand"><i>◆</i> AMBER ROOM <small>PRIVATE ARCADE</small></span><nav>${options.back ? backToLounge : ""}<button data-action="table">Lines & payouts</button><button data-action="settings">Settings & save</button></nav></header>${content}<p class="save-warning" role="status"></p><dialog class="panel-dialog"><button class="close" aria-label="Close">×</button><div class="dialog-body"></div></dialog>`;
  document.querySelector("#ui")!.append(root);
  const dialog = root.querySelector("dialog")!;
  const body = dialog.querySelector(".dialog-body")!;
  root.querySelector(".close")!.addEventListener("click", () => dialog.close());
  const warning = () => {
    root.querySelector(".save-warning")!.textContent = [owner.warning, options.extraWarning?.()]
      .filter(Boolean)
      .join(" ");
  };
  warning();
  const settings = () => {
    const s = owner.state.save.settings;
    body.innerHTML = `<h2>Make yourself at home</h2><label class="setting"><input type="checkbox" id="muted" ${s.muted ? "checked" : ""}> Mute all audio</label><label class="setting" for="music-volume">Music / room ambience <input id="music-volume" type="range" min="0" max="1" step="0.05" value="${audioMix.music}"></label><label class="setting" for="effects-volume">Machine effects <input id="effects-volume" type="range" min="0" max="1" step="0.05" value="${audioMix.effects}"></label><p class="fine">Volume levels last for this session.</p><label class="setting"><input type="checkbox" id="motion" ${s.reducedMotion ? "checked" : ""}> Reduce motion & lights</label><label class="setting" for="intensity">Effect intensity <input id="intensity" type="range" min="0" max="1" step="0.05" value="${s.effectsIntensity}"></label><hr><h3>Keep your progress</h3><p>Your progress stays on this device. Export a backup before moving this HTML file.</p><div class="save-actions"><button id="export">Export JSON</button><label class="file-button">Import JSON<input type="file" id="import" accept=".json,application/json"></label>${owner.originalRaw !== undefined ? '<button id="original">Download damaged original</button>' : ""}</div><p id="import-status" role="status"></p><p class="fine">One currency: play tokens. A private game, with no accounts or real money.</p><details class="font-licenses"><summary>Typeface credits & licenses</summary><pre></pre></details>`;
    body.querySelector(".font-licenses pre")!.textContent = `${marcellusLicense}\n\n${sourceLicense}`;
    if (playtest) {
      body.querySelector("h3")!.textContent = "Keep your prototype progress";
      body.querySelector("h3 + p")!.textContent =
        "Living Lounge prototype progress stays separate from your game. Export/import affects prototype progress only; rug appearance is not included in the game backup. The confirmed rug stays on this device until changed or reset.";
    }
    const change = () => {
      owner.commit({
        ...owner.state,
        save: {
          ...owner.state.save,
          settings: {
            muted: (body.querySelector("#muted") as HTMLInputElement).checked,
            reducedMotion: (body.querySelector("#motion") as HTMLInputElement).checked,
            effectsIntensity: Number((body.querySelector("#intensity") as HTMLInputElement).value),
          },
        },
      });
      audio.setMuted(owner.state.save.settings.muted);
      audio.setVolume("music", Number((body.querySelector("#music-volume") as HTMLInputElement).value));
      audio.setVolume("effects", Number((body.querySelector("#effects-volume") as HTMLInputElement).value));
      warning();
    };
    body.querySelectorAll("input:not([type=file])").forEach((el) => {
      el.addEventListener("input", change);
    });
    body
      .querySelector("#export")!
      .addEventListener("click", () =>
        download(
          JSON.stringify(owner.state.save, null, 2),
          playtest ? "amber-room-living-lounge-prototype-progress.json" : "amber-room-save.json",
        ),
      );
    body
      .querySelector("#original")
      ?.addEventListener("click", () =>
        download(
          owner.originalRaw!,
          playtest ? "amber-room-living-lounge-prototype-damaged-original.json" : "amber-room-damaged-original.json",
        ),
      );
    body.querySelector("#import")!.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const status = body.querySelector("#import-status")!;
      if (owner.state.phase !== "ready") {
        status.textContent = "Please wait for the spin to finish.";
        return;
      }
      try {
        if (file.size > 100000) throw new Error("Save file is too large");
        const raw = await file.text();
        if (owner.state.phase !== "ready") throw new Error("Please wait for the spin to finish.");
        owner.import(raw);
        dialog.close();
        scene.scene.start("salon");
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : "Invalid file";
      }
    });
  };
  root.querySelector("[data-action=settings]")!.addEventListener("click", () => {
    settings();
    dialog.showModal();
  });
  root.querySelector("[data-action=table]")!.addEventListener("click", () => {
    body.innerHTML = `<h2>Lines & payouts</h2><p>Match 3–5 symbols from the left. WILD substitutes for any symbol. Each line pays its single best match × bet per line. Winnings are credited automatically.</p><table><thead><tr><th>Symbol</th><th>3</th><th>4</th><th>5</th></tr></thead><tbody>${Object.entries(
      machine.paytable,
    )
      .map(
        ([s, p]) =>
          `<tr><th>${symbolNames[s as keyof typeof symbolNames]}</th>${p.map((n) => `<td>${n}</td>`).join("")}</tr>`,
      )
      .join(
        "",
      )}</tbody></table><p>Active: first ${owner.state.save.selectedBet.lineCount} lines. Total bet: ${number(owner.state.save.selectedBet.lineCount * owner.state.save.selectedBet.perLine)} tokens.</p><div class="line-catalog">${machine.paylines.map((path, i) => `<div class="line ${i < owner.state.save.selectedBet.lineCount ? "active" : ""}"><span>${i + 1}</span><svg viewBox="0 0 100 54" aria-label="Line ${i + 1}: ${path.join(",")}"><polyline points="${path.map((r, c) => `${8 + c * 21},${9 + r * 18}`).join(" ")}"/></svg></div>`).join("")}</div>`;
    dialog.showModal();
  });
  const unlock = () =>
    void audio.unlock().catch(() => {
      owner.warning = "Your browser blocked audio. Click again to enable it.";
      warning();
    });
  root.addEventListener("pointerdown", unlock);
  scene.events.once("shutdown", () => {
    root.remove();
  });
  return { root, dialog, warning, unlock };
}
