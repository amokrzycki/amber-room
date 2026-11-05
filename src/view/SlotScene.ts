import Phaser from "phaser";
import { owner, number, accrue } from "../runtime";
import { tuning } from "./tuning";
import { machine } from "../game/machine";
import { secureRng } from "../game/engine";
import { requestSpin, selectBet, reelsStopped, finishSpin } from "../game/session";
import { classifyWin } from "../game/feedback";
import type { Bet, SpinRecord } from "../game/model";
import { ReelView } from "./ReelView";
import { drawCabinet } from "./cabinet";
import { createAudio, type GameAudio } from "./audio";
import { mountUI } from "./ui";
import { playWin } from "./feedback";
import { describeSpinResult } from "./spinResult";
import { NumberDisplay } from "./NumberDisplay";
import { idleGrid } from "./idleGrid";
export class SlotScene extends Phaser.Scene {
  private reels: ReelView[] = [];
  private audio!: GameAudio;
  private ui!: ReturnType<typeof mountUI>;
  private win: ReturnType<typeof playWin> | undefined;
  private run = 0;
  private balanceDisplay!: NumberDisplay;
  private payoutDisplay!: NumberDisplay;
  private leaving = false;
  private returnedLine: ReturnType<typeof playWin> | undefined;
  private announcedSpinId = 0;
  constructor() {
    super("slot");
  }
  init() {
    this.reels = [];
    this.leaving = false;
    this.win = undefined;
    this.returnedLine = undefined;
    this.run++;
  }
  create() {
    accrue();
    this.audio = createAudio(this, false);
    this.audio.setMuted(owner.state.save.settings.muted);
    this.registry.set("paylines", machine.paylines);
    this.add.rectangle(800, 450, 1600, 900, 0x171214);
    drawCabinet(this);
    const initial = owner.state.save.lastSpin?.outcome.grid ?? idleGrid;
    for (let c = 0; c < 5; c++) this.reels.push(new ReelView(this, c, initial[c]));
    const bet = owner.state.save.selectedBet;
    const lastSpin = owner.state.save.lastSpin;
    this.announcedSpinId = lastSpin?.id ?? 0;
    this.ui = mountUI(
      this,
      this.audio,
      `<h1 class="machine-name">THE ORCHARD</h1><button class="back" id="back">BACK TO LOUNGE</button><div class="slot-hud"><div class="balance-block"><span>BALANCE</span><strong id="balance" aria-hidden="true">${number(owner.state.save.balance)}</strong><small>tokens</small><span class="sr-only" id="balance-final">${number(owner.state.save.balance)} tokens</span></div><div class="payout-block"><span>GROSS PAYOUT</span><strong id="payout" aria-hidden="true">${lastSpin ? number(lastSpin.outcome.payout) : "—"}</strong><small id="win-label">${lastSpin ? "Last payout · credited automatically" : "Ready to play"}</small><small id="spin-breakdown" aria-hidden="true">${lastSpin ? describeSpinResult(lastSpin).breakdown : "Choose your bet, then press SPIN."}</small></div><div class="bet-block"><div class="bet-selects"><label>Bet / line<select id="per-line">${[1, 2, 5].map((n) => `<option ${n === bet.perLine ? "selected" : ""}>${n}</option>`).join("")}</select></label><label>Lines<select id="line-count">${[1, 5, 10, 20, 40].map((n) => `<option ${n === bet.lineCount ? "selected" : ""}>${n}</option>`).join("")}</select></label><div><span>TOTAL BET</span><strong id="stake">${bet.lineCount * bet.perLine}</strong></div></div></div></div><div class="slot-controls"><p id="spin-status">SPACE to spin · take it at your own pace</p><button id="skip-motion" hidden>Skip motion</button><button id="spin" class="primary" data-state="idle">SPIN</button></div><p class="sr-only" id="result-summary">${lastSpin ? describeSpinResult(lastSpin).announcement : ""}</p><p class="sr-only" id="result-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`,
    );
    const root = this.ui.root;
    if (lastSpin?.outcome.lineWins.length)
      root.querySelector("#spin-status")!.textContent =
        `Winning lines: ${lastSpin.outcome.lineWins.map((win) => win.lineIndex + 1).join(", ")} · Lines & payouts shows each path`;
    this.balanceDisplay = new NumberDisplay(owner.state.save.balance, (value) => {
      root.querySelector("#balance")!.textContent = number(value);
    });
    this.payoutDisplay = new NumberDisplay(lastSpin?.outcome.payout ?? 0, (value) => {
      root.querySelector("#payout")!.textContent = number(value);
      const net = root.querySelector("#net");
      const returned = root.querySelector("#returned");
      const spin = owner.state.save.lastSpin;
      if (net && spin && owner.state.phase !== "spinning") {
        const profit = value - spin.totalStake;
        net.textContent = `${profit > 0 ? "+" : ""}${number(profit)}`;
        if (returned) returned.textContent = number(value);
      }
    });
    root.querySelector("#back")!.addEventListener("click", () => this.cashOut());
    root.querySelector<HTMLButtonElement>("#back")!.addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.code === "Space") && event.repeat) event.preventDefault();
    });
    const spinButton = root.querySelector<HTMLButtonElement>("#spin")!;
    const press = () => {
      if (spinButton.disabled || this.ui.dialog.open) return;
      spinButton.classList.add("is-pressed");
      const run = this.run;
      void this.audio
        .unlock()
        .then(() => {
          if (run === this.run && spinButton.classList.contains("is-pressed")) this.audio.play("press");
        })
        .catch(() => this.ui.unlock());
    };
    const release = () => spinButton.classList.remove("is-pressed");
    spinButton.addEventListener("pointerdown", (event) => {
      if (event.button === 0) press();
    });
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    spinButton.addEventListener("click", () => this.start());
    root.querySelector("#skip-motion")!.addEventListener("click", () => this.settleReels());
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
      if (spinButton.disabled) return;
      press();
      void this.start();
    };
    const releaseKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === "Enter") release();
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", releaseKey);
    window.addEventListener("blur", release);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finishNumbers = () => {
      if (this.reducedMotion()) {
        this.settleReels();
        this.skip();
        this.finishNumbers();
      }
    };
    motion.addEventListener("change", finishNumbers);
    root.addEventListener("input", finishNumbers);
    this.input.on("pointerdown", () => {
      void this.audio.unlock();
      if (owner.state.phase === "celebrating") this.skip();
    });
    const visibility = () => {
      if (document.hidden) {
        release();
        this.audio.silence();
        this.settleReels();
        this.returnedLine?.dispose();
        this.returnedLine = undefined;
        this.skip();
        this.finishNumbers();
      } else this.audio.resume();
    };
    document.addEventListener("visibilitychange", visibility);
    const income = () => this.refresh();
    window.addEventListener("salon-state", income);
    this.events.once("shutdown", () => {
      this.run++;
      this.leaving = true;
      this.win?.dispose();
      this.win = undefined;
      if (owner.state.activeSpinId !== null) {
        const id = owner.state.activeSpinId;
        owner.state = finishSpin(reelsStopped(owner.state, id), id);
      }
      this.returnedLine?.dispose();
      this.reels.forEach((r) => {
        r.dispose();
      });
      this.balanceDisplay.dispose();
      this.payoutDisplay.dispose();
      motion.removeEventListener("change", finishNumbers);
      window.removeEventListener("keyup", releaseKey);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
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
    // Settlement is already saved; withhold only the visual credit until the reels reveal it.
    const balance = s.save.balance - (s.phase === "spinning" ? s.save.lastSpin!.outcome.payout : 0);
    this.balanceDisplay.to(balance, this.reducedMotion() || document.hidden);
    root.querySelector("#balance-final")!.textContent = `${number(balance)} tokens`;
    root.querySelector("#stake")!.textContent = number(s.save.selectedBet.lineCount * s.save.selectedBet.perLine);
    root.querySelectorAll<HTMLSelectElement>("select").forEach((el) => {
      el.disabled = s.phase !== "ready";
    });
    (root.querySelector("#back") as HTMLButtonElement).disabled = s.phase === "spinning";
    (root.querySelector("#spin") as HTMLButtonElement).disabled = s.phase === "spinning";
    const spin = root.querySelector<HTMLButtonElement>("#spin")!;
    spin.textContent = s.phase === "spinning" ? "SPINNING" : s.phase === "celebrating" ? "SKIP" : "SPIN";
    spin.dataset.state = s.phase === "ready" ? "idle" : s.phase;
    root.querySelector<HTMLButtonElement>("#skip-motion")!.hidden = s.phase !== "spinning";
    this.ui.warning();
  }
  private async start(forced?: number[]) {
    if (this.leaving || this.ui.dialog.open) return;
    if (owner.state.phase === "celebrating") {
      this.skip();
      return;
    }
    if (owner.state.phase !== "ready") return;
    this.finishNumbers();
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
        this.ui.root.querySelector("#result-announcement")!.textContent =
          this.ui.root.querySelector("#spin-status")!.textContent;
        return;
      }
      owner.commit(result.state);
      this.refresh(); // Persist the complete settlement before any visual/audio playback.
      const run = this.run;
      const spin = result.spin;
      void this.audio
        .unlock()
        .then(() => {
          if (
            run === this.run &&
            owner.state.activeSpinId === spin.id &&
            owner.state.phase === "spinning" &&
            !this.reducedMotion()
          )
            this.audio.startReels();
        })
        .catch(() => this.ui.unlock());
      this.payoutDisplay.to(0, true);
      this.ui.root.querySelector("#payout")!.textContent = "—";
      this.ui.root.querySelector("#result-summary")!.textContent = "";
      this.ui.root.querySelector("#win-label")!.textContent = "Reels turning";
      this.ui.root.querySelector("#spin-breakdown")!.textContent = "";
      this.ui.root.querySelector("#spin-status")!.textContent = `Stake ${number(spin.totalStake)} tokens · debited`;
      await Promise.all(
        this.reels.map((reel, c) =>
          reel.play(spin.outcome.grid[c], c * tuning.stagger, spin.outcome.stops[c], this.reducedMotion(), () => {
            if (run === this.run) this.audio.reelStopped();
          }),
        ),
      );
      if (run !== this.run) return;
      this.audio.stopReels();
      owner.state = reelsStopped(owner.state, spin.id);
      this.celebrate(spin);
      if (document.hidden || this.reducedMotion()) this.finishNumbers();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not start the spin";
      this.ui.root.querySelector("#spin-status")!.textContent = message;
      this.ui.root.querySelector("#result-announcement")!.textContent = message;
    }
  }
  private celebrate(spin: SpinRecord) {
    const tier = classifyWin(spin.totalStake, spin.outcome.payout);
    const settings = { ...owner.state.save.settings, reducedMotion: this.reducedMotion() };
    const labels = {
      neutral:
        spin.outcome.payout === spin.totalStake
          ? "Break-even"
          : spin.outcome.payout
            ? "Tokens returned"
            : "No return this time",
      small: "Win",
      big: "Big win",
      jackpot: "Jackpot",
    };
    this.ui.root.querySelector("#win-label")!.textContent =
      `${labels[tier]}${spin.outcome.payout ? " · credited automatically" : ""}`;
    this.completeResult(spin);
    this.payoutDisplay.to(spin.outcome.payout, this.reducedMotion() || document.hidden);
    if (document.hidden || settings.reducedMotion || tier === "neutral") {
      if (!document.hidden && spin.outcome.payout > 0) this.returnedLine = playWin(this, spin, settings);

      owner.state = finishSpin(owner.state, spin.id);
      this.refresh();
      return;
    }
    this.audio.play(tier);
    this.audio.duck(true);
    const featured = [...spin.outcome.lineWins].sort((a, b) => b.payout - a.payout)[0];
    for (let c = 0; c < 5; c++)
      this.reels[c].highlight(
        featured && c < featured.count ? [machine.paylines[featured.lineIndex][c]] : [],
        settings.effectsIntensity,
        settings.reducedMotion,
      );
    this.win = playWin(this, spin, settings);
    const win = this.win;
    this.refresh();
    void win.done.then(() => {
      if (this.win === win) this.endWin();
    });
  }
  private endWin() {
    this.win = undefined;
    this.reels.forEach((r) => {
      r.clearHighlight();
    });
    this.audio.stopWin();
    this.audio.duck(false);
    if (owner.state.activeSpinId !== null) owner.state = finishSpin(owner.state, owner.state.activeSpinId);
    this.refresh();
  }
  private completeResult(spin: SpinRecord) {
    const breakdown = this.ui.root.querySelector("#spin-breakdown")!;
    if (!breakdown.querySelector("#net")) {
      breakdown.replaceChildren(document.createTextNode(`Stake ${number(spin.totalStake)} · Returned `));
      const returned = document.createElement("span");
      returned.id = "returned";
      returned.style.width = `${Math.max(1, number(spin.outcome.payout).length)}ch`;
      returned.textContent = "0";
      breakdown.append(returned, document.createTextNode(" · Net "));
      const net = document.createElement("span");
      net.id = "net";
      net.style.width = `${Math.max(4, number(spin.outcome.payout - spin.totalStake).length + (spin.outcome.payout > spin.totalStake ? 1 : 0))}ch`;
      net.textContent = number(-spin.totalStake);
      breakdown.append(net);
    }
    this.ui.root.querySelector("#result-summary")!.textContent = this.resultAnnouncement(spin);
    const lines = spin.outcome.lineWins.map((win) => win.lineIndex + 1);
    this.ui.root.querySelector("#spin-status")!.textContent = lines.length
      ? `Winning lines: ${lines.join(", ")} · Lines & payouts shows each path`
      : "No winning lines · SPACE to spin again";
    if (spin.id !== this.announcedSpinId) {
      this.ui.root.querySelector("#result-announcement")!.textContent = this.resultAnnouncement(spin);
      this.announcedSpinId = spin.id;
    }
  }
  private settleReels() {
    this.reels.forEach((reel) => {
      reel.finish();
    });
    this.audio.stopReels();
  }
  private reducedMotion() {
    return owner.state.save.settings.reducedMotion || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  private finishNumbers() {
    this.balanceDisplay.finish();
    this.payoutDisplay.finish();
  }
  private resultAnnouncement(spin: SpinRecord) {
    return `${describeSpinResult(spin).announcement} Balance ${number(owner.state.save.balance)} tokens. Payout already credited.`;
  }
  private cashOut() {
    if (this.leaving || owner.state.phase === "spinning") return;
    this.leaving = true;
    this.skip();
    this.finishNumbers();
    this.scene.start("salon");
  }
  private skip() {
    if (this.win) {
      this.win.skip();
      this.endWin();
      this.audio.silence();
      this.finishNumbers();
    }
  }
}
