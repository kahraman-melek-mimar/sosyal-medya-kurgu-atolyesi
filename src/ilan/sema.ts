// İlan Reels planı: tek bir JSON (work/ilan-plan.json) videonun tamamını tarif eder.
// Örnek: library/examples/ilan-plan.example.json. Tüm süreler SANİYE, tüm medya yolları public/ altına göre.
import { z } from "zod";
import { ALAN_DESENI } from "./izgara";

/** Izgara alanı: hücre ("6") ya da iki köşe ("5-12"), isteğe bağlı hiza ("13-16 alt"). Bkz. src/ilan/izgara.ts */
const alanSchema = z.string().regex(ALAN_DESENI, "Izgara alanı: \"6\", \"5-12\" veya \"13-16 alt\" (hücreler 1–20)");

export const sahneSchema = z.object({
  tip: z.enum(["konusma", "mulk-video", "mulk-foto", "karsilastirma"]),
  /** public/ altındaki dosya; boş bırakılırsa lacivert yer tutucu çizilir (taslak için). */
  src: z.string().optional(),
  /**
   * karsilastirma: `src` = ÖNCESİ (render / eski hal), `src2` = SONRASI (bitmiş hal). Foto veya video olabilir.
   * Dikey bir perde sağdan sola kayarak sonrasını açar; `perde` = [başlangıç, bitiş] sahne oranı (0–1).
   */
  src2: z.string().optional(),
  perde: z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]).default([0.25, 0.75]),
  oncesiYazi: z.string().default("ÖNCESİ"),
  sonrasiYazi: z.string().default("SONRASI"),
  sure: z.number().positive(),
  /** Kaynak videonun kaçıncı saniyesinden başlanacağı (video sahneleri). */
  baslangic: z.number().min(0).default(0),
  /** mulk-foto için yavaş kamera hareketi; videoda hafif punch-in. */
  hareket: z.enum(["yok", "yakinlas", "uzaklas", "sola", "saga"]).default("yakinlas"),
  /** Kadrajın odak noktası (0–1); dikey olmayan kaynakta neyin görüneceğini belirler. */
  odak: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).default({ x: 0.5, y: 0.5 }),
  /** Mülk sahnelerinde sol altta görünen oda etiketi, ör. "SALON", "ANA YATAK ODASI". */
  etiket: z.string().optional(),
  /** Sahnenin sesi: konuşmada varsayılan açık, mülk videosunda kapalı. Seslendirme varken avatar sahnesi sessizdir. */
  ses: z.boolean().optional(),
  /**
   * Avatar (HeyGen) klibi seslendirmeyle aynı zaman çizelgesinde: klip, sahnenin videodaki başlangıcına karşılık gelen
   * yerden oynar, böylece dudaklar seslendirmeyle eşleşir. `baslangic` yok sayılır.
   */
  senkron: z.boolean().default(false),
  /** Video oynatma hızı: 0.7 = ağır çekim (kısa klibi uzun anlatıma yaymak için). Senkron avatar klibinde 1 kalmalı. */
  hiz: z.number().min(0.25).max(2).default(1),
  /**
   * Görüntünün ızgarada kapladığı alan (ör. "5-16" = ortadaki 3 satır, "1-8" = üst 2 satır). Boş = tam ekran.
   * Alan dışı lacivert zemindir; bölünmüş ekran ve resim-içinde-resim için.
   */
  alan: alanSchema.optional(),
  /** Bu sahnenin oda etiketi için ayrı yerleşim (yoksa plan.yerlesim.odaEtiketi). */
  etiketAlan: alanSchema.optional(),
});

