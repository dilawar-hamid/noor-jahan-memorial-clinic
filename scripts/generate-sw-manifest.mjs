import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";

const root = path.resolve("dist");
const base = "/noor-jahan-memorial-clinic/";
const excluded = new Set(["sw.js", "precache-manifest.json", "404.html"]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

const files = await walk(root);
const assets = [];
for (const file of files) {
  const relative = path.relative(root, file).split(path.sep).join("/");
  if (excluded.has(relative) || relative === "index.html") continue;
  assets.push(relative);
}
assets.sort();
const content = JSON.stringify({ base, generatedAt: new Date().toISOString(), assets });
const revision = createHash("sha256").update(content).digest("hex").slice(0, 16);
await writeFile(path.join(root, "precache-manifest.json"), JSON.stringify({ revision, assets }, null, 2));
const workerPath = path.join(root, "sw.js");
const worker = await readFile(workerPath, "utf8");
const versionedWorker = worker.replace(/const CACHE_NAME = "noor-jahan-clinic-shell-v1";/, `const CACHE_NAME = "noor-jahan-clinic-shell-${revision}";`);
await writeFile(workerPath, versionedWorker);
console.log(`Generated offline precache manifest (${assets.length} assets, ${revision}).`);
