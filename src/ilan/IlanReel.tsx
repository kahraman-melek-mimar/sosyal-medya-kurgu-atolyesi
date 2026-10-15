// İLAN REELS — dikey 1080×1920 emlak tanıtım videosu (Instagram Reels/Story, TikTok, WhatsApp Durum).
// Danışmanın konuşma çekimleri ile mülk video/fotoğrafları art arda; üstünde Coldwell Banker kimliğiyle
// ilan etiketi + logo, başlık kartı, bilgi çubuğu, oda etiketleri, altyazı; sonda danışman kapanış kartı.
// Tüm içerik `IlanPlan` verisinden gelir (src/ilan/sema.ts); bu dosyada ilana özgü metin yoktur.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Audio, Video } from "@remotion/media";
import { GECIS_SN, IlanPlan, Sahne, toplamSure } from "./sema";
import { guvenli as G, renk, yazi } from "./tema";
import { alan, Hiza, hizaOku, hizaStil, IZGARA, Kutu, kutuSec } from "./izgara";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Kurgu klasörüne göre dosya yolu ("medya/salon.jpg" → "kurgular/<ad>/medya/salon.jpg"). */
const dosya = (klasor: string | undefined, src: string) => staticFile(klasor ? `${klasor}/${src}` : src);
const yumusak = Easing.bezier(0.16, 1, 0.3, 1);
const tr = (s: string) => s.toLocaleUpperCase("tr-TR");

// ───────────────────────── ızgara yerleşimi ─────────────────────────

/**
 * Öğeyi ızgara alanına (plan.yerlesim / kartlar[].alan) ya da klasik konumuna koyar. `butonKorumasi`: alan sağ alttaki
 * beğen/yorum sütununa (x > 850, y > 960) uzanıyorsa genişlik x 840'ta kesilir (altyazı, oda etiketi).
 */
const Yer: React.FC<{ tanim?: string; varsayilan: Kutu; hiza: Hiza; butonKorumasi?: boolean; children: React.ReactNode }> = ({
  tanim,
  varsayilan,
  hiza,
  butonKorumasi,
  children,
}) => {
  const k = kutuSec(tanim, varsayilan);
  const genislik = butonKorumasi && k.top + k.height > G.sagButonY ? Math.min(k.width, G.sagButonX - 10 - k.left) : k.width;
  return (
    <div style={{ position: "absolute", left: k.left, top: k.top, width: genislik, height: k.height, ...hizaStil(hizaOku(tanim, hiza)) }}>
      {children}
    </div>
  );
};

/** Önizleme ızgarası: 4×5 hücre, numaralar, platform arayüzünün örttüğü bölgeler kırmızı tarama. */
const IzgaraKatmani: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    {/* güvenli alan dışı: üst 0–280, alt y > 1250, sağ alt buton sütunu */}
    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 280, background: "rgba(255,40,40,0.16)" }} />
    <div style={{ position: "absolute", left: 0, top: 1250, width: 1080, height: 670, background: "rgba(255,40,40,0.16)" }} />
    <div style={{ position: "absolute", left: 850, top: 960, width: 230, height: 290, background: "rgba(255,40,40,0.16)" }} />
    {Array.from({ length: IZGARA.sutun * IZGARA.satir }, (_, i) => {
      const k = alan(String(i + 1));
      return (
        <div key={i} style={{ position: "absolute", left: k.left, top: k.top, width: k.width, height: k.height, boxSizing: "border-box", border: "2px solid rgba(255,230,0,0.75)" }}>
          <div style={{ position: "absolute", left: 10, top: 6, fontFamily: yazi.sans, fontWeight: 800, fontSize: 44, color: "#FFE600", textShadow: "0 0 8px rgba(0,0,0,0.9)" }}>{i + 1}</div>
        </div>
      );
    })}
  </AbsoluteFill>
);

/** 0→1 giriş, 1→0 çıkış; saniye cinsinden pencere. */
const pencere = (t: number, from: number, to: number, giris = 0.45, cikis = 0.35) =>
  Math.min(
    interpolate(t, [from, from + giris], [0, 1], { ...clamp, easing: yumusak }),
    interpolate(t, [to - cikis, to], [1, 0], { ...clamp, easing: Easing.in(Easing.cubic) }),
  );

// ───────────────────────── arka plan: sahneler ─────────────────────────

