// Türkçe emlak metnini seslendirme motoru için "okunuş" metnine çevirir ve altyazı parçalarına böler.
// Yazılı metin altyazıda kalır; yalnızca ElevenLabs'e gönderilen metin okunuşa çevrilir.
// Saf JS, ağ gerektirmez: `node scripts/ilan/okunus-test.mjs` ile test edilir.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const sozlukYukle = (dosya = path.join(KOK, "library/telaffuz/sozluk.tr.json")) => JSON.parse(readFileSync(dosya, "utf8"));

// ───────── sayılar ─────────
const BIRLER = ["", "bir", "iki", "üç", "dört", "beş", "altı", "yedi", "sekiz", "dokuz"];
const ONLAR = ["", "on", "yirmi", "otuz", "kırk", "elli", "altmış", "yetmiş", "seksen", "doksan"];

const ucBasamak = (n, ara = " ") => {
  const y = Math.floor(n / 100), o = Math.floor((n % 100) / 10), b = n % 10;
  return [y === 0 ? "" : y === 1 ? "yüz" : `${BIRLER[y]}${ara}yüz`, ONLAR[o], BIRLER[b]].filter(Boolean).join(ara);
};

/**
 * 0 – 999.999.999.999 arası tam sayıyı Türkçe okunuşa çevirir.
 * bitisik: her bölük tek kelime ("ikiyüzaltmışiki", "onikimilyon beşyüzbin"). Seslendirme bunu kullanır:
 * ayrı yazılınca ses motoru kelime aralarında duraksıyor ("iki yüz altmış … iki").
 */
export const sayiOku = (n, bitisik = false) => {
  n = Number(n);
  const ara = bitisik ? "" : " ";
  if (!Number.isFinite(n)) return String(n);
  if (n === 0) return "sıfır";
  if (n < 0) return `eksi ${sayiOku(-n, bitisik)}`;
  const parcalar = [];
  const birimler = [[1e9, "milyar"], [1e6, "milyon"], [1e3, "bin"]];
  let kalan = n;
  for (const [deger, ad] of birimler) {
    const k = Math.floor(kalan / deger);
    if (k > 0) parcalar.push(k === 1 && ad === "bin" ? "bin" : `${ucBasamak(k, ara)}${ara}${ad}`);
    kalan %= deger;
  }
  if (kalan > 0) parcalar.push(ucBasamak(kalan, ara));
  return parcalar.join(" ");
};

/** "12,5" → "on iki buçuk"; "3,25" → "üç virgül yirmi beş". */
const ondalikOku = (tam, kesir, b = false) => (kesir === "5" ? `${sayiOku(tam, b)} buçuk` : `${sayiOku(tam, b)} virgül ${sayiOku(Number(kesir), b)}`);

const SIRA_SON = {
  bir: "birinci", iki: "ikinci", üç: "üçüncü", dört: "dördüncü", beş: "beşinci", altı: "altıncı", yedi: "yedinci",
  sekiz: "sekizinci", dokuz: "dokuzuncu", on: "onuncu", yirmi: "yirminci", otuz: "otuzuncu", kırk: "kırkıncı",
  elli: "ellinci", altmış: "altmışıncı", yetmiş: "yetmişinci", seksen: "sekseninci", doksan: "doksanıncı",
  yüz: "yüzüncü", bin: "bininci", milyon: "milyonuncu", milyar: "milyarıncı",
};
/** 3 → "üçüncü", 21 → "yirmi birinci" (bitisik: "yirmibirinci"). */
export const siraOku = (n, bitisik = false) => {
  const k = sayiOku(n, bitisik).split(" ");
  const son = k[k.length - 1];
  // Bitişik yazımda son kelime "yirmibir" gibi olur: sondaki sayı adını bulup sıra ekini ona uygula.
  const kok = Object.keys(SIRA_SON).filter((x) => son.endsWith(x)).sort((a, b) => b.length - a.length)[0];
  if (kok) k[k.length - 1] = son.slice(0, son.length - kok.length) + SIRA_SON[kok];
  return k.join(" ");
};

