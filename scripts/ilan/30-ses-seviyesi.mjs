// İlan videosunun sesini sosyal medya seviyesine getirir (Instagram/TikTok ≈ -14 LUFS, tepe ≤ -1 dBTP).
// İki geçişli loudnorm: önce ölçer, sonra doğrusal kazançla düzeltir (müzik/ses dengesi bozulmaz). Görüntü kopyalanır.
//   node scripts/ilan/30-ses-seviyesi.mjs <girdi.mp4> <çıktı.mp4>
//   npm run ilan:render  → out/.ham-dikey.mp4 → out/final-dikey.mp4 (bu adım otomatik çalışır)
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, renameSync, unlinkSync } from "node:fs";

const [girdi, cikti] = process.argv.slice(2);
if (!girdi || !cikti || !existsSync(girdi)) {
  console.error("Kullanım: node scripts/ilan/30-ses-seviyesi.mjs <girdi.mp4> <çıktı.mp4>");
  process.exit(1);
}
const HEDEF = { I: -14, TP: -1, LRA: 11 };
const filtre = `loudnorm=I=${HEDEF.I}:TP=${HEDEF.TP}:LRA=${HEDEF.LRA}`;

const olc = (dosya) => {
  // loudnorm ölçümünü stderr'e yazar.
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", dosya, "-vn", "-af", `${filtre}:print_format=json`, "-f", "null", "-"], { encoding: "utf8" });
  return JSON.parse(r.stderr.match(/\{[\s\S]*\}/)[0]);
};

const o = olc(girdi);
console.log(`Önce: ${o.input_i} LUFS, tepe ${o.input_tp} dBTP`);
const gecici = `${cikti}.gecici.mp4`;
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", girdi, "-c:v", "copy",
  "-af", `${filtre}:measured_I=${o.input_i}:measured_TP=${o.input_tp}:measured_LRA=${o.input_lra}:measured_thresh=${o.input_thresh}:offset=${o.target_offset}:linear=true,aresample=48000`,
  "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", gecici,
]);
renameSync(gecici, cikti);
const s = olc(cikti);
console.log(`Sonra: ${s.input_i} LUFS, tepe ${s.input_tp} dBTP → ${cikti}`);
if (process.argv.includes("--ham-sil")) unlinkSync(girdi);
