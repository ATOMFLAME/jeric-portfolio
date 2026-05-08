import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'temporary screenshots');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const target = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';
const widthArg = parseInt(process.argv[4] || '1440', 10);

let n = 1;
while (true) {
  const candidate = path.join(OUT_DIR, `screenshot-${n}${label}.png`);
  if (!fs.existsSync(candidate)) break;
  n++;
}
const outPath = path.join(OUT_DIR, `screenshot-${n}${label}.png`);

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
  ],
});
const page = await browser.newPage();
await page.setViewport({ width: widthArg, height: 900, deviceScaleFactor: 1 });
await page.goto(target, { waitUntil: 'networkidle0', timeout: 30000 });
// Give the shader a few frames to paint
await new Promise(r => setTimeout(r, 600));
const action = process.argv[5];
if (action === 'open-contact') {
  await page.evaluate(() => {
    const btn = document.querySelector('[data-open-contact]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 350));
  await page.screenshot({ path: outPath, fullPage: false });
} else {
  await page.screenshot({ path: outPath, fullPage: true });
}
await browser.close();
console.log(`saved ${outPath}`);
