#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { jsPDF } = require('jspdf');

global.LOGO_UNIFECAF_B64 = fs.readFileSync('/tmp/logo_pdf_b64.txt', 'utf8').trim();

// Dados sintéticos só pra exercitar o código real extraído do index.html.
global.CATS = ['Conteúdo das Disciplinas','Infraestrutura e Atendimento','Políticas Acadêmicas','Políticas de Gestão','Docência e Tutoria'];
global.CURSOS = {
  odontologia__presencial: {
    nome: 'Odontologia', modalidade: 'PRESENCIAL',
    categorias: {
      'Conteúdo das Disciplinas': 4.22, 'Infraestrutura e Atendimento': 3.1,
      'Políticas Acadêmicas': 4.0, 'Políticas de Gestão': 3.93, 'Docência e Tutoria': 4.5,
      'Satisfação Geral': 8.1,
    },
  },
};
global.ALUNOS_RESPONDENTES = { odontologia__presencial: 134 };
global.COMENTARIOS = [
  { curso: 'odontologia__presencial', texto: 'Faltam mais horários de atendimento na clínica.' },
  { curso: 'odontologia__presencial', texto: 'Os professores são muito atenciosos, mas a infra é fraca.' },
];
global.SETORES = {
  ti: { nome: 'Tecnologia da Informação', nota: 3.6, perguntas: { 'Suporte técnico é rápido?': 3.2, 'Sistemas funcionam sem erro?': 4.0 } },
};
global.SETOR_COMENTARIOS = [
  { setor: 'ti', texto: 'O sistema cai bastante durante a matrícula.' },
];

function cursoLabel(cid){ return CURSOS[cid].nome + ' (' + CURSOS[cid].modalidade + ')'; }
global.cursoLabel = cursoLabel;

eval(
  fs.readFileSync('/tmp/extracted_helpers_curso.js', 'utf8') +
  '\n' +
  fs.readFileSync('/tmp/extracted_setor.js', 'utf8')
);

const doc1 = new jsPDF();
escreverCursoNoPDF(doc1, 'odontologia__presencial', 20);
pdfRodapeTodasPaginas(doc1);
doc1.save(path.join(__dirname, 'smoke-curso.pdf'));

const doc2 = new jsPDF();
escreverSetorNoPDF(doc2, 'ti', 20);
pdfRodapeTodasPaginas(doc2);
doc2.save(path.join(__dirname, 'smoke-setor.pdf'));

console.log('OK — gerados smoke-curso.pdf e smoke-setor.pdf sem erro de execução.');
