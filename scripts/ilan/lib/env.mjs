// .env dosyasını okur (Node sürümünden bağımsız; --env-file bayrağı eski Node'larda yok).
// Zaten tanımlı ortam değişkenlerinin üzerine yazmaz. Değerler asla ekrana yazılmaz.
import { existsSync, readFileSync } from "node:fs";
import { p } from "./kurgu.mjs";

const dosya = p(".env");
if (existsSync(dosya)) {
  for (const satir of readFileSync(dosya, "utf8").split(/\r?\n/)) {
    const m = satir.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m || satir.trim().startsWith("#")) continue;
    let deger = m[2];
    if (/^(["']).*\1$/.test(deger)) deger = deger.slice(1, -1);
    else deger = deger.replace(/\s+#.*$/, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = deger;
  }
}
