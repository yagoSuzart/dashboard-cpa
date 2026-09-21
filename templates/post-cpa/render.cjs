#!/usr/bin/env node
/**
 * Gera a imagem final (PNG, 1080x1350) da peça de resultado da CPA a partir
 * do template.html, injetando os dados de um curso específico.
 *
 * Uso:
 *   node render.js dados-curso.json [saida.png]
 *
 * Formato de dados-curso.json:
 * {
 *   "curso": "Odontologia",
 *   "coordenador": "Nome do(a) Coordenador(a)",
 *   "ident1": "...", "ident2": "...", "ident3": "...",
 *   "acao1": "...", "acao2": "...", "acao3": "..."
 * }
 */
const path = require('path');
const fs = require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

async function main() {
  const [, , dataPath, outPathArg] = process.argv;
  if (!dataPath) {
    console.error('Uso: node render.js dados-curso.json [saida.png]');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const outPath = outPathArg || path.join(
    path.dirname(dataPath),
    (data.curso || 'peca-cpa').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png'
  );

  const templateUrl = 'file://' + path.join(__dirname, 'template.html');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(templateUrl);
  await page.evaluate((d) => window.applyCpaData(d), data);
  await page.waitForTimeout(150); // garante fontes/imagens aplicadas
  await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1080, height: 1350 } });
  await browser.close();

  console.log('Imagem gerada em:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