const SahneGorsel: React.FC<{ s: Sahne; frames: number; senkronBas: number; klasor?: string }> = ({ s, frames, senkronBas, klasor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (s.tip === "ara-kart") return <AraKart s={s} />;
  // Kayma geçişinde sahne, sonrakinin altında birkaç kare daha görünür: hareket ve ses o kuyrukta durur.
  const p = frames > 1 ? Math.min(frame, frames - 1) / (frames - 1) : 0;
  const foto = s.tip === "mulk-foto";
  // Fotoğrafta belirgin, videoda hafif hareket (gerçek mimariyi bozmadan, sadece kadraj).
  const guc = foto ? 1 : 0.35;
  let olcek = 1.06;
  let dx = 0;
  if (s.hareket === "yakinlas") olcek = 1.04 + 0.1 * guc * p;
  if (s.hareket === "uzaklas") olcek = 1.04 + 0.1 * guc * (1 - p);
  if (s.hareket === "sola") dx = interpolate(p, [0, 1], [30, -30]) * guc;
  if (s.hareket === "saga") dx = interpolate(p, [0, 1], [-30, 30]) * guc;
  if (s.hareket === "yok") olcek = 1;
  const pos = `${s.odak.x * 100}% ${s.odak.y * 100}%`;
  const stil: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: pos,
    transform: `translateX(${dx}px) scale(${olcek})`,
    transformOrigin: pos,
  };
  if (!s.src) {
    // Taslak yer tutucu: medya henüz yokken yerleşim ve zamanlama kontrol edilebilsin.
    return (
      <AbsoluteFill style={{ background: `linear-gradient(160deg, #2A3B5E, ${renk.cbMaviKoyu})`, alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: "rgba(255,255,255,0.35)" }}>
          {tr(s.tip.replace("-", " "))} · {s.sure}s
        </div>
      </AbsoluteFill>
    );
  }
  if (s.tip === "karsilastirma") return <Karsilastirma s={s} frames={frames} stil={stil} klasor={klasor} />;
  if (foto) return <Img src={dosya(klasor, s.src)} style={stil} />;
  // Seslendirmeyle senkron avatar sesi kapalıdır (ses seslendirme kanalından gelir).
  const sesAcik = s.senkron ? false : (s.ses ?? s.tip === "konusma");
  const bas = s.senkron ? Math.max(0, senkronBas) : s.baslangic;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Video
        src={dosya(klasor, s.src)}
        trimBefore={Math.round(bas * fps)}
        playbackRate={s.senkron ? 1 : s.hiz}
        muted={!sesAcik}
        volume={(f) => (f < frames ? 1 : 0)}
        objectFit="cover"
        style={stil}
      />
    </AbsoluteFill>
  );
};

const videoMu = (src: string) => /\.(mp4|mov|m4v|webm)$/i.test(src);

/** Karşılaştırma katmanı: foto ya da sessiz video, sahnenin kamera hareketiyle. */
const Katman: React.FC<{ src: string; stil: React.CSSProperties; hiz: number; klasor?: string }> = ({ src, stil, hiz, klasor }) =>
  videoMu(src) ? (
    <Video src={dosya(klasor, src)} playbackRate={hiz} muted objectFit="cover" style={stil} />
  ) : (
    <Img src={dosya(klasor, src)} style={stil} />
  );

/** Öncesi / sonrası: SONRASI sağdan sola kayan beyaz bir perdeyle ÖNCESİ'nin üstüne açılır. */
const Karsilastirma: React.FC<{ s: Sahne; frames: number; stil: React.CSSProperties; klasor?: string }> = ({ s, frames, stil, klasor }) => {
  const frame = useCurrentFrame();
  const p = frames > 1 ? frame / (frames - 1) : 0;
  // Perdenin x konumu (0–1): 1 = tamamen öncesi, 0 = tamamen sonrası.
  const x = interpolate(p, s.perde, [1, 0], { ...clamp, easing: Easing.bezier(0.65, 0, 0.35, 1) });
  const px = x * 1080;
  const tutamacO = interpolate(x, [0, 0.03, 0.97, 1], [0, 1, 1, 0], clamp);
  const etiket = (metin: string, o: number, sag: boolean) => (
    <div
      style={{
        position: "absolute", top: 780, [sag ? "right" : "left"]: G.yan, opacity: o,
        background: sag ? renk.beyaz : renk.cbMavi, color: sag ? renk.cbMavi : renk.beyaz,
        fontFamily: yazi.sans, fontWeight: 700, fontSize: 30, letterSpacing: 5, padding: "12px 26px", borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
      }}
    >
      {tr(metin)}
    </div>
  );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {s.src ? <Katman src={s.src} stil={stil} hiz={s.hiz} klasor={klasor} /> : null}
      <AbsoluteFill style={{ clipPath: `inset(0 0 0 ${px}px)` }}>
        {s.src2 ? <Katman src={s.src2} stil={stil} hiz={s.hiz} klasor={klasor} /> : null}
      </AbsoluteFill>
      {/* perde çizgisi + tutamaç */}
      <div style={{ position: "absolute", top: 0, bottom: 0, left: px - 3, width: 6, background: renk.beyaz, opacity: tutamacO, boxShadow: "0 0 18px rgba(0,0,0,0.35)" }} />
      <div
        style={{
          position: "absolute", top: 960 - 42, left: px - 42, width: 84, height: 84, borderRadius: 42, background: renk.beyaz,
          opacity: tutamacO, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          color: renk.cbMavi, fontSize: 30, fontWeight: 800, fontFamily: yazi.sans, boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        ‹ ›
      </div>
      {etiket(s.oncesiYazi, interpolate(x, [0.15, 0.4], [0, 1], clamp), false)}
      {etiket(s.sonrasiYazi, interpolate(x, [0.6, 0.85], [1, 0], clamp), true)}
    </AbsoluteFill>
  );
};

/** Sahne sınırları (saniye): her sahnenin başı, süresi ve giriş geçişi. */
const sahneZamanlari = (plan: IlanPlan) => {
  let bas = 0;
  return plan.sahneler.map((s, i) => {
    const r = { s, i, bas, gecis: i === 0 ? ("kesme" as const) : s.gecis };
    bas += s.sure;
    return r;
  });
};

/**
 * Sahneler + giriş geçişleri (references/gecisler.md). kayma: önceki sahne kayma süresi kadar uzatılır ve yeni sahne
 * onun üstüne sağdan iter. perde/karartma: sınırda ayrı bir örtü katmanı (GecisOrtusu) kesmeyi gizler.
 */
const SahneKatmani: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const { fps } = useVideoConfig();
  const z = sahneZamanlari(plan);
  return (
    <>
      {z.map(({ s, i, bas, gecis }) => {
        const from = Math.round(bas * fps);
        const frames = Math.round(s.sure * fps);
        const sonraki = z[i + 1];
        const kuyruk = sonraki?.gecis === "kayma" ? Math.round(GECIS_SN.kayma * fps) : 0;
        // Senkron avatar: klipte, sahnenin başladığı an eksi seslendirmenin başladığı an kadar ileri sar.
        const senkronBas = bas - (plan.seslendirme?.from ?? 0);
        return (
          <Sequence key={i} from={from} durationInFrames={frames + kuyruk} premountFor={fps}>
            <SahneGecisi gecis={gecis} frames={frames} kuyruk={kuyruk}>
              <SahneAlani tanim={s.alan}>
                <SahneGorsel s={s} frames={frames} senkronBas={senkronBas} klasor={plan.klasor} />
              </SahneAlani>
            </SahneGecisi>
          </Sequence>
        );
      })}
    </>
  );
};

