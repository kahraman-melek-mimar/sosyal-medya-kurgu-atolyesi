// Her kurgunun kendi klasörü: public/kurgular/<isim>/
//
//   public/kurgular/<isim>/
//     metin.md          seslendirme metni (siz yazarsınız)
//     plan.json         ilan planı (sahneler, başlık, bilgi çubuğu…)
//     medya/            fotoğraflar, videolar, müzik (siz koyarsınız)
//     seslendirme.mp3   ilan:seslendir üretir
//     avatar.mp4        ilan:avatar üretir
//   out/<isim>/final-dikey.mp4   ilan:render üretir
//
// Planın içindeki dosya yolları kurgu klasörüne göredir ("medya/salon.jpg"); `klasor` alanı bunu sağlar.
// Kurgu adı verilmezse eski tek klasör düzeni (work/ + public/assets/) kullanılır.
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
export const p = (...x) => path.join(KOK, ...x);

const TR = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", Ö: "o", Ş: "s", Ü: "u" };
/** "Gölbaşı Villa 6+2" → "golbasi-villa-6-2" (klasör ve web yolu için güvenli). */
export const slug = (s) =>
  s
    .replace(/[çğıİöşüÇĞÖŞÜ]/g, (c) => TR[c])
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Komut satırındaki kurgu adı: bayrak olmayan ilk argüman, ya da KURGU ortam değişkeni. */
export const kurguAdi = (argv = process.argv.slice(2)) => {
  const ham = argv.find((a) => !a.startsWith("-") && !/\.(md|txt|json)$/.test(a)) ?? process.env.KURGU;
  return ham ? slug(ham) : null;
};

export const kurgular = () => {
  const d = p("public/kurgular");
  return existsSync(d) ? readdirSync(d, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name) : [];
};

/** Bir kurgunun bütün yolları. `ad` null ise eski düzen. */
export const yollar = (ad) => {
  if (!ad) {
    return {
      ad: null,
      klasor: null, // planda yollar public/ köküne göre
      dizin: p("public/assets"),
      metin: p("work/metin.md"),
      plan: p("work/ilan-plan.json"),
      seslendirme: p("public/assets/seslendirme.mp3"),
      seslendirmeSrc: "assets/seslendirme.mp3",
      seslendirmeJson: p("work/seslendirme.json"),
      avatar: p("public/assets/avatar.mp4"),
      avatarSrc: "assets/avatar.mp4",
      heygenJson: p("work/heygen.json"),
      cikti: p("out"),
    };
  }
  const dizin = p("public/kurgular", ad);
  return {
    ad,
    klasor: `kurgular/${ad}`,
    dizin,
    metin: path.join(dizin, "metin.md"),
    plan: path.join(dizin, "plan.json"),
    seslendirme: path.join(dizin, "seslendirme.mp3"),
    seslendirmeSrc: "seslendirme.mp3",
    seslendirmeJson: path.join(dizin, ".seslendirme.json"),
    avatar: path.join(dizin, "avatar.mp4"),
    avatarSrc: "avatar.mp4",
    heygenJson: path.join(dizin, ".heygen.json"),
    cikti: p("out", ad),
  };
};

/** Kurgu adı verilmiş ama klasör yoksa yardımcı mesajla çık. */
export const kurguGerekli = (y) => {
  if (y.ad && !existsSync(y.dizin)) {
    const mevcut = kurgular();
    console.error(`"${y.ad}" adlı kurgu yok. Önce: npm run ilan:yeni -- ${y.ad}`);
    if (mevcut.length) console.error(`Mevcut kurgular: ${mevcut.join(", ")}`);
    process.exit(1);
  }
};
