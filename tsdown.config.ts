import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["./src/anode.ts"],
  platform: "neutral",
  dts: true,
});