/** Sahne görüntüsünü ızgara alanına sığdırır (alan yoksa tam ekran). */
const SahneAlani: React.FC<{ tanim?: string; children: React.ReactNode }> = ({ tanim, children }) => {
  if (!tanim) return <>{children}</>;
  const k = alan(tanim);
  return <div style={{ position: "absolute", left: k.left, top: k.top, width: k.width, height: k.height, overflow: "hidden" }}>{children}</div>;
};

const SahneGecisi: React.FC<{ gecis: Sahne["gecis"]; frames: number; kuyruk: number; children: React.ReactNode }> = ({ gecis, frames, kuyruk, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  let opak = 1;
  let x = 0;
  if (gecis === "yumusak") opak = interpolate(frame, [0, 6], [0.35, 1], clamp);
  if (gecis === "kayma") x = interpolate(frame, [0, GECIS_SN.kayma * fps], [G.W, 0], { ...clamp, easing: yumusak });
  // Sonraki sahne kayarak gelirken bu sahne sola itilir (tam çıkmaz, altında kalır).
  if (kuyruk > 0) x += interpolate(frame, [frames, frames + kuyruk], [0, -G.W * 0.35], { ...clamp, easing: yumusak });
  return (
    <AbsoluteFill style={{ opacity: opak, transform: x ? `translateX(${x}px)` : undefined, backgroundColor: renk.cbMaviKoyu, overflow: "hidden" }}>
      {children}
    </AbsoluteFill>
  );
};

/** perde / karartma: sahne sınırının iki yanına yayılan örtü; kesme, örtü ekranı tam kapladığı karede olur. */
const GecisOrtusu: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const katmanlar = sahneZamanlari(plan).map(({ bas, gecis, i }) => {
    if (gecis !== "perde" && gecis !== "karartma") return null;
    const b = bas * fps;
    const yari = (GECIS_SN[gecis] * fps) / 2;
    if (frame < b - yari || frame > b + yari) return null;
    if (gecis === "karartma") {
      const o = interpolate(frame, [b - yari, b, b + yari], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.cubic) });
      return <AbsoluteFill key={i} style={{ backgroundColor: renk.cbMaviKoyu, opacity: o }} />;
    }
    // Perde: CB mavisi panel soldan sağa geçer; sınır karesinde ekranı tamamen kaplar. Ön/arka kenarda ince beyaz çizgi.
    const g = G.W * 1.15;
    const sol = interpolate(frame, [b - yari, b, b + yari], [-g, -(g - G.W) / 2, G.W], { ...clamp, easing: Easing.inOut(Easing.cubic) });
    return (
      <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: sol, width: g, background: renk.cbMavi }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: 6, background: renk.beyaz, opacity: 0.85 }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: 6, background: renk.beyaz, opacity: 0.85 }} />
      </div>
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{katmanlar}</AbsoluteFill>;
};

