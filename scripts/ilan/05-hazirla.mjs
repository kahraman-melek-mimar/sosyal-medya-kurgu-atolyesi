// Etkin projenin girdi/ klasöründeki ham medyayı IlanReel'in rahat oynatacağı biçime çevirir → assets/
//   npm run ilan:hazirla [-- --ayna IMG_1052 …] [--yeniden]
//   video : 1080×1920 (dikey, döndürme bilgisi uygulanır), 30 fps, H.264 yuv420p bt709, AAC 48 kHz.
//           iPhone HLG/PQ HDR → SDR Rec.709 ton eşleme (zscale + hable). 4K/60 DJI → 1080p/30.
//   foto  : HEIC/JPG/PNG → JPG (uzun kenar 2160). --ayna <ad>: selfie gibi ayna görüntülerini yatay çevirir.
//   Ham dosyalara dokunulmaz. Çıktı adları kısa: DJI_20261013_101231_526_video.mp4 → dji-101231.mp4, IMG_1040.MOV → img-1040.mp4
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, realpathSync, renameSync, statSync } from "node:fs";
import path from "node:path";
import { p } from "../lib/paths.mjs";

const args = process.argv.slice(2);
const ayna = new Set(args.flatMap((a, i) => (args[i - 1] === "--ayna" ? [a.toUpperCase()] : [])));
const yeniden = args.includes("--yeniden");
const GIRDI = path.join(path.dirname(realpathSync(p("work"))), "girdi"); // work → projects/<etkin>/work kısayolu; girdi onun kardeşi
const ASSETS = p("public/assets");
if (!existsSync(GIRDI)) throw new Error("Etkin projede girdi/ klasörü yok (npm run proje).");
mkdirSync(ASSETS, { recursive: true });

const tumu = (d) => readdirSync(d).flatMap((n) => (n.startsWith(".") ? [] : statSync(path.join(d, n)).isDirectory() ? tumu(path.join(d, n)) : [path.join(d, n)]));
const kisaAd = (f) => {
  const b = path.basename(f, path.extname(f));
  const dji = b.match(/^DJI_\d{8}_(\d{6})_/);
  return (dji ? `dji-${dji[1]}` : b.replace(/^IMG_/, "img-")).toLowerCase();
};
const probe = (f) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "json", f]).toString()).streams[0];

for (const f of tumu(GIRDI)) {
  const uz = path.extname(f).toLowerCase();
  const ad = kisaAd(f);
  if ([".mp4", ".mov", ".m4v"].includes(uz)) {
    const hedef = path.join(ASSETS, `${ad}.mp4`);
    if (existsSync(hedef) && !yeniden) { console.log(`var    ${ad}.mp4`); continue; }
    const hdr = ["arib-std-b67", "smpte2084"].includes(probe(f).color_transfer);
    const renk = hdr
      ? "zscale=t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
      : "";
    const vf = `${renk}scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos,crop=1080:1920,fps=30,setsar=1,format=yuv420p`;
    console.log(`video  ${path.basename(f)} → ${ad}.mp4${hdr ? " (HDR→SDR)" : ""}`);
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", f, "-vf", vf, "-c:v", "libx264", "-preset", "medium", "-crf", "17",
      "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
      "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", hedef], { stdio: "inherit" });
  } else if ([".heic", ".jpg", ".jpeg", ".png"].includes(uz)) {
    const hedef = path.join(ASSETS, `${ad}.jpg`);
    if (existsSync(hedef) && !yeniden) { console.log(`var    ${ad}.jpg`); continue; }
    const cevir = ayna.has(path.basename(f, path.extname(f)).toUpperCase());
    console.log(`foto   ${path.basename(f)} → ${ad}.jpg${cevir ? " (ayna düzeltildi)" : ""}`);
    execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "92", "-Z", "2160", f, "--out", hedef], { stdio: "ignore" });
    // Ayna çevirme ffmpeg ile: sips JPG'ye EXIF yönü bırakır ve -f ham pikselleri çevirir → dikey fotoğraf baş aşağı
    // olur (Ekim 2026). ffmpeg yönü uygulayıp sonra çevirir; çıktıda EXIF yönü kalmaz.
    if (cevir) {
      const ara = `${hedef}.ara.jpg`;
      execFileSync("ffmpeg", ["-v", "error", "-y", "-i", hedef, "-vf", "hflip", "-q:v", "2", ara]);
      renameSync(ara, hedef);
    }
  }
}
console.log("✓ assets/ hazır");
