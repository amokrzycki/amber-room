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
import { describeSpinResult, resultWord, signed, symbolNames } from "./spinResult";
import { NumberDisplay } from "./NumberDisplay";
import { idleGrid } from "./idleGrid";
import { createWinMarks } from "./winMarks";

/** After SKIP, ignore further activations briefly so a double-click or echoed key cannot start a new wager. */
const SKIP_REARM_MS = 350;
/** A synthetic click right after a keyboard activation is that activation echoing, not a second one. */
const KEY_ECHO_MS = 400;

/** Digits are fitted to their column from the character count, so long balances shrink instead of clipping. */
function figure(el: Element, text: string) {
  el.textContent = text;
  (el as HTMLElement).style.setProperty("--len", String(text.length));
}
export class SlotScene extends Phaser.Scene {
  private reels: ReelView[] = [];
  private audio!: GameAudio;
  private ui!: ReturnType<typeof mountUI>;
  private win: ReturnType<typeof playWin> | undefined;
  private run = 0;
  private balanceDisplay!: NumberDisplay;
  private payoutDisplay!: NumberDisplay;
  private leaving = false;
  private marks!: ReturnType<typeof createWinMarks>;
  private armedAt = 0;
  private keyAt = -Infinity;
  private announcedSpinId = 0;
  constructor() {
    super("slot");
  }
  init() {
    this.reels = [];
    this.leaving = false;
    this.win = undefined;
    this.armedAt = 0;
    this.keyAt = -Infinity;
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
    this.marks = createWinMarks(this);
    const bet = owner.state.save.selectedBet;
    const lastSpin = owner.state.save.lastSpin;
    this.announcedSpinId = lastSpin?.id ?? 0;
    const options = (values: number[], current: number) =>
      values.map((n) => `<option ${n === current ? "selected" : ""}>${n}</option>`).join("");
    this.ui = mountUI(
      this,
      this.audio,
      `<h1 class="machine-name">THE ORCHARD</h1><button class="back" id="back">BACK TO LOUNGE</button><div class="slot-hud"><section class="hud-group balance-block" aria-labelledby="hud-balance"><span class="hud-label" id="hud-balance">BALANCE</span><div class="hud-figure"><strong id="balance" aria-hidden="true">${number(owner.state.save.balance)}</strong></div><span class="hud-note">tokens</span><span class="sr-only" id="balance-final">${number(owner.state.save.balance)} tokens</span></section><section class="hud-group returned-block" aria-labelledby="hud-returned"><div class="hud-head"><span class="hud-label" id="hud-returned">RETURNED</span><details class="win-details" data-empty><summary></summary><div class="win-panel"><p class="win-title"></p><div class="win-list"></div></div></details></div><div class="hud-figure payout"><strong id="payout" aria-hidden="true">${lastSpin ? number(lastSpin.outcome.payout) : "—"}</strong></div><p class="hud-note" id="spin-status"><span id="result-word"></span><span id="net-wrap" aria-hidden="true" hidden> · Net <strong id="net"></strong></span></p></section><section class="hud-group bet-block" aria-labelledby="hud-bet"><span class="hud-label" id="hud-bet">BET &amp; SPIN</span><div class="bet-row"><label><span>Per line</span><select id="per-line">${options([1, 2, 5], bet.perLine)}</select></label><span class="op" aria-hidden="true">×</span><label><span>Lines</span><select id="line-count">${options([1, 5, 10, 20, 40], bet.lineCount)}</select></label><span class="op" aria-hidden="true">=</span><div class="total"><span>Total bet</span><strong id="stake">${bet.lineCount * bet.perLine}</strong></div><button id="spin" class="primary" data-state="idle" aria-label="Spin reels" aria-keyshortcuts="Space"><span class="face">SPIN</span></button></div></section></div><p class="sr-only" id="result-summary">${lastSpin ? describeSpinResult(lastSpin).announcement : ""}</p><p class="sr-only" id="result-announcement" role="status" aria-live="polite" aria-atomic="true"></p>`,
    );
    const root = this.ui.root;
    const q = <T extends Element>(selector: string) => root.querySelector<T>(selector)!;
    if (lastSpin) {
      this.showResult(lastSpin, "Last spin");
      this.marks.show(lastSpin.outcome.lineWins);
    } else q("#result-word").textContent = "Choose a bet · SPACE to spin";
    this.balanceDisplay = new NumberDisplay(owner.state.save.balance, (value) => {
      figure(q("#balance"), number(value));
    });
    this.payoutDisplay = new NumberDisplay(lastSpin?.outcome.payout ?? 0, (value) => {
      figure(q("#payout"), number(value));
    });
    q("#back").addEventListener("click", () => this.cashOut());
    q<HTMLButtonElement>("#back").addEventListener("keydown", (event) => {
      if ((event.key === "Enter" || event.code === "Space") && event.repeat) event.preventDefault();
    });
    const spinButton = q<HTMLButtonElement>("#spin");
    const press = () => {
      if (this.ui.dialog.open) return;
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
    spinButton.addEventListener("click", (event) => {
      if (event.detail === 0 && performance.now() - this.keyAt < KEY_ECHO_MS) return;
      this.activate();
    });
    const change = () => {
      owner.commit(
        selectBet(owner.state, {
          lineCount: Number(q<HTMLSelectElement>("#line-count").value),
          perLine: Number(q<HTMLSelectElement>("#per-line").value),
        } as Bet),
      );
      this.refresh();
    };
    root.querySelectorAll("select").forEach((el) => {
      el.addEventListener("change", change);
    });
    const details = q<HTMLDetailsElement>(".win-details");
    const closeDetails = () => {
      details.open = false;
    };
    const preview = (event: Event) => {
      const spin = owner.state.save.lastSpin;
      const line = (event.target as Element).closest<HTMLElement>("[data-line]");
      if (!spin || !line) return;
      const wins = spin.outcome.lineWins;
      this.marks.show(
        wins,
        event.type === "mouseout" || event.type === "focusout"
          ? undefined
          : wins.find((w) => w.lineIndex === Number(line.dataset.line)),
      );
    };
    const panel = q(".win-panel");
    panel.addEventListener("focusin", preview);
    panel.addEventListener("focusout", preview);
    panel.addEventListener("mouseover", preview);
    panel.addEventListener("mouseout", preview);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !this.ui.dialog.open) {
        if (details.open) closeDetails();
        else if (owner.state.phase === "celebrating") this.skip();
        return;
      }
      const target = e.target instanceof Element ? e.target : null;
      const interactive = target?.closest("button, select, input, summary, a, dialog");
      if (
        (e.code !== "Space" && !(e.key === "Enter" && target === spinButton)) ||
        this.ui.dialog.open ||
        (interactive && interactive !== spinButton)
      )
        return;
      e.preventDefault();
      if (e.repeat) return;
      this.keyAt = performance.now();
      press();
      this.activate();
    };
    const releaseKey = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.key === "Enter") {
        release();
        // Browsers fire the button's click on Space keyup; the keydown already acted.
        if (event.target === spinButton) event.preventDefault();
      }
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
      this.marks.dispose();
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
    this.refresh();
    if (import.meta.env.DEV)
      void import("./devScenarios").then((m) => {
        if (this.scene.isActive()) m.installScenarios(this.ui.root, (stops) => this.start(stops));
      });
  }
  /** The single SPIN/SKIP gesture: every pointer, key and assistive activation lands here. */
  private activate() {
    if (this.leaving || this.ui.dialog.open) return;
    const now = performance.now();
    if (now < this.armedAt) return;
    if (owner.state.phase === "spinning") {
      this.armedAt = now + SKIP_REARM_MS;
      this.settleReels(); // The committed outcome is already saved; this only ends the animation.
      return;
    }
    void this.start();
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
    const spin = root.querySelector<HTMLButtonElement>("#spin")!;
    const skipping = s.phase === "spinning";
    spin.querySelector(".face")!.textContent = skipping ? "SKIP" : "SPIN";
    spin.setAttribute("aria-label", skipping ? "Skip to result" : "Spin reels");
    spin.dataset.state = s.phase === "ready" ? "idle" : s.phase === "celebrating" ? "settled" : "spinning";
    this.ui.warning();
  }
  private note(text: string) {
    const root = this.ui.root;
    root.querySelector("#result-word")!.textContent = text;
    root.querySelector<HTMLElement>("#net-wrap")!.hidden = true;
  }
  /** Result line: a word for the outcome plus signed net. The net is final at once; only RETURNED counts up. */
  private showResult(spin: SpinRecord, word: string) {
    const root = this.ui.root;
    const net = spin.outcome.payout - spin.totalStake;
    root.querySelector("#result-word")!.textContent = word;
    const wrap = root.querySelector<HTMLElement>("#net-wrap")!;
    wrap.hidden = false;
    wrap.dataset.sign = net > 0 ? "gain" : net < 0 ? "loss" : "even";
    root.querySelector("#net")!.textContent = signed(net);
    root.querySelector<HTMLElement>("#spin-status")!.title = describeSpinResult(spin).breakdown;
    this.renderDetails(spin);
  }
  private renderDetails(spin: SpinRecord) {
    const details = this.ui.root.querySelector<HTMLDetailsElement>(".win-details")!;
    const wins = spin.outcome.lineWins;
    details.open = false;
    details.toggleAttribute("data-empty", wins.length === 0);
    details.inert = wins.length === 0;
    details.querySelector("summary")!.textContent = `${wins.length} winning line${wins.length === 1 ? "" : "s"}`;
    details.querySelector(".win-title")!.textContent =
      `Stake ${number(spin.totalStake)} · Returned ${number(spin.outcome.payout)}`;
    details.querySelector(".win-list")!.replaceChildren(
      ...wins.map((w) => {
        const row = document.createElement("button");
        row.type = "button";
        row.dataset.line = String(w.lineIndex);
        row.innerHTML = `<b>Line ${w.lineIndex + 1}</b><span>${symbolNames[w.symbol]} ×${w.count}</span><em>${number(w.payout)}</em>`;
        return row;
      }),
    );
  }
  private async start(forced?: number[]) {
    if (this.leaving || this.ui.dialog.open) return;
    if (owner.state.phase === "celebrating") this.skip(); // End the win overlay, then take the new deliberate spin.
    if (owner.state.phase !== "ready") return;
    this.finishNumbers();
    this.marks.clear();
    const stale = this.ui.root.querySelector<HTMLDetailsElement>(".win-details")!;
    stale.open = false;
    stale.toggleAttribute("data-empty", true);
    stale.inert = true; // The previous spin's lines are not this spin's; hide them until it settles.
    accrue();
    let i = 0;
    try {
      const result = requestSpin(owner.state, forced ? () => forced[i++] : secureRng);
      if (!result.ok) {
        const message =
          result.reason === "insufficient-funds"
            ? "Not enough tokens · try a smaller bet"
            : "Please wait for the spin to finish";
        this.note(message);
        this.ui.root.querySelector("#result-announcement")!.textContent = message;
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
      figure(this.ui.root.querySelector("#payout")!, "—");
      this.ui.root.querySelector("#result-summary")!.textContent = "";
      this.note("Reels turning");
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
      this.note(message);
      this.ui.root.querySelector("#result-announcement")!.textContent = message;
    }
  }
  private celebrate(spin: SpinRecord) {
    const tier = classifyWin(spin.totalStake, spin.outcome.payout);
    const settings = { ...owner.state.save.settings, reducedMotion: this.reducedMotion() };
    this.showResult(spin, resultWord(spin, tier));
    this.completeResult(spin);
    this.marks.show(spin.outcome.lineWins);
    this.payoutDisplay.to(spin.outcome.payout, this.reducedMotion() || document.hidden);
    if (document.hidden || settings.reducedMotion || tier === "neutral") {
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
    this.ui.root.querySelector("#result-summary")!.textContent = this.resultAnnouncement(spin);
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
