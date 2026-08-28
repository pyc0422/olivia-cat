import fs from "node:fs/promises";
import path from "node:path";
import Script from "next/script";
import { allowedMembers } from "../lib/allowed-members";

const scriptFiles = ["script.js", "video.js", "art.js", "levels.js"];

function extractBody(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1] : html;
}

function stripExternalScripts(content) {
  return content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

async function readInlineScript(fileName) {
  const filePath = path.join(process.cwd(), fileName);
  return fs.readFile(filePath, "utf8");
}

export default async function HomePage() {
  const html = await fs.readFile(path.join(process.cwd(), "index.html"), "utf8");
  const body = stripExternalScripts(extractBody(html));
  const scripts = await Promise.all(scriptFiles.map(readInlineScript));

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <div id="catclub-config" hidden data-allowed-members={JSON.stringify(allowedMembers)} />
      {scripts.map((code, index) => (
        <Script
          key={scriptFiles[index]}
          id={`catclub-${scriptFiles[index]}`}
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      ))}
    </>
  );
}
