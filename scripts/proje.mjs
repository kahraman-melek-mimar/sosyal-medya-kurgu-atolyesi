// Her video kendi klasöründe: projects/<slug>/{girdi,assets,work,out}. Kökteki work, out ve public/assets
// yalnızca ETKİN projeye bağlanan kısayollardır (symlink, mutlak yol), böylece bütün betikler değişmeden çalışır.
//   npm run proje                       → etkin projeyi ve tüm projeleri listeler
//   npm run proje -- <slug>             → projeye geç (yoksa oluşturur)
//   npm run proje -- <slug> --eski <eski-slug>
//        kökte kısayol değil GERÇEK work/out/public/assets klasörü varsa (eski düzen) önce onları
//        projects/<eski-slug>/ altına TAŞIR (hiçbir şey silinmez), sonra <slug>'a geçer.
//   girdi/  : kullanıcının eklediği ham dosyalar — hiçbir betik değiştirmez
//   assets/ : videoda kullanılan hazırlanmış medya (Remotion bunları public/assets/ olarak görür)
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, renameSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { p } from "./lib/paths.mjs";

const args = process.argv.slice(2);
const val = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : undefined; };
const slug = args.find((a, i) => !a.startsWith("--") && args[i - 1] !== "--eski");
const eski = val("eski");
const BAG = { work: "work", out: "out", "public/assets": "assets" }; // kök kısayol → proje alt klasörü
const ok = (s) => /^[a-z0-9][a-z0-9-]*$/.test(s ?? "");

const hedefi = (kisayol) => { try { return lstatSync(p(kisayol)).isSymbolicLink() ? readlinkSync(p(kisayol)) : null; } catch { return undefined; } };
const etkin = () => { const h = hedefi("work"); return h ? path.basename(path.dirname(h)) : null; };

if (!slug) {
  const e = etkin();
  console.log(`Etkin proje: ${e ?? "(yok — kökte eski düzen ya da hiç proje yok)"}`);
  for (const d of existsSync(p("projects")) ? readdirSync(p("projects")).filter((n) => !n.startsWith(".")) : []) console.log(`${d === e ? "▶" : " "} projects/${d}`);
  process.exit(0);
}
if (!ok(slug)) throw new Error("Proje adı küçük harf, rakam ve tire olmalı (örn. safepark-4-1).");

// eski düzen: kökte gerçek klasörler → arşive taşı
const gercek = Object.keys(BAG).filter((k) => hedefi(k) === null);
if (gercek.length) {
  if (!ok(eski)) throw new Error(`Kökte kısayol olmayan klasör(ler) var: ${gercek.join(", ")}. Hangi projeye ait olduklarını --eski <slug> ile söyleyin; oraya taşınırlar.`);
  for (const k of gercek) {
    const kaynak = p(k);
    const hedef = p("projects", eski, BAG[k]);
    mkdirSync(hedef, { recursive: true });
    for (const ad of readdirSync(kaynak)) {
      if (ad === ".DS_Store" || ad === ".gitkeep") continue;
      if (existsSync(path.join(hedef, ad))) throw new Error(`Çakışma: projects/${eski}/${BAG[k]}/${ad} zaten var. Hiçbir şey taşınmadı.`);
    }
  }
  for (const k of gercek) {
    const kaynak = p(k);
    const hedef = p("projects", eski, BAG[k]);
    for (const ad of readdirSync(kaynak)) {
      if (ad === ".DS_Store" || ad === ".gitkeep") continue;
      renameSync(path.join(kaynak, ad), path.join(hedef, ad));
      console.log(`taşındı  ${k}/${ad}  →  projects/${eski}/${BAG[k]}/${ad}`);
    }
    const kalan = readdirSync(kaynak).filter((n) => n !== ".DS_Store" && n !== ".gitkeep");
    if (kalan.length) throw new Error(`${k} boşaltılamadı: ${kalan.join(", ")}`);
    // klasörde yalnızca .DS_Store/.gitkeep kaldı; onlar kalkar, boş klasör kısayola yer açar
    for (const ad of readdirSync(kaynak)) unlinkSync(path.join(kaynak, ad));
    rmdirSync(kaynak);
  }
}

const kok = p("projects", slug);
const yeni = !existsSync(kok);
for (const d of ["girdi", "assets", "work/logs", "out"]) mkdirSync(path.join(kok, d), { recursive: true });
// eski 16:9 hattı (src/Root.tsx) work/edit-plan.json'u derleme anında içe aktarır → her projede bir örnek plan bulunsun
if (!existsSync(path.join(kok, "work/edit-plan.json"))) copyFileSync(p("library/examples/edit-plan.example.json"), path.join(kok, "work/edit-plan.json"));
if (!existsSync(path.join(kok, "work/project.json"))) writeFileSync(path.join(kok, "work/project.json"), JSON.stringify({ slug, createdAt: new Date().toISOString() }, null, 2) + "\n");

for (const [k, alt] of Object.entries(BAG)) {
  if (hedefi(k)) unlinkSync(p(k)); // yalnızca kısayol kaldırılır, hedefindeki dosyalar yerinde kalır
  mkdirSync(path.dirname(p(k)), { recursive: true });
  symlinkSync(path.join(kok, alt), p(k));
}
console.log(`${yeni ? "Yeni proje oluşturuldu" : "Projeye geçildi"}: projects/${slug}/\n  girdi/  ham dosyalarınız\n  assets/ videoda kullanılan medya\n  work/   plan, metin, döküm, loglar\n  out/    teslim dosyaları`);
