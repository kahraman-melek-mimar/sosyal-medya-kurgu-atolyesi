// Geçiş kontrolü — gecisler.md kurallarının ölçülebilen kısmını denetler (bağımlılık yok, render yok).
//   npm run ilan:gecis -- golbasi-villa     → public/kurgular/golbasi-villa/{plan.json,metin.md}
//   npm run ilan:gecis                      → eski düzen (work/ilan-plan.json + work/metin.md)
//   --json                                  → makine okunur çıktı (gecis-editoru ajanı için)
// Çıkış kodu: 0 = hata yok (uyarılar olabilir), 1 = kural ihlali.
// Ölçülemeyenler (baştan-sona bağın kalitesi, sürprizin baştan verilmesi, tohumun tutulması) ajana/insana kalır.
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { KOK, kurguAdi, yollar } from "./lib/kurgu.mjs";

const y = yollar(kurguAdi());
const json = process.argv.includes("--json");
if (!existsSync(y.plan)) {
  console.error(`Plan yok: ${path.relative(KOK, y.plan)}`);
  process.exit(1);
}
const plan = JSON.parse(readFileSync(y.plan, "utf8"));
const metin = existsSync(y.metin) ? readFileSync(y.metin, "utf8") : null;

// src/ilan/IlanReel.tsx → GECIS_SN ile aynı tutulmalı.
const SURE = { kayma: 0.4, perde: 0.6, karartma: 0.5 };
const TOL = 0.3; // söz–görüntü eşleşme toleransı (sn)
const BOLUM = new Set(["perde", "karartma"]);

const hatalar = [];
const uyarilar = [];
const notlar = [];
const f = (n) => n.toFixed(2);

// --- Sahne sınırları -------------------------------------------------------
const sahneler = plan.sahneler ?? [];
let t = 0;
const sinirlar = sahneler.map((s, i) => {
  const r = { i, t, tip: s.tip, gecis: i === 0 ? null : (s.gecis ?? "yumusak"), etiket: s.etiket ?? s.ust ?? s.tip, sure: s.sure, metin: s.metin };
  t += s.sure;
  return r;
});
const toplam = t + (plan.kapanis?.sure ?? 4);
const hikaye = t; // kapanış hariç

// --- 1. Ölçü: 30 sn'de ≤ 2 perde/karartma, ≤ 1 ara-kart ---------------------
// Ara kartın kendi giriş örtüsü ara-kart sayılır, perde/karartma bütçesinden düşülmez.
const bolumAnlari = sinirlar.filter((s) => BOLUM.has(s.gecis) && s.tip !== "ara-kart");
const araKartlar = sinirlar.filter((s) => s.tip === "ara-kart");
const pencere = (liste, max, ad) => {
  for (const a of liste) {
    const icinde = liste.filter((b) => b.t >= a.t && b.t < a.t + 30);
    if (icinde.length > max) {
      hatalar.push(`${f(a.t)}–${f(a.t + 30)} sn arasında ${icinde.length} ${ad} var (en fazla ${max}).`);
      break;
    }
  }
};
pencere(bolumAnlari, 2, "perde/karartma");
pencere(araKartlar, 1, "ara-kart");

// --- 2. Kısa video (≤ 15 sn): perde ve ara-kart yok, tek geçiş anı ---------
if (toplam <= 15) {
  if (bolumAnlari.some((s) => s.gecis === "perde") || araKartlar.length)
    hatalar.push(`Video ${f(toplam)} sn (≤ 15): perde ve ara-kart kullanılmaz (gecisler.md §3, Story).`);
  if (bolumAnlari.length > 1) uyarilar.push(`Kısa videoda en fazla bir geçiş anı olmalı; ${bolumAnlari.length} perde/karartma var.`);
}

// --- 3. Ara kart: ≤ 7 kelime, 1.2–2 sn ------------------------------------
for (const a of araKartlar) {
  const n = (a.metin ?? "").trim().split(/\s+/).filter(Boolean).length;
  if (n > 7) hatalar.push(`Ara kart ${f(a.t)} sn: köprü cümlesi ${n} kelime (en fazla 7): "${a.metin}"`);
  if (a.sure < 1.2 || a.sure > 2) uyarilar.push(`Ara kart ${f(a.t)} sn: süre ${a.sure} sn (önerilen 1.2–2).`);
}

// --- 4. Söz–görüntü eşleşmesi --------------------------------------------
const altyazi = plan.altyazi ?? [];
const anlamli = sinirlar.filter((s) => s.gecis && (BOLUM.has(s.gecis) || s.gecis === "kayma" || s.tip === "ara-kart"));
if (!altyazi.length) {
  notlar.push("Planda altyazı yok: söz–görüntü eşleşmesi kontrol edilemedi (önce seslendirme/deşifre).");
} else {
  for (const s of anlamli) {
    // Ara kartın sözü kartın kendisidir; geri kalanında kesme anına yakın başlayan bir altyazı satırı aranır.
    if (s.tip === "ara-kart") continue;
    const yakin = altyazi.filter((a) => Math.abs(a.from - s.t) <= TOL);
    if (!yakin.length) {
      const enYakin = altyazi.reduce((m, a) => (Math.abs(a.from - s.t) < Math.abs(m.from - s.t) ? a : m));
      (BOLUM.has(s.gecis) ? hatalar : uyarilar).push(
        `${s.gecis} @ ${f(s.t)} sn (${s.etiket}): ±${TOL} sn içinde başlayan söz yok. En yakın satır ${f(enYakin.from)} sn: "${enYakin.text}"`,
      );
    } else {
      notlar.push(`${s.gecis} @ ${f(s.t)} sn ↔ "${yakin[0].text}" (${f(yakin[0].from - s.t)} sn)`);
    }
  }
}