/** Bölüm arası köprü kartı: lacivert zemin, küçük üst etiket, büyüyen ince çizgi, Garamond italik köprü cümlesi. */
const AraKart: React.FC<{ s: Sahne }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = (d: number, sure = 0.5) => interpolate(t, [d, d + sure], [0, 1], { ...clamp, easing: yumusak });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 45%, #0A2E80 0%, ${renk.cbMavi} 50%, ${renk.cbMaviKoyu} 100%)` }}>
      {/* Güvenli alan içinde, dikey ortaya yakın (y ≈ 780–1080); sağ buton sütununa girmez. */}
      <div style={{ position: "absolute", top: 780, left: G.yan + 20, right: G.W - G.sagButonX + 20, textAlign: "center", color: renk.beyaz }}>
        {s.ust ? (
          <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 28, letterSpacing: 7, color: renk.griAcik, opacity: g(0.1) }}>{tr(s.ust)}</div>
        ) : null}
        <div style={{ height: 3, width: 160 * g(0.2, 0.6), background: renk.beyaz, margin: "22px auto 26px", borderRadius: 2 }} />
        <div style={{ fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 600, fontSize: 74, lineHeight: 1.12, opacity: g(0.3), transform: `translateY(${(1 - g(0.3)) * 18}px)` }}>
          {s.metin}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── üst bant: etiket + logo ─────────────────────────

const LogoRozet: React.FC<{ src: string; yukseklik: number }> = ({ src, yukseklik }) => (
  // Çerçeveli logo yalnızca açık zeminde kullanılır (kılavuz s.7) → beyaz rozet; güvenlik boşluğu = logonun yarısı kadar.
  <div style={{ background: renk.beyaz, borderRadius: 18, padding: `${yukseklik * 0.14}px ${yukseklik * 0.18}px`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
    <Img src={staticFile(src)} style={{ height: yukseklik, display: "block" }} />
  </div>
);

const UstBant: React.FC<{ plan: IlanPlan; t: number; bitis: number }> = ({ plan, t, bitis }) => {
  const o = pencere(t, 0.1, bitis, 0.5, 0.3);
  const k = plan.ustEtiketOlcek;
  const logoAyri = !!plan.yerlesim.logo;
  const logoKutu = logoAyri ? alan(plan.yerlesim.logo!) : null;
  return (
    <>
      <Yer tanim={plan.yerlesim.ustBant} varsayilan={{ left: G.yan, top: G.ust, width: G.W - 2 * G.yan, height: 170 }} hiza="ust">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", opacity: o }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 8 }}>
            <div
              style={{
                background: renk.cbMavi, color: renk.beyaz, fontFamily: yazi.sans, fontWeight: 700, fontSize: 30 * k, letterSpacing: 4 * k,
                padding: `${12 * k}px ${24 * k}px`, borderRadius: 12 * k, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap",
              }}
            >
              {tr(plan.ustEtiket ?? plan.ilan.tur)}
            </div>
          </div>
          {logoAyri ? null : <LogoRozet src={plan.danisman.logo} yukseklik={128} />}
        </div>
      </Yer>
      {logoKutu ? (
        // Logo alanın tam ortasında; rozet genişliği alanı aşmayacak şekilde ölçeklenir (logo oranı ≈ 1.61).
        <div style={{ position: "absolute", left: logoKutu.left, top: logoKutu.top, width: logoKutu.width, height: logoKutu.height, display: "flex", alignItems: "center", justifyContent: "center", opacity: o }}>
          <LogoRozet src={plan.danisman.logo} yukseklik={Math.min(150, (logoKutu.width - 30) / 1.97)} />
        </div>
      ) : null}
    </>
  );
};

/**
 * İmza döngüsü (plan.imzaDongu): ad imza gibi soldan sağa yazılır, telefon daktilo gibi harf harf gelir, kısa bir
 * bekleyişten sonra ikisi birlikte birkaç kez hızlıca yanıp söner ve kaybolur; `bekleme` sn sonra baştan başlar.
 */
const IMZA_SN = { imza: 1.4, daktiloHarf: 0.08, tut: 1.2, yanip: 0.6, sonus: 0.5 } as const;
const ImzaDongu: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const d = plan.imzaDongu;
  if (!d) return null;
  const ad = d.ad ?? plan.danisman.ad;
  const tel = d.telefon ?? plan.danisman.telefon;
  const daktilo = tel.length * IMZA_SN.daktiloHarf;
  const gorunur = IMZA_SN.imza + daktilo + IMZA_SN.tut + IMZA_SN.yanip + IMZA_SN.sonus;
  const dongu = gorunur + d.bekleme;
  if (t < d.baslangic) return null;
  const u = (t - d.baslangic) % dongu;
  if (u >= gorunur) return null;
  const imzaP = interpolate(u, [0, IMZA_SN.imza], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  const harf = Math.floor(Math.max(0, u - IMZA_SN.imza * 0.85) / IMZA_SN.daktiloHarf);
  const yazilan = tel.slice(0, Math.min(tel.length, harf));
  const daktiloBitti = harf >= tel.length;
  const yanipBas = IMZA_SN.imza + daktilo + IMZA_SN.tut;
  // Hızlı yanıp sönme: 0.1 sn açık / 0.1 sn kapalı (3 kez), ardından söner.
  let o = 1;
  if (u >= yanipBas && u < yanipBas + IMZA_SN.yanip) o = Math.floor((u - yanipBas) / 0.1) % 2 === 0 ? 0.08 : 1;
  if (u >= yanipBas + IMZA_SN.yanip) o = interpolate(u, [yanipBas + IMZA_SN.yanip, gorunur], [1, 0], clamp);
  // Daktilo imleci: yazarken sabit, bitince yarım saniyede bir yanıp söner.
  const imlec = !daktiloBitti ? 1 : Math.floor(u / 0.5) % 2 === 0 ? 1 : 0;
  const k = alan(d.alan);
  const golge = "0 3px 14px rgba(0,0,0,0.75), 0 0 2px rgba(0,0,0,0.6)";
  return (
    <div style={{ position: "absolute", right: G.W - (k.left + k.width) + 34, top: k.top + k.height / 2, transform: "translateY(-50%)", textAlign: "right", opacity: o, color: renk.beyaz }}>
      <div style={{ fontFamily: yazi.imza, fontSize: 84, lineHeight: 1.05, whiteSpace: "nowrap", textShadow: golge, padding: "0 6px", clipPath: `inset(-30% ${(1 - imzaP) * 100}% -30% -5%)` }}>
        {ad.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\p{L})/gu, (_, b: string, h: string) => b + h.toLocaleUpperCase("tr-TR"))}
      </div>
      <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 40, letterSpacing: 2, fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", textShadow: golge, marginTop: 2, minHeight: 52 }}>
        {yazilan}
        {harf > 0 ? <span style={{ opacity: imlec, fontWeight: 400 }}>|</span> : null}
      </div>
    </div>
  );
};

