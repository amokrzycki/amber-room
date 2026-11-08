import type { SalonScene } from "./SalonScene";
import { catalog, type Item } from "../game/business";
import { owner } from "../runtime";
import { createLoungeSave, readRug, resetLounge, writeRug, type RugStyle } from "../../prototypes/living-lounge-state";
import { exportSave } from "../game/save";
import { drawLivingLounge, loungeReward } from "./livingLounge";

type LoungeDraw = ReturnType<typeof drawLivingLounge>;
type CatalogEntry = (typeof catalog)[Item];

export class LivingLoungePlaytest {
  private lounge: LoungeDraw | undefined;
  private confirmedRug: RugStyle = "claret";
  private previewRug: RugStyle | undefined;
  rugWarning = "";

  constructor(private scene: SalonScene) {}

  init() {
    const rug = readRug({ getItem: (key) => window.localStorage.getItem(key) });
    this.confirmedRug = rug.style;
    this.rugWarning = rug.warning;
  }

  mount() {
    const root = this.scene.ui.root;
    root.querySelector(".shop h2")!.textContent = "A good room. A better evening.";
    root
      .querySelector("#buy-decor")!
      .insertAdjacentHTML(
        "afterend",
        `<button id="style-rug" aria-expanded="false" aria-controls="rug-chooser" aria-describedby="rug-purpose">Style rug</button><p id="rug-purpose">Free appearance choice · unlocks with the rug.</p><div id="rug-chooser" role="group" aria-label="Preview rug appearance" hidden><div class="rug-choices"><button data-rug="claret" aria-pressed="false">Claret weave</button><button data-rug="moss" aria-pressed="false">Moss weave</button></div><p>Preview only · no cost or income change.</p><div class="rug-actions"><button id="rug-apply">Apply</button><button id="rug-cancel">Cancel</button></div></div>`,
      );
    root
      .querySelector(".topbar nav")!
      .insertAdjacentHTML("beforeend", '<button id="reset-playtest">Reset playtest</button>');

    root.querySelector("#style-rug")!.addEventListener("click", () => {
      this.settleReveal();
      if (this.previewRug !== undefined) return this.cancelRug();
      this.previewRug = this.confirmedRug;
      root.querySelector<HTMLElement>("#rug-chooser")!.hidden = false;
      root.querySelector("#style-rug")!.setAttribute("aria-expanded", "true");
      root.querySelectorAll<HTMLButtonElement>("[data-rug]").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.rug === this.previewRug));
      });
      root.querySelector<HTMLButtonElement>(`[data-rug=${this.previewRug}]`)!.focus();
    });

    root.querySelectorAll<HTMLButtonElement>("[data-rug]").forEach((button) => {
      button.addEventListener("click", () => {
        this.previewRug = button.dataset.rug as RugStyle;
        root.querySelectorAll<HTMLButtonElement>("[data-rug]").forEach((choice) => {
          choice.setAttribute("aria-pressed", String(choice === button));
        });
        this.scene.drawRoom("decor");
      });
    });

    root.querySelector("#rug-cancel")!.addEventListener("click", () => this.cancelRug());
    root.querySelector("#rug-apply")!.addEventListener("click", () => {
      if (this.previewRug === undefined) return;
      const result = writeRug(
        { setItem: (key, value) => window.localStorage.setItem(key, value) },
        this.previewRug,
      );
      if (result.ok) {
        this.confirmedRug = this.previewRug;
        this.rugWarning = "";
        root.querySelector("#salon-message")!.textContent =
          `${this.confirmedRug === "claret" ? "Claret" : "Moss"} weave saved · cosmetic only; no cost or income change.`;
        this.cancelRug();
      } else this.rugWarning = "Rug appearance not saved. Try Apply again or Cancel to restore the last confirmed rug.";
      this.scene.ui.warning();
    });

    root.addEventListener(
      "click",
      (event) => {
        if ((event.target as Element).closest("[data-action]")) this.cancelRug(false);
      },
      true,
    );

    root.addEventListener("input", () => this.settleReveal());

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const settle = () => this.settleReveal();
    motion.addEventListener("change", settle);
    this.scene.events.once("shutdown", () => motion.removeEventListener("change", settle));

    root.querySelector("#reset-playtest")!.addEventListener("click", () => {
      if (
        !window.confirm(
          "Reset Living Lounge playtest? This replaces prototype progress and rug appearance with the 20,000-token starting wallet. Production progress stays unchanged.",
        )
      )
        return;
      this.settleReveal();
      const now = Date.now();
      try {
        // shortcut: two storage keys are not atomic; report partial failure until a migration adds transactional storage.
        resetLounge(window.localStorage, now);
        owner.import(exportSave(createLoungeSave(now)));
        this.confirmedRug = "claret";
        this.rugWarning = "";
        this.cancelRug(false);
        this.scene.drawRoom();
        this.scene.refresh();
        if (owner.warning) throw new Error(owner.warning);
        root.querySelector("#salon-message")!.textContent =
          "Playtest reset · 20,000 tokens, no upgrades, Claret weave.";
      } catch {
        root.querySelector("#salon-message")!.textContent =
          "Reset failed. Storage may contain a partial reset. Export current progress before reloading; the rug may not have reset.";
      }
    });
  }

  drawRoom(item?: Item) {
    this.settleReveal();
    if (!item) this.scene.room?.destroy();
    const lounge = drawLivingLounge(
      this.scene,
      owner.state.save.businesses,
      this.previewRug ?? this.confirmedRug,
      item && this.lounge ? { ...this.lounge, item } : undefined,
    );
    this.lounge = lounge;
    this.scene.room = lounge.room;
    if (!item || item === "machine")
      lounge.groups.machine.getByName("lounge-cabinet-personal").on("pointerdown", () => {
        this.scene.ui.unlock();
        this.scene.audio.play("press");
        this.scene.scene.start("slot");
      });
  }

  settleReveal() {
    if (!this.lounge) return;
    for (const group of Object.values(this.lounge.groups)) {
      this.scene.tweens.killTweensOf(group);
      group.setAlpha(1);
    }
  }

  reveal(item: Item) {
    this.settleReveal();
    const settings = owner.state.save.settings;
    if (
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      settings.reducedMotion ||
      settings.effectsIntensity === 0
    )
      return;
    const group = this.lounge!.groups[item];
    group.setAlpha(0.35);
    this.scene.tweens.add({ targets: group, alpha: 1, duration: 240, ease: "Cubic.Out" });
  }

  cancelRug(focus = true) {
    this.settleReveal();
    if (this.previewRug === undefined) return;
    this.previewRug = undefined;
    const root = this.scene.ui.root;
    root.querySelector<HTMLElement>("#rug-chooser")!.hidden = true;
    root.querySelector("#style-rug")!.setAttribute("aria-expanded", "false");
    this.scene.drawRoom("decor");
    if (focus) root.querySelector<HTMLButtonElement>("#style-rug")!.focus();
  }

  onBeforePurchase() {
    this.cancelRug(false);
  }

  purchaseMessage(item: Item): string {
    const entry = catalog[item],
      level = owner.state.save.businesses[entry.field];
    return `${entry.name} ${level}/3 · ${loungeReward(item, level)}${item === "decor" ? "." : ` · +${entry.gain} tokens/hour; ${entry.name.toLowerCase()} total +${level * entry.gain}/hour net.`}`;
  }

  benefitText(item: Item, level: number, complete: boolean, entry: CatalogEntry): string {
    if (complete) {
      if (item === "decor") return "All furnishings in place · cosmetic only; no income.";
      return `Total +${level * entry.gain} tokens/hour net · odds unchanged.`;
    }
    const reward = loungeReward(item, level + 1);
    if (item === "decor") return `${reward}.`;
    return `${reward} · +${entry.gain} tokens/hour net.`;
  }

  refresh(root: HTMLElement) {
    const s = owner.state.save;
    (root.querySelector("#style-rug") as HTMLButtonElement).disabled = s.businesses.decorLevel < 1;
    root.querySelector("#rug-purpose")!.textContent =
      s.businesses.decorLevel < 1 ? "Unlocks with first furnishing." : "Free · appearance only.";
  }

  onKeyDown(e: KeyboardEvent): boolean {
    if (e.key === "Escape" && this.previewRug !== undefined) {
      e.preventDefault();
      this.cancelRug();
      return true;
    }
    return false;
  }

  shutdown() {
    this.settleReveal();
    this.previewRug = undefined;
  }
}
