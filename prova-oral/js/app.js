(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Configuração: ajuste aqui sem mexer no resto do código.
  // codigoTurma: código pedido na entrada. Deixe '' para não pedir código.
  // ---------------------------------------------------------------------------
  var CONFIG = {
    codigoTurma: 'ODONTO26',
    tempoSugeridoSeg: 120,
    questoesSimuladoGeral: 10,
    tentativasPorQuestao: 3
  };

  var MODULOS = window.MODULOS || [];
  var CASOS = window.CASOS || {};
  var PERGUNTAS = window.PERGUNTAS || {};
  MODULOS.forEach(function (m) { m.casos = CASOS[m.id] || []; m.pr = PERGUNTAS[m.id] || []; });
  var CHAVE = 'orallab:v1';
  var LETRAS = ['A', 'B', 'C', 'D', 'E'];

  var topo = document.getElementById('topo');
  var principal = document.getElementById('principal');

  // ---------------------------------------------------------------------------
  // Progresso salvo no navegador
  // ---------------------------------------------------------------------------
  function estadoVazio() {
    return { nome: '', turma: '', estudados: {}, questoes: {}, oral: {} };
  }

  function lerEstado() {
    try {
      var bruto = localStorage.getItem(CHAVE);
      if (!bruto) return estadoVazio();
      var dados = JSON.parse(bruto);
      return Object.assign(estadoVazio(), dados);
    } catch (e) {
      return estadoVazio();
    }
  }

  var estado = lerEstado();

  function salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* navegador sem armazenamento */ }
  }

  // ---------------------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------------------
  function esc(texto) {
    return String(texto == null ? '' : texto)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalizar(texto) {
    return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }

  function contarPalavras(texto) {
    var t = String(texto || '').trim();
    return t ? t.split(/\s+/).length : 0;
  }

  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function modulo(id) {
    for (var i = 0; i < MODULOS.length; i++) if (MODULOS[i].id === id) return MODULOS[i];
    return null;
  }

  function iniciais(nome) {
    var partes = String(nome || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    var s = partes[0][0] + (partes.length > 1 ? partes[partes.length - 1][0] : '');
    return s.toUpperCase();
  }

  function mmss(seg) {
    var s = Math.abs(seg);
    var m = Math.floor(s / 60);
    var r = s % 60;
    return (seg < 0 ? '-' : '') + String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0');
  }

  function porcento(a, b) { return b ? Math.round((a / b) * 100) : 0; }

  var DENTE = 'M20 10C30 0 40 8 50 6C60 8 70 0 80 10C92 22 92 46 84 58C80 66 78 80 74 100C72 112 64 114 62 102L56 74C54 68 46 68 44 74L38 102C36 114 28 112 26 100C22 80 20 66 16 58C8 46 8 22 20 10Z';

  var ICONE = {
    livro: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/></svg>',
    check: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/></svg>',
    fala: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8 11h8M8 14h5"/></svg>',
    grafico: '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    lampada: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
    alerta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/></svg>',
    certo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>',
    errado: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    relogio: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    pessoa: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>'
  };

  // ---------------------------------------------------------------------------
  // Contagens de progresso
  // ---------------------------------------------------------------------------
  function chaveQ(mid, qi) { return mid + ':' + qi; }
  function chaveO(mid, ci, pi) { return 'paciente:' + mid + ':' + ci + ':' + pi; }

  function totalPerguntasOrais(m) {
    return m.casos.reduce(function (s, c) { return s + c.perguntas.length; }, 0);
  }

  function progressoModulo(m) {
    var qFeitas = 0, qCertas = 0, oFeitas = 0, oPontos = 0, oTotal = 0;
    m.questoes.forEach(function (_, qi) {
      var r = estado.questoes[chaveQ(m.id, qi)];
      if (r) { qFeitas++; if (r.primeira) qCertas++; }
    });
    m.casos.forEach(function (c, ci) {
      c.perguntas.forEach(function (p, pi) {
        var r = estado.oral[chaveO(m.id, ci, pi)];
        if (r) { oFeitas++; oPontos += r.melhor; oTotal += r.total; }
      });
    });
    var nOral = totalPerguntasOrais(m);
    var estudado = estado.estudados[m.id] ? 1 : 0;
    var geral = Math.round(((estudado + qFeitas / m.questoes.length + (nOral ? oFeitas / nOral : 0)) / 3) * 100);
    return { estudado: !!estudado, qFeitas: qFeitas, qCertas: qCertas, qTotal: m.questoes.length, oFeitas: oFeitas, oTotal: nOral, oPontos: oPontos, oPossiveis: oTotal, geral: geral };
  }

  // ---------------------------------------------------------------------------
  // Cabeçalho
  // ---------------------------------------------------------------------------
  var ICONE_MENU = {
    inicio: '<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    conteudos: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 8h6M9 12h4"/>',
    perguntas: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17h.01"/>',
    simulado: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 12 3 3 5-6"/>',
    oral: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M8 11h8M8 14h5"/>'
  };

  function desenharBarraInferior(secao) {
    var barra = document.getElementById('barra-inferior');
    if (!barra) return;
    if (!estado.nome) { barra.hidden = true; barra.innerHTML = ''; return; }
    var itens = [['inicio', 'Início'], ['conteudos', 'Temas'], ['perguntas', 'Perguntas'], ['simulado', 'Simulado'], ['oral', 'Prova oral']];
    barra.hidden = false;
    barra.innerHTML = itens.map(function (it) {
      var atual = secao === it[0] || (it[0] === 'inicio' && secao === 'desempenho');
      return '<a href="#/' + it[0] + '"' + (atual ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONE_MENU[it[0]] + '</svg><span>' + it[1] + '</span></a>';
    }).join('');
  }

  function desenharTopo(rota) {
    desenharBarraInferior(rota[0] === 'modulo' ? 'conteudos' : rota[0]);
    if (!estado.nome) { topo.innerHTML = marcaHTML(); return; }
    var itens = [
      ['inicio', 'Início'], ['conteudos', 'Conteúdos'], ['perguntas', 'Perguntas'], ['simulado', 'Simulados'], ['oral', 'Prova Oral'], ['desempenho', 'Desempenho']
    ];
    var secao = rota[0] === 'modulo' ? 'conteudos' : rota[0];
    topo.innerHTML = marcaHTML() +
      '<nav class="menu" aria-label="Principal">' + itens.map(function (it) {
        return '<a href="#/' + it[0] + '"' + (secao === it[0] ? ' aria-current="page"' : '') + '>' + it[1] + '</a>';
      }).join('') + '</nav>' +
      '<div class="usuario vidro"><a class="avatar" href="#/desempenho" aria-label="Meu desempenho" title="Meu desempenho">' + esc(iniciais(estado.nome)) + '</a><span class="usuario-nome">' + esc(estado.nome) + '</span>' +
      '<button class="btn-texto" type="button" data-acao="trocar-nome" style="min-height:44px">Trocar</button></div>';
  }

  function marcaHTML() {
    return '<a class="marca" href="#/inicio"><span class="marca-icone vidro"><svg viewBox="0 0 100 120" aria-hidden="true"><path d="' + DENTE + '"/></svg></span>' +
      '<span><span class="marca-nome">OralLab</span><span class="marca-sub">Odontologia · Prova Oral</span></span></a>';
  }

  // ---------------------------------------------------------------------------
  // Tela de entrada (sem login)
  // ---------------------------------------------------------------------------
  function telaEntrada() {
    var pedeCodigo = !!CONFIG.codigoTurma;
    principal.innerHTML =
      '<section class="entrada">' +
        '<div class="entrada-texto">' +
          '<span class="selo" style="align-self:flex-start">Preparação para a banca</span>' +
          '<h1>Treine como se estivesse diante da banca.</h1>' +
          '<p>Resumos das aulas de DTM, Dor Orofacial e Cirurgia, simulados com correção explicada e casos clínicos para treinar a resposta escrita. Sem cadastro e sem senha.</p>' +
          '<form class="formulario vidro" id="form-entrada" novalidate>' +
            '<div class="campos">' +
              (pedeCodigo ? '<label class="campo">Código da turma<input name="codigo" autocomplete="off" autocapitalize="characters" placeholder="Ex.: ODONTO26" required></label>' : '') +
              '<label class="campo">Como quer ser chamado(a)?<input name="nome" autocomplete="nickname" maxlength="40" placeholder="Ex.: Ana Lu" required></label>' +
            '</div>' +
            '<p class="erro-form" id="erro-entrada" role="alert"></p>' +
            '<button class="btn btn-ouro pulsa" type="submit">Entrar na sala de estudo</button>' +
            '<p class="suave" style="margin:0;font-size:13px">Seu progresso fica salvo neste aparelho. Para continuar em outro, use o "código de progresso" na tela Desempenho.</p>' +
          '</form>' +
        '</div>' +
        '<div class="entrada-arte" aria-hidden="true">' +
          '<div class="circulo vidro"></div>' +
          '<svg class="dente-heroi" viewBox="0 0 100 120"><defs><linearGradient id="esmalte" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".5" stop-color="#F6E3DA" stop-opacity=".75"/><stop offset="1" stop-color="#C98A8A" stop-opacity=".55"/></linearGradient></defs>' +
            '<path d="' + DENTE + '" fill="url(#esmalte)" stroke="rgba(255,255,255,.9)" stroke-width=".8"/><path d="M28 18C34 14 40 18 44 16" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".9"/></svg>' +
          '<div class="flutuante vidro" style="top:40px;left:10px">' + MODULOS.length + ' temas</div>' +
          '<div class="flutuante vidro" style="top:120px;right:0">Simulados comentados</div>' +
          '<div class="flutuante vidro" style="bottom:60px;left:30px">Casos clínicos</div>' +
        '</div>' +
      '</section>';
  }

  function entrar(form) {
    var nome = (form.nome.value || '').trim();
    var erro = document.getElementById('erro-entrada');
    if (CONFIG.codigoTurma) {
      var digitado = normalizar(form.codigo.value).replace(/[^a-z0-9]/g, '');
      var certo = normalizar(CONFIG.codigoTurma).replace(/[^a-z0-9]/g, '');
      if (digitado !== certo) { erro.textContent = 'Código da turma não confere. Confira com o seu professor ou coordenação.'; form.codigo.focus(); return; }
    }
    if (!nome) { erro.textContent = 'Digite como você quer ser chamado(a).'; form.nome.focus(); return; }
    estado.nome = nome.slice(0, 40);
    estado.turma = CONFIG.codigoTurma;
    salvar();
    ir('inicio');
    render();
  }

  // ---------------------------------------------------------------------------
  // Início
  // ---------------------------------------------------------------------------
  var pedidoInstalacao = null;
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    pedidoInstalacao = ev;
    if (rotaAtual()[0] === 'inicio' && estado.nome) render();
  });

  function appInstalado() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }

  function dicaInstalar() {
    if (estado.dicaInstalarFechada || appInstalado() || window.innerWidth > 900) return '';
    var iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var como = pedidoInstalacao
      ? '<button class="btn btn-ouro" type="button" data-acao="instalar">Instalar o OralLab</button>'
      : (iphone
        ? '<p style="margin:0">No iPhone: toque em <strong>Compartilhar</strong> (quadrado com seta) e depois em <strong>Adicionar à Tela de Início</strong>.</p>'
        : '<p style="margin:0">No Android: toque nos <strong>três pontinhos</strong> do navegador e depois em <strong>Adicionar à tela inicial</strong> ou <strong>Instalar app</strong>.</p>');
    return '<section class="painel vidro dica-instalar"><div style="display:flex;flex-direction:column;gap:8px"><span class="rotulo">Use como aplicativo</span>' +
      '<h2 style="font-size:20px">Coloque o OralLab na tela do seu celular</h2>' + como +
      '<p class="suave" style="margin:0;font-size:13px">Depois do primeiro acesso, ele funciona até sem internet.</p></div>' +
      '<button class="btn-texto" type="button" data-acao="fechar-dica" style="min-height:44px;align-self:flex-start">Agora não</button></section>';
  }

  function telaInicio() {
    var estudados = 0, qFeitas = 0, qCertas = 0, qTotal = 0, oFeitas = 0;
    var cards = MODULOS.map(function (m) {
      var p = progressoModulo(m);
      estudados += p.estudado ? 1 : 0; qFeitas += p.qFeitas; qCertas += p.qCertas; qTotal += p.qTotal; oFeitas += p.oFeitas;
      return '<a class="cartao vidro" href="#/modulo/' + m.id + '">' +
        '<span class="rotulo">' + esc(m.disciplina) + '</span>' +
        '<h3>' + esc(m.titulo) + '</h3>' +
        '<p>' + m.pr.length + ' perguntas e respostas · ' + m.questoes.length + ' questões · ' + m.casos.length + ' casos</p>' +
        '<div class="barra" role="img" aria-label="Progresso ' + p.geral + '%"><span style="width:' + p.geral + '%"></span></div>' +
        '<p>' + p.geral + '% concluído</p></a>';
    }).join('');

    principal.innerHTML = dicaInstalar() +
      '<section class="boas-vindas vidro">' +
        '<div style="display:flex;flex-direction:column;gap:8px"><span class="rotulo">Sala de estudo</span><h1>Olá, ' + esc(estado.nome) + '!</h1><p class="suave" style="margin:0">Escolha um tema, teste o que aprendeu e treine a resposta para a banca.</p></div>' +
        '<div class="numeros">' +
          '<div class="numero"><strong>' + estudados + '/' + MODULOS.length + '</strong><span>temas estudados</span></div>' +
          '<div class="numero"><strong>' + qFeitas + '</strong><span>questões respondidas</span></div>' +
          '<div class="numero"><strong>' + porcento(qCertas, qFeitas) + '%</strong><span>acertos de primeira</span></div>' +
          '<div class="numero"><strong>' + oFeitas + '</strong><span>respostas orais treinadas</span></div>' +
        '</div>' +
      '</section>' +
      '<div class="grade">' +
        '<a class="cartao vidro" href="#/simulado/geral">' + ICONE.check + '<h2>Simulado rápido</h2><p>' + CONFIG.questoesSimuladoGeral + ' questões sorteadas de todos os temas, com correção explicada.</p></a>' +
        '<button class="cartao vidro" type="button" data-acao="oral-sorteado">' + ICONE.fala + '<h2>Paciente surpresa</h2><p>Um caso sorteado: o paciente pergunta e você responde direto, como na prova.</p></button>' +
        '<a class="cartao vidro" href="#/perguntas">' + ICONE.livro + '<h2>Perguntas e respostas</h2><p>O que pode cair, com a resposta direta e o porquê.</p></a>' +
        '<a class="cartao vidro" href="#/simulado/erradas">' + ICONE.alerta.replace('<svg', '<svg class="icone"') + '<h2>Revisar erros</h2><p>Refaça só as questões que você errou da última vez.</p></a>' +
        '<a class="cartao vidro" href="#/desempenho">' + ICONE.grafico + '<h2>Meu desempenho</h2><p>Veja onde você vai bem e o que precisa revisar.</p></a>' +
      '</div>' +
      '<h2 class="secao-titulo">Temas</h2>' +
      '<div class="grade">' + cards + '</div>';
  }

  // ---------------------------------------------------------------------------
  // Conteúdos
  // ---------------------------------------------------------------------------
  function telaConteudos() {
    principal.innerHTML =
      '<div class="cabecalho"><span class="rotulo">Trilha de conteúdo</span><h1>Conteúdos</h1><p>Cada tema tem resumo, flashcards, termos importantes e dicas de como a banca pergunta.</p></div>' +
      '<div class="grade">' + MODULOS.map(function (m, i) {
        var p = progressoModulo(m);
        return '<a class="cartao vidro" href="#/modulo/' + m.id + '"><span class="rotulo">Tema ' + (i + 1) + ' · ' + esc(m.disciplina) + '</span><h2>' + esc(m.titulo) + '</h2><p>' + esc(m.intro.split('. ')[0]) + '.</p>' +
          '<div class="barra"><span style="width:' + p.geral + '%"></span></div><p>' + (p.estudado ? 'Estudado · ' : '') + p.geral + '% concluído</p></a>';
      }).join('') + '</div>';
  }

  var abaAtual = 'resumo';
  var flash = { mid: null, i: 0, virado: false, ordem: [] };

  function telaModulo(id) {
    var m = modulo(id);
    if (!m) { ir('conteudos'); return; }
    var idx = MODULOS.indexOf(m);
    var p = progressoModulo(m);
    if (flash.mid !== m.id) { flash = { mid: m.id, i: 0, virado: false, ordem: m.cards.map(function (_, i) { return i; }) }; abaAtual = 'resumo'; }

    var lateral = '<nav class="lateral vidro" aria-label="Temas"><span class="rotulo" style="padding:0 12px 8px">Sua trilha</span>' +
      MODULOS.map(function (mm, i) {
        var feito = estado.estudados[mm.id];
        return '<a href="#/modulo/' + mm.id + '"' + (mm.id === m.id ? ' aria-current="page"' : '') + '><span class="marcador' + (feito ? ' feito' : '') + '" aria-hidden="true">' + (feito ? '✓' : '') + '</span>' + (i + 1) + '. ' + esc(mm.titulo) + '</a>';
      }).join('') + '</nav>';

    var abas = [['resumo', 'Resumo'], ['perguntas', 'Perguntas e respostas'], ['flashcards', 'Flashcards'], ['termos', 'Termos'], ['banca', 'Como a banca pergunta']];

    principal.innerHTML =
      '<div class="layout-modulo">' + lateral +
        '<div class="conteudo">' +
          '<div class="cabecalho" style="margin:0"><span class="rotulo">Tema ' + (idx + 1) + ' de ' + MODULOS.length + ' · ' + esc(m.disciplina) + '</span><h1>' + esc(m.titulo) + '</h1><p>' + esc(m.intro) + '</p></div>' +
          '<div class="abas" role="tablist" aria-label="Formas de estudar">' + abas.map(function (a) {
            return '<button class="aba" type="button" role="tab" id="aba-' + a[0] + '" aria-controls="painel-aba" aria-selected="' + (abaAtual === a[0]) + '" data-acao="aba" data-aba="' + a[0] + '">' + a[1] + '</button>';
          }).join('') + '</div>' +
          '<section class="painel vidro" id="painel-aba" role="tabpanel" aria-labelledby="aba-' + abaAtual + '">' + painelAba(m) + '</section>' +
          '<div class="acoes">' +
            '<a class="btn btn-ouro" href="#/simulado/' + m.id + '">Testar este tema (' + m.questoes.length + ' questões)</a>' +
            '<a class="btn btn-linha" href="#/oral/' + m.id + '/0">Treinar a resposta oral</a>' +
            '<button class="btn btn-linha" type="button" data-acao="marcar-estudado" data-mid="' + m.id + '">' + (p.estudado ? '✓ Estudado' : 'Marcar como estudado') + '</button>' +
          '</div>' +
          (idx < MODULOS.length - 1 ? '<a href="#/modulo/' + MODULOS[idx + 1].id + '" style="align-self:flex-end;min-height:44px;display:flex;align-items:center">Próximo tema: ' + esc(MODULOS[idx + 1].titulo) + ' →</a>' : '') +
        '</div>' +
      '</div>';
  }

  function painelAba(m) {
    if (abaAtual === 'flashcards') {
      var total = m.cards.length;
      var c = m.cards[flash.ordem[flash.i]];
      return '<div class="topo-quiz" style="margin:0"><span class="rotulo">Flashcard ' + (flash.i + 1) + ' de ' + total + '</span><button class="btn-texto" type="button" data-acao="flash-embaralhar" style="min-height:44px">Embaralhar</button></div>' +
        '<div class="flash-palco"><button type="button" class="flash vidro' + (flash.virado ? ' virado' : '') + '" data-acao="flash-virar" aria-live="polite">' +
          '<span class="rotulo">' + (flash.virado ? 'Resposta' : 'Pergunta') + '</span>' +
          '<p class="texto-flash">' + esc(flash.virado ? c[1] : c[0]) + '</p>' +
          '<span class="suave" style="font-size:14px">' + (flash.virado ? 'Toque para ver a pergunta' : 'Toque para virar e ver a resposta') + '</span>' +
        '</button></div>' +
        '<div class="acoes"><button class="btn btn-linha" type="button" data-acao="flash-anterior"' + (flash.i === 0 ? ' disabled' : '') + '>← Anterior</button>' +
        '<button class="btn btn-ouro" type="button" data-acao="flash-proximo"' + (flash.i === total - 1 ? ' disabled' : '') + '>Próximo →</button></div>';
    }
    if (abaAtual === 'perguntas') {
      return '<div class="topo-quiz" style="margin:0"><h2>Perguntas e respostas</h2>' + botaoAbrirTodas() + '</div>' +
        '<p class="suave" style="margin:0">Tente responder de cabeça e depois toque na pergunta para conferir.</p>' +
        listaPR(m.pr);
    }
    if (abaAtual === 'termos') {
      return '<h2>Termos para usar na fala</h2><div class="termos">' + m.termos.map(function (t) {
        return '<div class="termo"><strong>' + esc(t[0]) + '</strong><span>' + esc(t[1]) + '</span></div>';
      }).join('') + '</div>';
    }
    if (abaAtual === 'banca') {
      return '<h2>Como a banca pergunta</h2>' +
        '<div class="destaque">' + ICONE.lampada + '<p><strong>Na prova oral:</strong> responda ao paciente em três passos e com palavras simples: <strong>o que pode ser</strong>, <strong>por que está acontecendo</strong> e <strong>o que vamos fazer</strong>.</p></div>' +
        '<div class="destaque">' + ICONE.lampada + '<p><strong>Como montar a resposta:</strong> ' + esc(m.dica) + '</p></div>' +
        '<div class="destaque alerta">' + ICONE.alerta + '<div><strong>Erros que derrubam na prova oral</strong><ul style="margin:8px 0 0;padding-left:20px;display:flex;flex-direction:column;gap:6px">' +
          m.erros.map(function (e) { return '<li>' + esc(e) + '</li>'; }).join('') + '</ul></div></div>' +
        '<h3>Situações para treinar</h3><ul style="margin:0;padding-left:22px;display:flex;flex-direction:column;gap:8px">' +
          m.casos.map(function (c, ci) { return '<li><a href="#/oral/' + m.id + '/' + ci + '">' + esc(c.t) + '</a> · <span class="suave">“' + esc(c.fala) + '”</span></li>'; }).join('') + '</ul>';
    }
    return '<h2>Pontos-chave</h2>' + m.secoes.map(function (s) {
      return '<div class="secao-resumo"><h3>' + esc(s.t) + '</h3><ul>' + s.p.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }).join('') +
    '<div class="destaque">' + ICONE.lampada + '<p><strong>Dica para a fala:</strong> ' + esc(m.dica) + '</p></div>';
  }

  // ---------------------------------------------------------------------------
  // Perguntas e respostas
  // ---------------------------------------------------------------------------
  function listaPR(lista) {
    return '<div class="lista-pr">' + lista.map(function (item, i) {
      return '<details class="pr"><summary><span class="pr-num" aria-hidden="true">' + (i + 1) + '</span><span class="pr-pergunta">' + esc(item[0]) + '</span></summary>' +
        '<div class="pr-corpo"><p class="pr-resposta"><strong>Resposta:</strong> ' + esc(item[1]) + '</p>' +
        '<p class="pr-porque"><strong>Por quê?</strong> ' + esc(item[2]) + '</p></div></details>';
    }).join('') + '</div>';
  }

  function botaoAbrirTodas() {
    return '<button class="btn-texto" type="button" data-acao="abrir-todas" style="min-height:44px">Abrir todas</button>';
  }

  function telaPerguntas(filtro) {
    var lista = filtro ? MODULOS.filter(function (m) { return m.id === filtro; }) : MODULOS;
    if (!lista.length) { ir('perguntas'); return; }
    var total = MODULOS.reduce(function (s, m) { return s + m.pr.length; }, 0);
    principal.innerHTML =
      '<div class="cabecalho"><span class="rotulo">Revisão rápida</span><h1>Perguntas e respostas</h1>' +
        '<p>' + total + ' perguntas que podem cair, com a resposta direta e um "por quê" curto. Tente responder de cabeça antes de abrir.</p></div>' +
      '<nav class="linha-chips filtro-temas" aria-label="Filtrar por tema">' +
        '<a class="chip' + (filtro ? '' : ' ativo') + '" href="#/perguntas"' + (filtro ? '' : ' aria-current="page"') + '>Todos os temas</a>' +
        MODULOS.map(function (m) {
          return '<a class="chip' + (filtro === m.id ? ' ativo' : '') + '" href="#/perguntas/' + m.id + '"' + (filtro === m.id ? ' aria-current="page"' : '') + '>' + esc(m.titulo) + '</a>';
        }).join('') +
      '</nav>' +
      lista.map(function (m) {
        return '<section class="painel vidro bloco-pr"><div class="topo-quiz" style="margin:0"><h2>' + esc(m.titulo) + '</h2>' + botaoAbrirTodas() + '</div>' +
          listaPR(m.pr) +
          '<div class="acoes"><a class="btn btn-linha" href="#/modulo/' + m.id + '">Ver o resumo</a><a class="btn btn-linha" href="#/simulado/' + m.id + '">Testar com questões</a></div></section>';
      }).join('');
  }

  // ---------------------------------------------------------------------------
  // Simulado
  // ---------------------------------------------------------------------------
  var quiz = null;

  function telaSimuladoEscolha() {
    var erradas = listaErradas().length;
    principal.innerHTML =
      '<div class="cabecalho"><span class="rotulo">Simulados</span><h1>Escolha o que treinar</h1><p>Você pode tentar cada questão até ' + CONFIG.tentativasPorQuestao + ' vezes. A cada erro, o sistema explica por que aquela alternativa não serve.</p></div>' +
      '<div class="grade">' +
        '<a class="cartao vidro" href="#/simulado/geral">' + ICONE.check + '<h2>Simulado rápido</h2><p>' + CONFIG.questoesSimuladoGeral + ' questões sorteadas de todos os temas.</p></a>' +
        '<a class="cartao vidro" href="#/simulado/erradas">' + ICONE.alerta.replace('<svg', '<svg class="icone"') + '<h2>Revisar erros</h2><p>' + (erradas ? erradas + ' questão(ões) para revisar.' : 'Nenhum erro registrado ainda.') + '</p></a>' +
      '</div>' +
      '<h2 class="secao-titulo">Por tema</h2>' +
      '<div class="grade">' + MODULOS.map(function (m) {
        var p = progressoModulo(m);
        return '<a class="cartao vidro" href="#/simulado/' + m.id + '"><span class="rotulo">' + m.questoes.length + ' questões</span><h3>' + esc(m.titulo) + '</h3><p>' + (p.qFeitas ? p.qCertas + ' de ' + p.qFeitas + ' certas de primeira' : 'Ainda não respondido') + '</p></a>';
      }).join('') + '</div>';
  }

  function listaErradas() {
    var lista = [];
    MODULOS.forEach(function (m) {
      m.questoes.forEach(function (_, qi) {
        var r = estado.questoes[chaveQ(m.id, qi)];
        if (r && !r.ultima) lista.push({ m: m, qi: qi });
      });
    });
    return lista;
  }

  function novoQuiz(id) {
    var itens;
    if (id === 'geral') {
      var todas = [];
      MODULOS.forEach(function (m) { m.questoes.forEach(function (_, qi) { todas.push({ m: m, qi: qi }); }); });
      itens = embaralhar(todas).slice(0, CONFIG.questoesSimuladoGeral);
    } else if (id === 'erradas') {
      itens = listaErradas();
    } else {
      var m = modulo(id);
      if (!m) return null;
      itens = m.questoes.map(function (_, qi) { return { m: m, qi: qi }; });
    }
    itens = itens.map(function (it) { return { m: it.m, qi: it.qi, q: embaralharAlternativas(it.m.questoes[it.qi]) }; });
    return { id: id, itens: itens, i: 0, escolhida: null, tentadas: [], revelada: false, resultados: [], fim: false };
  }

  // Embaralha a ordem das alternativas, mantendo cada explicação junto da sua alternativa.
  function embaralharAlternativas(q) {
    var ordem = embaralhar(q.a.map(function (_, i) { return i; }));
    return {
      e: q.e,
      a: ordem.map(function (i) { return q.a[i]; }),
      x: ordem.map(function (i) { return q.x[i]; }),
      c: ordem.indexOf(q.c),
      g: q.g
    };
  }

  function telaSimulado(id) {
    if (!quiz || quiz.id !== id) quiz = novoQuiz(id);
    if (!quiz) { ir('simulado'); return; }
    if (!quiz.itens.length) {
      principal.innerHTML = '<div class="vazio vidro"><h1 style="font-size:28px;margin-bottom:12px">Nada para revisar</h1><p>Você ainda não tem questões erradas. Faça um simulado primeiro.</p><a class="btn btn-ouro" href="#/simulado/geral">Fazer simulado rápido</a></div>';
      return;
    }
    if (quiz.fim) { telaResultado(); return; }

    var item = quiz.itens[quiz.i];
    var q = item.q;
    var errou = quiz.tentadas.length > 0 && !quiz.revelada;
    var ultimaErrada = quiz.tentadas[quiz.tentadas.length - 1];
    var acertou = quiz.revelada && quiz.tentadas[quiz.tentadas.length - 1] === q.c;

    var trilha = '<div class="trilha-quiz" aria-hidden="true">' + quiz.itens.map(function (_, i) {
      var cls = i === quiz.i ? 'atual' : (quiz.resultados[i] === true ? 'ok' : (quiz.resultados[i] === false ? 'nok' : ''));
      return '<span class="' + cls + '"></span>';
    }).join('') + '</div>';

    var alternativas = q.a.map(function (txt, ai) {
      var cls = '', marca = '', desab = quiz.revelada || quiz.tentadas.indexOf(ai) >= 0;
      if (quiz.tentadas.indexOf(ai) >= 0 && ai !== q.c) { cls = ' errada'; marca = '<span class="marca-res">' + ICONE.errado + 'Não é esta</span>'; }
      if (quiz.revelada && ai === q.c) { cls = ' certa'; marca = '<span class="marca-res">' + ICONE.certo + 'Correta</span>'; }
      return '<button type="button" class="alternativa' + cls + '" data-acao="escolher" data-ai="' + ai + '" aria-pressed="' + (quiz.escolhida === ai) + '"' + (desab ? ' disabled' : '') + '>' +
        '<span class="letra">' + LETRAS[ai] + '</span><span class="txt">' + esc(txt) + '</span>' + marca + '</button>';
    }).join('');

    var botoes;
    if (quiz.revelada) {
      botoes = '<button class="btn btn-ouro" type="button" data-acao="proxima">' + (quiz.i === quiz.itens.length - 1 ? 'Ver resultado' : 'Próxima questão →') + '</button>' +
        '<a class="btn-texto" href="#/modulo/' + item.m.id + '" style="min-height:48px;display:flex;align-items:center">Rever o resumo deste tema</a>';
    } else {
      botoes = '<button class="btn btn-ouro" type="button" data-acao="responder"' + (quiz.escolhida === null ? ' disabled' : '') + '>' + (errou ? 'Tentar de novo' : 'Responder') + '</button>' +
        (errou ? '<button class="btn btn-linha" type="button" data-acao="revelar">Ver resposta comentada</button>' : '');
    }

    var lado = '';
    if (quiz.revelada) {
      lado = '<aside class="explica vidro" aria-live="polite"><h2>' + (acertou ? (quiz.tentadas.length === 1 ? 'Acertou de primeira!' : 'Acertou!') : 'Entenda a questão') + '</h2>' +
        q.a.map(function (txt, ai) {
          var tipo = ai === q.c ? 'ok' : (quiz.tentadas.indexOf(ai) >= 0 ? 'nok' : 'neutro');
          var titulo = ai === q.c ? 'Por que é a ' + LETRAS[ai] + '?' : 'Por que não é a ' + LETRAS[ai] + '?';
          return '<div class="motivo ' + tipo + '"><b>' + titulo + '</b><p>' + esc(q.x[ai]) + '</p></div>';
        }).join('') +
        (q.g && q.g.length ? '<div class="caixa-escura"><span class="rotulo">Palavras-gatilho do enunciado</span><div class="linha-chips">' + q.g.map(function (g) { return '<span class="chip chip-ouro">' + esc(g) + '</span>'; }).join('') + '</div></div>' : '') +
        '</aside>';
    } else if (errou) {
      var restam = CONFIG.tentativasPorQuestao - quiz.tentadas.length;
      lado = '<aside class="explica vidro" aria-live="polite"><h2>Quase! Vamos entender</h2>' +
        '<div class="motivo nok"><b>Por que não é a ' + LETRAS[ultimaErrada] + '?</b><p>' + esc(q.x[ultimaErrada]) + '</p></div>' +
        '<p class="aviso-tentativa">Escolha outra alternativa. Você ainda tem <strong>' + restam + '</strong> tentativa' + (restam > 1 ? 's' : '') + '.</p>' +
        (q.g && q.g.length ? '<div class="caixa-escura"><span class="rotulo">Dica: releia estas palavras</span><div class="linha-chips">' + q.g.map(function (g) { return '<span class="chip chip-ouro">' + esc(g) + '</span>'; }).join('') + '</div></div>' : '') +
        '</aside>';
    }

    var titulo = quiz.id === 'geral' ? 'Simulado rápido' : (quiz.id === 'erradas' ? 'Revisão de erros' : item.m.titulo);
    principal.innerHTML =
      '<div class="topo-quiz"><span class="selo">' + esc(titulo) + '</span><div class="linha-chips"><span class="chip">Questão ' + (quiz.i + 1) + ' de ' + quiz.itens.length + '</span><span class="chip">Tentativa ' + Math.min(quiz.tentadas.length + (quiz.revelada ? 0 : 1), CONFIG.tentativasPorQuestao) + ' de ' + CONFIG.tentativasPorQuestao + '</span></div></div>' +
      trilha +
      '<div class="layout-quiz"><section class="questao vidro"><span class="rotulo">' + esc(item.m.titulo) + '</span><h1>' + esc(q.e) + '</h1>' +
        '<div class="alternativas" role="group" aria-label="Alternativas">' + alternativas + '</div>' +
        '<div class="acoes">' + botoes + '</div></section>' + lado + '</div>';
  }

  function responder() {
    var item = quiz.itens[quiz.i];
    var q = item.q;
    if (quiz.escolhida === null) return;
    quiz.tentadas.push(quiz.escolhida);
    var certo = quiz.escolhida === q.c;
    if (certo || quiz.tentadas.length >= CONFIG.tentativasPorQuestao) finalizarQuestao(certo);
    quiz.escolhida = null;
    telaSimulado(quiz.id);
    mostrarExplicacaoNoCelular();
  }

  function mostrarExplicacaoNoCelular() {
    if (window.innerWidth > 720) return;
    var ex = document.querySelector('.explica');
    if (ex) ex.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function finalizarQuestao(certo) {
    var item = quiz.itens[quiz.i];
    var primeira = certo && quiz.tentadas.length === 1;
    quiz.revelada = true;
    quiz.resultados[quiz.i] = primeira;
    var k = chaveQ(item.m.id, item.qi);
    var r = estado.questoes[k] || { vezes: 0 };
    r.vezes++;
    r.primeira = primeira;
    r.ultima = primeira;
    estado.questoes[k] = r;
    salvar();
  }

  function telaResultado() {
    var certas = quiz.resultados.filter(Boolean).length;
    var total = quiz.itens.length;
    var pct = porcento(certas, total);
    var msg = pct >= 80 ? 'Excelente! Você está pronto(a) para este conteúdo.' : (pct >= 50 ? 'Bom caminho! Revise os pontos que escaparam.' : 'Vale rever o resumo e tentar de novo. Cada erro já veio explicado.');
    var erradas = quiz.itens.filter(function (_, i) { return !quiz.resultados[i]; });
    principal.innerHTML =
      '<section class="resultado vidro"><span class="rotulo">Resultado</span>' +
        '<div class="anel" style="background:conic-gradient(var(--certo) 0 ' + pct + '%, rgba(255,255,255,.15) ' + pct + '% 100%)"><div><strong>' + pct + '%</strong><span>de primeira</span></div></div>' +
        '<h1 style="font-size:30px">' + certas + ' de ' + total + ' certas na primeira tentativa</h1><p class="suave" style="margin:0">' + msg + '</p>' +
        (erradas.length ? '<div class="caixa-escura" style="text-align:left;max-width:640px;width:100%"><span class="rotulo">Para revisar</span><ul style="margin:0;padding-left:20px">' + erradas.map(function (it) { return '<li>' + esc(it.m.questoes[it.qi].e) + ' <span class="suave">(' + esc(it.m.titulo) + ')</span></li>'; }).join('') + '</ul></div>' : '') +
        '<div class="acoes" style="justify-content:center"><button class="btn btn-ouro" type="button" data-acao="refazer">Fazer de novo</button>' +
        (erradas.length ? '<a class="btn btn-linha" href="#/simulado/erradas">Revisar só as erradas</a>' : '') +
        '<a class="btn btn-linha" href="#/oral">Treinar prova oral</a></div>' +
      '</section>';
  }

  // ---------------------------------------------------------------------------
  // Prova oral (resposta escrita)
  // ---------------------------------------------------------------------------
  var oral = null;
  var timer = null;

  function pararRelogio() { if (timer) { clearInterval(timer); timer = null; } }

  function telaOralLista() {
    principal.innerHTML =
      '<div class="cabecalho"><span class="rotulo">Prova oral simulada</span><h1>Atendimento ao paciente</h1><p>Um paciente (ator) faz três perguntas: o que ele tem, por que está acontecendo e o que vamos fazer. Responda direto, em palavras simples, e compare com a resposta-modelo.</p></div>' +
      MODULOS.map(function (m) {
        return '<h2 class="secao-titulo">' + esc(m.titulo) + '</h2><div class="lista-casos">' + m.casos.map(function (c, ci) {
          var feitas = c.perguntas.filter(function (_, pi) { return estado.oral[chaveO(m.id, ci, pi)]; }).length;
          return '<a class="cartao vidro" href="#/oral/' + m.id + '/' + ci + '">' + ICONE.fala + '<h3>' + esc(c.t) + '</h3><p>' + esc(c.paciente) + '</p><p>' + c.perguntas.length + ' perguntas do paciente' + (feitas ? ' · ' + feitas + ' respondida(s)' : '') + '</p></a>';
        }).join('') + '</div>';
      }).join('');
  }

  function telaOral(mid, ci) {
    var m = modulo(mid);
    ci = parseInt(ci, 10) || 0;
    if (!m || !m.casos[ci]) { ir('oral'); return; }
    if (!oral || oral.mid !== mid || oral.ci !== ci) oral = { mid: mid, ci: ci, pi: 0, texto: '', enviado: false, achados: [], dica: false, seg: CONFIG.tempoSugeridoSeg };
    var c = m.casos[ci];
    var p = c.perguntas[oral.pi];
    var palavras = contarPalavras(oral.texto);
    var ultima = oral.pi === c.perguntas.length - 1;

    var ficha = '<section class="ficha vidro"><span class="rotulo">Situação clínica · ' + esc(m.titulo) + '</span>' +
      '<div class="paciente"><span class="paciente-icone">' + ICONE.pessoa + '</span><div><strong style="display:block">' + esc(c.paciente) + '</strong><span class="suave" style="font-size:13px">' + esc(c.t) + '</span></div></div>' +
      '<p class="fala">“' + esc(c.fala) + '”</p>' +
      '<details class="dados-caso"' + (window.innerWidth > 720 ? ' open' : '') + '><summary>Ver dados do caso</summary>' +
        '<div class="dados">' + c.dados.map(function (d) { return '<div><span>' + esc(d[0]) + '</span><strong>' + esc(d[1]) + '</strong></div>'; }).join('') + '</div></details></section>';

    var resposta;
    if (!oral.enviado) {
      resposta = '<form class="resposta vidro" id="form-oral">' +
        '<div class="resposta-topo"><label for="texto-oral">Responda ao paciente como você falaria na prova</label>' +
        '<span class="relogio' + (oral.seg < 0 ? ' esgotado' : '') + '" id="relogio" role="timer" aria-live="off">' + ICONE.relogio + '<span id="relogio-txt">' + mmss(oral.seg) + '</span>&nbsp;· tempo sugerido</span></div>' +
        '<div class="linha-chips" aria-label="Roteiro sugerido"><span class="chip chip-ouro">1. O que pode ser</span><span class="chip chip-ouro">2. Por que está acontecendo</span><span class="chip chip-ouro">3. O que vamos fazer</span></div>' +
        '<textarea class="area-resposta" id="texto-oral" rows="7" placeholder="Responda direto para o paciente, em palavras simples…">' + esc(oral.texto) + '</textarea>' +
        (oral.dica ? '<p class="dica-inicio"><strong>Um jeito de começar:</strong> ' + esc(p.modelo.split('. ')[0]) + '.</p>' : '') +
        '<div class="resposta-rodape"><span class="suave" style="font-size:13px" id="contador">' + palavras + ' palavra' + (palavras === 1 ? '' : 's') + ' · respostas diretas costumam ter de 30 a 70</span>' +
        '<div class="acoes">' + (oral.dica ? '' : '<button class="btn btn-linha" type="button" data-acao="dica-oral">Ver um exemplo de início</button>') +
        '<button class="btn btn-ouro" type="submit">Enviar resposta</button></div></div></form>';
    } else {
      var achou = oral.achados.filter(Boolean).length;
      resposta = '<div class="avaliacao">' +
        '<section class="vidro"><h2>O que não pode faltar</h2><p class="suave" style="margin:0;font-size:14px">Você citou <strong>' + achou + ' de ' + p.esp.length + '</strong> pontos esperados.</p>' +
          p.esp.map(function (e, i) {
            return '<div class="item-esperado ' + (oral.achados[i] ? 'achou' : 'faltou') + '"><span class="bolinha" aria-hidden="true">' + (oral.achados[i] ? ICONE.certo : '') + '</span><span><span class="sr-only">' + (oral.achados[i] ? 'Citado: ' : 'Faltou: ') + '</span>' + esc(e[0]) + '</span></div>';
          }).join('') +
          '<p class="suave" style="margin:0;font-size:12px">A verificação procura palavras-chave no seu texto. É um apoio para você se avaliar, não uma nota oficial.</p></section>' +
        '<section class="vidro"><h2>Resposta-modelo</h2><p class="modelo">' + esc(p.modelo) + '</p></section>' +
        '<section class="vidro" style="flex-basis:100%"><h2>Sua resposta</h2><p class="modelo" style="white-space:pre-wrap">' + esc(oral.texto) + '</p>' +
          '<div class="acoes"><button class="btn btn-linha" type="button" data-acao="refazer-oral">Reescrever minha resposta</button>' +
          (ultima ? '<a class="btn btn-ouro" href="#/oral">Concluir caso</a>' : '<button class="btn btn-ouro" type="button" data-acao="proxima-oral">Próxima pergunta →</button>') + '</div></section>' +
      '</div>';
    }

    principal.innerHTML =
      '<div class="topo-quiz"><a class="selo" href="#/oral" style="text-decoration:none">← Todos os casos</a><span class="chip">Pergunta ' + (oral.pi + 1) + ' de ' + c.perguntas.length + '</span></div>' +
      '<div class="layout-oral">' + ficha +
        '<div class="palco-oral">' +
          '<div class="banca"><span class="banca-avatar" aria-hidden="true">P</span><div class="balao vidro"><span class="rotulo">Paciente (ator) pergunta</span><p>' + esc(p.p) + '</p></div></div>' +
          resposta +
        '</div>' +
      '</div>';
  }

  function avaliarOral() {
    var m = modulo(oral.mid);
    var p = m.casos[oral.ci].perguntas[oral.pi];
    var texto = ' ' + normalizar(oral.texto).replace(/[^a-z0-9-]+/g, ' ') + ' ';
    oral.achados = p.esp.map(function (e) {
      return e[1].some(function (kw) { return texto.indexOf(normalizar(kw)) >= 0; });
    });
    oral.enviado = true;
    pararRelogio();
    var k = chaveO(oral.mid, oral.ci, oral.pi);
    var achou = oral.achados.filter(Boolean).length;
    var r = estado.oral[k] || { melhor: 0, vezes: 0 };
    r.vezes++;
    r.melhor = Math.max(r.melhor, achou);
    r.total = p.esp.length;
    estado.oral[k] = r;
    salvar();
  }

  function iniciarRelogio() {
    if (timer || !oral || oral.enviado) return;
    timer = setInterval(function () {
      if (!oral) { pararRelogio(); return; }
      oral.seg--;
      var t = document.getElementById('relogio-txt');
      var r = document.getElementById('relogio');
      if (!t) { pararRelogio(); return; }
      t.textContent = mmss(oral.seg);
      if (oral.seg < 0) r.classList.add('esgotado');
    }, 1000);
  }

  // ---------------------------------------------------------------------------
  // Desempenho
  // ---------------------------------------------------------------------------
  function telaDesempenho() {
    var linhas = MODULOS.map(function (m) {
      var p = progressoModulo(m);
      var acerto = porcento(p.qCertas, p.qFeitas);
      var oralPct = porcento(p.oPontos, p.oPossiveis);
      var situacao = !p.qFeitas ? 'Começar' : (acerto >= 80 ? 'Dominando' : (acerto >= 50 ? 'Revisar pontos' : 'Rever o resumo'));
      return '<tr><td><a href="#/modulo/' + m.id + '">' + esc(m.titulo) + '</a></td>' +
        '<td>' + (p.estudado ? '✓' : '—') + '</td>' +
        '<td>' + p.qFeitas + '/' + p.qTotal + '</td>' +
        '<td><span class="barra"><span style="width:' + acerto + '%"></span></span>' + (p.qFeitas ? acerto + '%' : '—') + '</td>' +
        '<td>' + (p.oFeitas ? oralPct + '% dos pontos' : '—') + '</td>' +
        '<td>' + situacao + '</td></tr>';
    }).join('');

    principal.innerHTML =
      '<div class="cabecalho"><span class="rotulo">Meu desempenho</span><h1>Onde você está</h1><p>"Acertos" considera só a primeira tentativa de cada questão. Na prova oral, vale a sua melhor resposta.</p></div>' +
      '<section class="painel vidro"><div class="tabela-wrap"><table><thead><tr><th>Tema</th><th>Estudado</th><th>Questões</th><th>Acertos</th><th>Prova oral</th><th>Situação</th></tr></thead><tbody>' + linhas + '</tbody></table></div>' +
        '<div class="acoes"><a class="btn btn-ouro" href="#/simulado/erradas">Revisar erros</a></div></section>' +
      '<h2 class="secao-titulo">Continuar em outro aparelho</h2>' +
      '<section class="painel vidro">' +
        '<p style="margin:0">Copie o seu código de progresso e cole no outro celular ou computador, nesta mesma tela.</p>' +
        '<div class="acoes"><button class="btn btn-linha" type="button" data-acao="copiar-progresso">Copiar meu código de progresso</button></div>' +
        '<label class="campo" for="importar">Colar código vindo de outro aparelho<textarea class="area-resposta" id="importar" rows="3" style="min-height:90px"></textarea></label>' +
        '<p class="erro-form" id="msg-progresso" role="status"></p>' +
        '<div class="acoes"><button class="btn btn-ouro" type="button" data-acao="importar-progresso">Carregar progresso</button>' +
        '<button class="btn-texto" type="button" data-acao="apagar-progresso" style="min-height:48px">Apagar meu progresso</button></div>' +
      '</section>';
  }

  function codigoProgresso() {
    var json = JSON.stringify(estado);
    return btoa(unescape(encodeURIComponent(json)));
  }

  function importarProgresso() {
    var campo = document.getElementById('importar');
    var msg = document.getElementById('msg-progresso');
    try {
      var dados = JSON.parse(decodeURIComponent(escape(atob(campo.value.trim()))));
      if (!dados || typeof dados !== 'object' || !dados.questoes) throw new Error('formato');
      estado = Object.assign(estadoVazio(), dados);
      salvar();
      msg.textContent = 'Progresso carregado!';
      render();
    } catch (e) {
      msg.textContent = 'Esse código não parece válido. Copie de novo no outro aparelho.';
    }
  }

  // ---------------------------------------------------------------------------
  // Navegação
  // ---------------------------------------------------------------------------
  function rotaAtual() {
    var h = location.hash.replace(/^#\/?/, '');
    var partes = h.split('/').filter(Boolean);
    return partes.length ? partes : ['inicio'];
  }

  function ir(rota) { location.hash = '#/' + rota; }

  var ultimaRota = '';

  function render() {
    var rota = rotaAtual();
    var chave = rota.join('/');
    if (chave !== ultimaRota) { pararRelogio(); window.scrollTo(0, 0); }
    ultimaRota = chave;

    desenharTopo(rota);
    if (!estado.nome) { telaEntrada(); return; }

    switch (rota[0]) {
      case 'conteudos': telaConteudos(); break;
      case 'perguntas': telaPerguntas(rota[1]); break;
      case 'modulo': telaModulo(rota[1]); break;
      case 'simulado': rota[1] ? telaSimulado(rota[1]) : telaSimuladoEscolha(); break;
      case 'oral': rota[1] ? telaOral(rota[1], rota[2]) : telaOralLista(); break;
      case 'desempenho': telaDesempenho(); break;
      default: telaInicio();
    }
  }

  // ---------------------------------------------------------------------------
  // Eventos
  // ---------------------------------------------------------------------------
  document.addEventListener('click', function (ev) {
    var alvo = ev.target.closest('[data-acao]');
    if (!alvo) return;
    var acao = alvo.getAttribute('data-acao');
    var rota = rotaAtual();

    switch (acao) {
      case 'abrir-todas':
        var bloco = alvo.closest('.painel');
        var itens = bloco.querySelectorAll('details.pr');
        var abrir = Array.prototype.some.call(itens, function (d) { return !d.open; });
        Array.prototype.forEach.call(itens, function (d) { d.open = abrir; });
        alvo.textContent = abrir ? 'Fechar todas' : 'Abrir todas';
        break;
      case 'instalar':
        if (pedidoInstalacao) {
          pedidoInstalacao.prompt();
          pedidoInstalacao.userChoice.then(function () { pedidoInstalacao = null; render(); });
        }
        break;
      case 'fechar-dica':
        estado.dicaInstalarFechada = true;
        salvar();
        render();
        break;
      case 'trocar-nome':
        estado.nome = '';
        salvar();
        render();
        break;
      case 'aba':
        abaAtual = alvo.getAttribute('data-aba');
        flash.virado = false;
        telaModulo(rota[1]);
        var aba = document.getElementById('aba-' + abaAtual);
        if (aba) aba.focus();
        break;
      case 'marcar-estudado':
        var mid = alvo.getAttribute('data-mid');
        estado.estudados[mid] = !estado.estudados[mid];
        salvar();
        telaModulo(mid);
        break;
      case 'flash-virar':
        flash.virado = !flash.virado;
        telaModulo(rota[1]);
        break;
      case 'flash-proximo':
        flash.i++; flash.virado = false; telaModulo(rota[1]);
        break;
      case 'flash-anterior':
        flash.i--; flash.virado = false; telaModulo(rota[1]);
        break;
      case 'flash-embaralhar':
        flash.ordem = embaralhar(flash.ordem); flash.i = 0; flash.virado = false; telaModulo(rota[1]);
        break;
      case 'escolher':
        quiz.escolhida = parseInt(alvo.getAttribute('data-ai'), 10);
        telaSimulado(quiz.id);
        break;
      case 'responder':
        responder();
        break;
      case 'revelar':
        finalizarQuestao(false);
        telaSimulado(quiz.id);
        mostrarExplicacaoNoCelular();
        break;
      case 'proxima':
        if (quiz.i >= quiz.itens.length - 1) { quiz.fim = true; }
        else { quiz.i++; quiz.escolhida = null; quiz.tentadas = []; quiz.revelada = false; }
        window.scrollTo(0, 0);
        telaSimulado(quiz.id);
        break;
      case 'refazer':
        quiz = novoQuiz(quiz.id);
        telaSimulado(quiz.id);
        break;
      case 'oral-sorteado':
        var m = MODULOS[Math.floor(Math.random() * MODULOS.length)];
        var destino = 'oral/' + m.id + '/' + Math.floor(Math.random() * m.casos.length);
        oral = null;
        if (location.hash === '#/' + destino) render(); else ir(destino);
        break;
      case 'dica-oral':
        guardarTextoOral();
        oral.dica = true;
        telaOral(oral.mid, oral.ci);
        break;
      case 'refazer-oral':
        oral.enviado = false; oral.seg = CONFIG.tempoSugeridoSeg;
        telaOral(oral.mid, oral.ci);
        break;
      case 'proxima-oral':
        oral.pi++; oral.texto = ''; oral.enviado = false; oral.dica = false; oral.seg = CONFIG.tempoSugeridoSeg;
        window.scrollTo(0, 0);
        telaOral(oral.mid, oral.ci);
        break;
      case 'copiar-progresso':
        var codigo = codigoProgresso();
        var msg = document.getElementById('msg-progresso');
        var campo = document.getElementById('importar');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(codigo).then(function () { msg.textContent = 'Código copiado! Cole no outro aparelho.'; },
            function () { campo.value = codigo; campo.select(); msg.textContent = 'Selecione e copie o código acima.'; });
        } else {
          campo.value = codigo; campo.select(); msg.textContent = 'Selecione e copie o código acima.';
        }
        break;
      case 'importar-progresso':
        importarProgresso();
        break;
      case 'apagar-progresso':
        if (confirm('Apagar todo o seu progresso neste aparelho?')) {
          var nome = estado.nome;
          estado = estadoVazio();
          estado.nome = nome;
          salvar();
          render();
        }
        break;
    }
  });

  function guardarTextoOral() {
    var t = document.getElementById('texto-oral');
    if (t && oral) oral.texto = t.value;
  }

  document.addEventListener('submit', function (ev) {
    if (ev.target.id === 'form-entrada') { ev.preventDefault(); entrar(ev.target); }
    if (ev.target.id === 'form-oral') {
      ev.preventDefault();
      guardarTextoOral();
      if (contarPalavras(oral.texto) < 5) {
        var c = document.getElementById('contador');
        c.textContent = 'Escreva pelo menos uma ou duas frases antes de enviar.';
        document.getElementById('texto-oral').focus();
        return;
      }
      avaliarOral();
      telaOral(oral.mid, oral.ci);
      window.scrollTo(0, 0);
    }
  });

  document.addEventListener('input', function (ev) {
    if (ev.target.id !== 'texto-oral' || !oral) return;
    oral.texto = ev.target.value;
    iniciarRelogio();
    var n = contarPalavras(oral.texto);
    var c = document.getElementById('contador');
    if (c) c.textContent = n + ' palavra' + (n === 1 ? '' : 's') + ' · respostas diretas costumam ter de 30 a 70';
  });

  window.addEventListener('hashchange', render);
  render();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
