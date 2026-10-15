# Geçişler — dikey videoyu tek parça bir hikâyeye bağlamak

Kaynak fikir: Amanda Mascarelli, "Good Transitions: A Guide to Cementing Stories Together", The Open Notebook
(25 Eylül 2018) — https://www.theopennotebook.com/2018/09/25/good-transitions-a-guide-to-cementing-stories-together/
Makale yazılı haber metni içindir; aşağıdaki kurallar onun fikirlerinin bu atölyeye (dikey emlak videosu,
seslendirme + avatar + mülk görüntüsü) uyarlanmış hâlidir. Örnek cümleler bu atölyeye aittir.

**Neden önemli:** Makaledeki benzetmeyle geçişler köprü taşlarını birbirine bağlayan harçtır. Harç gelişigüzel
dökülürse ortaya köprü değil, birbirine yapışmış taş yığını çıkar. Dikey videoda bunun karşılığı kaydırma
parmağıdır: iki sahne arasındaki her kopukluk izleyiciye "geç" demesi için bir fırsattır.
Her geçiş tek bir soruya cevap verir: **"İzleyici şu an kopuyor mu?"**

Bu dosya iki katmanı birlikte yönetir:
1. **Söz geçişleri** — `metin.md` (seslendirme) ve altyazı. Makalenin asıl konusu.
2. **Görsel geçişler** — `plan.json` → sahnelerin `gecis` alanı ve `ara-kart` sahneleri.
İkisi aynı yerde aynı işi yapmalı: sözde bölüm değişiyorsa görüntüde de değişir; sözde akış sürüyorsa görüntü
sert bir efektle bölünmez.

---

## 1. Söz geçişleri (metin.md)

### 1a. Baştan-sona bağ (head-to-tail)
Bir cümlenin **son kavramı** bir sonraki cümlenin **başında** yeniden geçer — aynı kelimeyle, eş anlamlısıyla ya da
ona gönderme yapan bir ifadeyle. İzleyici zinciri kaybetmeden bir halka ileri gider.

- "Salon tüm gün güney ışığı alıyor. **O ışık** bahçeye açılan cam kapıdan içeri doluyor."
- "Site içinde, güvenlikli. **Güvenlik** kadar önemli bir şey daha var: okula beş dakika."

Kural: **video başına en fazla 2–3 kez.** Fazlası kalıp gibi duyulur ve tempoyu düşürür. En çok, izleyicinin
kaybolabileceği yerlerde işe yarar: teknik bilgi (m², kat, tapu durumu) ile duygusal anlatı arasında geçerken.

### 1b. Kontrast dönüşü ("Ama…")
Bilineni ya da beklenen şeyi söyle, sonra çevir. Yön değiştirmenin en kısa yolu; kısa videolar için ideal.

- "Şehir merkezine on dakika. **Ama** gürültüden çok uzak."
- "Çoğu villada bahçe ön cephede kalır. **Bu evde** bahçe tamamen size ait, arka tarafta."

Kural: dönüşten sonra gelen şey **gerçekten gösterilmeli** (bkz. 2. bölüm, "söz–görüntü eşleşmesi").

### 1c. "Ama durun" — keşif geçişi
Makalede bilim haberleri için anlatılan kalıp: önce genel bilgi, sonra "ama yeni bulgu bunu değiştiriyor".
Emlakta karşılığı: önce standart bilgi, sonra mülkü farklı kılan şey.

- "6+2, dört banyo, kapalı otopark — buraya kadar tanıdık. **Asıl fark en üst katta.**"

### 1d. Fırlatma rampası (yeni bölüme somut ayrıntıyla gir)
Yeni bir bölüm (kat, mekân, zaman) **somut bir ayrıntıyla** açılır: saat, yer, oda adı, bir nesne. İzleyici yeni
sahneye anında yerleşir ve neden orada olduğunu sezer.

- "**Sabah sekiz, mutfak.** Güneş tezgâhın tam üstünde."
- "**Zemin kat:** salon, mutfak ve misafir odası."
- "**Akşam, bahçe.** Şömine dışarıdan da görünüyor."