// ───────────────────────── başlık kartı ─────────────────────────

type KartMetni = { from: number; to: number; buyuk: string; vurgu?: string; serif?: string; kucuk?: string; fiyat?: string; alan?: string };

const BaslikKarti: React.FC<{ k: KartMetni; t: number; varsayilanAlan?: string }> = ({ k, t, varsayilanAlan }) => {
  const { from, to } = k;
  const o = pencere(t, from, to, 0.55, 0.35);
  const y = interpolate(t, [from, from + 0.6], [40, 0], { ...clamp, easing: yumusak });
  const cizgi = interpolate(t, [from + 0.25, from + 0.9], [0, 1], { ...clamp, easing: yumusak });
  if (o <= 0) return null;
  return (
    <Yer tanim={k.alan ?? varsayilanAlan} varsayilan={{ left: G.yan, top: 478, width: G.W - 2 * G.yan, height: 560 }} hiza="ust">
    <div style={{ opacity: o, transform: `translateY(${y}px)`, color: renk.beyaz }}>
      <div style={{ fontFamily: yazi.sans, fontWeight: 800, fontSize: 112, lineHeight: 1, letterSpacing: -2, whiteSpace: "pre-line", textShadow: "0 8px 30px rgba(0,0,0,0.45)" }}>
        {tr(k.buyuk)}
        {k.vurgu ? <span style={{ fontWeight: 600 }}> {k.vurgu}</span> : null}
      </div>
      <div style={{ height: 4, width: 220 * cizgi, background: renk.beyaz, margin: "22px 0 18px", borderRadius: 2 }} />
      {k.serif ? <div style={{ fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 600, fontSize: 50, lineHeight: 1.1, textShadow: "0 4px 18px rgba(0,0,0,0.5)" }}>{k.serif}</div> : null}
      {k.kucuk ? (
        <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 30, letterSpacing: 3, marginTop: 10, color: renk.griAcik }}>{tr(k.kucuk)}</div>
      ) : null}
      {k.fiyat ? (
        <div style={{ display: "inline-block", marginTop: 22, background: renk.beyaz, color: renk.cbMavi, fontFamily: yazi.sans, fontWeight: 800, fontSize: 46, padding: "8px 22px", borderRadius: 12 }}>{k.fiyat}</div>
      ) : null}
    </div>
    </Yer>
  );
};

/** İlan başlığı (plan.baslik) + serbest kartlar (plan.kartlar). */
const kartlariTopla = (plan: IlanPlan): KartMetni[] => [
  ...(plan.baslik
    ? [{ ...plan.baslik, buyuk: plan.ilan.emlakTipi, vurgu: plan.ilan.oda, serif: plan.ilan.konum, kucuk: plan.ilan.konum2, fiyat: plan.ilan.fiyat, alan: plan.yerlesim.baslik }]
    : []),
  ...plan.kartlar,
];

// ───────────────────────── bilgi çubuğu ─────────────────────────

