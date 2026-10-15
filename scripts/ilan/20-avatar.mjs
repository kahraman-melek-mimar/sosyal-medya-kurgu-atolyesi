// ElevenLabs seslendirmesiyle HeyGen avatar videosu üretir (dudaklar bu sese senkron).
//
//   npm run ilan:avatar -- <kurgu>   → public/kurgular/<kurgu>/seslendirme.mp3 → HeyGen → avatar.mp4
//   (kurgu adı verilmezse eski düzen: public/assets/)
//
// Gerekenler (.env): HEYGEN_API_KEY, HEYGEN_AVATAR_ID. Önce: npm run ilan:seslendir.
// Ayarlar: library/ilan-ses-ayarlari.json → heygen (9:16, 1080p, CB lacivert arka plan).
// Üretim HeyGen kredisi harcar; aynı ses için yeniden çalıştırmadan önce mevcut avatar.mp4'ü kontrol edin.
import "./lib/env.mjs";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { KOK, kurguAdi, kurguGerekli, p, yollar } from "./lib/kurgu.mjs";

const y = yollar(kurguAdi());
kurguGerekli(y);
const API = process.env.HEYGEN_BASE_URL || "https://api.heygen.com";
const { HEYGEN_API_KEY: anahtar, HEYGEN_AVATAR_ID: avatar } = process.env;

if (!anahtar || !avatar) {
  console.error(".env içinde HEYGEN_API_KEY ve HEYGEN_AVATAR_ID gerekli (.env.example'a bakın).");
  process.exit(1);
}
const sesYolu = y.seslendirme;
if (!existsSync(sesYolu)) {
  console.error(`${path.relative(KOK, sesYolu)} yok. Önce: npm run ilan:seslendir${y.ad ? ` -- ${y.ad}` : ""}`);
  process.exit(1);
}
const ayar = JSON.parse(readFileSync(p("library/ilan-ses-ayarlari.json"), "utf8")).heygen;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const istek = async (yol, secenek = {}) => {
  const y = await fetch(API + yol, { ...secenek, headers: { "X-Api-Key": anahtar, ...(secenek.headers ?? {}) } });
  const govde = await y.text();
  if (!y.ok) throw new Error(`HeyGen ${secenek.method ?? "GET"} ${yol} → ${y.status}: ${govde}`);
  return JSON.parse(govde);
};

// 1) Sesi yükle
const form = new FormData();
form.append("file", new Blob([readFileSync(sesYolu)], { type: "audio/mpeg" }), "seslendirme.mp3");
const varlik = await istek("/v3/assets", { method: "POST", body: form });
const audioId = varlik.data?.id;
if (!audioId) throw new Error(`Yükleme yanıtında data.id yok: ${JSON.stringify(varlik)}`);
console.log(`✓ Ses yüklendi (asset ${audioId})`);

// 2) Videoyu başlat
const olustur = await istek("/v3/videos", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "avatar",
    avatar_id: avatar,
    audio_asset_id: audioId,
    title: `İlan seslendirme ${new Date().toISOString().slice(0, 16)}`,
    aspect_ratio: ayar.aspect_ratio,
    resolution: ayar.resolution,
    background: ayar.background,
  }),
});
const videoId = olustur.data?.video_id;
if (!videoId) throw new Error(`Oluşturma yanıtında data.video_id yok: ${JSON.stringify(olustur)}`);
writeFileSync(y.heygenJson, JSON.stringify({ videoId, audioId, baslangic: new Date().toISOString() }, null, 2));
console.log(`✓ Video başlatıldı (${videoId}). Hazırlanıyor — genelde birkaç dakika sürer…`);

// 3) Bekle (en fazla 30 dk)
let video;
for (let i = 0; i < 180; i++) {
  await bekle(10_000);
  video = (await istek(`/v3/videos/${videoId}`)).data;
  if (video.status === "completed" || video.status === "failed") break;
  if (i % 3 === 0) process.stdout.write(`  durum: ${video.status} (${(i + 1) * 10} sn)\n`);
}
if (video?.status !== "completed") {
  console.error(`HeyGen videosu tamamlanmadı: ${video?.status} ${video?.failure_message ?? ""}\nKimlik ${path.relative(KOK, y.heygenJson)} içinde; HeyGen panelinden de bakabilirsiniz.`);
  process.exit(1);
}

// 4) İndir (bağlantı 7 gün geçerli)
const dosya = await fetch(video.video_url);
if (!dosya.ok) throw new Error(`İndirme hatası ${dosya.status}`);
writeFileSync(y.avatar, Buffer.from(await dosya.arrayBuffer()));
console.log(`✓ ${path.relative(KOK, y.avatar)} indirildi.`);
console.log(`Plan: konuşma sahnelerinde  { "tip": "konusma", "src": "${y.avatarSrc}", "senkron": true }  kullanın; dudaklar seslendirmeyle eşleşir.`);
