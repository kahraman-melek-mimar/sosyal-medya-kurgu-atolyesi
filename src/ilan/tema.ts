// COLDWELL BANKER İLAN REELS TEMASI — dikey 1080×1920 tasarım birimleri.
// Renkler Coldwell Banker Kurumsal Kimlik Kılavuzu'ndan (Ekim 2019): birincil CB Mavisi #012169 (PMS 280 C),
// beyaz, metinler için siyah/koyu. Font: Poppins (Geometos Neue / Helvetica Neue'ye en yakın erişilebilir
// alternatif, poster standardıyla aynı) + vurgu için Cormorant Garamond (Adobe Garamond Pro'nun açık alternatifi).
import { continueRender, delayRender, staticFile } from "remotion";

// Fontlar public/fonts/ altında yerel dosya (SIL OFL, lisanslar yanında): render internete bağlı değildir.
// Her ağırlık latin + latin-ext (Türkçe ç ğ ı İ ö ş ü) olarak iki parçadır.
const LATIN = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
const LATIN_EXT = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";

const yukle = (aile: string, dosyaKoku: string, agirliklar: number[], stil: "normal" | "italic") => {
  if (typeof document === "undefined") return;
  const h = delayRender(`Font: ${aile}`);
  const yuzler = agirliklar.flatMap((w) =>
    (["latin", "latin-ext"] as const).map(
      (sub) =>
        new FontFace(aile, `url(${staticFile(`fonts/${dosyaKoku}-${sub}-${w}-${stil}.woff2`)}) format("woff2")`, {
          weight: String(w),
          style: stil,
          unicodeRange: sub === "latin" ? LATIN : LATIN_EXT,
        }),
    ),
  );
  Promise.all(yuzler.map((f) => f.load()))
    .then((yuklenen) => {
      yuklenen.forEach((f) => document.fonts.add(f));
      continueRender(h);
    })
    .catch((err) => {
      console.error(err);
      continueRender(h);
    });
};

yukle("CB Poppins", "poppins", [500, 600, 700, 800], "normal");
yukle("CB Garamond", "cormorant-garamond", [500, 600], "italic");
// İmza (kapanışta danışman adı el yazısıyla "atılır").
yukle("CB Imza", "mrs-saint-delafield", [400], "normal");

export const yazi = {
  sans: `"CB Poppins", Poppins, sans-serif`,
  serif: `"CB Garamond", "Cormorant Garamond", Georgia, serif`,
  imza: `"CB Imza", "Mrs Saint Delafield", cursive`,
};

export const renk = {
  cbMavi: "#012169", // Coldwell Banker Blue, PMS 280 C
  cbMaviKoyu: "#000F33",
  beyaz: "#FFFFFF",
  metin: "#14171F",
  griAcik: "#C9D3E6",
  gri: "#5D636E",
  celestial: "#418FDE", // ikincil palet — çok az kullanılır (ince çizgi, nokta)
  yesil: "#3CC878", // "hemen arayın" noktası
} as const;

// Ortak güvenli alan (references/dikey-format.md). Kritik her şey bunun içinde kalır.
export const guvenli = {
  W: 1080,
  H: 1920,
  ust: 290, // 0–280 kullanıcı adı / ses etiketi
  alt: 1250, // y > 1250 açıklama / yanıt çubuğu
  yan: 65,
  sagButonX: 850, // x > 850 ve y > 960: beğen/yorum/paylaş sütunu
  sagButonY: 960,
  bandAlt: 720, // grafik bandı 290–720
} as const;
