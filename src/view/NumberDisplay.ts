import { tuning } from "./tuning";
/** Display only: settlement always belongs to the saved session. */
export class NumberDisplay {
  private frame = 0;
  private value: number;
  private target: number;
  constructor(
    initial: number,
    private render: (value: number) => void,
  ) {
    this.value = this.target = initial;
  }
  to(target: number, reducedMotion: boolean) {
    if (target === this.target) {
      if (reducedMotion || !this.frame) this.finish();
      return;
    }
    this.dispose();
    this.target = target;
    if (reducedMotion) {
      this.finish();
      return;
    }
    const from = this.value;
    const started = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, Math.max(0, (now - started) / tuning.counter));
      const eased = 1 - (1 - progress) ** 3;
      this.value = progress === 1 ? target : Math.round(from * (1 - eased) + target * eased);
      this.render(this.value);
      this.frame = progress < 1 ? requestAnimationFrame(update) : 0;
    };
    this.frame = requestAnimationFrame(update);
  }
  finish() {
    this.dispose();
    this.value = this.target;
    this.render(this.value);
  }
  dispose() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }
}