export const ilanPlanSchema = z.object({
  fps: z.number().int().positive().default(30),
  /** Üst banttaki etiket; boşsa `ilan.tur` yazılır (ör. "PROJE İNCELEME" — ilan dışı videolar için). */
  ustEtiket: z.string().optional(),
  ilan: z.object({
    tur: z.enum(["SATILIK", "KİRALIK"]),
    emlakTipi: z.string(), // "VİLLA", "DAİRE" …
    oda: z.string(), // "6+2"
    konum: z.string(), // "Gölbaşı / Karşıyaka Mh. - Ankara"
    konum2: z.string().optional(), // site adı
    fiyat: z.string().optional(), // "12.500.000 TL" — boşsa gösterilmez
  }),
  /** Bilgi çubuğu, 3–5 sütun. */
  ozellikler: z.array(z.object({ deger: z.string(), etiket: z.string() })).min(1).max(5),
  sahneler: z.array(sahneSchema).min(1),
  /**
   * Başlık kartının ekranda kaldığı aralık (mutlak saniye). Ek başlıklar için `kartlar`.
   * `null` = ilan başlığı yok. (Alanı silmek yetmez: Remotion --props'u örnek planın üstüne birleştirir.)
   */
  baslik: z.object({ from: z.number().min(0), to: z.number() }).nullable().optional(),
  /**
   * Serbest başlık kartları (başlık kartıyla aynı görünüm, metni elle verilir): `buyuk` Poppins 800 (\n ile satır bölünür),
   * `vurgu` aynı satırda ince, `serif` Garamond italik alt satır, `kucuk` aralıklı küçük satır.
   */
  kartlar: z
    .array(z.object({ from: z.number().min(0), to: z.number(), buyuk: z.string(), vurgu: z.string().optional(), serif: z.string().optional(), kucuk: z.string().optional(), alan: alanSchema.optional() }))
    .default([]),
  /**
   * Görüntüden bağımsız ses parçaları (J/L kesme): bir klibin sesi başka görüntülerin üstünde çalar.
   * `from` videodaki mutlak saniye, `baslangic` kaynaktaki saniye, `sure` saniye. Bu aralıklarda müzik kısılır.
   */
  sesler: z
    .array(z.object({ src: z.string(), from: z.number().min(0), baslangic: z.number().min(0).default(0), sure: z.number().positive(), ses: z.number().min(0).max(3).default(1) }))
    .default([]),
  /**
   * IZGARA YERLEŞİMİ (4 sütun × 5 satır, 1 sol üst – 20 sağ alt). Her öğe bir alana konur; verilmeyen öğe klasik
   * konumunda kalır. Örnek: { "baslik": "5-8", "bilgi": "9-12 orta", "altyazi": "13-15 alt", "odaEtiketi": "9" }.
   */
  yerlesim: z
    .object({
      ustBant: alanSchema.optional(),
      baslik: alanSchema.optional(),
      bilgi: alanSchema.optional(),
      odaEtiketi: alanSchema.optional(),
      altyazi: alanSchema.optional(),
    })
    .default({}),
  /** Önizleme için numaralı ızgarayı videonun üstüne çizer. Teslim render'ında false olmalı. */
  izgaraGoster: z.boolean().default(false),
  /** Bilgi çubuğunun aralığı; sütunlar `aralik` saniye arayla tek tek girer. */
  bilgi: z.object({ from: z.number().min(0), to: z.number(), aralik: z.number().default(0.25) }),
  /** Altyazı satırları (gömülü). Kısa tut: 2–6 kelime. */
  altyazi: z.array(z.object({ from: z.number(), to: z.number(), text: z.string() })).default([]),
  /** ElevenLabs seslendirmesi (npm run ilan:seslendir doldurur). `from`: videonun kaçıncı saniyesinde başlar. */
  seslendirme: z
    .object({ src: z.string(), from: z.number().min(0).default(0.3), ses: z.number().min(0).max(2).default(1) })
    .optional(),
  muzik: z
    .object({
      src: z.string(),
      /** Parçanın kaçıncı saniyesinden başlanacağı. */
      baslangic: z.number().min(0).default(0),
      ses: z.number().min(0).max(1).default(0.22),
      /** Konuşma sahnelerinde müzik bu orana iner. */
      konusmadaSes: z.number().min(0).max(1).default(0.08),
    })
    .optional(),
  kapanis: z.object({
    sure: z.number().positive().default(4),
    slogan: z.string().default("Doğru yatırım, doğru danışmanla mümkün."),
    /** "ofis": portre/imza yerine ofis kartı (başlık, adres, telefon). Varsayılan danışman kartı. */
    mod: z.enum(["danisman", "ofis"]).default("danisman"),
    ofis: z.object({ baslik: z.string(), altBaslik: z.string().optional(), adres: z.string().optional(), telefon: z.string() }).optional(),
  }),
  danisman: z.object({
    ad: z.string(),
    unvan: z.string().default("Ticari Gayrimenkul Danışmanı"),
    telefon: z.string(),
    ofis: z.string().optional(), // "Parla Gayrimenkul"
    portre: z.string().default("marka/portre-kare.png"),
    logo: z.string().default("marka/cb-parla-logo.png"),
    /** Kapanışta ad el yazısıyla, imza atılıyormuş gibi yazılır (false → düz Poppins). */
    imza: z.boolean().default(true),
  }),
});

export type IlanPlan = z.infer<typeof ilanPlanSchema>;
export type Sahne = z.infer<typeof sahneSchema>;

export const toplamSure = (p: IlanPlan) => p.sahneler.reduce((s, x) => s + x.sure, 0) + p.kapanis.sure;
