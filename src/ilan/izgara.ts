// YERLEŞİM IZGARASI — 1080×1920 ekran yatayda 4, dikeyde 5 parçaya bölünür (hücre 270×384).
// Hücreler satır satır numaralanır: sol üst 1, sağ üst 4, sol alt 17, sağ alt 20.
//
//   ┌────┬────┬────┬────┐
//   │  1 │  2 │  3 │  4 │   y    0– 384  (üst 0–280 platform arayüzü: kritik öğe koyma)
//   ├────┼────┼────┼────┤
//   │  5 │  6 │  7 │  8 │   y  384– 768
//   ├────┼────┼────┼────┤
//   │  9 │ 10 │ 11 │ 12 │   y  768–1152
//   ├────┼────┼────┼────┤
//   │ 13 │ 14 │ 15 │ 16 │   y 1152–1536  (y > 1250 açıklama alanı)
//   ├────┼────┼────┼────┤
//   │ 17 │ 18 │ 19 │ 20 │   y 1536–1920  (açıklama / yanıt çubuğu)
//   └────┴────┴────┴────┘
//
// Bir öğenin alanı tek hücre ("6") ya da iki köşe hücresiyle verilen dikdörtgendir ("5-12" = 5'ten 12'ye kadar
// satır 2–3'ün tamamı; "6-11" = ortadaki 2×2 blok). Kullanıcı yerleşimi bu numaralarla tarif eder.

export const IZGARA = { sutun: 4, satir: 5, w: 270, h: 384 } as const;

export type Kutu = { left: number; top: number; width: number; height: number };

// İsteğe bağlı sonek, öğenin alan içindeki dikey hizası: "13-16 alt", "6-11 orta", "5-8 üst".
export const ALAN_DESENI = /^\s*([1-9]|1\d|20)\s*(?:-\s*([1-9]|1\d|20)\s*)?(?:\s+(üst|ust|orta|alt))?\s*$/i;
export type Hiza = "ust" | "orta" | "alt";

/** Alan tanımındaki dikey hiza soneki; yoksa öğenin varsayılanı. */
export const hizaOku = (tanim: string | undefined, varsayilan: Hiza): Hiza => {
  const h = tanim ? ALAN_DESENI.exec(tanim)?.[3]?.toLocaleLowerCase("tr-TR") : undefined;
  return h === "orta" ? "orta" : h === "alt" ? "alt" : h ? "ust" : varsayilan;
};

/** Hizaya göre flex yerleşimi (kutu içinde üst / orta / alt). */
export const hizaStil = (h: Hiza) => ({
  display: "flex" as const,
  flexDirection: "column" as const,
  justifyContent: h === "orta" ? "center" : h === "alt" ? "flex-end" : "flex-start",
});

const konum = (n: number) => ({ sutun: (n - 1) % IZGARA.sutun, satir: Math.floor((n - 1) / IZGARA.sutun) });

/** "5-12" → piksel dikdörtgeni. İki hücrenin kapsadığı en küçük dikdörtgen alınır (sıra önemli değil). */
export const alan = (tanim: string): Kutu => {
  const m = ALAN_DESENI.exec(tanim);
  if (!m) throw new Error(`Geçersiz ızgara alanı "${tanim}" (ör. "6", "5-12")`);
  const a = konum(Number(m[1]));
  const b = konum(Number(m[2] ?? m[1]));
  const s0 = Math.min(a.sutun, b.sutun);
  const s1 = Math.max(a.sutun, b.sutun);
  const r0 = Math.min(a.satir, b.satir);
  const r1 = Math.max(a.satir, b.satir);
  return { left: s0 * IZGARA.w, top: r0 * IZGARA.h, width: (s1 - s0 + 1) * IZGARA.w, height: (r1 - r0 + 1) * IZGARA.h };
};

/**
 * Yazı/kart kutusu için iç boşluk: ekran kenarına değen kenarda 65 px (güvenli alan), iç kenarda 18 px.
 * Böylece "5-8" gibi tam genişlik bir alan, eski yerleşimle aynı yan boşlukları korur.
 */
export const ic = (k: Kutu): Kutu => {
  const sol = k.left === 0 ? 65 : 18;
  const sag = k.left + k.width >= 1080 ? 65 : 18;
  return { left: k.left + sol, top: k.top, width: k.width - sol - sag, height: k.height };
};

/** Plan alanı verilmişse onun iç kutusu, verilmemişse öğenin klasik (ızgara öncesi) konumu. */
export const kutuSec = (tanim: string | undefined, varsayilan: Kutu): Kutu => (tanim ? ic(alan(tanim)) : varsayilan);
