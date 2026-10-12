// Okunuş dönüştürücüsünün testleri: node scripts/ilan/okunus-test.mjs
import assert from "node:assert/strict";
import { okunusaCevir, sayiOku, siraOku, seslendirmePlani } from "./lib/okunus.mjs";

const vakalar = [
  [sayiOku(0), "sıfır"], [sayiOku(1000), "bin"], [sayiOku(1250), "bin iki yüz elli"], [sayiOku(2015), "iki bin on beş"],
  [sayiOku(12500000), "on iki milyon beş yüz bin"], [sayiOku(101), "yüz bir"], [sayiOku(1000000), "bir milyon"],
  [siraOku(3), "üçüncü"], [siraOku(21), "yirmi birinci"], [siraOku(10), "onuncu"], [siraOku(21, true), "yirmibirinci"],
  [sayiOku(262, true), "ikiyüzaltmışiki"], [sayiOku(12500000, true), "onikimilyon beşyüzbin"],
  [okunusaCevir("Satılık villa 6+2"), "Satılık villa altı artı iki"],
  [okunusaCevir("309 m² brüt, 262 m2 net"), "üçyüzdokuz metrekare brüt, ikiyüzaltmışiki metrekare net"],
  [okunusaCevir("Gölbaşı / Karşıyaka Mh. - Ankara"), "Gölbaşı, Karşıyaka Mahallesi, Ankara"],
  [okunusaCevir("Fiyat 12.500.000 TL"), "Fiyat onikimilyon beşyüzbin lira"],
  [okunusaCevir("12,5 milyon TL"), "oniki buçuk milyon lira"],
  [okunusaCevir("Hemen arayın: 0542 361 77 91"), "Hemen arayın: sıfır beşyüzkırkiki üçyüzaltmışbir yetmişyedi doksanbir"],
  [okunusaCevir("3. kat, %20 peşin"), "üçüncü kat, yüzde yirmi peşin"],
  [okunusaCevir("Coldwell Banker güvencesiyle"), "Coldwell Banker güvencesiyle"],
  [okunusaCevir("3,5+1 daire, AVM'ye 2 km"), "üç buçuk artı bir daire, aveem'ye iki kilometre"],
];
let ok = 0;
for (const [gercek, beklenen] of vakalar) {
  try { assert.equal(gercek, beklenen); ok++; } catch { console.log(`✗ beklenen: ${beklenen}\n  gelen:    ${gercek}`); }
}
const p = seslendirmePlani("# Başlık\nGölbaşı'nda site içinde 6+2 villa. 309 m² brüt alan, 12.500.000 TL. Karşıyaka Mh. Ankara yolunda. Detaylar için 0542 361 77 91 numarayı arayın.");
for (const x of p.parcalar) assert.equal(p.okunus.slice(x.bas, x.son), x.okunus);
assert.ok(p.parcalar.some((x) => x.yazili.includes("12.500.000 TL")), "fiyat bölünmemeli");
assert.ok(p.parcalar.some((x) => x.yazili.includes("Mh. Ankara")), "kısaltma cümleyi bölmemeli");
console.log(p.parcalar.map((x) => `  [${x.yazili}] → ${x.okunus}`).join("\n"));
console.log(`${ok}/${vakalar.length} vaka geçti; parça konumları tutarlı.`);
if (ok !== vakalar.length) process.exit(1);
