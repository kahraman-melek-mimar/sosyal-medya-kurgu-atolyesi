// İlan metnini ElevenLabs ile seslendirir ve altyazıları kelime zamanlarından üretir.
//
//   npm run ilan:seslendir -- <kurgu>          → public/kurgular/<kurgu>/metin.md → seslendirme.mp3 + plan.json güncellenir
//   npm run ilan:seslendir -- <kurgu> --kuru   → API çağrısı YOK: okunuş metnini ve altyazı parçalarını gösterir (ücretsiz)
//   (kurgu adı verilmezse eski düzen: work/metin.md → public/assets/seslendirme.mp3)
//
// Gerekenler (.env): ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID. İsteğe bağlı: ELEVENLABS_DICTIONARY_ID + _VERSION_ID.
// Ayarlar: library/ilan-ses-ayarlari.json. Telaffuz düzeltmeleri: library/telaffuz/sozluk.tr.json.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import "./lib/env.mjs";
import { seslendirmePlani } from "./lib/okunus.mjs";
import { KOK, kurguAdi, kurguGerekli, p, yollar } from "./lib/kurgu.mjs";

const kuru = process.argv.includes("--kuru");
const y = yollar(kurguAdi());
kurguGerekli(y);
const metinDosyasi = process.argv.find((a) => a.endsWith(".md") || a.endsWith(".txt")) ?? y.metin;

if (!existsSync(metinDosyasi)) {
  console.error(`Metin bulunamadı: ${path.relative(KOK, metinDosyasi)}\nİlan metnini bu dosyaya yazın (düz cümleler; # ile başlayan satırlar okunmaz).`);
  process.exit(1);
}
const ayar = JSON.parse(readFileSync(p("library/ilan-ses-ayarlari.json"), "utf8"));
const plan = seslendirmePlani(readFileSync(metinDosyasi, "utf8"));

console.log("── Okunuş metni (ElevenLabs'e gidecek) ──\n" + plan.okunus + "\n");
console.log("── Altyazı parçaları ──");
plan.parcalar.forEach((x, i) => console.log(`${String(i + 1).padStart(2)}. ${x.yazili}`));
console.log(`\n${plan.okunus.length} karakter · ~${Math.round(plan.okunus.split(/\s+/).length / 2.4)} sn (tahmini)`);
if (kuru) {
  console.log("\n--kuru: API çağrılmadı. Yanlış okunacak bir kelime görürseniz library/telaffuz/sozluk.tr.json'a ekleyin.");
  process.exit(0);
}

const { ELEVENLABS_API_KEY: anahtar, ELEVENLABS_VOICE_ID: ses } = process.env;
if (!anahtar || !ses) {
  console.error("\n.env içinde ELEVENLABS_API_KEY ve ELEVENLABS_VOICE_ID gerekli (.env.example'a bakın).");
  process.exit(1);
}

const el = ayar.elevenlabs;
const govde = {
  text: plan.okunus,
  model_id: process.env.ELEVENLABS_MODEL_ID || el.model_id,
  voice_settings: el.voice_settings,
  seed: el.seed,
  apply_text_normalization: el.apply_text_normalization,
};
// language_code multilingual_v2 modellerinde desteklenmiyor; diğer modellerde Türkçe'yi zorla.
if (!govde.model_id.includes("multilingual_v2")) govde.language_code = "tr";
if (process.env.ELEVENLABS_DICTIONARY_ID) {
  govde.pronunciation_dictionary_locators = [{ id: process.env.ELEVENLABS_DICTIONARY_ID, version_id: process.env.ELEVENLABS_DICTIONARY_VERSION_ID }];
}

const url = `${process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io"}/v1/text-to-speech/${ses}/with-timestamps?output_format=${el.output_format}`;
console.log(`\nElevenLabs'e gönderiliyor (${govde.model_id})…`);
const yanit = await fetch(url, { method: "POST", headers: { "xi-api-key": anahtar, "Content-Type": "application/json" }, body: JSON.stringify(govde) });
if (!yanit.ok) {
  console.error(`ElevenLabs hatası ${yanit.status}: ${await yanit.text()}`);
  process.exit(1);
}
const veri = await yanit.json();

