import { enableLivingLounge } from "../src/runtimeMode";

if (!import.meta.env.DEV) throw new Error("Living Lounge is a development-only playtest");
enableLivingLounge();
await import("../src/main");