const BilgiCubugu: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const { from, to, aralik } = plan.bilgi;
  const o = pencere(t, from, to, 0.4, 0.35);
  if (o <= 0) return null;
  const n = plan.ozellikler.length;
  const y = interpolate(t, [from, from + 0.5], [30, 0], { ...clamp, easing: yumusak });
  return (
    <Yer tanim={plan.yerlesim.bilgi} varsayilan={{ left: G.yan, top: 500, width: G.W - 2 * G.yan, height: 220 }} hiza="ust">
    <div style={{ opacity: o, transform: `translateY(${y}px)` }}>
      <div style={{ display: "flex", background: "rgba(255,255,255,0.96)", borderRadius: 24, padding: "26px 8px", boxShadow: "0 14px 40px rgba(0,0,0,0.3)" }}>
        {plan.ozellikler.map((oz, i) => {
          const g = interpolate(t, [from + 0.15 + i * aralik, from + 0.15 + i * aralik + 0.35], [0, 1], { ...clamp, easing: yumusak });
          return (
            <div key={i} style={{ flex: 1, textAlign: "center", borderLeft: i > 0 ? "2px solid #D5DBE6" : "none", opacity: g, transform: `translateY(${(1 - g) * 14}px)` }}>
              <div style={{ fontFamily: yazi.sans, fontWeight: 700, fontSize: n >= 5 ? 40 : 46, color: renk.cbMavi, lineHeight: 1.05, whiteSpace: "nowrap" }}>{oz.deger}</div>
              <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 21, letterSpacing: 2.5, color: renk.gri, marginTop: 8 }}>{tr(oz.etiket)}</div>
            </div>
          );
        })}
      </div>
    </div>
    </Yer>
  );
};

// ───────────────────────── oda etiketi + altyazı ─────────────────────────

const OdaEtiketi: React.FC<{ metin: string; frames: number; tanim?: string }> = ({ metin, frames, tanim }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const o = pencere(frame / fps, 0.2, frames / fps, 0.4, 0.3);
  return (
    <Yer tanim={tanim} varsayilan={{ left: G.yan, top: 1000, width: 775, height: 80 }} hiza="ust" butonKorumasi>
    <div style={{ opacity: o, transform: `translateX(${(1 - o) * -24}px)`, display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 8, height: 46, background: renk.beyaz, borderRadius: 4, flexShrink: 0 }} />
      <div style={{ background: renk.cbMavi, color: renk.beyaz, fontFamily: yazi.sans, fontWeight: 600, fontSize: 30, letterSpacing: 3.5, padding: "10px 20px", borderRadius: 10, whiteSpace: "nowrap" }}>{tr(metin)}</div>
    </div>
    </Yer>
  );
};

const Altyazi: React.FC<{ plan: IlanPlan; t: number }> = ({ plan, t }) => {
  const cur = plan.altyazi.find((a) => t >= a.from && t < a.to);
  if (!cur) return null;
  const o = pencere(t, cur.from, cur.to, 0.12, 0.08);
  return (
    // Klasik: sol hizalı, x 65–840 (buton sütununa taşmaz), alt sınır y 1240. Izgara alanında alta yaslı.
    <Yer tanim={plan.yerlesim.altyazi} varsayilan={{ left: G.yan, top: 840, width: G.sagButonX - 10 - G.yan, height: 400 }} hiza="alt" butonKorumasi>
    <div style={{ opacity: o }}>
      <span
        style={{
          fontFamily: yazi.sans,
          fontWeight: 700,
          fontSize: 50,
          lineHeight: 1.32,
          color: renk.beyaz,
          background: "rgba(1,33,105,0.88)",
          padding: "4px 16px",
          borderRadius: 10,
          boxDecorationBreak: "clone",
          WebkitBoxDecorationBreak: "clone",
        }}
      >
        {cur.text}
      </span>
    </div>
    </Yer>
  );
};

// ───────────────────────── kapanış kartı ─────────────────────────

const Kapanis: React.FC<{ plan: IlanPlan }> = ({ plan }) =>
  plan.kapanis.mod === "ofis" && plan.kapanis.ofis ? <OfisKapanis plan={plan} /> : <DanismanKapanis plan={plan} />;

/** Ofis kartı: logo, ofis/ekip adı, adres, telefon (en büyük öğe), slogan. Tümü y < 1250. */
const OfisKapanis: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = (d: number) => interpolate(t, [d, d + 0.5], [0, 1], { ...clamp, easing: yumusak });
  const o = plan.kapanis.ofis!;
  const cizgi = interpolate(t, [0.5, 1.1], [0, 1], { ...clamp, easing: yumusak });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #0A2E80 0%, ${renk.cbMavi} 45%, ${renk.cbMaviKoyu} 100%)`, opacity: g(0) }}>
      <div style={{ position: "absolute", top: G.ust + 40, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: g(0.1), transform: `scale(${0.94 + 0.06 * g(0.1)})` }}>
        <LogoRozet src={plan.danisman.logo} yukseklik={170} />
      </div>
      <div style={{ position: "absolute", top: 610, left: G.yan, right: G.yan, textAlign: "center", color: renk.beyaz, opacity: g(0.35), transform: `translateY(${(1 - g(0.35)) * 24}px)` }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 800, fontSize: 84, lineHeight: 1.02, letterSpacing: -1 }}>{tr(o.baslik)}</div>
        {o.altBaslik ? <div style={{ fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 600, fontSize: 52, marginTop: 14, color: renk.griAcik }}>{o.altBaslik}</div> : null}
        <div style={{ height: 4, width: 220 * cizgi, background: renk.beyaz, margin: "28px auto 0", borderRadius: 2 }} />
      </div>
      {o.adres ? (
        <div style={{ position: "absolute", top: 900, left: G.yan, right: G.yan, textAlign: "center", opacity: g(0.6), fontFamily: yazi.sans, fontWeight: 600, fontSize: 34, letterSpacing: 5, color: renk.griAcik }}>
          {tr(o.adres)}
        </div>
      ) : null}
      <div style={{ position: "absolute", top: 990, left: G.yan, right: G.yan, textAlign: "center", opacity: g(0.75), transform: `translateY(${(1 - g(0.75)) * 20}px)` }}>
        <div style={{ display: "inline-block", background: renk.beyaz, color: renk.cbMavi, fontFamily: yazi.sans, fontWeight: 800, fontSize: 58, letterSpacing: 1, padding: "12px 30px", borderRadius: 18, whiteSpace: "nowrap", boxShadow: "0 14px 40px rgba(0,0,0,0.35)" }}>
          {o.telefon}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1150, left: 120, right: 120, textAlign: "center", fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 500, fontSize: 40, color: renk.griAcik, opacity: g(1.0) }}>
        {plan.kapanis.slogan}
      </div>
    </AbsoluteFill>
  );
};