Kural: rampa cümlesi, görüntünün o mekâna kestiği an söylenir (±0.3 sn).

### 1e. Merak tohumu (bir sonraki bölümü çektiren son cümle)
Makalede Asimov'un her bölüm sonuna bir "tohum" bırakması anlatılır: okur "bir bölüm daha" der. Videoda bu, bir
bölümün son cümlesinin bir sonrakini **ima etmesidir**, sürprizi söylemeden.

- "Ve bu evin en güzel odası henüz görmediğiniz oda."
- "Fiyat mı? Videonun sonunda."  ← yalnız sonda gerçekten veriliyorsa

Kural: tohum sözü tutulmalı. Gösterilmeyen bir şeyi vaat etme (bkz. editorial-style.md, ilke 9).

### 1f. Tek kelimelik işaretler
"Ve", "Ama", "Üstelik", "Peki", "Sonuç?" — cümleleri basitçe dikişler. Kullan ama art arda iki cümlede aynısını
kullanma ("Ayrıca… Ayrıca…" yasak).

### Kaçınılacaklar
- **Kalıp ve küçümseyici geçişler:** "Şimdi size … göstereceğim", "Gelelim … konusuna", "Bir de şuna bakalım".
- **Sürprizi baştan vermek:** en güçlü özellik ilk cümlede tüketilmez; hook'ta ima edilir, sonra gösterilir.
- **Tekrar:** geçiş cümlesi önceki cümleyi yeniden söylememeli, onu bir adım ileri taşımalı.
- **Sadece iki cümleye bakmak:** geçişi yazmadan önce tüm videonun yolunu bil. Makaledeki uyarı: harcı yalnızca
  komşu iki taşa bakarak dökersen nehri geçen bir köprü değil, taş yığını kurarsın.

---

## 2. Görsel geçişler (plan.json)

Her sahnenin `gecis` alanı, **o sahneye nasıl girildiğini** belirler (ilk sahnede yok sayılır).
Geçiş tipi bir anlam taşır; süs değildir.

| `gecis` | Görünüm | Anlamı / ne zaman |
|---|---|---|
| `kesme` | Sert kesme | Aynı bölüm içinde, aynı düşünce sürüyor. Ritim için. Oda adı söylendiği an o odaya kes. |
| `yumusak` | Kısa opaklık girişi (varsayılan, eski davranış) | Aynı bölüm, sakin anlatım. |
| `kayma` | Yeni sahne sağdan iterek gelir (≈0.4 sn) | Mekân değişiyor ama düşünce sürüyor: "baştan-sona bağ"ın görsel karşılığı (salon → bahçe). |
| `perde` | CB mavisi dikey perde soldan sağa geçer, arkasında yeni sahne (≈0.6 sn) | **Bölüm değişimi**: konuşma → mülk turu, dış → iç, zemin kat → üst kat. Makaledeki "bölüm arası": okumayı bilerek bir an yavaşlatan hız kesici. |
| `karartma` | Lacivertten geçiş (≈0.5 sn) | Zaman/ton değişimi: gündüz → akşam, ilan → danışman/avatar. "Kontrast dönüşü"nün görsel karşılığı. |

**`ara-kart` sahnesi** (`"tip": "ara-kart"`): lacivert zeminde kısa bir köprü cümlesi (≤ 7 kelime) ve isteğe bağlı
küçük üst etiket. Makaledeki bölüm arası + fırlatma rampasının birleşimi: tempoyu bir an keser, sonra yeni bölümü
somut bir ayrıntıyla başlatır. Süre 1.2–2 sn.

```json
{ "tip": "ara-kart", "sure": 1.6, "ust": "ÜST KAT", "metin": "Asıl sürpriz burada.", "gecis": "perde" }
```

### Kurallar
- **Söz–görüntü eşleşmesi:** görsel geçiş, onu taşıyan söz geçişinin söylendiği ana denk gelir (±0.3 sn).
  "Ama…" kelimesinin üstüne `karartma`, "Zemin kat:" rampasının üstüne `perde`.
