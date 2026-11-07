export {};

declare global {
  interface Window {
    __stops: number[];
    __audio: {
      contexts: number;
      active: number;
      started?: number;
      starts?: number;
      events?: { duration: number | undefined; time: number; loop: boolean }[];
    };
    __masterMute: GainNode;
    __now: number;
    __incomeTick: () => void;
    __hidden: boolean;
    __cabinetUploads: number[];
    __frames: number[];
    __callbacks: number[];
    __phases: Record<string, number[]>;
    __spinStarted: number;
    __changes: Record<string, (string | null)[]>;
    __announcements: (string | null)[];
    __coherence: boolean[];
    __moneyObserver: MutationObserver;
    __announcementObserver: MutationObserver;
    __ann: (string | null)[];
    __saves: number;
    __layout: { n: number; box: Record<string, { min: number[]; max: number[] }> } | null;
    __sample: () => void;
    __resultUpdates: string[];
  }
}