// --- 5. Yazı geçişin ortasında girip çıkmasın (≥ 0.2 sn pay) ---------------
const ortu = (s) => {
  if (s.gecis === "kayma") return [s.t, s.t + SURE.kayma];
  if (BOLUM.has(s.gecis)) return [s.t - SURE[s.gecis] / 2, s.t + SURE[s.gecis] / 2];
  return null;
};
const yazilar = [
  ...(plan.baslik ? [{ ad: "başlık kartı", ...plan.baslik }] : []),
  ...(plan.bilgi ? [{ ad: "bilgi çubuğu", ...plan.bilgi }] : []),
  ...altyazi.map((a) => ({ ad: `altyazı "${a.text}"`, from: a.from, to: a.to })),
];
for (const s of sinirlar) {
  const o = ortu(s);
  if (!o) continue;
  for (const y2 of yazilar) {
    for (const [an, ne] of [[y2.from, "giriyor"], [y2.to, "çıkıyor"]]) {
      // Söz geçişini taşıyan altyazı satırının örtüyle aynı anda başlaması istenen şeydir; o hariç.
      if (ne === "giriyor" && y2.ad.startsWith("altyazı") && Math.abs(an - s.t) <= TOL) continue;
      if (an > o[0] - 0.2 && an < o[1] + 0.2)
        uyarilar.push(`${y2.ad} ${f(an)} sn'de ${ne}: ${s.gecis} örtüsü (${f(o[0])}–${f(o[1])}) ±0.2 sn içinde.`);
    }
  }
}

// --- 6. Altyazı geçiş cümlesini bölmesin ------------------------------------
const KOPRU = /(^|\s)(ama|ve|üstelik|peki|ancak|fakat|çünkü)$/i;
for (const a of altyazi) {
  if (KOPRU.test(a.text.trim()) || /^(ama|ve|peki|üstelik)[.…,]?$/i.test(a.text.trim()))
    uyarilar.push(`Altyazı ${f(a.from)} sn: geçiş kelimesi satır sonunda kalmış: "${a.text}"`);
}

// --- 7. metin.md: kalıp geçişler ve art arda aynı işaret -------------------
if (metin) {
  const govde = metin
    .split("\n")
    .filter((l) => !l.trim().startsWith("#"))
    .join(" ");
  const KALIP = [
    /şimdi size [^.]* göstereceğim/i,
    /gelelim [^.]* (konusuna|kısmına)/i,
    /bir de şuna bakalım/i,
    /şimdi de [^.]* geçelim/i,
    /sizlere [^.]* tanıtacağım/i,
  ];
  for (const k of KALIP) {
    const m = govde.match(k);
    if (m) hatalar.push(`metin.md: kalıp geçiş — "${m[0]}" (gecisler.md §1, Kaçınılacaklar).`);
  }
  const cumleler = govde.split(/(?<=[.!?…])\s+/).map((c) => c.trim()).filter(Boolean);
  const ISARET = /^(ve|ama|üstelik|ayrıca|peki|sonuç\??|ancak|fakat)\b/i;
  for (let i = 1; i < cumleler.length; i++) {
    const a = cumleler[i - 1].match(ISARET)?.[1]?.toLocaleLowerCase("tr-TR");
    const b = cumleler[i].match(ISARET)?.[1]?.toLocaleLowerCase("tr-TR");
    if (a && a === b) hatalar.push(`metin.md: art arda iki cümle "${b}" ile başlıyor: "${cumleler[i]}"`);
  }
  const amaSay = cumleler.filter((c) => /^ama\b/i.test(c)).length;
  if (amaSay > 2) uyarilar.push(`metin.md: ${amaSay} cümle "Ama" ile başlıyor; kontrast dönüşü video başına 1–2 kez yeterli.`);
} else {
  notlar.push(`metin.md yok (${path.relative(KOK, y.metin)}): söz kontrolleri atlandı.`);
}

// --- Rapor ------------------------------------------------------------------
const ozet = {
  kurgu: y.ad ?? "(eski düzen)",
  toplamSn: +f(toplam),
  hikayeSn: +f(hikaye),
  sahneSayisi: sahneler.length,
  gecisler: sinirlar.filter((s) => s.gecis).map((s) => ({ t: +f(s.t), kare: Math.round(s.t * (plan.fps ?? 30)), gecis: s.gecis, sahne: s.etiket })),
  hatalar,
  uyarilar,
  notlar,
};
if (json) {
  console.log(JSON.stringify(ozet, null, 2));
} else {
  console.log(`Geçiş kontrolü — ${ozet.kurgu} · ${ozet.toplamSn} sn · ${ozet.sahneSayisi} sahne`);
  console.log("\nSahne sınırları (önizleme karesi için --kare=<kare>):");
  for (const g of ozet.gecisler) console.log(`  ${String(g.t).padStart(6)} sn  kare ${String(g.kare).padStart(4)}  ${g.gecis.padEnd(9)} → ${g.sahne}`);
  const yaz = (b, l) => l.length && console.log(`\n${b} (${l.length}):\n` + l.map((x) => `  - ${x}`).join("\n"));
  yaz("HATA", hatalar);
  yaz("UYARI", uyarilar);
  yaz("Not", notlar);
  if (!hatalar.length && !uyarilar.length) console.log("\nÖlçülebilen kuralların hepsi geçti. Okuma testi (gecisler.md §4) hâlâ gerekli.");
}
process.exit(hatalar.length ? 1 : 0);
