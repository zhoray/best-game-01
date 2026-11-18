/**
 * Hand-in builder for Orbwarden (best-game-01).
 * Copies game assets and screenshots, produces dossier.json.
 */

import { cpSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

const OUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? join(process.cwd(), "out");
const SHOTS_FILE = join(process.cwd(), "shots.json");
const GAME_DIR = join(process.cwd(), "game");
const SCREENS_DIR = join(process.cwd(), "screenshots");

interface Shot { name: string; query: string }

// Read and parse shots.json
const shots: Shot[] = JSON.parse(readFileSync(SHOTS_FILE, "utf8"));

// Verify all screenshot files exist
for (const shot of shots) {
  const srcPath = join(SCREENS_DIR, shot.name);
  try { statSync(srcPath); }
  catch {
    process.stderr.write(`Error: missing screenshot "${shot.name}"\n`);
    process.exit(1);
  }
}

// Create output directories
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(join(OUT_DIR, "game"), { recursive: true });
mkdirSync(join(OUT_DIR, "screenshots"), { recursive: true });

// Copy game/ recursively
const copied: { path: string; size: number }[] = [];

function copyDir(src: string, dest: string) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    statSync(s).isDirectory() ? copyDir(s, d) : cpSync(s, d);
  }
}

function collectFiles(dir: string, base: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const rel = join(base, entry);
    statSync(full).isDirectory() ? collectFiles(full, rel) : copied.push({ path: rel.replace(/\\/g, "/"), size: statSync(full).size });
  }
}

copyDir(GAME_DIR, join(OUT_DIR, "game"));
collectFiles(join(OUT_DIR, "game"), "game");

// Copy screenshots and collect info
for (const shot of shots) {
  const src = join(SCREENS_DIR, shot.name);
  const dest = join(OUT_DIR, "screenshots", shot.name);
  cpSync(src, dest);
  copied.push({ path: `screenshots/${shot.name}`, size: statSync(dest).size });
}

// Sort by path
copied.sort((a, b) => a.path.localeCompare(b.path));

// Write dossier.json
const dossier = {
  title: "Orbwarden",
  competition: "best-game-01",
  files: copied,
  screenshots: shots.map(s => s.name),
  timestamp: new Date().toISOString()
};

writeFileSync(join(OUT_DIR, "dossier.json"), JSON.stringify(dossier, null, 2));

process.stdout.write(`Copied ${copied.length} files.\n`);