const DanismanKapanis: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const g = (d: number) => interpolate(t, [d, d + 0.5], [0, 1], { ...clamp, easing: yumusak });
  const d = plan.danisman;
  const portre = 244;
  // İmza: ad soldan sağa "yazılır" (kalem hızı sabit değil, başta ve sonda yavaşlar).
  const imzaP = interpolate(t, [0.5, 1.9], [0, 1], { ...clamp, easing: Easing.bezier(0.45, 0, 0.25, 1) });
  const imzaMetni = d.ad.toLocaleLowerCase("tr-TR").replace(/(^|\s)(\p{L})/gu, (_, b: string, h: string) => b + h.toLocaleUpperCase("tr-TR"));
  return (
    <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 38%, #0A2E80 0%, ${renk.cbMavi} 45%, ${renk.cbMaviKoyu} 100%)`, opacity: g(0) }}>
      <div style={{ position: "absolute", top: G.ust, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: g(0.1) }}>
        <LogoRozet src={d.logo} yukseklik={150} />
      </div>
      <div style={{ position: "absolute", top: 506, left: (G.W - portre - 16) / 2, opacity: g(0.25), transform: `scale(${0.92 + 0.08 * g(0.25)})` }}>
        <div style={{ width: portre + 16, height: portre + 16, borderRadius: "50%", background: renk.beyaz, padding: 8, boxShadow: "0 20px 50px rgba(0,0,0,0.4)" }}>
          <Img src={staticFile(d.portre)} style={{ width: portre, height: portre, borderRadius: "50%", objectFit: "cover", objectPosition: "50% 30%" }} />
        </div>
      </div>
      {d.imza ? (
        <div style={{ position: "absolute", top: 772, left: G.yan, right: G.yan, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: yazi.imza, fontSize: 124, lineHeight: 1.15, color: renk.beyaz, padding: "0 40px", whiteSpace: "nowrap",
              clipPath: `inset(-20% ${(1 - imzaP) * 100}% -20% 0)`,
            }}
          >
            {imzaMetni}
          </div>
        </div>
      ) : null}
      <div style={{ position: "absolute", top: d.imza ? 914 : 846, left: G.yan, right: G.yan, textAlign: "center", color: renk.beyaz, opacity: g(d.imza ? 1.6 : 0.45) }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 700, fontSize: d.imza ? 38 : 60, lineHeight: 1.1 }}>{d.ad}</div>
        <div style={{ fontFamily: yazi.sans, fontWeight: 500, fontSize: 24, letterSpacing: 4, color: renk.griAcik, marginTop: 8 }}>
          {tr(d.unvan)}
          {d.ofis ? ` · ${tr(d.ofis)}` : ""}
        </div>
      </div>
      {/* Telefon: en büyük ve en belirgin öğe (danışman talebi). Ortalı kutu x ≈ 284–796: buton sütununa (x > 850) değmez. */}
      <div style={{ position: "absolute", top: 1030, left: G.yan, right: G.yan, textAlign: "center", opacity: g(0.65), transform: `translateY(${(1 - g(0.65)) * 20}px)` }}>
        <div style={{ fontFamily: yazi.sans, fontWeight: 600, fontSize: 24, letterSpacing: 6, color: "#9CC3FF", display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <span style={{ width: 14, height: 14, borderRadius: "50%", background: renk.yesil, display: "inline-block" }} />
          HEMEN ARAYIN
        </div>
        <div style={{ display: "inline-block", marginTop: 12, background: renk.beyaz, color: renk.cbMavi, fontFamily: yazi.sans, fontWeight: 800, fontSize: 64, letterSpacing: 1, padding: "10px 30px", borderRadius: 18, whiteSpace: "nowrap" }}>
          {d.telefon}
        </div>
      </div>
      <div style={{ position: "absolute", top: 1188, left: 120, right: 120, textAlign: "center", fontFamily: yazi.serif, fontStyle: "italic", fontWeight: 500, fontSize: 38, color: renk.griAcik, opacity: g(0.9) }}>
        {plan.kapanis.slogan}
      </div>
    </AbsoluteFill>
  );
};

// ───────────────────────── ses ─────────────────────────

