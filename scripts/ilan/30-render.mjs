// Kurguyu render eder.
//   npm run ilan:render -- golbasi-villa            → out/golbasi-villa/final-dikey.mp4
//   npm run ilan:render -- golbasi-villa --kare=240 → out/golbasi-villa/onizleme-240.png (tek kare, hızlı)
//   npm run ilan:render                              → eski düzen (work/ilan-plan.json → out/final-dikey.mp4)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { KOK, kurguAdi, kurguGerekli, yollar } from "./lib/kurgu.mjs";

const y = yollar(kurguAdi());
kurguGerekli(y);
if (!existsSync(y.plan)) {
  console.error(`Plan yok: ${path.relative(KOK, y.plan)}`);
  process.exit(1);
}
// Eski planlarda `klasor` eksik olabilir; kurgu klasöründeki plan her zaman kendi klasörüne göre çözülür.
if (y.ad) {
  const plan = JSON.parse(readFileSync(y.plan, "utf8"));
  if (plan.klasor !== y.klasor) {
    console.error(`plan.json içindeki "klasor" alanı "${y.klasor}" olmalı (şu an: ${JSON.stringify(plan.klasor)}).`);
    process.exit(1);
  }
}
mkdirSync(y.cikti, { recursive: true });

const kareArg = process.argv.find((a) => a.startsWith("--kare="));
const ortak = ["src/ilan/giris.ts", "IlanReel"];
const args = kareArg
  ? ["remotion", "still", ...ortak, path.join(y.cikti, `onizleme-${kareArg.slice(7)}.png`), `--props=${y.plan}`, `--frame=${kareArg.slice(7)}`]
  : [
      "remotion", "render", ...ortak, path.join(y.cikti, "final-dikey.mp4"), `--props=${y.plan}`,
      "--codec=h264", "--crf=18", "--pixel-format=yuv420p", "--color-space=bt709", "--audio-codec=aac",
    ];
const r = spawnSync("npx", args, { cwd: KOK, stdio: "inherit" });
process.exit(r.status ?? 1);