const sayiTemizle = (s) => Number(s.replace(/\./g, "")); // "12.500.000" → 12500000

/** Telefon: 0542 361 77 91 → "sıfır beşyüzkırkiki üçyüzaltmışbir yetmişyedi doksanbir" (virgülsüz: akıcı okunur). */
const telefonOku = (m) => {
  const r = m.replace(/\D/g, "");
  const g = r.length === 11 ? [r.slice(0, 4), r.slice(4, 7), r.slice(7, 9), r.slice(9)] : r.length === 10 ? [r.slice(0, 3), r.slice(3, 6), r.slice(6, 8), r.slice(8)] : [r];
  return g
    .map((p) => (p.startsWith("0") ? `sıfır ${sayiOku(Number(p.slice(1)), true)}` : sayiOku(Number(p), true)))
    .join(" ");
};

const kacis = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SINIR = "(?<![\\p{L}\\p{N}])"; // Unicode harf/sayı sınırı (Türkçe karakterlerle \b güvenilir değil)
const SINIR_SON = "(?![\\p{L}\\p{N}])";

/**
 * Yazılı metni okunuşa çevirir. Sıra önemlidir: önce telefon, fiyat, birim gibi kalıplar, sonra genel sayılar.
 */
export const okunusaCevir = (metin, sozluk = sozlukYukle()) => {
  let t = ` ${metin} `;
  // Kullanıcı sözlüğü (önce uzun ifadeler)
  const kelimeler = Object.entries(sozluk.kelimeler ?? {}).sort((a, b) => b[0].length - a[0].length);
  for (const [yazili, okunus] of kelimeler) {
    const sembol = /^[^\p{L}\p{N}]+$/u.test(yazili);
    const re = sembol ? new RegExp(kacis(yazili), "gu") : new RegExp(`${SINIR}${kacis(yazili)}${SINIR_SON}`, "gu");
    t = t.replace(re, sembol ? ` ${okunus} ` : okunus);
  }
  for (const [yazili, okunus] of Object.entries(sozluk.kisaltmalar ?? {})) {
    t = t.replace(new RegExp(`${SINIR}${kacis(yazili)}`, "gu"), okunus);
  }
  // Telefon (05xx / 0312 …), boşluk/tire/parantez ile
  t = t.replace(/(?<!\d)\(?0\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}(?!\d)/g, (m) => telefonOku(m));
  // Para: "12.500.000 lira" / "12,5 milyon lira" (TL sözlükte "lira" oldu)
  t = t.replace(/(\d+),(\d+)\s*(milyon|milyar|bin)/g, (_, a, b, c) => `${ondalikOku(Number(a), b, true)} ${c}`);
  // Oda sayısı 3+1, 6+2, 4,5+1
  t = t.replace(/(\d+),5\s*\+\s*(\d+)/g, (_, a, b) => `${sayiOku(Number(a), true)} buçuk artı ${sayiOku(Number(b), true)}`);
  t = t.replace(/(\d+)\s*\+\s*(\d+)/g, (_, a, b) => `${sayiOku(Number(a), true)} artı ${sayiOku(Number(b), true)}`);
  // Metrekare
  t = t.replace(/(\d[\d.]*)\s*(m²|m2|㎡|metrekare)(?![\p{L}])/gu, (_, n) => `${sayiOku(sayiTemizle(n), true)} metrekare`);
  t = t.replace(/(?<![\p{L}])(m²|㎡)/gu, "metrekare");
  // Yüzde
  t = t.replace(/%\s*(\d+)(?:,(\d+))?/g, (_, a, b) => `yüzde ${b ? ondalikOku(Number(a), b, true) : sayiOku(Number(a), true)}`);
  // Sıra sayısı: "3. kat", "2. el" (ardından küçük harfle başlayan kelime)
  t = t.replace(/(\d+)\.\s+(?=\p{Ll})/gu, (_, n) => `${siraOku(Number(n), true)} `);
  // Ondalık: 2,5 → iki buçuk
  t = t.replace(/(\d+),(\d+)/g, (_, a, b) => ondalikOku(Number(a), b, true));
  // Binlik ayraçlı ve düz sayılar
  t = t.replace(/\d{1,3}(?:\.\d{3})+|\d+/g, (m) => sayiOku(sayiTemizle(m), true));
  // Konum ayraçları: "Gölbaşı / Karşıyaka" , " - " → virgül (doğal duraklama)
  t = t.replace(/\s+[/–—-]\s+/g, ", ");
  t = t.replace(/\s{2,}/g, " ").replace(/\s+([,.!?;:])/g, "$1");
  return t.trim();
};