- **Ölçü:** 30 sn'de en fazla 2 `perde`/`karartma` ve en fazla 1 `ara-kart`. Gerisi `kesme`/`yumusak`/`kayma`.
  Her geçiş efekt olursa hiçbiri anlam taşımaz.
- **Yazılar geçişte zıplamaz:** başlık kartı, bilgi çubuğu ve altyazı bir geçişin tam ortasında girmez/çıkmaz;
  geçiş bittikten ≥ 0.2 sn sonra gelir.
- **Kapanışa geçiş:** son sahnenin son cümlesi kapanışı çağırır ("Detaylar ve randevu için…"); kapanış kartı zaten
  lacivert zeminle açılır, ekstra efekt gerekmez.

---

## 3. Video türüne göre iskeletler

### İlan tanıtımı (IlanReel, 25–45 sn)
| Bölüm | Söz | Görsel |
|---|---|---|
| Hook 0–1.5 sn | İma: "Gölbaşı'nda, bahçesi size ait bir villa." | Dış cephe, başlık kartı |
| Temel bilgi | m², oda, kat — kısa, sayılarla | `kesme` ile 2–3 mülk sahnesi, bilgi çubuğu |
| Dönüş | 1b veya 1c: "Buraya kadar tanıdık. Asıl fark…" | `karartma` veya `ara-kart` |
| Tur | 1d rampalarıyla oda oda; 1–2 kez 1a bağı | `kayma` (mekân), `kesme` (aynı kat) |
| Tohum + kapanış | 1e ya da çağrı: "Randevu için…" | Kapanış kartı |

### Avatar videoları (HeyGen + ElevenLabs, 30–60 sn)
- Avatar ekranda konuşurken geçişleri **söz taşır**: 1a ve 1f ağırlıklı. Görüntü `kesme` ile avatar ↔ mülk
  arasında gidip gelir; avatar her dönüşünde yeni bir bilgiyle döner, tekrar etmez.
- Konuşma bölümleri arasında büyük konu değişimi varsa (ör. ilan → piyasa yorumu) `karartma`.
- Avatar cümlesi biterken bir sonraki mülk sahnesini çağırır: "…ve bunu en iyi mutfak anlatıyor." → mutfağa kes.

### Kısa duyuru / Story (≤ 15 sn)
- **En fazla bir geçiş anı.** Tek bir 1b kontrastı ya da tek bir 1e tohumu.
- Hook ilk saniyede; bölüm arası yok, `perde`/`ara-kart` kullanılmaz (çok kısa).
- Son 2–3 sn: çağrı + telefon (kapanış kartı ya da kısaltılmış `kapanis.sure`).

---

## 4. Kontrol listesi (metin ve plan bittiğinde)

Ölçülebilen kısım otomatik: `npm run ilan:gecis -- <isim>` (ölçü, ±0.3 sn eşleşme, örtüdeki yazılar, ara kart
uzunluğu, kalıp geçişler, art arda aynı işaret). Bu listeyi uçtan uca `gecis-editoru` ajanı uygular
(`.claude/agents/gecis-editoru.md`).


- [ ] `metin.md`'yi baştan sona sesli oku: hangi cümlede "neden devam edeyim?" sorusu cevapsız kalıyor?
- [ ] Bölüm sınırları belli mi? Her bölüm rampa cümlesiyle (1d) açılıyor mu?
- [ ] Baştan-sona bağ ≤ 3, aynı işaret kelimesi art arda yok.
- [ ] Sürpriz/en güçlü özellik ilk cümlede tüketilmemiş; tohum verdiysen sözü tutulmuş.
- [ ] Her `perde`/`karartma`/`ara-kart` bir söz geçişine denk geliyor; 30 sn'de ölçü aşılmamış.
- [ ] Geçiş anlarında yazı girip çıkmıyor (still ile kontrol: `npm run ilan:render -- <isim> --kare=<n>`).
- [ ] Altyazı geçiş cümlesini bölmüyor ("Ama" bir satırda, devamı öbüründe kalmasın).
