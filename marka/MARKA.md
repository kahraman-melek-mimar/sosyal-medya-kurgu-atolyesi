# Marka kimliği

> Bu dosya kanalın kurgu kimliği. Claude her videoya başlamadan önce bunu okur.
> Ekim 2026'da Poster Asistanı projesinin kurallarından (`danisman-iletisim-bilgileri.md`,
> `poster-tasarim-standardi.md`) ve Coldwell Banker Kurumsal Kimlik Kılavuzu'ndan (Ekim 2019) dolduruldu.
> "(belirtilmedi)" yazan yerleri kullanıcı söyledikçe doldur. Dikey video temasının kodu: `src/ilan/tema.ts`
> (eski 16:9 hattı `src/theme/theme.ts` kullanır).

## 1. Kanal

- **Kanal adı / handle:** Kahraman Melek — Coldwell Banker Parla Gayrimenkul (sosyal medya kullanıcı adı: belirtilmedi)
- **Konu:** Gayrimenkul — satılık/kiralık ilan tanıtımları, danışman videoları (avatar dahil), kısa duyurular
- **İzleyici:** (belirtilmedi)
- **Videonun dili / ekran yazılarının dili:** Türkçe
- **Kanalın tek cümlelik vaadi:** "Doğru yatırım, doğru danışmanla mümkün." (kapanış sloganı)

## 2. Marka fikri (grafiklerin hissi, tek cümle)

> Kurumsal, güven veren, sade lüks: Coldwell Banker lacivert–beyaz kimliği, mülkün gerçek görüntüsü her zaman ana resim.

## 3. Görsel kimlik

| Token | Değer | Not |
|---|---|---|
| Zemin (panel/pano) | CB Mavisi `#012169` (PMS 280 C), koyu ton `#000F33` | Kurumsal kılavuz değeri. Poster belgelerindeki `#00205B` aynı rengin yaklaşık değeri; videoda `#012169` kullanılır |
| Metin | Beyaz `#FFFFFF`; açık zeminde lacivert / koyu `#14171F` | |
| **Vurgu rengi (tek)** | Beyaz kart üzerinde lacivert (telefon, fiyat, bilgi çubuğu değerleri) | İkincil Celestial `#418FDE` yalnızca ince çizgi/nokta; yeşil nokta yalnızca "HEMEN ARAYIN" |
| Negatif / yanlış | (kullanılmıyor) | |
| Başlık fontu | Poppins 700–800 | Geometos Neue / Helvetica Neue'ye en yakın erişilebilir alternatif (poster standardıyla aynı) |
| Metin fontu | Poppins 500–600; vurgu: Cormorant Garamond italik | Garamond = Adobe Garamond Pro'nun açık alternatifi |
| Etiket fontu (mono) | yok — etiketler Poppins, büyük harf, geniş harf aralığı | |
| Köşe yuvarlaklığı | hafif (10–24 px) | |
| Logo | `public/marka/cb-logo-cerceveli.png` | Çerçeveli logo yalnızca açık zeminde → beyaz rozet içinde |
| Portre | `public/marka/portre.png` | Kapanışta dairesel, beyaz halkalı |

## 4. Hareket ve tempo

- **Tempo:** dengeli — dikeyde her 1–2 sn bir değişiklik, ekranda tek mesaj
- **Giriş hissi:** sakin kayma (yumuşak eğri), sert pop yok
- **Zoom / punch-in:** ara sıra; fotoğrafta yavaş kamera hareketi, videoda hafif punch-in (mimariyi bozmadan)
- **Geçişler:** anlam taşır, süs değildir — `.claude/skills/video-kurgula/references/gecisler.md`
- **Asla:** parlama, parçacık, zıplama, sallanma; mülkte olmayan bir şeyi gösteren görüntü; abartılı HDR

## 5. Ses

- **Efekt yoğunluğu:** hafif (belirtilmedi — varsayılan)
- **Efekt karakteri:** (belirtilmedi)
- **Müzik:** her videoda kendim veririm (kurgu klasöründe `medya/`)
- **Müzik seviyesi:** kısık; konuşma/seslendirme sırasında otomatik daha da kısılır
- **Seslendirme:** ElevenLabs klon sesi; telaffuz düzeltmeleri `library/telaffuz/sozluk.tr.json`

## 6. Açılış ve kapanış

- **Hook tarzı:** ilk 1–1,5 sn'de en güçlü özelliği ima eden cümle + dış cephe + başlık kartı ("VİLLA 6+2", konum)
- **Takip kartı:** yok — dikeyde "ara" çağrısı kapanış kartında
- **Kapanış kartı:** lacivert zemin, CB logo rozeti, dairesel portre, **Kahraman Melek**, "GAYRİMENKUL DANIŞMANI ·
  PARLA GAYRİMENKUL", "HEMEN ARAYIN" + **0542 361 77 91** (kartın en büyük ve en belirgin öğesi — kullanıcının özel
  talebi), Garamond italik slogan
- **Bölüm etiketi stili:** yok (dikey); mülk sahnelerinde oda etiketi, bölüm arasında `ara-kart`

## 7. Çalışma tercihleri

- **Onay:** (belirtilmedi — varsayılan: onay sormadan bitir, sonra revize ederim). Ücretli API (ElevenLabs, HeyGen)
  yalnızca kullanıcı açıkça isteyince ve önce `--kuru` kontrolüyle
- **Altyazı:** gömülü (IlanReel), kısa satırlar
- **Format:** **Dikey 9:16, 1080×1920** (Instagram Reels + Story, TikTok, WhatsApp Durum) — varsayılan. Yatay/YouTube şimdilik yok.
- **Teslim:** tek MP4 (H.264, SDR Rec.709, 30 fps, AAC) — üç platforma aynı dosya yüklenir; > 90 sn ise WhatsApp için ayrı kısa kesim
- **Danışman bilgileri** (sorulmadan kullanılır, kullanıcı güncellemedikçe değişmez): Kahraman Melek ·
  Gayrimenkul Danışmanı · 0542 361 77 91 · Parla Gayrimenkul (Coldwell Banker). E-posta gösterilmez.
- **Mülk fotoğrafları:** üçüncü taraf filigranlı veya düşük çözünürlüklü görsel gelirse kullanmadan önce uyar ve onay al
- **AI etiketi:** avatar/klon ses içeren videolarda yüklerken "AI ile oluşturuldu" etiketini hatırlat

## 8. Sevdiğim / sevmediğim (referanslar)

- Sevdiğim kurgular (link + neyi sevdiğim): → kareleri `marka/style-refs/` içine koy
- Asla istemediğim şeyler: (belirtilmedi)
