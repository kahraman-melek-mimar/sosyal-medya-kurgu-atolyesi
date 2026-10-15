# İlan Reels — dikey emlak videosu kompozisyonu (IlanReel)

Bu kullanıcının varsayılan dikey videosu: danışmanın konuşma çekimleri ile mülk videoları/fotoğrafları art arda,
Coldwell Banker kimliğiyle. 1080×1920, 30 fps, H.264 SDR Rec.709 + AAC. Tek dosya → Instagram Reels/Story, TikTok,
WhatsApp Durum. Eski 16:9 hattından (src/index.ts, work/edit-plan.json, scripts/60–80) tamamen bağımsızdır.

## Kurgu klasörü (her ilan videosu ayrı)

Her kurgu kendi klasöründe yaşar; dosyalar asla karışmaz. Kurgu adı Türkçe yazılabilir, klasör adı otomatik
sadeleşir ("Gölbaşı Villa" → `golbasi-villa`).

```
> İki düzen birlikte çalışır: Mac'te her video `projects/<slug>/` altında (`npm run proje -- <slug>`, kökteki
> `work`/`out`/`public/assets` etkin projeye kısayol). Kurgu adıyla çalışan komutlar ise `public/kurgular/<isim>/` düzenini kullanır.

public/kurgular/<isim>/
  metin.md          seslendirme metni (kullanıcı yazar)
  plan.json         ilan planı; "klasor": "kurgular/<isim>" → içindeki yollar bu klasöre göre
  medya/            fotoğraf, video, müzik (kullanıcı koyar)  →  planda "src": "medya/salon.jpg"
  seslendirme.mp3   ilan:seslendir üretir                    →  planda "seslendirme.mp3"
  avatar.mp4        ilan:avatar üretir                       →  planda "avatar.mp4"
out/<isim>/final-dikey.mp4                                   ilan:render üretir
```

| Komut | Ne yapar |
|---|---|
| `npm run ilan:yeni -- "<isim>"` | Klasörü açar (metin.md şablonu, örnek plan.json, medya/). Adsız: kurguları listeler |
| `npm run ilan:seslendir -- <isim> --kuru` | Ücretsiz okunuş kontrolü |
| `npm run ilan:seslendir -- <isim>` | ElevenLabs → seslendirme.mp3 + altyazılar plana |
| `npm run ilan:avatar -- <isim>` | HeyGen → avatar.mp4 |
| `npm run ilan:gecis -- <isim>` | Geçiş kontrolü (gecisler.md kuralları; sahne sınırları + kareleri). Ajan: `gecis-editoru` |
| `npm run ilan:render -- <isim> --kare=240` | Tek kare önizleme → out/<isim>/onizleme-240.png |
| `npm run ilan:render -- <isim>` | Son video → out/<isim>/final-dikey.mp4 |

`public/kurgular/*` git'e girmez (kişisel medya). Kurgu adı verilmeyen komutlar eski tek klasör düzenini
(`work/` + `public/assets/`) kullanır. Ortak yol mantığı: `scripts/ilan/lib/kurgu.mjs`.

## Dosyalar

