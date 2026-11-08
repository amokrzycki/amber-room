import Phaser from "phaser";
import { owner, number, accrue } from "../runtime";
import { catalog, purchase, buyRound, hourlyIncome, type Item } from "../game/business";
import { preloadAssets } from "./assets";
import { createAudio, type GameAudio } from "./audio";
import { mountUI } from "./ui";
import { livingLounge } from "../runtimeMode";
import { createLoungeSave, readRug, resetLounge, writeRug, type RugStyle } from "../../prototypes/living-lounge-state";
import { exportSave } from "../game/save";
import { drawLivingLounge, loungeReward } from "./livingLounge";
const playtest = import.meta.env.DEV && livingLounge;
export class SalonScene extends Phaser.Scene {
  private audio!: GameAudio;
  private room: Phaser.GameObjects.Container | undefined;
  private ui!: ReturnType<typeof mountUI>;
  private lounge: ReturnType<typeof drawLivingLounge> | undefined;
  private confirmedRug: RugStyle = "claret";
  private previewRug: RugStyle | undefined;
  private rugWarning = "";
  constructor() {
    super("salon");
  }
  init() {
    this.room = undefined;
    this.lounge = undefined;
    this.previewRug = undefined;
    if (playtest) {
      const rug = readRug({ getItem: (key) => window.localStorage.getItem(key) });
      this.confirmedRug = rug.style;
      this.rugWarning = rug.warning;
    }
  }
  preload() {
    if (!this.textures.exists("cherry")) preloadAssets(this);
  }
  create() {
    accrue();
    document.querySelector("#loading")?.remove();
    this.audio = createAudio(this);
    this.audio.setMuted(owner.state.save.settings.muted);
    this.add.image(800, 450, "salon-base").setDisplaySize(1600, 900);
    this.add.rectangle(1320, 450, 560, 900, 0x171214, 0.97);
    this.drawRoom();
    this.ui = mountUI(
      this,
      this.audio,
      `<div class="salon-copy"><p class="eyebrow">YOUR LITTLE CORNER OF THE NIGHT</p><h1>The Amber<br>Room</h1><p>A warm light. A familiar rhythm.<br>Your lounge keeps its own hours.</p></div><button class="enter-button primary" id="enter-slot">Play The Orchard <span>→</span></button><div class="salon-wallet"><span>YOUR TOKENS</span><strong id="salon-balance"></strong><small id="income"></small></div><aside class="shop"><p class="eyebrow">MAKE IT YOURS</p><h2>A good room.<br>A better evening.</h2><p class="shop-intro">Small upgrades. Make yourself at home.</p><div id="purchases">${(Object.entries(catalog) as [Item, (typeof catalog)[Item]][]).map(([item, entry]) => `<article class="purchase"><div class="purchase-head"><h3>${entry.name}</h3><small id="level-${item}"></small></div><p id="benefit-${item}"></p><button id="buy-${item}" data-item="${item}" aria-describedby="benefit-${item}"></button></article>`).join("")}<button class="toast-button" id="round" aria-describedby="round-purpose">Buy the room a round <strong>50 tokens</strong></button><p id="round-purpose">Celebration only · no bonus or income.</p></div><p id="salon-message" role="status"></p></aside>`,
      { extraWarning: () => this.rugWarning },
    );
    const root = this.ui.root;
    if (playtest) this.mountPlaytest();
    root.querySelector("#enter-slot")!.addEventListener("click", () => {
      this.audio.play("press");
      this.scene.start("slot");
    });
    root.querySelectorAll<HTMLButtonElement>("[data-item]").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.dataset.item as Item;
        if (playtest) this.cancelRug(false);
        const result = purchase(owner.state.save, item, Date.now());
        owner.commit({ ...owner.state, save: result.save });
        if (result.ok) {
          this.audio.play("salon-toast");
          this.drawRoom(playtest ? item : undefined);
          if (playtest) this.reveal(item);
        }
        root.querySelector("#salon-message")!.textContent = result.ok
          ? playtest
            ? this.purchaseMessage(item)
            : "A little more yours."
          : result.reason === "max-level"
            ? "All set. This upgrade is complete."
            : "Not enough tokens yet. Your lounge keeps earning.";
        this.refresh();
      });
    });
    root.querySelector("#round")!.addEventListener("click", () => {
      const result = buyRound(owner.state.save, Date.now());
      owner.commit({ ...owner.state, save: result.save });
      if (result.ok) {
        this.audio.play("salon-toast");
        this.audio.play("salon-cheer");
        if (!playtest && !owner.state.save.settings.reducedMotion && owner.state.save.settings.effectsIntensity > 0) {
          const glow = this.add.rectangle(
            525,
            490,
            1010,
            740,
            0xd8af55,
            0.045 * owner.state.save.settings.effectsIntensity,
          );
          this.tweens.add({ targets: glow, alpha: 0, duration: 900, onComplete: () => glow.destroy() });
        }
      }
      root.querySelector("#salon-message")!.textContent = result.ok
        ? "Cheers to a good evening. No bonus — just a moment."
        : "A round costs 50 tokens.";
      this.refresh();
    });
    this.refresh();
    const key = (e: KeyboardEvent) => {
      if (playtest && e.key === "Escape" && this.previewRug !== undefined) {
        e.preventDefault();
        this.cancelRug();
        return;
      }
      if (
        e.code === "Space" &&
        !e.repeat &&
        !this.ui.dialog.open &&
        !(e.target instanceof HTMLButtonElement) &&
        !(e.target instanceof HTMLInputElement)
      ) {
        e.preventDefault();
        this.ui.unlock();
        this.scene.start("slot");
      }
    };
    window.addEventListener("keydown", key);
    const visibility = () => {
      if (document.hidden) {
        if (playtest) this.settleReveal();
        this.audio.silence();
      } else this.audio.resume();
    };
    document.addEventListener("visibilitychange", visibility);
    const income = () => this.refresh();
    window.addEventListener("salon-state", income);
    this.events.once("shutdown", () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("salon-state", income);
      document.removeEventListener("visibilitychange", visibility);
      if (playtest) {
        this.settleReveal();
        this.previewRug = undefined;
      }
      this.audio.dispose();
    });
  }
  private refresh() {
    const s = owner.state.save,
      root = this.ui.root;
    root.querySelector("#salon-balance")!.textContent = number(s.balance);
    root.querySelector("#income")!.textContent = `${hourlyIncome(s.businesses)} tokens / hour net · up to 8 hours away`;
    for (const [item, entry] of Object.entries(catalog) as [Item, (typeof catalog)[Item]][]) {
      const level = s.businesses[entry.field],
        complete = level === 3,
        cost = entry.prices.at(level) ?? 0;
      root.querySelector(`#level-${item}`)!.textContent = `${level} / 3`;
      root.querySelector(`#benefit-${item}`)!.textContent = playtest
        ? complete
          ? item === "decor"
            ? "All furnishings in place · cosmetic only; no income."
            : `Total +${level * entry.gain} tokens/hour net · odds unchanged.`
          : `${loungeReward(item, level + 1)}${item === "decor" ? "." : ` · +${entry.gain} tokens/hour net.`}`
        : item === "decor"
          ? [
              "A woven rug. Cosmetic only; no income.",
              "Greenery. Cosmetic only; no income.",
              "Your name in brass. Cosmetic only; no income.",
              "Every detail in place. Cosmetic only.",
            ][level]
          : complete
            ? "The room is working at its best."
            : `+${entry.gain} tokens / hour net · odds stay the same`;
      const button = root.querySelector(`#buy-${item}`) as HTMLButtonElement;
      button.innerHTML = complete
        ? "Complete ✓"
        : `${level === 0 ? "Add" : "Upgrade"} ${item === "machine" ? "machine" : entry.name.toLowerCase()} <strong>${number(cost)} tokens</strong>`;
      button.disabled = complete || s.balance < cost;
    }
    (root.querySelector("#round") as HTMLButtonElement).disabled = s.balance < 50;
    if (playtest) {
      (root.querySelector("#style-rug") as HTMLButtonElement).disabled = s.businesses.decorLevel < 1;
      root.querySelector("#rug-purpose")!.textContent =
        s.businesses.decorLevel < 1 ? "Unlocks with first furnishing." : "Free · appearance only.";
    }
    this.ui.warning();
  }
  private purchaseMessage(item: Item) {
    const entry = catalog[item],
      level = owner.state.save.businesses[entry.field];
    return `${entry.name} ${level}/3 · ${loungeReward(item, level)}${item === "decor" ? "." : ` · +${entry.gain} tokens/hour; ${entry.name.toLowerCase()} total +${level * entry.gain}/hour net.`}`;
  }
  private settleReveal() {
    if (!this.lounge) return;
    for (const group of Object.values(this.lounge.groups)) {
      this.tweens.killTweensOf(group);
      group.setAlpha(1);
    }
  }
  private reveal(item: Item) {
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
    this.tweens.add({ targets: group, alpha: 1, duration: 240, ease: "Cubic.Out" });
  }
  private cancelRug(focus = true) {
    this.settleReveal();
    if (this.previewRug === undefined) return;
    this.previewRug = undefined;
    this.ui.root.querySelector<HTMLElement>("#rug-chooser")!.hidden = true;
    this.ui.root.querySelector("#style-rug")!.setAttribute("aria-expanded", "false");
    this.drawRoom("decor");
    if (focus) this.ui.root.querySelector<HTMLButtonElement>("#style-rug")!.focus();
  }
  private mountPlaytest() {
    const root = this.ui.root;
    root.querySelector(".shop h2")!.textContent = "A good room. A better evening.";
    root
      .querySelector("#buy-decor")!
      .insertAdjacentHTML(
        "afterend",
        `<button id="style-rug" aria-expanded="false" aria-controls="rug-chooser" aria-describedby="rug-purpose">Style rug</button><p id="rug-purpose">Free appearance choice · unlocks with the rug.</p><div id="rug-chooser" role="group" aria-label="Preview rug appearance" hidden><div class="rug-choices"><button data-rug="claret" aria-pressed="false">Claret weave</button><button data-rug="moss" aria-pressed="false">Moss weave</button></div><p>Preview only · no cost or income change.</p><div class="rug-actions"><button id="rug-apply">Apply</button><button id="rug-cancel">Cancel</button></div></div>`,
      );
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
        this.drawRoom("decor");
      });
    });
    root.querySelector("#rug-cancel")!.addEventListener("click", () => this.cancelRug());
    root.querySelector("#rug-apply")!.addEventListener("click", () => {
      if (this.previewRug === undefined) return;
      const result = writeRug({ setItem: (key, value) => window.localStorage.setItem(key, value) }, this.previewRug);
      if (result.ok) {
        this.confirmedRug = this.previewRug;
        this.rugWarning = "";
        root.querySelector("#salon-message")!.textContent =
          `${this.confirmedRug === "claret" ? "Claret" : "Moss"} weave saved · cosmetic only; no cost or income change.`;
        this.cancelRug();
      } else this.rugWarning = "Rug appearance not saved. Try Apply again or Cancel to restore the last confirmed rug.";
      this.ui.warning();
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
    this.events.once("shutdown", () => motion.removeEventListener("change", settle));
    root
      .querySelector(".topbar nav")!
      .insertAdjacentHTML("beforeend", '<button id="reset-playtest">Reset playtest</button>');
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
        this.drawRoom();
        this.refresh();
        if (owner.warning) throw new Error(owner.warning);
        root.querySelector("#salon-message")!.textContent =
          "Playtest reset · 20,000 tokens, no upgrades, Claret weave.";
      } catch {
        root.querySelector("#salon-message")!.textContent =
          "Reset failed. Storage may contain a partial reset. Export current progress before reloading; the rug may not have reset.";
      }
    });
  }
  private drawRoom(item?: Item) {
    if (import.meta.env.DEV && livingLounge) {
      this.settleReveal();
      if (!item) this.room?.destroy();
      const lounge = drawLivingLounge(
        this,
        owner.state.save.businesses,
        this.previewRug ?? this.confirmedRug,
        item && this.lounge ? { ...this.lounge, item } : undefined,
      );
      this.lounge = lounge;
      this.room = lounge.room;
      if (!item || item === "machine")
        lounge.groups.machine.getByName("lounge-cabinet-personal").on("pointerdown", () => {
          this.ui.unlock();
          this.audio.play("press");
          this.scene.start("slot");
        });
      return;
    }
    this.room?.destroy();
    this.room = this.add.container(0, 0);
    const room = this.room,
      b = owner.state.save.businesses;
    room.add(
      this.add
        .image(250, 500, "salon-bar")
        .setDisplaySize(400, 310)
        .setAlpha(b.barLevel ? 1 : 0.18),
    );
    const personal = this.add
      .image(745, 405, "salon-machine")
      .setDisplaySize(235, 320)
      .setInteractive({ useHandCursor: true });
    personal.on("pointerdown", () => {
      this.ui.unlock();
      this.audio.play("press");
      this.scene.start("slot");
    });
    room.add(personal);
    for (let i = 0; i < 3; i++) {
      room.add(this.add.ellipse(470 + i * 190, 800, 135, 25, 0x000000, 0.3));
      if (i < b.extraMachines) room.add(this.add.image(470 + i * 190, 680, "salon-machine").setDisplaySize(155, 230));
      else room.add(this.add.rectangle(470 + i * 190, 700, 130, 180, 0xd8af55, 0.035).setStrokeStyle(1, 0xd8af55, 0.1));
    }
    const g = this.add.graphics();
    room.add(g);
    if (b.decorLevel >= 1) {
      const rug = [
        [390, 790],
        [920, 790],
        [990, 865],
        [315, 865],
      ].map(([x, y]) => new Phaser.Math.Vector2(x, y));
      g.fillStyle(0x6b2636, 0.8).fillPoints(rug, true);
      g.lineStyle(2, 0xd8af55, 0.45).strokePoints(rug, true);
      for (let y = 805; y < 856; y += 12)
        g.lineStyle(1, 0xd8af55, 0.1).lineBetween(380 - (y - 790) * 0.65, y, 930 + (y - 790) * 0.65, y);
    }
    if (b.decorLevel >= 2)
      for (const x of [100, 960]) {
        g.lineStyle(3, 0x617343).lineBetween(x, 516, x, 595);
        g.fillStyle(0x9b683b).fillPoints(
          [
            [x - 24, 580],
            [x + 24, 580],
            [x + 18, 628],
            [x - 18, 628],
          ].map(([px, py]) => new Phaser.Math.Vector2(px, py)),
          true,
        );
        g.lineStyle(2, 0xd8af55, 0.6).lineBetween(x - 24, 584, x + 24, 584);
        for (let leaf = 0; leaf < 7; leaf++) {
          const side = leaf % 2 ? 1 : -1;
          room.add(
            this.add
              .ellipse(x + side * (12 + leaf * 2), 535 + leaf * 5, 19, 63, leaf % 3 === 0 ? 0x426744 : 0x244b38)
              .setAngle(side * (28 + leaf * 5)),
          );
        }
      }
    if (b.decorLevel >= 3) {
      g.lineStyle(2, 0xd8af55, 0.8).strokeRoundedRect(580, 180, 330, 45, 20);
      room.add(this.add.text(745, 202, "◆  THE AMBER ROOM  ◆", { fontSize: "19px", color: "#fff2cc" }).setOrigin(0.5));
    }
    for (let i = 0; i < b.barLevel; i++) {
      g.fillStyle(0xd8af55, 0.8).fillCircle(180 + i * 50, 385, 6);
      g.fillStyle(0x35e6d1, 0.6).fillRoundedRect(198 + i * 29, 440, 12, 25, 3);
    }
  }
}
