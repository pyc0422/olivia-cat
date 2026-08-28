import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standaloneNextDir, "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standaloneDir, "public");

async function copyDirIfExists(source, destination) {
  try {
    const stat = await fs.stat(source);
    if (!stat.isDirectory()) {
      return;
    }
  } catch {
    return;
  }

  await fs.rm(destination, { recursive: true, force: true });
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, { recursive: true });
}

await copyDirIfExists(staticSrc, staticDest);
await copyDirIfExists(publicSrc, publicDest);