mkdirSync(path.dirname(y.seslendirme), { recursive: true });
mkdirSync(path.dirname(y.plan), { recursive: true });
writeFileSync(y.seslendirme, Buffer.from(veri.audio_base64, "base64"));

// Karakter zamanlarından altyazı zamanları. alignment, gönderdiğimiz metnin karakterleriyle birebirdir;
// uzunluk tutmazsa (beklenmez) orantılı eşlemeye düşeriz.
const hiza = veri.alignment ?? veri.normalized_alignment;
const n = hiza.characters.length;
const birebir = n === plan.okunus.length;
const zaman = (i, tur) => {
  const j = birebir ? i : Math.round((i / plan.okunus.length) * (n - 1));
  const k = Math.max(0, Math.min(n - 1, j));
  return tur === "bas" ? hiza.character_start_times_seconds[k] : hiza.character_end_times_seconds[k];
};
const ofset = ayar.zamanlama.seslendirmeBaslangic;
const sure = hiza.character_end_times_seconds[n - 1];
const altyazi = plan.parcalar.map((x, i) => {
  const from = zaman(x.bas, "bas");
  const sonraki = plan.parcalar[i + 1];
  const to = sonraki ? zaman(sonraki.bas, "bas") : zaman(x.son - 1, "son") + ayar.zamanlama.altyaziKuyruk;
  return { from: +(from + ofset).toFixed(3), to: +(to + ofset).toFixed(3), text: x.yazili };
});
writeFileSync(y.seslendirmeJson, JSON.stringify({ okunus: plan.okunus, sure, birebirHiza: birebir, parcalar: plan.parcalar, altyazi }, null, 2));

// Planı güncelle: seslendirme kanalı + altyazılar.
const planYolu = y.plan;
const ilanPlan = existsSync(planYolu)
  ? JSON.parse(readFileSync(planYolu, "utf8"))
  : JSON.parse(readFileSync(p("library/examples/ilan-plan.example.json"), "utf8"));
if (y.klasor) ilanPlan.klasor = y.klasor;
ilanPlan.seslendirme = { src: y.seslendirmeSrc, from: ofset, ses: 1 };
ilanPlan.altyazi = altyazi;
// Varsayılan müzik: public/marka/muzik.(mp3|m4a|wav) varsa ve planda müzik yoksa eklenir (seslendirmede otomatik kısılır).
if (!ilanPlan.muzik) {
  const muzik = ["mp3", "m4a", "wav"].map((x) => `marka/muzik.${x}`).find((x) => existsSync(p("public", x)));
  if (muzik) ilanPlan.muzik = { src: muzik, ses: 0.22, konusmadaSes: 0.08 };
}
writeFileSync(planYolu, JSON.stringify(ilanPlan, null, 2));

const sahneToplam = ilanPlan.sahneler.reduce((s, x) => s + x.sure, 0);
console.log(`
✓ ${path.relative(KOK, y.seslendirme)} (${sure.toFixed(1)} sn) · ${altyazi.length} altyazı · ${path.relative(KOK, y.plan)} güncellendi`);
if (!birebir) console.warn("! Hizalama uzunluğu metinle tutmadı; altyazılar orantılı eşlendi — stillerde kontrol edin.");
if (sahneToplam < sure + ofset) console.warn(`! Sahnelerin toplamı (${sahneToplam.toFixed(1)} sn) seslendirmeden (${(sure + ofset).toFixed(1)} sn) kısa: sahne sürelerini uzatın, yoksa ses kapanış kartının üstüne taşar.`);
const ek = y.ad ? ` -- ${y.ad}` : "";
console.log(`Sıradaki adım: npm run ilan:avatar${ek} (HeyGen) veya doğrudan npm run ilan:render${ek}`);
