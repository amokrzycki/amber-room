import Phaser from "phaser";
import { owner, number, accrue } from "../runtime";
import { tuning } from "./tuning";
import { machine } from "../game/machine";
import { secureRng, spin } from "../game/engine";
import { requestSpin, selectBet, reelsStopped, finishSpin } from "../game/session";
import { classifyWin } from "../game/feedback";
import type { Bet, SpinRecord } from "../game/model";
import { ReelView } from "./ReelView";
import { drawCabinet } from "./cabinet";
import { createAudio, type GameAudio } from "./audio";
import { mountUI } from "./ui";
import { playWin } from "./feedback";
import { describeSpinResult } from "./spinResult";
export class SlotScene extends Phaser.Scene {
  private reels: ReelView[] = [];
  private audio!: GameAudio;
  private ui!: ReturnType<typeof mountUI>;
  private win: ReturnType<typeof playWin> | undefined;
  private run = 0;
  private countTween: Phaser.Tweens.Tween | undefined;
  private returnedLine: ReturnType<typeof playWin> | undefined;
  private announcedSpinId = 0;
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
    drawCabinet(this);
    this.add
      .text(800, 142, "ORCHARD No. 7", {
        fontFamily: "Georgia",
        fontSize: "34px",
        fontStyle: "italic",
        color: "#fff2cc",
        letterSpacing: 5,
      })
      .setOrigin(0.5);
    const initial =
      owner.state.save.lastSpin?.outcome.grid ?? spin(machine, { lineCount: 5, perLine: 1 }, () => 0).grid;
    for (let c = 0; c < 5; c++) this.reels.push(new ReelView(this, c, initial[c]));
    const bet = owner.state.save.selectedBet;
    const lastSpin = owner.state.save.lastSpin;
    this.announcedSpinId = lastSpin?.id ?? 0;
    this.ui = mountUI(
      this,
      this.audio,
      `<button class="back" id="back">← Lounge</button><div class="slot-hud"><div class="balance-block"><span>BALANCE</span><strong id="balance">${number(owner.state.save.balance)}</strong><small>tokens</small></div><div class="payout-block"><span>GROSS PAYOUT</span><strong id="payout">${lastSpin ? number(lastSpin.outcome.payout) : "—"}</strong><small id="win-label">${lastSpin ? "Last completed spin" : "Ready to play"}</small><small id="spin-breakdown">${lastSpin ? describeSpinResult(lastSpin).breakdown : "Choose your bet, then press START."}</small></div><div class="bet-block"><div class="bet-selects"><label>Bet / line<select id="per-line">${[1, 2, 5].map((n) => `<option ${n === bet.perLine ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Lines<select id="line-count">${[1, 5, 10, 20, 40].map((n) => `<option ${n === bet.lineCount ? "selected" : ""}>${n}</option>`).join("")}</select></label><div><span>TOTAL BET</span><strong id="stake">${bet.lineCount * bet.perLine}</strong></div></div></div></div><div class="slot-controls"><p id="spin-status" role="status">SPACE to spin · take it at your own pace</p><button id="spin" class="primary">START <span>↻</span></button></div><p class="sr-only" id="result-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`,
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
        (e.code !== "Space" && !(e.key === "Enter" && e.target === root.querySelector("#spin"))) ||
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
      this.ui.root.querySelector("#spin-breakdown")!.textContent = "";
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
      neutral:
        spin.outcome.payout === spin.totalStake
          ? "Break-even"
          : spin.outcome.payout
            ? "Tokens returned"
            : "No return this time",
      small: "A little afterglow",
      big: "A lovely win",
      jackpot: "JACKPOT · This one is on the house!",
    };
    this.ui.root.querySelector("#win-label")!.textContent = labels[tier];
    if (document.hidden || tier === "neutral") {
      if (!document.hidden && spin.outcome.payout > 0) this.returnedLine = playWin(this, spin, settings);
      this.ui.root.querySelector("#payout")!.textContent = number(spin.outcome.payout);
      this.completeResult(spin);
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
    if (spin) {
      this.ui.root.querySelector("#payout")!.textContent = number(spin.outcome.payout);
      this.completeResult(spin);
    }
    this.audio.stopWin();
    if (!document.hidden) this.audio.play("payout-end");
    this.audio.duck(false);
    if (owner.state.activeSpinId !== null) owner.state = finishSpin(owner.state, owner.state.activeSpinId);
    this.refresh();
  }
  private completeResult(spin: SpinRecord) {
    const result = describeSpinResult(spin);
    this.ui.root.querySelector("#spin-breakdown")!.textContent = result.breakdown;
    if (spin.id !== this.announcedSpinId) {
      this.ui.root.querySelector("#result-announcement")!.textContent = result.announcement;
      this.announcedSpinId = spin.id;
    }
  }
  private skip() {
    if (this.win) {
      this.win.skip();
      this.endWin();
      this.audio.silence();
    }
  }
}