| Yol | Rol |
|---|---|
| `src/ilan/giris.ts` | Remotion giriş noktası (yalnızca IlanReel) |
| `src/ilan/IlanRoot.tsx` | Kompozisyon kaydı; süreyi plandan hesaplar |
| `src/ilan/IlanReel.tsx` | Sahneler, üst bant, başlık kartı, bilgi çubuğu, oda etiketi, altyazı, kapanış, müzik |
| `src/ilan/sema.ts` | Plan şeması (zod) — alan açıklamaları burada |
| `src/ilan/tema.ts` | CB renkleri (#012169), yerel fontlar, güvenli alan sabitleri |
| `public/fonts/` | Poppins + Cormorant Garamond (SIL OFL), internetsiz render |
| `public/marka/` | `cb-parla-logo.png` (tek geçerli logo: CB Parla Gayrimenkul), `portre-kare.png` (yüz ortalı), isteğe bağlı `muzik.mp3` (varsayılan müzik) |
| `library/examples/ilan-plan.example.json` | Örnek plan (medyasız → lacivert yer tutucular) |
| `work/ilan-plan.json` | Bu videonun planı (git'e girmez) |
| `work/metin.md` | Seslendirme metni (git'e girmez) |
| `scripts/ilan/` | `00-yeni.mjs` (kurgu klasörü), `10-seslendir.mjs` (ElevenLabs), `20-avatar.mjs` (HeyGen), `30-render.mjs`, `lib/kurgu.mjs` (yollar), `lib/okunus.mjs` (Türkçe okunuş), testler |
| `library/telaffuz/sozluk.tr.json` | Kalıcı telaffuz düzeltmeleri |
| `library/ilan-ses-ayarlari.json` | Ses ve avatar ayarları |

## Akış

1. Medyayı `public/assets/` içine koy (konuşma klipleri, mülk videoları, fotoğraflar, müzik).
2. `cp library/examples/ilan-plan.example.json work/ilan-plan.json` ve doldur:
   - `ilan`: tür (SATILIK/KİRALIK), emlak tipi, oda, konum, site, isteğe bağlı fiyat
   - `ozellikler`: 3–5 sütun (değer + etiket)
   - `sahneler`: sırayla `konusma` / `mulk-video` / `mulk-foto` / `ara-kart`; `sure` (sn), `baslangic` (videoda kaçıncı sn),
     `hareket` (yakinlas/uzaklas/sola/saga/yok), `odak` (yatay kaynakta neyin görüneceği, 0–1), `etiket` (oda adı),
     `gecis` (sahneye giriş: kesme / yumusak (varsayılan) / kayma / perde / karartma),
     `ara-kart` için `metin` (≤ 7 kelimelik köprü cümlesi) + isteğe bağlı `ust` etiketi.
     **Geçişleri seçmeden önce `gecisler.md`'yi oku**: görsel geçiş, söz geçişinin söylendiği ana denk gelir.
   - `baslik` ve `bilgi`: mutlak saniye aralıkları (başlık ilk ~6 sn, bilgi çubuğu ardından)
   - `altyazi`: kısa satırlar, konuşmayla eşzamanlı (deşifre: `npm run transcribe` veya elle)
   - `muzik`: dosya + seviye; konuşma sahnelerinde otomatik kısılır, son 1 sn söner
   - `danisman`: ad, unvan, telefon, ofis (proje dokümanı `danisman-iletisim-bilgileri.md` ile aynı tut)
3. Kontrol: `npm run ilan:studio` (canlı önizleme) veya `npm run ilan:still -- --frame=<n>`.
   Kareleri güvenli alan çizgileriyle oku (`dikey-format.md`).
4. Render: `npm run ilan:render` → `out/final-dikey.mp4`. `ffprobe` ile 1080×1920, yuv420p, bt709, süre doğrula.
5. Video 90 sn'yi aşarsa WhatsApp için ≤ 90 sn'lik ikinci plan.

## Yerleşim kuralları (kodda sabit)

- Üst bant y 290: solda lacivert SATILIK/KİRALIK etiketi, sağda beyaz rozet içinde çerçeveli CB logosu
  (çerçeveli logo yalnızca açık zeminde — kurumsal kimlik kılavuzu).
- Başlık kartı y ≈ 478–720: "VİLLA 6+2" (Poppins 800), ince beyaz çizgi, konum (Garamond italik), site adı.
- Bilgi çubuğu y ≈ 500: beyaz kart, lacivert değerler, gri etiketler, sütunlar tek tek girer.
- Oda etiketi y 1000 solda; altyazı sol hizalı x 65–840, alt kenar y 1240 (buton sütununa ve açıklamaya girmez).
- Kapanış (son `kapanis.sure` sn): lacivert zemin, logo, dairesel portre, ad + unvan + ofis, "HEMEN ARAYIN" +
  en büyük öğe olarak telefon, Garamond italik slogan. Tüm kapanış y < 1250.
- Konuşma sahnelerinde ses açık, mülk sahnelerinde kapalı (`ses` ile değiştirilebilir).
- Geçişler (Ekim 2026): `kayma` önceki sahneyi 0,4 sn uzatıp üstüne sağdan iter (önceki sahnenin sesi o kuyrukta
  kapanır); `perde` (0,6 sn) ve `karartma` (0,5 sn) sınırın iki yanına yayılan bir örtüdür, kesme örtünün ekranı tam
  kapladığı karede olur. Başlık kartı, bilgi çubuğu, üst bant ve altyazı örtünün üstünde kalır (yazı zıplamaz).
- Ara kart: lacivert zemin, üst etiket (Poppins, geniş aralık), büyüyen ince çizgi, Garamond italik 74 px köprü
  cümlesi; y ≈ 780–1080, x 85–810 (buton sütununa girmez).

## Doğrulandı (ilk kurulum, Ekim 2026)

Test medyasıyla 21 sn'lik tam render: 630/630 kare, 1080×1920, H.264 yuv420p tv-range bt709, AAC 48 kHz.
Kareler güvenli alan çizgileriyle incelendi: kritik öğelerin tamamı içeride. Gerçek çekimle ilk videoda
yatay kaynak kadrajı (`odak`) ve altyazı okunurluğu ayrıca kontrol edilmeli.

## Seslendirme ve avatar (API akışı: ElevenLabs + HeyGen)

Kullanıcı seslendirmeyi ElevenLabs (klon sesi), konuşan kişiyi HeyGen (avatar) ile üretir; ikisi de **API ile**
ve kullanıcının Mac'inde çalışır (anahtarlar `.env`, git'e girmez — `.env.example`'a bak). Bu sohbet ortamı bu
servislere ağ erişimine sahip değildir; betikler yalnız kullanıcının makinesinde gerçek API'ye gider.

| Adım | Komut | Ne yapar |
|---|---|---|
| 1 | `work/metin.md` yaz | Yazılı ilan metni (altyazıda aynen görünür). `#` satırları okunmaz |
| 2 | `npm run ilan:seslendir -- --kuru` | **Ücretsiz kontrol**: okunuş metnini ve altyazı parçalarını gösterir |
| 3 | `npm run ilan:seslendir` | ElevenLabs `with-timestamps` → `public/assets/seslendirme.mp3`; kelime zamanlarından altyazı; `work/ilan-plan.json` içine `seslendirme` + `altyazi` yazar |
| 4 | `npm run ilan:avatar` | Sesi HeyGen'e yükler, 9:16 1080p avatar videosu üretir (dudaklar bu sese senkron) → `public/assets/avatar.mp4` |
| 5 | planda konuşma sahneleri `{"tip":"konusma","src":"assets/avatar.mp4","senkron":true}` | Avatar klibi seslendirme zaman çizelgesinde oynar; sahne sessiz, ses seslendirme kanalından |
| 6 | `npm run ilan:render` | Son video |

- **Telaffuz:** yazılı metin `scripts/ilan/lib/okunus.mjs` ile okunuşa çevrilir (sayılar, `6+2`, `m²`, fiyat, telefon
  grupları, `%`, sıra sayıları, kısaltmalar). Yanlış okunan kelime → `library/telaffuz/sozluk.tr.json` → `kelimeler`.
  Her düzeltme kalıcıdır. Test: `npm run ilan:test`. Web arayüzü için: `npm run ilan:sozluk` → `out/telaffuz-sozlugu.pls`.
- **Ses ayarları** (model, seed, stability, similarity, style, speed) ve HeyGen (oran, çözünürlük, CB lacivert arka
  plan): `library/ilan-ses-ayarlari.json`. Kullanıcı beğendiği ayarı bulduktan sonra değiştirme.
- **Müzik** seslendirme ve konuşma sahnelerinde `konusmadaSes` seviyesine iner.
- **Maliyet:** her `ilan:seslendir` ElevenLabs karakteri, her `ilan:avatar` HeyGen kredisi harcar. Önce `--kuru`,
  avatar'ı yalnız ses onaylandıktan sonra çalıştır. Kullanıcı açıkça istemeden yeniden üretme.
- **Platform etiketi:** avatar/klon ses içeren videoyu yüklerken Instagram/TikTok'ta "AI ile oluşturuldu" etiketini
  hatırlat.
- **Doğrulama (Ekim 2026):** iki betik, resmi dokümanlardaki yanıt biçimlerini taklit eden yerel sahte sunucuyla uçtan
  uca test edildi (`ELEVENLABS_BASE_URL` / `HEYGEN_BASE_URL` ile yönlendirilebilir). Video ortasındaki avatar sahnesi
  doğru kareden oynadı (senkron kontrolü). Gerçek API ile ilk çalıştırmada yanıt alanlarını yine kontrol et.

## Yerleşim ızgarası (Ekim 2026, kullanıcı isteği)

Ekran 4 sütun × 5 satır (hücre 270×384); sol üst **1**, sağ alt **20**, satır satır numaralı. Kullanıcı yerleşimi
bu numaralarla ister ("başlık 5-8'e", "altyazı 13-15 alt"). Alan = tek hücre (`"6"`) ya da iki köşe (`"6-11"`),
isteğe bağlı hiza soneki `üst` / `orta` / `alt`. Kod: `src/ilan/izgara.ts`.
- `yerlesim`: `ustBant`, `baslik`, `bilgi`, `odaEtiketi`, `altyazi` (verilmeyen öğe klasik konumunda kalır)
- `kartlar[].alan`, `sahneler[].alan` (görüntüyü alana sığdırır: bölünmüş ekran / PiP), `sahneler[].etiketAlan`
- `izgaraGoster: true` → numaralı ızgara + güvenli alan dışı kırmızı tarama (yalnız önizleme; teslimde false)
- Altyazı ve oda etiketi, alan buton sütununa (x > 850, y > 960) uzanırsa x 840'ta kesilir.
- `yerlesim.logo`: CB logosu alanın tam ortasında (ör. `"4"`); `ustEtiketOlcek`: SATILIK/KİRALIK boyutu (1.5 = %50 büyük)
- `ustKarartma: false`: üst kenardaki koyu degrade bant kaldırılır (alt degrade kalır)
- `imzaDongu` `{ alan: "20", ad, telefon, bekleme: 5 }`: video boyunca, alanın dikey ortasında sağa yaslı; ad imza gibi
  yazılır, telefon daktilo gibi gelir, birkaç kez hızlı yanıp söner, söner; `bekleme` sn sonra tekrar.

Kullanıcının tercih ettiği yerleşim (Safepark 4+1, Ekim 2026): altyazı `"13-15 alt"` (17'nin üstüne yaslı),
oda etiketi `"13 orta"`, logo `"4"`, `ustEtiketOlcek: 1.5`, `ustKarartma: false`, `imzaDongu` hücre 20.
