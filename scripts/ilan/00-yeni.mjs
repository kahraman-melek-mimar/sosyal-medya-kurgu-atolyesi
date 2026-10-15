// Yeni kurgu klasörü açar.
//   npm run ilan:yeni -- golbasi-villa      → public/kurgular/golbasi-villa/ (metin.md, plan.json, medya/)
//   npm run ilan:yeni                        → mevcut kurguları listeler
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { kurguAdi, kurgular, p, yollar } from "./lib/kurgu.mjs";

const ad = kurguAdi();
if (!ad) {
  const m = kurgular();
  console.log(m.length ? `Kurgular:\n${m.map((x) => `  • ${x}`).join("\n")}` : "Henüz kurgu yok.");
  console.log('\nYeni kurgu: npm run ilan:yeni -- <isim>   (ör. npm run ilan:yeni -- "Gölbaşı Villa")');
  process.exit(0);
}
const y = yollar(ad);
if (existsSync(y.dizin)) {
  console.error(`public/kurgular/${ad}/ zaten var — üzerine yazılmadı.`);
  process.exit(1);
}
mkdirSync(path.join(y.dizin, "medya"), { recursive: true });

writeFileSync(
  y.metin,
  `# ${ad} — seslendirme metni
# "#" ile başlayan satırlar okunmaz. Metni normal yazın: 6+2, 309 m², 12.500.000 TL, 0542 361 77 91 olduğu gibi kalabilir.
# Kontrol (ücretsiz): npm run ilan:seslendir -- ${ad} --kuru
#
# GEÇİŞLER (rehber: .claude/skills/video-kurgula/references/gecisler.md) — bölümleri bu sırayla doldurun,
# örnek cümleleri silip kendi cümlenizi yazın. Görsel geçiş (plan.json → "gecis") söz geçişinin söylendiği ana denk gelir.
#
# ── 1. HOOK (ilk 1–1,5 sn) — en güçlü özelliği İMA ET, tüketme.
#    örn: Gölbaşı'nda, bahçesi tamamen size ait bir villa.
#
# ── 2. TEMEL BİLGİ — kısa, sayılarla (plan: "kesme").
#    örn: 6+2, 309 metrekare, dört banyo, kapalı otopark.
#
# ── 3. DÖNÜŞ — kontrast ya da "ama durun" (plan: "karartma" veya bir "ara-kart").
#    örn: Buraya kadar tanıdık. Asıl fark en üst katta.
#
# ── 4. TUR — her bölüm somut bir ayrıntıyla açılır: "Zemin kat:", "Sabah sekiz, mutfak." (plan: "kayma"/"perde").
#    En fazla 2–3 kez baştan-sona bağ: cümlenin son kavramını sonraki cümlenin başında yakala.
#    örn: Salon tüm gün güney ışığı alıyor. O ışık bahçeye açılan cam kapıdan içeri doluyor.
#
# ── 5. TOHUM + ÇAĞRI — kapanışı çağır; verdiğin sözü tut.
#    örn: Detaylar ve randevu için hemen arayın.
#
# Kaçının: "Şimdi size … göstereceğim", "Gelelim …", art arda aynı bağlaç ("Ayrıca… ayrıca…").

`,
);

const ornek = JSON.parse(readFileSync(p("library/examples/ilan-plan.example.json"), "utf8"));
ornek.klasor = y.klasor;
// Örnek sahneler medyasız (lacivert yer tutucu) kalır; dosyalarınızı medya/ içine koyup "src" alanlarını doldurun.
ornek.sahneler = ornek.sahneler.map((s) => ({ ...s, src: "" }));
writeFileSync(y.plan, JSON.stringify(ornek, null, 2) + "\n");

writeFileSync(
  path.join(y.dizin, "medya", "BENİ-OKU.txt"),
  `Bu kurgunun fotoğraf, video ve müzik dosyalarını bu klasöre koyun.
Planda (plan.json) "src": "medya/dosya-adi.jpg" şeklinde yazılır.
Dosya adlarında Türkçe karakter ve boşluk yerine tire kullanın: salon-1.jpg, dis-cephe.mp4
`,
);

console.log(`✓ public/kurgular/${ad}/ oluşturuldu
    metin.md     ← seslendirme metnini buraya yazın
    plan.json    ← ilan bilgileri ve sahneler
    medya/       ← fotoğraf, video, müzik dosyalarınız

Sıradaki adımlar:
  npm run ilan:seslendir -- ${ad} --kuru   (ücretsiz okunuş kontrolü)
  npm run ilan:seslendir -- ${ad}
  npm run ilan:render -- ${ad}             → out/${ad}/final-dikey.mp4`);
