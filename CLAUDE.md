# Kahraman MELEK — Sosyal Medya Kurgu Atölyesi (dikey konuşma + emlak ilan videoları, kodla kurgu)

> **VARSAYILAN FORMAT: DİKEY 9:16 (1080×1920).** Kullanıcı şimdilik YouTube için değil; Instagram Reels + Story,
> TikTok ve WhatsApp Durum için video hazırlıyor. Tek bir 1080×1920 master üç platformu da karşılar.
> Platform ölçüleri ve güvenli alanlar: `.claude/skills/video-kurgula/references/dikey-format.md` (her işe başlamadan oku).
> Emlak ilan videosu = `IlanReel` kompozisyonu (`src/ilan/`, rehber: `.claude/skills/video-kurgula/references/ilan-reel.md`).
> Geçişler (seslendirme metni + sahne geçişleri): `.claude/skills/video-kurgula/references/gecisler.md` — metin yazmadan önce oku.
> Metni yazma/gözden geçirme ve sahne geçişlerini atama işi `gecis-editoru` ajanına verilir (`.claude/agents/`); kontrol: `npm run ilan:gecis -- <isim>`.
> Marka ve danışman bilgileri: `marka/MARKA.md` (Poster Asistanı kurallarıyla aynı; telefon her zaman en büyük öğe).
> Yatay 16:9 / YouTube akışı (bölüm listesi, `--youtube` dosyası, `90-shorts`) yalnızca kullanıcı açıkça isterse.

This repo is a **reusable editing workshop**: a Remotion graphics layer + FFmpeg/x265 compositing + sound design,
driven by one data file per video (`work/edit-plan.json`). It becomes the user's own through two files:
`marka/MARKA.md` (brand identity) and the "Ev kuralları" in `.claude/skills/video-kurgula/references/editorial-style.md`
(rules learned from the user's corrections).

## First run

If `marka/MARKA.md` still starts with the `DOLDURULMADI` marker, or `node_modules` is missing, or the user says
"kurulum", "markamı kur", "başlayalım": **invoke the `marka-kimligi` skill first** (machine check + brand interview).

## When the user hands over a video ("bunu kurgula", "yeni video", "kurgula", "devam", revision notes)

**Invoke the `video-kurgula` skill** (`.claude/skills/video-kurgula/`). It holds the workflow, the editorial rules
and the delivery format. Default: finished delivery without approval gates (decide, build, verify, deliver, then
revise), unless `marka/MARKA.md` → "Çalışma tercihleri" says otherwise.

- Chat in the user's language (default **Turkish**). On-screen text in the language set in `MARKA.md`.
- **Every video lives in its own folder** `projects/<slug>/` (user's explicit wish, Oct 2026):
  `girdi/` = raw files the user adds (never modified), `assets/` = prepared media used in the video,
  `work/` = plan, script, transcript, logs, `out/` = deliverables. Root `work`, `out`, `public/assets` are only
  symlinks to the ACTIVE project: `npm run proje` (list) · `npm run proje -- <slug>` (switch / create).
  Never put a project's files directly at the repo root. Never generate music unless asked.
- Resume point of the current video: `work/progress.md` (= `projects/<active>/work/progress.md`).
- Long jobs run detached with logs in `work/logs/`; always give the ETA and a `! tail -f …` command.
- Never modify/delete: `public/main.mov`, anything in `projects/*/girdi/`, other (non-active) projects, delivered files in `out/`.
- You cannot hear audio or see HDR: measure, inspect stills, and say what needs the user's ears/eyes.
- Learning loop: a correction given twice (or "bunu kural yap") → one line in "Ev kuralları". Brand changes →
  `MARKA.md` + `src/theme/theme.ts`.

## Layout

| Path | Role |
|---|---|
| `marka/` | The channel's identity: `MARKA.md`, `style-refs/` (screenshots the user likes). |
| `src/` | Remotion code: `plan/schema.ts` (plan schema), `events/*` (components), `theme/theme.ts` (design tokens). Any change re-renders all segments. |
| `scripts/` | Numbered pipeline (`05` new project → `00` probe → `10` proxy → `20/21` transcript → `30` assets → `40` LUTs → `50` validate → `60` render → `65/66` stills → `70` composite → `75` audio → `80` QC; `90` shorts). |
| `library/` | Reusable across videos: sound selection (effects are synthesised by `scripts/lib/synth.mjs`), optional own SFX, whisper vocabulary, plan example. |
| `projects/<slug>/{girdi,assets,work,out}` | One folder per video (git-ignored). `work`, `out`, `public/assets` at the root are symlinks to the active one (`npm run proje`). |

Checks after code changes: `npx tsc --noEmit && npx eslint src && npm run plan:check`.
