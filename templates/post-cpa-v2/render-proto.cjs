#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'proto.html'));
  await page.waitForFunction(() => window.PRONTO === true, { timeout: 15000 });

  const ids = ['c-capa', 'c-problema', 'c-solucao', 'c-fim'];
  for (const id of ids) {
    const b64 = await page.evaluate((elId) => {
      const canvas = document.getElementById(elId);
      return canvas.toDataURL('image/png').split(',')[1];
    }, id);
    fs.writeFileSync(path.join(__dirname, id + '.png'), Buffer.from(b64, 'base64'));
  }
  await browser.close();
  console.log('OK — 4 PNGs gerados em resolução real (1080x1350).');
}

main().catch((err) => { console.error(err); process.exit(1); });
