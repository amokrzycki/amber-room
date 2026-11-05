import Phaser from "phaser";
import { owner, number, accrue } from "../runtime";
import { tuning } from "./tuning";
import { machine } from "../game/machine";
import { secureRng, spin } from "../game/engine";
import { requestSpin, selectBet, reelsStopped, finishSpin } from "../game/session";
import { classifyWin } from "../game/feedback";
import type { Bet, SpinRecord } from "../game/model";
import { ReelView } from "./ReelView";
import { createAudio, type GameAudio } from "./audio";
import { mountUI } from "./ui";
import { playWin } from "./feedback";
export class SlotScene extends Phaser.Scene {
  private reels: ReelView[] = [];
  private audio!: GameAudio;
  private ui!: ReturnType<typeof mountUI>;
  private win: ReturnType<typeof playWin> | undefined;
  private run = 0;
  private countTween: Phaser.Tweens.Tween | undefined;
  private returnedLine: ReturnType<typeof playWin> | undefined;
  constructor() {
    super("slot");
  }
  init() {
    this.reels = [];
    this.win = undefined;
    this.returnedLine = undefined;
    this.run++;
  }
  create() {
    accrue();
    this.audio = createAudio(this);
    this.audio.setMuted(owner.state.save.settings.muted);
    this.registry.set("paylines", machine.paylines);
    this.add.rectangle(800, 450, 1600, 900, 0x171214);
    const g = this.add.graphics();
    g.fillGradientStyle(0x4a1b2a, 0x4a1b2a, 0x210f18, 0x210f18).fillRoundedRect(45, 105, 1510, 760, 36);
    g.lineStyle(3, 0xd8af55, 0.6).strokeRoundedRect(45, 105, 1510, 760, 36);
    g.lineStyle(1, 0xf8dc94, 0.25).strokeRoundedRect(54, 114, 1492, 742, 29);
    for (const x of [76, 1524])
      for (const y of [185, 660, 830]) {
        g.fillStyle(0x956633).fillCircle(x, y, 5);
        g.lineStyle(1, 0xf9d995, 0.7).lineBetween(x - 2, y - 2, x + 2, y + 2);
      }
    g.fillStyle(0x8c1730).fillRoundedRect(245, 175, 1110, 505, 28);
    g.lineStyle(6, 0xd8af55).strokeRoundedRect(265, 195, 1070, 465, 20);
    g.fillStyle(0x100d12).fillRoundedRect(280, 207, 1040, 435, 12);
    for (let c = 0; c < 5; c++) {
      g.fillStyle(c % 2 ? 0x201920 : 0x19131a).fillRect(291 + c * 205, 209, 198, 432);
      if (c < 4) g.lineStyle(2, 0xd8af55, 0.3).lineBetween(491 + c * 205, 207, 491 + c * 205, 642);
    }
    this.add
      .text(800, 142, "ORCHARD No. 7", {
        fontFamily: "Georgia",
        fontSize: "34px",
        fontStyle: "italic",
        color: "#fff2cc",
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    for (const x of [552, 1048]) {
      this.add.image(x, 140, "cherry").setDisplaySize(45, 45).setAlpha(0.65);
    }
    this.add
      .text(1458, 400, "◆\nAMBER ROOM\n◆", { fontSize: "19px", align: "center", lineSpacing: 22, color: "#d8af55" })
      .setOrigin(0.5);
    const initial =
      owner.state.save.lastSpin?.outcome.grid ?? spin(machine, { lineCount: 5, perLine: 1 }, () => 0).grid;
    for (let c = 0; c < 5; c++) this.reels.push(new ReelView(this, c, initial[c]));
    const bet = owner.state.save.selectedBet;
    this.ui = mountUI(
      this,
      this.audio,
      `<button class="back" id="back">← Lounge</button><div class="slot-hud"><div class="balance-block"><span>BALANCE</span><strong id="balance">${number(owner.state.save.balance)}</strong><small>tokens</small></div><div class="payout-block"><span>GROSS PAYOUT</span><strong id="payout">${number(owner.state.save.lastSpin?.outcome.payout ?? 0)}</strong><small id="win-label">A little luck. A little afterglow.</small></div><div class="bet-block"><div class="bet-selects"><label>Bet / line<select id="per-line">${[1, 2, 5].map((n) => `<option ${n === bet.perLine ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Lines<select id="line-count">${[1, 5, 10, 20, 40].map((n) => `<option ${n === bet.lineCount ? "selected" : ""}>${n}</option>`).join("")}</select></label><div><span>TOTAL BET</span><strong id="stake">${bet.lineCount * bet.perLine}</strong></div></div></div></div><div class="slot-controls"><p id="spin-status" role="status">SPACE to spin · take it at your own pace</p><button id="spin" class="primary">START <span>↻</span></button></div>`,
    );
    const root = this.ui.root;
    root.querySelector("#back")!.addEventListener("click", () => {
      if (owner.state.phase === "spinning") return;
      this.skip();
      this.scene.start("salon");
    });
    root.querySelector("#spin")!.addEventListener("click", () => this.start());
    const change = () => {
      owner.commit(
        selectBet(owner.state, {
          lineCount: Number((root.querySelector("#line-count") as HTMLSelectElement).value),
          perLine: Number((root.querySelector("#per-line") as HTMLSelectElement).value),
        } as Bet),
      );
      this.refresh();
    };
    root.querySelectorAll("select").forEach((el) => {
      el.addEventListener("change", change);
    });
    const key = (e: KeyboardEvent) => {
      if (
        e.code !== "Space" ||
        this.ui.dialog.open ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLInputElement
      )
        return;
      if (e.target instanceof HTMLButtonElement && e.target.id !== "spin") return;
      e.preventDefault();
      if (e.repeat) return;
      this.ui.unlock();
      this.start();
    };
    window.addEventListener("keydown", key);
    this.input.on("pointerdown", () => {
      void this.audio.unlock();
      if (owner.state.phase === "celebrating") this.skip();
    });
    const visibility = () => {
      if (document.hidden) {
        this.audio.silence();
        this.skip();
      } else this.audio.resume();
    };
    document.addEventListener("visibilitychange", visibility);
    const income = () => this.refresh();
    window.addEventListener("salon-state", income);
    this.events.once("shutdown", () => {
      this.run++;
      this.skip();
      this.returnedLine?.dispose();
      this.reels.forEach((r) => {
        r.dispose();
      });
      this.countTween?.stop();
      window.removeEventListener("keydown", key);
      window.removeEventListener("salon-state", income);
      document.removeEventListener("visibilitychange", visibility);
      this.audio.dispose();
    });
    if (import.meta.env.DEV)
      void import("./devScenarios").then((m) => {
        if (this.scene.isActive()) m.installScenarios(this.ui.root, (stops) => this.start(stops));
      });
  }
  private refresh() {
    const root = this.ui.root;
    const s = owner.state;
    root.querySelector("#balance")!.textContent = number(s.save.balance);
    root.querySelector("#stake")!.textContent = number(s.save.selectedBet.lineCount * s.save.selectedBet.perLine);
    root.querySelectorAll<HTMLSelectElement>("select").forEach((el) => {
      el.disabled = s.phase !== "ready";
    });
    (root.querySelector("#back") as HTMLButtonElement).disabled = s.phase === "spinning";
    (root.querySelector("#spin") as HTMLButtonElement).disabled = s.phase === "spinning";
    root.querySelector("#spin")!.innerHTML = s.phase === "celebrating" ? "SKIP <span>→</span>" : "START <span>↻</span>";
    this.ui.warning();
  }
  private async start(forced?: number[]) {
    if (this.ui.dialog.open) return;
    if (owner.state.phase === "celebrating") {
      this.skip();
      return;
    }
    if (owner.state.phase !== "ready") return;
    this.returnedLine?.dispose();
    this.returnedLine = undefined;
    accrue();
    let i = 0;
    try {
      const result = requestSpin(owner.state, forced ? () => forced[i++] : secureRng);
      if (!result.ok) {
        this.ui.root.querySelector("#spin-status")!.textContent =
          result.reason === "insufficient-funds"
            ? "Not enough tokens. Your lounge keeps earning — try a smaller bet."
            : "Please wait for the spin to finish.";
        return;
      }
      owner.commit(result.state);
      this.refresh(); // Persist the complete settlement before any visual/audio playback.
      const run = this.run;
      const spin = result.spin;
      this.audio.play("press");
      void this.audio.unlock().then(() => {
        if (run === this.run && owner.state.phase === "spinning") this.audio.startReels();
      });
      this.ui.root.querySelector("#payout")!.textContent = "0";
      this.ui.root.querySelector("#win-label")!.textContent = "Finding the rhythm…";
      this.ui.root.querySelector("#spin-status")!.textContent = "";
      await Promise.all(
        this.reels.map((reel, c) =>
          reel.play(spin.outcome.grid[c], c * tuning.stagger).then(() => {
            if (run === this.run && !document.hidden) this.audio.play("stop");
          }),
        ),
      );
      if (run !== this.run) return;
      this.audio.stopReels();
      owner.state = reelsStopped(owner.state, spin.id);
      this.celebrate(spin);
    } catch (error) {
      this.ui.root.querySelector("#spin-status")!.textContent =
        error instanceof Error ? error.message : "Could not start the spin";
    }
  }
  private celebrate(spin: SpinRecord) {
    const tier = classifyWin(spin.totalStake, spin.outcome.payout);
    const settings = owner.state.save.settings;
    const labels = {
      neutral: spin.outcome.payout ? "Tokens returned" : "Another turn. Another chance.",
      small: "A little afterglow",
      big: "A lovely win",
      jackpot: "JACKPOT · This one is on the house!",
    };
    this.ui.root.querySelector("#win-label")!.textContent = labels[tier];
    if (document.hidden || tier === "neutral") {
      if (!document.hidden && spin.outcome.payout > 0) this.returnedLine = playWin(this, spin, settings);
      this.ui.root.querySelector("#payout")!.textContent = number(spin.outcome.payout);
      owner.state = finishSpin(owner.state, spin.id);
      this.refresh();
      return;
    }
    this.audio.play(tier);
    this.audio.duck(true);
    if (tier === "big" || tier === "jackpot") this.audio.play("salon-cheer");
    const featured = [...spin.outcome.lineWins].sort((a, b) => b.payout - a.payout)[0];
    for (let c = 0; c < 5; c++)
      this.reels[c].highlight(
        featured && c < featured.count ? [machine.paylines[featured.lineIndex][c]] : [],
        settings.effectsIntensity,
        settings.reducedMotion,
      );
    this.win = playWin(this, spin, settings);
    const win = this.win;
    const counter = { value: 0 };
    let tick = -1;
    this.countTween = this.tweens.add({
      targets: counter,
      value: spin.outcome.payout,
      duration: tier === "small" ? 450 : tier === "big" ? 1100 : 1800,
      ease: "Sine.easeOut",
      onUpdate: () => {
        this.ui.root.querySelector("#payout")!.textContent = number(Math.floor(counter.value));
        const next = Math.floor(this.time.now / 130);
        if (next !== tick) {
          tick = next;
          this.audio.play("payout-tick");
        }
      },
    });
    this.refresh();
    void win.done.then(() => {
      if (this.win === win) this.endWin();
    });
  }
  private endWin() {
    this.win = undefined;
    this.countTween?.stop();
    this.reels.forEach((r) => {
      r.clearHighlight();
    });
    const spin = owner.state.save.lastSpin;
    if (spin) this.ui.root.querySelector("#payout")!.textContent = number(spin.outcome.payout);
    this.audio.stopWin();
    if (!document.hidden) this.audio.play("payout-end");
    this.audio.duck(false);
    if (owner.state.activeSpinId !== null) owner.state = finishSpin(owner.state, owner.state.activeSpinId);
    this.refresh();
  }
  private skip() {
    if (this.win) {
      this.win.skip();
      this.endWin();
      this.audio.silence();
    }
  }
}
