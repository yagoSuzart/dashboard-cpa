#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

const logoB64 = fs.readFileSync('/tmp/logo_pdf_b64.txt', 'utf8').trim();

const CATS = ['Conteúdo das Disciplinas','Infraestrutura e Atendimento','Políticas Acadêmicas','Políticas de Gestão','Docência e Tutoria'];
const curso = {
  nome: 'Administração — EAD',
  respondentes: 312,
  categorias: {
    'Conteúdo das Disciplinas': 4.22,
    'Infraestrutura e Atendimento': 4.24,
    'Políticas Acadêmicas': 4.00,
    'Políticas de Gestão': 3.93,
    'Docência e Tutoria': 4.00,
    'Satisfação Geral': 8.68
  }
};
const comentarios = [
  'O material do curso é muito bom, mas às vezes falta contato mais direto com o tutor.',
  'Gostaria de mais horários de atendimento no laboratório virtual.',
  'A plataforma poderia avisar com mais antecedência sobre provas.'
];

const NAVY = [18,57,94];
const BLUE = [28,109,179];
const GREEN = [47,174,96];
const AMBER = [196,130,25];
const GRAY_TRACK = [230,233,240];
const GRAY_TEXT = [90,90,100];
const INK = [30,20,60];

const doc = new jsPDF();
const margem = 15;
const larguraUtil = 180;
let y;

doc.setFillColor(...NAVY);
doc.rect(0, 0, 210, 8, 'F');

const logoLargura = 40, logoAltura = logoLargura * 0.326625;
doc.addImage(logoB64, 'JPEG', margem, 16, logoLargura, logoAltura);
doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(...INK);
doc.text(curso.nome, margem + logoLargura + 8, 24);
doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...GRAY_TEXT);
doc.text('Relatório CPA — UniFECAF · ' + curso.respondentes + ' aluno(s) responderam · Gerado em ' + new Date().toLocaleDateString('pt-BR'), margem + logoLargura + 8, 30);

y = 46;

doc.setFillColor(233,241,252);
doc.roundedRect(margem, y, larguraUtil, 22, 3, 3, 'F');
doc.setFont('helvetica','bold'); doc.setFontSize(22); doc.setTextColor(...BLUE);
doc.text(curso.categorias['Satisfação Geral'].toFixed(2), margem + 8, y + 15);
doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(...GRAY_TEXT);
doc.text('/ 10 — Satisfação geral dos alunos', margem + 30, y + 15);
y += 34;

doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...INK);
doc.text('Detalhamento por categoria', margem, y); y += 8;

const barX = margem + 62, barW = larguraUtil - 62 - 18;
CATS.forEach(cat=>{
  const val = curso.categorias[cat];
  doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(60,60,70);
  doc.text(cat, margem, y + 3.2);
  doc.setFillColor(...GRAY_TRACK);
  doc.roundedRect(barX, y, barW, 5, 2, 2, 'F');
  const pct = Math.max(0, Math.min(1, val / 5));
  doc.setFillColor(...BLUE);
  doc.roundedRect(barX, y, barW * pct, 5, 2, 2, 'F');
  doc.setFont('helvetica','bold'); doc.setFontSize(9.5); doc.setTextColor(...INK);
  doc.text(val.toFixed(2), barX + barW + 4, y + 4);
  y += 9.5;
});
y += 6;

const ordenadas = CATS.slice().sort((a,b)=>curso.categorias[b]-curso.categorias[a]);
const forte = ordenadas[0], oport = ordenadas[ordenadas.length-1];
const boxW = (larguraUtil - 6) / 2, boxH = 20;

doc.setFillColor(226,246,235);
doc.roundedRect(margem, y, boxW, boxH, 3, 3, 'F');
doc.setFillColor(...GREEN);
doc.circle(margem + 8, y + 10, 3, 'F');
doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...GREEN);
doc.text('PONTO FORTE', margem + 14, y + 7);
doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
doc.text(doc.splitTextToSize(forte + ' (' + curso.categorias[forte].toFixed(2) + ')', boxW - 18), margem + 14, y + 13);

const box2X = margem + boxW + 6;
doc.setFillColor(252,240,222);
doc.roundedRect(box2X, y, boxW, boxH, 3, 3, 'F');
doc.setFillColor(...AMBER);
doc.circle(box2X + 8, y + 10, 3, 'F');
doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(...AMBER);
doc.text('OPORTUNIDADE', box2X + 14, y + 7);
doc.setFont('helvetica','normal'); doc.setFontSize(9.5); doc.setTextColor(...INK);
doc.text(doc.splitTextToSize(oport + ' (' + curso.categorias[oport].toFixed(2) + ')', boxW - 18), box2X + 14, y + 13);

y += boxH + 12;

doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...INK);
doc.text('Comentários de alunos (amostra)', margem, y); y += 8;

comentarios.forEach(texto=>{
  const linhas = doc.splitTextToSize(texto, larguraUtil - 14);
  const alturaCard = linhas.length * 5 + 8;
  doc.setFillColor(247,248,251);
  doc.roundedRect(margem, y, larguraUtil, alturaCard, 2, 2, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(margem, y, 1.5, alturaCard, 'F');
  doc.setFont('helvetica','italic'); doc.setFontSize(9.5); doc.setTextColor(70,70,85);
  doc.text(linhas, margem + 8, y + 6);
  y += alturaCard + 5;
});

doc.setFillColor(...NAVY);
doc.rect(0, 291, 210, 6, 'F');
doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(255,255,255);
doc.text('UniFECAF · Comissão Própria de Avaliação', margem, 295);
doc.text('Página 1 de 1', margem + larguraUtil, 295, { align: 'right' });

doc.save(path.join(__dirname, 'exemplo-relatorio-curso-v2.pdf'));
console.log('PDF gerado em', path.join(__dirname, 'exemplo-relatorio-curso-v2.pdf'));