// ───────── altyazı parçalama ─────────
// Telefon, fiyat, "309 m²", "6+2" gibi birimler bölünmez; parçalar 2–5 kelime, noktalama sınırını tercih eder.
const BIRIM_RE = /\(?0\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}|\d[\d.,]*\s*(?:m²|m2|TL|₺|lira|milyon|milyar)|\d+(?:,5)?\s*\+\s*\d+|\S+/gu;

export const parcala = (cumle, enFazla = 5) => {
  const birimler = cumle.match(BIRIM_RE) ?? [];
  const parcalar = [];
  let cur = [];
  const kelimeSay = (b) => b.split(/\s+/).length;
  let sayac = 0;
  birimler.forEach((b, i) => {
    // Yalnız noktalama olan parça ("." gibi) bir öncekine boşluksuz yapışır.
    if (/^[,.!?;:]+$/.test(b) && cur.length) cur[cur.length - 1] += b;
    else if (/^[,.!?;:]+$/.test(b) && parcalar.length) parcalar[parcalar.length - 1] += b;
    else cur.push(b);
    sayac += kelimeSay(b);
    // "Mh.", "Cad.", "Apt." gibi kısa kısaltmalar satır sonu sayılmaz.
    const noktalama = /[,.!?;:]$/.test(b) && !/^\p{Lu}\p{Ll}{0,4}\.$/u.test(b);
    const sonraki = birimler[i + 1];
    if (cur.length && (sayac >= enFazla || (noktalama && sayac >= 2) || !sonraki)) {
      parcalar.push(cur.join(" "));
      cur = [];
      sayac = 0;
    }
  });
  // Tek kelimelik kuyruğu öncekine ekle
  if (parcalar.length > 1 && parcalar[parcalar.length - 1].split(/\s+/).length === 1) {
    const son = parcalar.pop();
    parcalar[parcalar.length - 1] += ` ${son}`;
  }
  return parcalar;
};

/** Metni cümlelere, cümleleri altyazı parçalarına böler; her parçanın okunuşunu ve okunuş metnindeki konumunu verir. */
export const seslendirmePlani = (metin, sozluk = sozlukYukle()) => {
  const temiz = metin
    .split("\n")
    .map((s) => s.replace(/^#.*$/, "").trim()) // markdown başlıklarını yok say
    .filter(Boolean)
    .join(" ");
  // Cümle sonu = [.!?] + boşluk + büyük harf. "12.500.000" ve "Mh. Ankara" gibi kısaltmalar cümleyi bölmez.
  const kisaltmalar = Object.keys(sozluk.kisaltmalar ?? {});
  const ham = temiz.split(/(?<=[.!?])\s+(?=[\p{Lu}"“'])/u);
  const cumleler = [];
  for (const s of ham) {
    const onceki = cumleler[cumleler.length - 1];
    if (onceki && kisaltmalar.some((k) => onceki.endsWith(` ${k}`) || onceki === k)) cumleler[cumleler.length - 1] = `${onceki} ${s}`;
    else cumleler.push(s.trim());
  }
  const parcalar = [];
  let okunus = "";
  for (const c of cumleler) {
    for (const p of parcala(c)) {
      const o = okunusaCevir(p, sozluk);
      const bas = okunus.length ? okunus.length + 1 : 0;
      okunus = okunus.length ? `${okunus} ${o}` : o;
      parcalar.push({ yazili: p.replace(/[,;:]$/, ""), okunus: o, bas, son: bas + o.length });
    }
  }
  return { okunus, parcalar };
};