const Muzik: React.FC<{ plan: IlanPlan }> = ({ plan }) => {
  const { fps, durationInFrames } = useVideoConfig();
  const m = plan.muzik;
  if (!m) return null;
  // Seslendirmenin bittiği kare: altyazı sonu yaklaşık olarak kullanılır (ses dosyası süresi render'da bilinmez).
  const sesSonu = plan.altyazi.length ? Math.round(plan.altyazi[plan.altyazi.length - 1].to * fps) : durationInFrames;
  // Konuşma sahnelerinde, ses parçalarında ve seslendirme süresince müziği kıs (ducking); sonda 1 sn içinde sön.
  const araliklar: { a: number; b: number; konusma: boolean }[] = [];
  let bas = 0;
  for (const s of plan.sahneler) {
    araliklar.push({ a: bas * fps, b: (bas + s.sure) * fps, konusma: (s.ses ?? s.tip === "konusma") === true });
    bas += s.sure;
  }
  // Müzik, konuşma girerken/çıkarken 0.3 sn'de yumuşakça iner/çıkar (ani seviye sıçraması olmasın).
  const konusmaAraliklari = [
    ...araliklar.filter((x) => x.konusma),
    ...plan.sesler.map((x) => ({ a: x.from * fps, b: (x.from + x.sure) * fps })),
  ];
  const kisma = (f: number) =>
    Math.max(0, ...konusmaAraliklari.map((x) => Math.min(interpolate(f, [x.a - 0.3 * fps, x.a], [0, 1], clamp), interpolate(f, [x.b, x.b + 0.3 * fps], [1, 0], clamp))));
  return (
    <Audio
      src={dosya(plan.klasor, m.src)}
      loop
      trimBefore={Math.round(m.baslangic * fps)}
      volume={(f) => {
        const seslendirmeVar = plan.seslendirme && f >= plan.seslendirme.from * fps && f < sesSonu;
        const k = seslendirmeVar ? 1 : kisma(f);
        const hedef = m.ses + (m.konusmadaSes - m.ses) * k;
        const sonus = interpolate(f, [durationInFrames - fps, durationInFrames - 1], [1, 0], clamp);
        return hedef * sonus;
      }}
    />
  );
};

// ───────────────────────── kompozisyon ─────────────────────────

export const IlanReel: React.FC<IlanPlan> = (plan) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const icerikSonu = toplamSure(plan) - plan.kapanis.sure;
  let bas = 0;
  const etiketler = plan.sahneler.map((s) => {
    const r = { from: bas, s };
    bas += s.sure;
    return r;
  });
  return (
    <AbsoluteFill style={{ backgroundColor: renk.cbMaviKoyu }}>
      <SahneKatmani plan={plan} />
      {/* Okunabilirlik: üstte lacivert (ustKarartma), altta koyu degrade (mülkü örtmeden). */}
      <AbsoluteFill
        style={{
          background: plan.ustKarartma
            ? "linear-gradient(180deg, rgba(0,15,51,0.72) 0%, rgba(0,15,51,0.35) 30%, rgba(0,15,51,0) 45%, rgba(0,0,0,0) 55%, rgba(0,10,30,0.55) 78%, rgba(0,10,30,0.7) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 55%, rgba(0,10,30,0.55) 78%, rgba(0,10,30,0.7) 100%)",
        }}
      />
      <GecisOrtusu plan={plan} />
      {etiketler.map(({ from, s }, i) =>
        s.etiket ? (
          <Sequence key={i} from={Math.round(from * fps)} durationInFrames={Math.round(s.sure * fps)} layout="none">
            <OdaEtiketi metin={s.etiket} frames={Math.round(s.sure * fps)} tanim={s.etiketAlan ?? plan.yerlesim.odaEtiketi} />
          </Sequence>
        ) : null,
      )}
      <UstBant plan={plan} t={t} bitis={icerikSonu} />
      {kartlariTopla(plan).map((k, i) => (
        <BaslikKarti key={i} k={k} t={t} varsayilanAlan={plan.yerlesim.baslik} />
      ))}
      <BilgiCubugu plan={plan} t={t} />
      <Altyazi plan={plan} t={t} />
      <Sequence from={Math.round(icerikSonu * fps)} durationInFrames={Math.round(plan.kapanis.sure * fps)}>
        <Kapanis plan={plan} />
      </Sequence>
      <ImzaDongu plan={plan} t={t} />
      {plan.izgaraGoster ? <IzgaraKatmani /> : null}
      <Muzik plan={plan} />
      {plan.sesler.map((x, i) => (
        <Sequence key={`ses${i}`} from={Math.round(x.from * fps)} durationInFrames={Math.round(x.sure * fps)} layout="none">
          <Audio src={dosya(plan.klasor, x.src)} trimBefore={Math.round(x.baslangic * fps)} volume={() => x.ses} />
        </Sequence>
      ))}
      {plan.seslendirme ? (
        <Sequence from={Math.round(plan.seslendirme.from * fps)} layout="none">
          <Audio src={dosya(plan.klasor, plan.seslendirme.src)} volume={() => plan.seslendirme?.ses ?? 1} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
