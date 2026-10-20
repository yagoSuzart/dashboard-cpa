// Conteúdo de estudo montado a partir das aulas em PDF (DTM, Dor Orofacial e Cirurgia).
// Cada módulo: resumo, termos, flashcards, questões comentadas e casos para a prova oral.
//
// Formato rápido:
//   termos:    [termo, definição]
//   cards:     [pergunta, resposta]
//   questoes:  { e: enunciado, a: [4 alternativas], c: índice da correta, x: [explicação de cada alternativa], g: [palavras-gatilho] }
//   casos:     { t, paciente, fala, dados: [[rótulo, valor]], perguntas: [{ p, esp: [[item, [palavras-chave]]], modelo }] }
// As palavras-chave são comparadas sem acento e em minúsculas, por trecho (ex.: "ressonanc" acha "ressonância").

window.MODULOS = [
  {
    id: 'anatomia-atm',
    titulo: 'Anatomia da ATM',
    disciplina: 'DTM · Cirurgia',
    intro: 'A articulação temporomandibular (ATM) é uma articulação sinovial, bilateral, biaxial e complexa, formada pela cabeça da mandíbula, pela fossa mandibular e pela eminência articular do temporal, com um disco articular entre elas. Participa da mastigação, da deglutição e da fonação.',
    secoes: [
      { t: 'Desenvolvimento e características gerais', p: [
        'Começa a se desenvolver na 8ª semana de vida intrauterina e está totalmente ossificada até a 20ª semana.',
        'Cresce até por volta dos 20 anos.',
        'É bilateral: as duas ATMs são unidas pela mandíbula e funcionam como uma só articulação.',
        'Além da rotação, realiza translação; permite abertura, fechamento, lateralidade, protrusão e retrusão.',
        'Tem relação de interdependência com a oclusão dentária e depende da ação dos músculos da mastigação.'
      ]},
      { t: 'O que torna a ATM diferente das outras sinoviais', p: [
        'A cabeça da mandíbula não tem cartilagem epifisária.',
        'As faces articulares são discordantes (incongruentes) e revestidas por fibrocartilagem.',
        'Há um disco articular entre as faces, que divide a ATM em duas articulações funcionais.',
        'Associa movimentos de rotação e translação.'
      ]},
      { t: 'Componentes intra e extra-articulares', p: [
        'Intra-articulares: superfícies articulares (cabeça da mandíbula, fossa articular e eminência articular), disco articular, membrana sinovial e líquido sinovial (sinóvia).',
        'Extra-articulares: cápsula articular (parte fibrosa), ligamento lateral (temporomandibular), ligamento esfenomandibular e ligamento estilomandibular.',
        'Côndilo: superfície anterossuperior, superfície posterior, polo medial e polo lateral (este é palpável).',
        'Limites da fossa: anterior = eminência articular; posterior = parte timpânica do temporal; medial = espinha do esfenoide; superior = osso delgado que separa a fossa da fossa média do crânio.'
      ]},
      { t: 'Disco articular', p: [
        'Fibrocartilagem rica em colágeno, com capacidade de remodelação.',
        'Fica entre a fossa mandibular e o côndilo, na posição de "12 horas".',
        'Tem formato de sela na porção superior e é côncavo na inferior.',
        'Borda anterior funde-se ao músculo pterigoideo lateral; borda posterior funde-se à zona bilaminar.',
        'Função: adaptar superfícies ósseas incongruentes (articulação instável) e absorver choques.',
        'Coxim retrodiscal: porção altamente vascularizada e inervada (colágeno, fibras elásticas, tecido adiposo, nervos e vasos).',
        'Ligamentos colaterais medial e lateral prendem o disco nas laterais; o disco separa os compartimentos supradiscal (temporodiscal) e infradiscal.'
      ]},
      { t: 'Cartilagem, membrana e líquido sinovial', p: [
        'Cartilagem articular em três camadas: externa (conjuntivo denso), intermediária (células precursoras) e interna (fibrocartilagem). É avascular.',
        'É mais espessa nos pontos de maior impacto: vertente posterior da eminência e superfície anterior do côndilo.',
        'A membrana sinovial reveste internamente a cápsula e os compartimentos: lubrifica, nutre e protege.',
        'A sinóvia é viscosa, nutritiva e lubrificante (sais do sangue, glicose, pequenas quantidades de proteínas e ácido hialurônico).'
      ]},
      { t: 'Ligamentos, inervação, vascularização e músculos', p: [
        'Ligamento temporomandibular: cobre quase toda a face lateral da cápsula e limita a retrusão, evitando compressão das estruturas atrás da cabeça da mandíbula.',
        'Ligamentos acessórios (estilomandibular e esfenomandibular): reforçam e dão estabilidade, mas não atuam nos movimentos.',
        'Inervação da cápsula: nervos auriculotemporal, temporal profundo posterior e massetérico (ramos do mandibular).',
        'Vascularização: artéria maxilar e artéria temporal superficial.',
        'Temporal: eleva e retrai. Masseter: eleva. Pterigoideo medial: eleva. Pterigoideo lateral: abre, protrui e lateraliza.'
      ]}
    ],
    dica: 'Responda de fora para dentro: classifique a articulação (sinovial, bilateral, biaxial), cite os componentes intra e extra-articulares, explique o disco (forma, inserções e função) e feche com inervação e músculos.',
    erros: [
      'Dizer que a ATM tem cartilagem hialina como as outras sinoviais (é fibrocartilagem).',
      'Confundir a inserção anterior do disco (pterigoideo lateral) com a posterior (zona bilaminar).',
      'Atribuir aos ligamentos acessórios a função de limitar movimentos.',
      'Esquecer que o coxim retrodiscal é a região vascularizada e inervada.'
    ],
    termos: [
      ['Articulação sinovial', 'Articulação móvel com cápsula, membrana e líquido sinovial.'],
      ['Disco articular', 'Placa de fibrocartilagem entre côndilo e fossa que adapta as superfícies e absorve choques.'],
      ['Zona bilaminar', 'Tecido retrodiscal ao qual se funde a borda posterior do disco.'],
      ['Coxim retrodiscal', 'Porção altamente vascularizada e inervada atrás do disco.'],
      ['Compartimento supradiscal', 'Espaço entre o disco e o temporal (temporodiscal).'],
      ['Compartimento infradiscal', 'Espaço entre o disco e o côndilo.'],
      ['Sinóvia', 'Líquido viscoso que lubrifica e nutre a articulação; contém ácido hialurônico.'],
      ['Ligamento temporomandibular', 'Ligamento lateral que limita a retrusão da mandíbula.'],
      ['Eminência articular', 'Limite anterior da fossa; vertente posterior recebe grande carga.']
    ],
    cards: [
      ['Em que semana intrauterina a ATM começa a se desenvolver?', 'Na 8ª semana; até a 20ª já está totalmente ossificada.'],
      ['Até que idade a ATM cresce?', 'Até cerca de 20 anos.'],
      ['Quais são os componentes intra-articulares?', 'Superfícies articulares (cabeça da mandíbula, fossa e eminência), disco, membrana sinovial e líquido sinovial.'],
      ['Quais são os componentes extra-articulares?', 'Cápsula fibrosa e ligamentos temporomandibular (lateral), esfenomandibular e estilomandibular.'],
      ['Com o que se funde a borda anterior do disco?', 'Com o músculo pterigoideo lateral.'],
      ['Com o que se funde a borda posterior do disco?', 'Com a zona bilaminar.'],
      ['Qual a função do disco articular?', 'Adaptar superfícies ósseas incongruentes e absorver choques.'],
      ['Qual ligamento limita a retrusão?', 'O ligamento temporomandibular (lateral).'],
      ['Quais nervos inervam a cápsula da ATM?', 'Auriculotemporal, temporal profundo posterior e massetérico.'],
      ['Qual músculo abre a boca e protrui a mandíbula?', 'O pterigoideo lateral.']
    ],
    questoes: [
      { e: 'Qual característica diferencia a ATM das demais articulações sinoviais do corpo?',
        a: ['A cabeça da mandíbula possui cartilagem epifisária', 'Faces articulares revestidas por fibrocartilagem, com disco interposto', 'Realiza apenas movimento de rotação', 'É uma articulação unilateral e independente'],
        c: 1,
        x: ['Errada: a cabeça da mandíbula NÃO tem cartilagem epifisária; essa é justamente uma das diferenças.', 'Correta: a ATM é revestida por fibrocartilagem e tem um disco entre faces discordantes.', 'Errada: a ATM associa rotação e translação.', 'Errada: é bilateral; as duas ATMs são unidas pela mandíbula.'],
        g: ['diferencia', 'demais sinoviais'] },
      { e: 'A borda anterior do disco articular funde-se com:',
        a: ['A zona bilaminar', 'O ligamento estilomandibular', 'O músculo pterigoideo lateral', 'O músculo masseter'],
        c: 2,
        x: ['Errada: a zona bilaminar recebe a borda POSTERIOR do disco.', 'Errada: o estilomandibular é um ligamento acessório e não se liga ao disco.', 'Correta: a borda anterior do disco é contínua com o pterigoideo lateral.', 'Errada: o masseter é elevador e não se insere no disco.'],
        g: ['borda anterior', 'disco'] },
      { e: 'Qual ligamento limita os movimentos retrusivos da mandíbula, protegendo as estruturas posteriores à cabeça da mandíbula?',
        a: ['Esfenomandibular', 'Temporomandibular (lateral)', 'Estilomandibular', 'Colateral medial'],
        c: 1,
        x: ['Errada: é acessório; reforça, mas não atua nos movimentos.', 'Correta: cobre a face lateral da cápsula e limita a retrusão.', 'Errada: também é acessório.', 'Errada: os colaterais prendem o disco ao côndilo.'],
        g: ['retrusivos', 'estruturas posteriores'] },
      { e: 'Qual região da ATM é altamente vascularizada e inervada?',
        a: ['Porção central do disco', 'Coxim retrodiscal', 'Cartilagem articular', 'Eminência articular'],
        c: 1,
        x: ['Errada: a parte central do disco suporta carga e não é vascularizada.', 'Correta: o coxim retrodiscal contém vasos, nervos, tecido adiposo e fibras elásticas.', 'Errada: a cartilagem articular é avascular.', 'Errada: é osso coberto por fibrocartilagem, local de carga.'],
        g: ['vascularizada', 'inervada'] },
      { e: 'A inervação da cápsula da ATM é feita pelos nervos:',
        a: ['Auriculotemporal, temporal profundo posterior e massetérico', 'Lingual, bucal e alveolar inferior', 'Facial e glossofaríngeo', 'Infraorbitário e zigomático'],
        c: 0,
        x: ['Correta: os três são ramos do nervo mandibular que chegam à cápsula.', 'Errada: esses nervos inervam dentes, língua e mucosa.', 'Errada: não fazem a inervação sensitiva da cápsula.', 'Errada: são ramos do maxilar e inervam a face média.'],
        g: ['inervação', 'cápsula'] },
      { e: 'Qual músculo é responsável pela abertura da boca e pela protrusão da mandíbula?',
        a: ['Temporal', 'Masseter', 'Pterigoideo medial', 'Pterigoideo lateral'],
        c: 3,
        x: ['Errada: o temporal eleva e retrai.', 'Errada: o masseter eleva.', 'Errada: o pterigoideo medial eleva.', 'Correta: o pterigoideo lateral abre, protrui e lateraliza.'],
        g: ['abertura', 'protrusão'] }
    ],
    casos: [
      { t: 'Estalido ao abrir a boca',
        paciente: 'Paciente, 28 anos, sexo feminino',
        fala: 'Quando eu abro a boca, alguma coisa estala aqui na frente da orelha. Não dói muito, mas me incomoda.',
        dados: [['Local', 'Região pré-auricular direita'], ['Abertura', 'Sem limitação'], ['Ruído', 'Estalido na abertura']],
        perguntas: [
          { p: 'Antes de falar da disfunção, descreva para a banca os componentes intra e extra-articulares da ATM.',
            esp: [
              ['Superfícies articulares: cabeça da mandíbula (côndilo), fossa e eminência', ['condilo', 'cabeca da mandibula', 'fossa', 'eminencia']],
              ['Disco articular', ['disco']],
              ['Membrana e líquido sinovial', ['sinovial', 'sinovia']],
              ['Cápsula e ligamentos (temporomandibular, esfenomandibular, estilomandibular)', ['capsula', 'ligamento']]
            ],
            modelo: 'A ATM é uma articulação sinovial, bilateral e complexa. Os componentes intra-articulares são as superfícies articulares, ou seja, a cabeça da mandíbula, a fossa mandibular e a eminência articular do temporal, além do disco articular, da membrana sinovial e do líquido sinovial. Os extra-articulares são a cápsula fibrosa e os ligamentos: o temporomandibular, que é o lateral e limita a retrusão, e os acessórios esfenomandibular e estilomandibular, que reforçam a articulação mas não participam dos movimentos.' },
          { p: 'Qual é a função do disco articular e com quais estruturas suas bordas se relacionam?',
            esp: [
              ['Adaptar superfícies incongruentes e absorver choques', ['choque', 'adapt', 'incongru', 'amortec']],
              ['Borda anterior ligada ao pterigoideo lateral', ['pterigoideo lateral', 'pterigoide lateral']],
              ['Borda posterior ligada à zona bilaminar / retrodiscal', ['bilaminar', 'retrodiscal']],
              ['Divide a ATM em compartimentos supra e infradiscal', ['compartimento', 'supradiscal', 'infradiscal']]
            ],
            modelo: 'O disco é uma fibrocartilagem rica em colágeno que fica entre o côndilo e a fossa. Como as superfícies ósseas são incongruentes, ele adapta essas superfícies e absorve os choques. Sua borda anterior se funde ao músculo pterigoideo lateral e a posterior à zona bilaminar, onde está o coxim retrodiscal, bem vascularizado e inervado. Ele ainda divide a articulação em compartimento supradiscal e infradiscal. Por isso um estalido pode indicar alteração na posição desse disco.' }
        ] }
    ]
  },

  {
    id: 'fisiologia-atm',
    titulo: 'Fisiologia da ATM',
    disciplina: 'DTM, Dor Orofacial e Terapias Complementares',
    intro: 'Estuda como a ATM percebe e executa os movimentos: a propriocepção, os receptores articulares (classificação de Greenfield e Wyke), os mecanorreceptores, as posições mandibulares e os movimentos de rotação, translação, lateralidade e do disco articular.',
    secoes: [
      { t: 'Propriocepção', p: [
        'É a percepção da posição estática da mandíbula, da direção e velocidade dos movimentos, da força dos músculos da mastigação e das forças sobre os dentes.',
        'Exemplos: perceber um osso no alimento, manter a posição oclusal e mudar o padrão muscular diante de uma interferência oclusal (como uma restauração alta).',
        'Envolve o núcleo motor do trigêmeo, o núcleo mesencefálico e os receptores.'
      ]},
      { t: 'Classificação de Greenfield e Wyke (GW)', p: [
        'Classificação neuroanatômica e funcional dos receptores sensoriais da ATM, de acordo com a informação que captam (posição, movimento, velocidade, pressão, limite de movimento, dor).',
        'GW I (postura): baixo limiar, adaptação lenta; gera reflexos posturais. Ex.: impede que a mandíbula caia pela gravidade.',
        'GW II (movimento): baixo limiar, adaptação rápida; estimulado pelo deslocamento do côndilo. Ex.: atua na mastigação.',
        'GW III (proteção): altíssimo limiar, adaptação rápida; relaxa os levantadores. Ex.: soltar a mordida ao morder uma pedra.',
        'GW IV (dor/nocicepção): altíssimo limiar, adaptação lenta; responde a abertura extensa com dor ou trismo. Ex.: dor num bocejo muito amplo.'
      ]},
      { t: 'Mecanorreceptores', p: [
        'Corpúsculos de Pacini: adaptação rápida; movimentos rápidos, pressão e vibração.',
        'Corpúsculos de Ruffini: adaptação lenta; estiramento e posição da articulação.',
        'Terminações nervosas livres: nociceptores; detectam estímulos lesivos e são centrais para entender a dor nas DTMs.'
      ]},
      { t: 'Posições mandibulares', p: [
        'Repouso: músculos em contração mínima, dentes sem contato (espaço livre interoclusal), descanso muscular.',
        'Oclusão central (máxima intercuspidação): mandíbula elevada até o maior número de contatos dentários.',
        'Relação central: dentes em ligeiro contato com a mandíbula 1 a 2 mm retruída, na posição mais retrusiva; o limite posterior é dado por músculos e ligamentos, não por contato ósseo.'
      ]},
      { t: 'Rotação, translação e abertura', p: [
        'Rotação: a mandíbula gira sobre um eixo transversal que passa pelos côndilos, sem movimento do disco; o côndilo não se desloca na fossa.',
        'Translação: o côndilo desliza para a frente levando o disco, e depois retorna à posição de origem.',
        'Na abertura, há rotação inicial e depois translação até a abertura máxima; no fechamento, a mandíbula desliza para trás até a oclusão central.',
        'No Gráfico de Posselt aparece o deslocamento do côndilo de 5 a 20 mm.'
      ]},
      { t: 'Lateralidade e movimento de Bennett', p: [
        'Lado de trabalho: o côndilo faz rotação com pequeno deslocamento lateral.',
        'Lado de balanceio: o côndilo vai para frente, para baixo e para medial.',
        'Ex.: mandíbula para a direita → trabalho = direito, balanceio = esquerdo.',
        'Ângulo de Bennett: ângulo entre a trajetória do côndilo de balanceio e o plano sagital mediano, visto no plano horizontal.'
      ]},
      { t: 'Gráfico de Posselt e disco articular', p: [
        'Posselt representa os movimentos da mandíbula nos três planos e delimita a área de movimento máximo (abertura, fechamento, protrusão, retrusão e lateralidade).',
        'Disco no repouso: entre côndilo e fossa.',
        'Na abertura: rotação do côndilo + translação do complexo côndilo–disco para anterior e inferior; o disco fica entre côndilo e eminência.',
        'No fechamento: o complexo côndilo–disco volta para trás. Na lateralidade, acompanha os côndilos.'
      ]}
    ],
    dica: 'Para receptores, sempre fale as três coisas: limiar, velocidade de adaptação e um exemplo clínico. Para movimentos, diga o que o côndilo faz e o que o disco faz.',
    erros: [
      'Trocar GW III (proteção, solta a mordida) com GW IV (dor na abertura extrema).',
      'Dizer que há movimento do disco na rotação pura.',
      'Confundir relação central (articular, retrusiva) com oclusão central (máximo de contatos).',
      'Inverter o comportamento dos côndilos de trabalho e de balanceio.'
    ],
    termos: [
      ['Propriocepção', 'Percepção da posição, do movimento e das forças da mandíbula.'],
      ['GW I', 'Receptor postural: baixo limiar, adaptação lenta.'],
      ['GW II', 'Receptor de movimento: baixo limiar, adaptação rápida.'],
      ['GW III', 'Receptor protetor: altíssimo limiar, adaptação rápida; relaxa levantadores.'],
      ['GW IV', 'Nociceptor: altíssimo limiar, adaptação lenta; dor na abertura extensa.'],
      ['Corpúsculo de Pacini', 'Adaptação rápida; vibração e movimentos rápidos.'],
      ['Corpúsculo de Ruffini', 'Adaptação lenta; posição e estiramento.'],
      ['Movimento de Bennett', 'Deslocamento lateral do côndilo de trabalho durante a lateralidade.'],
      ['Ângulo de Bennett', 'Ângulo entre a trajetória do côndilo de balanceio e o plano sagital mediano.'],
      ['Gráfico de Posselt', 'Representação dos limites do movimento mandibular nos três planos.']
    ],
    cards: [
      ['Qual receptor impede que a mandíbula caia pela gravidade?', 'GW I: baixo limiar, adaptação lenta, reflexos posturais.'],
      ['Qual receptor faz soltar a mordida ao morder uma pedra?', 'GW III: altíssimo limiar, adaptação rápida, relaxa os levantadores.'],
      ['Qual receptor explica a dor num bocejo muito amplo?', 'GW IV: nocicepção, altíssimo limiar, adaptação lenta.'],
      ['O que os corpúsculos de Pacini detectam?', 'Movimentos rápidos, pressão e vibração (adaptação rápida).'],
      ['O que os corpúsculos de Ruffini detectam?', 'Posição e estiramento da articulação (adaptação lenta).'],
      ['Qual a função das terminações nervosas livres?', 'Nocicepção: percepção de estímulos lesivos e dor.'],
      ['O que é relação central?', 'Mandíbula na posição mais retrusiva, com dentes em ligeiro contato; limitada por músculos e ligamentos.'],
      ['O que acontece com o disco na rotação?', 'Nada: na rotação pura o disco não se movimenta.'],
      ['Na lateralidade para a direita, o que faz o côndilo esquerdo?', 'É o balanceio: vai para frente, para baixo e para medial.'],
      ['O que o Gráfico de Posselt representa?', 'Os limites do movimento mandibular nos três planos.']
    ],
    questoes: [
      { e: 'Um receptor de baixo limiar e adaptação lenta, que gera contração para impedir que a mandíbula caia pela ação da gravidade, pertence à classe:',
        a: ['GW I', 'GW II', 'GW III', 'GW IV'],
        c: 0,
        x: ['Correta: GW I é postural, de baixo limiar e adaptação lenta.', 'Errada: GW II tem adaptação rápida e atua no movimento (mastigação).', 'Errada: GW III tem altíssimo limiar e é protetor.', 'Errada: GW IV é nociceptor.'],
        g: ['baixo limiar', 'adaptação lenta', 'gravidade'] },
      { e: 'Ao morder inesperadamente um alimento muito duro, ocorre relaxamento imediato dos músculos levantadores. Qual classe de receptor está envolvida?',
        a: ['GW I', 'GW II', 'GW III', 'GW IV'],
        c: 2,
        x: ['Errada: GW I mantém postura.', 'Errada: GW II percebe o deslocamento condilar na mastigação.', 'Correta: GW III, altíssimo limiar e adaptação rápida, é o reflexo protetor.', 'Errada: GW IV responde com dor à abertura extrema.'],
        g: ['inesperadamente', 'relaxamento dos levantadores'] },
      { e: 'Sobre os corpúsculos de Ruffini na ATM, é correto afirmar:',
        a: ['São de adaptação rápida e respondem à vibração', 'São de adaptação lenta e respondem ao estiramento e à posição', 'Funcionam principalmente como nociceptores', 'Não participam da percepção da posição mandibular'],
        c: 1,
        x: ['Errada: isso descreve os corpúsculos de Pacini.', 'Correta: Ruffini = adaptação lenta, posição e estiramento.', 'Errada: nocicepção é das terminações nervosas livres.', 'Errada: contribuem justamente para perceber a posição.'],
        g: ['Ruffini'] },
      { e: 'A posição em que a mandíbula está na sua posição mais retrusiva, com os dentes em ligeiro contato e limitação posterior dada por músculos e ligamentos, é:',
        a: ['Repouso mandibular', 'Oclusão central', 'Relação central', 'Protrusão máxima'],
        c: 2,
        x: ['Errada: no repouso os dentes NÃO se tocam.', 'Errada: oclusão central é o máximo de contatos (máxima intercuspidação).', 'Correta: é a definição de relação central.', 'Errada: protrusão é anterior, não retrusiva.'],
        g: ['mais retrusiva', 'ligeiro contato'] },
      { e: 'No movimento de rotação mandibular:',
        a: ['O côndilo desliza para frente levando o disco', 'A mandíbula gira sobre um eixo transversal pelos côndilos, sem movimento do disco', 'O côndilo de balanceio vai para medial', 'Ocorre a abertura máxima'],
        c: 1,
        x: ['Errada: isso é translação.', 'Correta: rotação pura, sem deslocamento do disco.', 'Errada: isso é lateralidade.', 'Errada: a abertura máxima exige translação.'],
        g: ['rotação'] },
      { e: 'Em uma lateralidade para a DIREITA, o côndilo esquerdo:',
        a: ['Faz apenas rotação no lugar', 'Desloca-se para trás e para cima', 'Desloca-se para frente, para baixo e para medial', 'Desloca-se lateralmente para a esquerda'],
        c: 2,
        x: ['Errada: rotação com pequeno deslocamento lateral é do lado de trabalho (direito).', 'Errada: não é a trajetória do balanceio.', 'Correta: o esquerdo é o balanceio: frente, baixo e medial.', 'Errada: o deslocamento lateral é do côndilo de trabalho.'],
        g: ['direita', 'côndilo esquerdo'] },
      { e: 'O Gráfico de Posselt é útil para:',
        a: ['Classificar os receptores articulares', 'Delimitar a amplitude e os limites dos movimentos mandibulares nos três planos', 'Medir a espessura do disco', 'Diagnosticar neuralgia'],
        c: 1,
        x: ['Errada: isso é a classificação de Greenfield e Wyke.', 'Correta: ele delimita a área de movimento máximo.', 'Errada: não avalia o disco.', 'Errada: não tem relação.'],
        g: ['Posselt'] }
    ],
    casos: [
      { t: 'Dor ao bocejar',
        paciente: 'Paciente, 24 anos, sexo masculino',
        fala: 'Toda vez que eu bocejo bem grande, dá uma dor aqui do lado do rosto e eu tenho que fechar a boca na hora.',
        dados: [['Gatilho', 'Abertura máxima (bocejo)'], ['Mastigação', 'Sem dor'], ['Exame', 'Abertura dentro do normal']],
        perguntas: [
          { p: 'Qual classe de receptor de Greenfield e Wyke explica essa resposta e quais as características dela?',
            esp: [
              ['GW IV', ['gw iv', 'gw 4', 'tipo iv', 'tipo 4', 'classe iv']],
              ['Nocicepção / dor', ['nocicep', 'dor']],
              ['Altíssimo limiar', ['alto limiar', 'altissimo limiar', 'limiar alto']],
              ['Adaptação lenta', ['adaptacao lenta']]
            ],
            modelo: 'Essa resposta é explicada pelos receptores GW IV da classificação de Greenfield e Wyke. Eles são nociceptores de altíssimo limiar e adaptação lenta, que só disparam em situações extremas, como uma abertura bucal muito ampla, gerando dor ou trismo como resposta protetora. Do ponto de vista dos mecanorreceptores, isso está ligado às terminações nervosas livres, que detectam estímulos potencialmente lesivos.' },
          { p: 'Descreva o que acontece com o côndilo e o disco durante a abertura bucal até a abertura máxima.',
            esp: [
              ['Rotação inicial em eixo transversal', ['rotacao', 'eixo']],
              ['Translação do côndilo para anterior', ['translacao', 'desliza', 'anterior']],
              ['Disco acompanha o côndilo (complexo côndilo–disco)', ['disco']],
              ['Disco fica entre côndilo e eminência na abertura', ['eminencia']]
            ],
            modelo: 'A abertura começa com rotação: a mandíbula gira sobre um eixo transversal que passa pelos côndilos, sem movimento do disco. Em seguida ocorre a translação: o complexo côndilo–disco desliza para anterior e inferior, e o disco passa a ficar interposto entre o côndilo e a eminência articular. Assim chega-se à abertura máxima. No fechamento, o complexo côndilo–disco retorna para a posição inicial na fossa.' }
        ] }
    ]
  },

  {
    id: 'oclusao-atm',
    titulo: 'Oclusão e ATM',
    disciplina: 'DTM, Dor Orofacial e Terapias Complementares',
    intro: 'Mostra a oclusão como parte do sistema mastigatório: as posições de referência (RC, OC e MIC), as guias condilar, oclusal, incisal e canina, a oclusão mutuamente protegida, a morfologia oclusal e a relação (multifatorial) entre oclusão e DTM.',
    secoes: [
      { t: 'O sistema mastigatório', p: [
        'Dentes determinam contatos; superfícies articulares orientam o trajeto dos côndilos; ligamentos limitam movimentos extremos.',
        'Músculos produzem o movimento; o disco protege e distribui cargas; o sistema neurossensorial coordena a atividade muscular.'
      ]},
      { t: 'RC × OC × MIC', p: [
        'Relação Cêntrica (RC): referência articular; posição musculoesqueleticamente estável que independe dos contatos dentários.',
        'Oclusão Cêntrica (OC): contatos dentários obtidos após fechar em RC.',
        'Máxima Intercuspidação (MIC): referência dentária; posição de maior contato entre as arcadas.'
      ]},
      { t: 'Guias', p: [
        'Guia condilar: guia posterior, dada pela anatomia da ATM; influencia protrusão e lateralidade (ângulo da trajetória condilar).',
        'Guia oclusal: contatos das superfícies oclusais dos posteriores; quanto mais inclinadas as cúspides, maior a influência no trajeto.',
        'Guia incisal: na protrusão, incisivos inferiores deslizam pelas faces palatinas dos superiores, desocluindo os posteriores.',
        'Guia canina: o canino inferior desliza na face palatina do superior e desoclui os posteriores na lateralidade.',
        'Função em grupo: o contato lateral é dividido entre canino e posteriores do lado de trabalho.'
      ]},
      { t: 'Oclusão mutuamente protegida', p: [
        'Em MIC, os posteriores suportam a maior parte das forças verticais (protegem os anteriores no fechamento).',
        'Nos movimentos excursivos, os anteriores guiam e desocluem os posteriores (protegem os posteriores).',
        'Protrusão → guia incisal; lateralidade → guia canina ou função em grupo; trajeto → guia condilar + guias dentárias.'
      ]},
      { t: 'Morfologia oclusal e perdas dentárias', p: [
        'A altura das cúspides e a profundidade das fossas dependem da guia anterior, da guia condilar e da distância da cúspide a esses fatores.',
        'Mais espaço para o movimento → cúspides mais altas e fossas mais profundas; menos espaço → cúspides baixas e fossas rasas.',
        'Perdas dentárias reduzem o suporte posterior e afetam a estabilidade articular.',
        'Posição neutra: estabilidade quando forças linguais e vestibulares estão em equilíbrio.'
      ]},
      { t: 'Interferências e DTM', p: [
        'Uma interferência pode alterar o trajeto, a distribuição de forças e a resposta neuromuscular, aumentando a demanda sobre músculos e estruturas.',
        'Contato dentário → mecanorreceptores periodontais e articulares → SNC → modulação da atividade muscular.',
        'Toda interferência causa DTM? NÃO. A DTM é multifatorial: fatores estruturais, neuromusculares, trauma, parafunção, psicossociais, capacidade de adaptação e oclusais.'
      ]},
      { t: 'Os 4 critérios da oclusão ideal', p: [
        '1. Contatos posteriores em RC coincidindo com a MIC.',
        '2. Cargas direcionadas ao longo eixo dos dentes posteriores (axiais).',
        '3. Guia anterior efetiva, desocluindo os posteriores na protrusão e lateralidade.',
        '4. Ausência de interferências, principalmente no lado de balanceio.'
      ]}
    ],
    dica: 'Comece diferenciando RC (articular), OC e MIC (dentárias). Depois explique quem guia cada movimento e feche lembrando que a DTM é multifatorial.',
    erros: [
      'Usar RC e MIC como sinônimos.',
      'Dizer que a guia canina atua na protrusão (é a incisal).',
      'Afirmar que toda interferência oclusal causa DTM.',
      'Esquecer o lado de balanceio ao falar de interferências.'
    ],
    termos: [
      ['Relação Cêntrica (RC)', 'Posição articular estável, independente dos contatos dentários.'],
      ['Oclusão Cêntrica (OC)', 'Contatos dentários após o fechamento em RC.'],
      ['MIC', 'Máxima intercuspidação: maior contato entre as arcadas.'],
      ['Guia condilar', 'Guia posterior determinada pela anatomia da ATM.'],
      ['Guia incisal', 'Contato dos anteriores que desoclui os posteriores na protrusão.'],
      ['Guia canina', 'Contato entre caninos que desoclui os posteriores na lateralidade.'],
      ['Função em grupo', 'Contato lateral distribuído entre canino e posteriores do lado de trabalho.'],
      ['Oclusão mutuamente protegida', 'Posteriores protegem os anteriores no fechamento; anteriores protegem os posteriores nos excursivos.'],
      ['Interferência oclusal', 'Contato inadequado que altera trajeto e resposta neuromuscular.']
    ],
    cards: [
      ['Qual a diferença entre RC e MIC?', 'RC é referência articular, independe dos dentes; MIC é referência dentária, máximo de contatos.'],
      ['O que é OC?', 'Os contatos dentários obtidos quando se fecha em RC.'],
      ['Quem desoclui os posteriores na protrusão?', 'A guia incisal.'],
      ['Quem desoclui os posteriores na lateralidade?', 'A guia canina ou a função em grupo.'],
      ['O que é função em grupo?', 'Contato lateral dividido entre canino e posteriores do lado de trabalho.'],
      ['Em MIC, quem suporta as forças verticais?', 'Os dentes posteriores.'],
      ['Menos espaço para o movimento mandibular gera que tipo de cúspide?', 'Cúspides mais baixas e fossas mais rasas.'],
      ['Toda interferência oclusal causa DTM?', 'Não. A DTM é multifatorial.'],
      ['Quais os 4 critérios da oclusão ideal?', 'RC = MIC; cargas axiais; guia anterior efetiva; ausência de interferências.'],
      ['O que é a posição neutra do dente?', 'Equilíbrio entre forças linguais e vestibulares.']
    ],
    questoes: [
      { e: 'A posição musculoesqueleticamente estável, que independe dos contatos dentários, é chamada de:',
        a: ['Máxima intercuspidação', 'Relação cêntrica', 'Oclusão cêntrica', 'Posição de repouso'],
        c: 1,
        x: ['Errada: MIC é referência dentária (máximo de contatos).', 'Correta: RC é a referência articular.', 'Errada: OC são os contatos após fechar em RC.', 'Errada: no repouso não há contato e não é referência articular.'],
        g: ['independe dos contatos'] },
      { e: 'Durante a protrusão, a desoclusão dos dentes posteriores é promovida principalmente pela:',
        a: ['Guia canina', 'Guia incisal', 'Função em grupo', 'Guia oclusal posterior'],
        c: 1,
        x: ['Errada: a guia canina atua na lateralidade.', 'Correta: os incisivos inferiores deslizam nas palatinas dos superiores.', 'Errada: função em grupo é lateralidade.', 'Errada: os posteriores devem ficar FORA de contato.'],
        g: ['protrusão', 'desoclusão'] },
      { e: 'Na oclusão mutuamente protegida:',
        a: ['Os anteriores suportam as forças verticais em MIC', 'Os posteriores guiam os movimentos excursivos', 'Os posteriores protegem os anteriores no fechamento e os anteriores protegem os posteriores nos excursivos', 'Não há participação da guia condilar'],
        c: 2,
        x: ['Errada: em MIC quem suporta são os posteriores.', 'Errada: quem guia são os anteriores.', 'Correta: é a definição de proteção mútua.', 'Errada: guia condilar e guias dentárias determinam o trajeto.'],
        g: ['mutuamente protegida'] },
      { e: 'Quando o contato lateral é distribuído entre o canino e os dentes posteriores do lado de trabalho, temos:',
        a: ['Guia canina pura', 'Função em grupo', 'Interferência de balanceio', 'Guia incisal'],
        c: 1,
        x: ['Errada: na guia canina só o canino toca.', 'Correta: é a função em grupo.', 'Errada: balanceio é o lado oposto.', 'Errada: incisal é protrusão.'],
        g: ['distribuído', 'lado de trabalho'] },
      { e: 'Em relação à morfologia oclusal, quanto MENOR o espaço disponível para o movimento mandibular:',
        a: ['Mais altas as cúspides e mais profundas as fossas', 'Mais baixas as cúspides e mais rasas as fossas', 'A morfologia não muda', 'Maior a guia canina'],
        c: 1,
        x: ['Errada: isso ocorre quando há MAIS espaço.', 'Correta: menos espaço exige cúspides baixas e fossas rasas.', 'Errada: a morfologia não é aleatória.', 'Errada: não há essa relação direta.'],
        g: ['menor o espaço'] },
      { e: 'Sobre a relação entre interferências oclusais e DTM, é correto afirmar:',
        a: ['Toda interferência oclusal causa DTM', 'A oclusão não tem nenhuma relação com DTM', 'A DTM é multifatorial e a oclusão é um dos fatores', 'Apenas fatores psicossociais causam DTM'],
        c: 2,
        x: ['Errada: a aula responde "NÃO" a essa pergunta.', 'Errada: a oclusão é um dos fatores envolvidos.', 'Correta: estruturais, neuromusculares, trauma, parafunção, psicossociais, adaptação e oclusais.', 'Errada: é um entre vários fatores.'],
        g: ['interferências', 'DTM'] }
    ],
    casos: [
      { t: 'Restauração alta e desconforto muscular',
        paciente: 'Paciente, 45 anos, sexo feminino',
        fala: 'Fiz uma restauração semana passada e desde então sinto o dente "batendo primeiro" e o rosto cansado no fim do dia.',
        dados: [['Procedimento', 'Restauração recente em molar'], ['Queixa', 'Contato prematuro e cansaço muscular'], ['Histórico', 'Sem DTM prévia']],
        perguntas: [
          { p: 'Como uma interferência oclusal pode alterar a função mastigatória? Ela sozinha explica uma DTM?',
            esp: [
              ['Altera trajeto mandibular e distribuição de forças', ['trajeto', 'forca', 'carga']],
              ['Mecanorreceptores e resposta neuromuscular', ['mecanorrecep', 'neuromuscular', 'receptor']],
              ['DTM é multifatorial', ['multifatorial']],
              ['Cita outros fatores (parafunção, psicossociais, adaptação)', ['parafun', 'psicossoc', 'adapta', 'trauma', 'emocion']]
            ],
            modelo: 'A interferência pode modificar o trajeto mandibular e a distribuição das forças. Os mecanorreceptores periodontais e articulares levam essa informação ao sistema nervoso central, que modula a atividade muscular, o que pode aumentar a demanda sobre alguns músculos e explicar o cansaço. Mas uma interferência sozinha não explica uma DTM: ela é multifatorial, envolvendo fatores estruturais, neuromusculares, trauma, parafunção, fatores psicossociais e a capacidade de adaptação de cada paciente, além dos oclusais.' },
          { p: 'Quais são os quatro critérios de uma oclusão ideal?',
            esp: [
              ['Contatos posteriores em RC coincidindo com MIC', [' rc ', 'relacao centrica', ' mic ', 'intercuspid']],
              ['Cargas axiais nos posteriores', ['axia', 'longo eixo']],
              ['Guia anterior efetiva / desoclusão', ['guia anterior', 'desoclu', 'guia canina', 'guia incisal']],
              ['Ausência de interferências (balanceio)', ['interferenc', 'balanceio']]
            ],
            modelo: 'Os quatro critérios são: primeiro, contatos posteriores em relação cêntrica coincidindo com a máxima intercuspidação. Segundo, as cargas nos posteriores devem ser direcionadas ao longo eixo do dente. Terceiro, uma guia anterior efetiva, que desoclua os posteriores na protrusão e na lateralidade. E quarto, ausência de interferências oclusais, principalmente no lado de balanceio. No caso dessa paciente, eu checaria o contato da restauração com papel carbono.' }
        ] }
    ]
  },

  {
    id: 'nervo-trigemeo',
    titulo: 'Revisão do Nervo Trigêmeo',
    disciplina: 'Cirurgia',
    intro: 'O trigêmeo (V par craniano) é um nervo misto que fornece a inervação dentária. Sai da porção anterolateral da ponte e se divide em três ramos: oftálmico, maxilar e mandibular. Saber o trajeto e o território de cada ramo é a base da anestesia e do diagnóstico da dor orofacial.',
    secoes: [
      { t: 'Visão geral', p: [
        '12 pares cranianos ligados ao encéfalo; o V par é o trigêmeo.',
        'Raiz motora pequena (músculos da mastigação) e raiz sensitiva maior (olhos, glândulas lacrimais, pálpebras, dentes, gengivas, palato, lábios, pele da face e couro cabeludo).',
        'Três divisões a partir do gânglio trigeminal: oftálmica (V1), maxilar (V2) e mandibular (V3).'
      ]},
      { t: 'Divisão oftálmica (V1)', p: [
        'Passa pela parede lateral do seio cavernoso e sai pela fissura orbital superior.',
        'Sensibilidade do globo ocular, conjuntiva, glândula lacrimal, parte da mucosa do nariz e seios, pele da fronte, pálpebras e nariz.',
        'Ramos: frontal (supraorbital e supratroclear), nasociliar e lacrimal.'
      ]},
      { t: 'Divisão maxilar (V2)', p: [
        'Sai pelo forame redondo, chega à fossa pterigopalatina e, ao entrar na órbita pela fissura orbital inferior, passa a se chamar nervo infraorbitário.',
        'Supre meninges, face, palato, cavidade nasal, seio maxilar e dentes superiores.',
        'Da fossa pterigopalatina: nasopalatino, palatinos maior e menor e alveolar superior posterior.',
        'Do infraorbitário: alveolares superiores médio e anterior.'
      ]},
      { t: 'Inervação dos dentes superiores', p: [
        'Alveolar superior posterior: 3º e 2º molares e raízes palatina e distovestibular do 1º molar; periodonto, vestibular e seio maxilar.',
        'Alveolar superior médio: raiz mesiovestibular do 1º molar e pré-molares superiores.',
        'Alveolar superior anterior: bateria labial superior (incisivos e canino).',
        'Palatino maior: 2/3 do palato (de canino a molares). Palatino menor: tonsilas e palato mole.',
        'Nasopalatino: emerge pelo forame incisivo; gengiva palatina de incisivos e caninos.'
      ]},
      { t: 'Divisão mandibular (V3)', p: [
        'Sai pelo forame oval com raízes sensitiva e motora, para a fossa infratemporal.',
        'Divisão anterior (predominantemente motora): massetérico, temporais profundos, pterigoideo lateral e nervo bucal.',
        'Divisão posterior: auriculotemporal (parótida, pavilhão auditivo e cápsula da ATM), alveolar inferior e lingual.'
      ]},
      { t: 'Inervação mandibular e da língua', p: [
        'Alveolar inferior: raízes dos dentes inferiores; dá o milo-hioideo, ramos dentários, nervo mentual e ramo incisivo.',
        'Nervo mentual: sai pelo forame mentual; pele do mento, lábio inferior e gengiva vestibular de 1º e 2º pré-molares.',
        'Ramo incisivo: polpas do 1º pré-molar até o incisivo central.',
        'Lingual: 2/3 anteriores da língua (sensibilidade geral), gengiva lingual e soalho bucal.',
        'Bucal: tecidos moles vestibulares dos molares inferiores; deve ser bloqueado em exodontias.',
        'Gustação: 2/3 anteriores = corda do tímpano; 1/3 posterior = glossofaríngeo. Motor da língua = hipoglosso.'
      ]}
    ],
    dica: 'Organize por ramo e por "porta de saída": V1 fissura orbital superior, V2 forame redondo, V3 forame oval. Depois desça até o dente que a banca perguntar.',
    erros: [
      'Trocar forame redondo (maxilar) e forame oval (mandibular).',
      'Esquecer que a raiz mesiovestibular do 1º molar superior é do alveolar superior médio.',
      'Atribuir a gustação dos 2/3 anteriores ao nervo lingual (é a corda do tímpano).',
      'Não bloquear o nervo bucal na exodontia de molares inferiores.'
    ],
    termos: [
      ['Nervo misto', 'Tem fibras motoras e sensitivas.'],
      ['Gânglio trigeminal', 'Gânglio sensitivo de onde partem V1, V2 e V3.'],
      ['Forame redondo', 'Saída do nervo maxilar.'],
      ['Forame oval', 'Saída do nervo mandibular.'],
      ['Nervo infraorbitário', 'Continuação do maxilar ao entrar na órbita; dá os alveolares superiores médio e anterior.'],
      ['Nervo nasopalatino', 'Sai pelo forame incisivo; gengiva palatina anterior.'],
      ['Nervo mentual', 'Ramo do alveolar inferior que sai pelo forame mentual.'],
      ['Corda do tímpano', 'Responsável pela gustação dos 2/3 anteriores da língua.'],
      ['Nervo bucal', 'Tecidos moles vestibulares dos molares inferiores.']
    ],
    cards: [
      ['Por onde sai o nervo maxilar?', 'Pelo forame redondo.'],
      ['Por onde sai o nervo mandibular?', 'Pelo forame oval.'],
      ['Quem inerva a raiz mesiovestibular do 1º molar superior?', 'O nervo alveolar superior médio.'],
      ['Quem inerva 3º e 2º molares superiores?', 'O nervo alveolar superior posterior.'],
      ['Por onde emerge o nasopalatino e o que ele inerva?', 'Forame incisivo; gengiva palatina de incisivos e caninos.'],
      ['Qual a área do palatino maior?', '2/3 do palato, de caninos a molares.'],
      ['Quem dá a sensibilidade geral dos 2/3 anteriores da língua?', 'O nervo lingual.'],
      ['Quem dá a gustação dos 2/3 anteriores da língua?', 'O nervo corda do tímpano.'],
      ['O que inerva o nervo mentual?', 'Pele do mento, lábio inferior e gengiva vestibular de pré-molares inferiores.'],
      ['Que nervo da divisão posterior inerva a cápsula da ATM?', 'O auriculotemporal.']
    ],
    questoes: [
      { e: 'O nervo mandibular emerge do crânio através do:',
        a: ['Forame redondo', 'Forame oval', 'Forame espinhoso', 'Fissura orbital superior'],
        c: 1,
        x: ['Errada: é a saída do nervo maxilar.', 'Correta: V3 sai pelo forame oval.', 'Errada: por ele passa a artéria meníngea média.', 'Errada: é a saída do oftálmico.'],
        g: ['mandibular', 'emerge'] },
      { e: 'A raiz mesiovestibular do primeiro molar superior e os pré-molares superiores são inervados pelo nervo:',
        a: ['Alveolar superior posterior', 'Alveolar superior médio', 'Alveolar superior anterior', 'Palatino maior'],
        c: 1,
        x: ['Errada: inerva 3º e 2º molares e as raízes palatina e distovestibular do 1º molar.', 'Correta: é o território do alveolar superior médio.', 'Errada: inerva a bateria labial (incisivos e canino).', 'Errada: inerva a mucosa palatina.'],
        g: ['mesiovestibular', 'pré-molares'] },
      { e: 'A gustação dos 2/3 anteriores da língua é conduzida pelo nervo:',
        a: ['Lingual', 'Hipoglosso', 'Corda do tímpano', 'Glossofaríngeo'],
        c: 2,
        x: ['Errada: o lingual dá a sensibilidade GERAL dos 2/3 anteriores.', 'Errada: o hipoglosso é motor.', 'Correta: a corda do tímpano conduz a gustação.', 'Errada: o glossofaríngeo cuida do 1/3 posterior.'],
        g: ['gustação', '2/3 anteriores'] },
      { e: 'Na exodontia de um molar inferior, além do alveolar inferior e do lingual, qual nervo precisa ser bloqueado para a manipulação dos tecidos moles vestibulares?',
        a: ['Mentual', 'Bucal', 'Milo-hioideo', 'Auriculotemporal'],
        c: 1,
        x: ['Errada: inerva a região de pré-molares e lábio.', 'Correta: o bucal inerva a gengiva vestibular dos molares inferiores.', 'Errada: é ramo motor e do soalho.', 'Errada: inerva parótida, orelha e ATM.'],
        g: ['molar inferior', 'tecidos moles vestibulares'] },
      { e: 'O nervo nasopalatino:',
        a: ['Emerge pelo forame palatino maior', 'Emerge pelo forame incisivo e inerva a gengiva palatina de incisivos e caninos', 'Inerva o palato mole', 'É ramo do nervo mandibular'],
        c: 1,
        x: ['Errada: esse é o palatino maior.', 'Correta.', 'Errada: palato mole é do palatino menor.', 'Errada: é ramo do maxilar (fossa pterigopalatina).'],
        g: ['nasopalatino'] },
      { e: 'Sobre o nervo trigêmeo, é correto afirmar:',
        a: ['É exclusivamente sensitivo', 'É um nervo misto; sua raiz motora inerva os músculos da mastigação', 'É o VII par craniano', 'Origina-se no bulbo'],
        c: 1,
        x: ['Errada: tem também raiz motora.', 'Correta.', 'Errada: é o V par; o VII é o facial.', 'Errada: origina-se na porção anterolateral da ponte.'],
        g: ['trigêmeo'] }
    ],
    casos: [
      { t: 'Exodontia do 46',
        paciente: 'Paciente, 35 anos, sexo masculino',
        fala: 'Esse dente de trás embaixo está todo quebrado e dói. Vai precisar tirar?',
        dados: [['Dente', '46'], ['Indicação', 'Exodontia'], ['Exame', 'Destruição coronária extensa']],
        perguntas: [
          { p: 'Quais nervos você precisa anestesiar para extrair o 46 e por quê?',
            esp: [
              ['Alveolar inferior (polpa e periodonto do dente)', ['alveolar inferior']],
              ['Lingual (gengiva lingual e soalho)', ['lingual']],
              ['Bucal (gengiva vestibular de molares)', ['bucal']],
              ['Justifica pelo território de cada nervo', ['gengiva', 'mucosa', 'tecido']]
            ],
            modelo: 'Para extrair o 46 eu anestesiaria o nervo alveolar inferior, que inerva as raízes e a polpa dos dentes inferiores. Também o nervo lingual, responsável pela gengiva lingual e pela mucosa do soalho bucal. E o nervo bucal, que inerva os tecidos moles vestibulares da região de molares inferiores. Como a exodontia manipula esses tecidos, o bloqueio do bucal é necessário além do alveolar inferior e do lingual.' },
          { p: 'Após o procedimento, o paciente relata dormência no lábio inferior e no mento do mesmo lado. Qual nervo está envolvido?',
            esp: [
              ['Nervo mentual', ['mentual', 'mentoniano']],
              ['Ramo do alveolar inferior', ['alveolar inferior']],
              ['Sai pelo forame mentual', ['forame']],
              ['Território: lábio inferior, mento e gengiva de pré-molares', ['labio', 'mento', 'pre-molar', 'pre molar']]
            ],
            modelo: 'A dormência no lábio inferior e no mento corresponde ao território do nervo mentual, que é ramo do alveolar inferior e se exterioriza pelo forame mentual. Ele inerva a pele do mento, a pele e a mucosa do lábio inferior e a gengiva vestibular dos pré-molares inferiores. Como o alveolar inferior foi anestesiado, essa sensação é esperada enquanto dura a anestesia; se persistir, eu investigaria lesão do nervo.' }
        ] }
    ]
  },

  {
    id: 'neuralgia-trigemeo',
    titulo: 'Neuralgia do Trigêmeo',
    disciplina: 'DTM, Dor Orofacial e Terapias Complementares',
    intro: 'Desordem neuropática caracterizada por paroxismos de dor facial intensa, em choque elétrico ou lancinante, limitada ao território de um ou mais ramos do V par. O ponto principal para o dentista é o diagnóstico diferencial com dor de dente e DTM, evitando tratamentos desnecessários.',
    secoes: [
      { t: 'Epidemiologia', p: [
        'Incidência de 4,3 casos por 100.000 habitantes/ano.',
        'Leve predileção pelo sexo feminino (1,7:1); mais comum entre 60 e 70 anos e rara antes dos 40.',
        'Predominantemente unilateral, mais no lado direito (1,5:1). Casos bilaterais são raros.',
        'V2 e V3 são os ramos mais acometidos; o envolvimento isolado de V1 é raro.'
      ]},
      { t: 'Características da dor', p: [
        'Aspecto: choque elétrico, agulhada, facada ou pontada lancinante, de início e fim súbitos.',
        'Duração: fração de segundo até 2 minutos; pode ocorrer poucas ou muitas vezes ao dia.',
        'Período refratário: logo após uma crise, estimular o local não dispara outra.',
        'Cerca de 30% podem ter dor contínua ou queimação de fundo entre os paroxismos.'
      ]},
      { t: 'Zonas de gatilho', p: [
        'Áreas da face ou mucosa onde estímulos mecânicos sutis disparam a crise.',
        'Gatilhos: tocar o rosto, lavar o rosto, barbear, escovar os dentes, mastigar, falar, sorrir, ar-condicionado.',
        'Locais mais comuns: região nasolabial, lábios, mento, bochecha e gengiva alveolar.',
        'Fisiopatologia: mielina danificada + nervo hiperestimulado = disparos elétricos anormais.'
      ]},
      { t: 'Classificação (ICHD-3)', p: [
        'Clássica: compressão neurovascular da raiz do trigêmeo, frequentemente pela artéria cerebelar superior (diagnóstico por RM).',
        'Secundária: causada por doença neurológica estrutural, como esclerose múltipla ou lesões expansivas (tumores, MAVs).',
        'Idiopática: diagnóstico de exclusão, quando não se acha compressão com alteração morfológica nem lesão secundária.',
        'Sinais atípicos (suspeitar de secundária): início antes dos 40 anos, déficit sensorial permanente (hipoestesia, parestesia, perda do reflexo corneano), sintomas bilaterais, alterações neurológicas (fraqueza facial, vertigem, perda auditiva).'
      ]},
      { t: 'Diagnóstico diferencial', p: [
        'Neuralgia: choque de segundos a 2 min, gatilho por toque leve, exame oral e neurológico normais, período refratário PRESENTE.',
        'Odontalgia (pulpite/periapical): pulsátil ou contínua, minutos a horas, estímulo térmico ou mastigação, cárie, restauração infiltrada ou trinca; sem período refratário.',
        'DTM muscular: dor em peso ou cansaço, horas a dias, piora com função e palpação, pontos-gatilho em masseter e temporal; sem período refratário.',
        'Neuropatia pós-traumática: queimação contínua, toque na área operada, parestesia ou alodinia; sem período refratário.',
        'Neuralgia do glossofaríngeo (IX): choque desencadeado por deglutição, fala ou mastigação, no terço posterior da língua, tonsila, orofaringe ou ouvido.',
        'SUNCT/SUNA: paroxismos curtos sempre com lacrimejamento, hiperemia conjuntival, rinorreia ou congestão nasal.'
      ]},
      { t: 'Tratamento', p: [
        'Carbamazepina: padrão-ouro (nível A); bloqueia canais de sódio voltagem-dependentes. Início 100 a 200 mg 2x/dia, com aumento gradual (máximo 1600 mg/dia).',
        'Atenção à carbamazepina: vertigem, sonolência, ataxia, hiponatremia, alterações sanguíneas e hepáticas e risco de Síndrome de Stevens-Johnson e Necrólise Epidérmica Tóxica.',
        'Outras opções: oxcarbazepina, baclofeno (agonista GABA-B, sinérgico com carbamazepina), lamotrigina, gabapentina, toxina botulínica nas zonas de gatilho e laser de baixa potência como adjuvante.',
        'Invasivos: rizotomia por radiofrequência ou balão (gânglio de Gasser), descompressão microvascular (cirurgia padrão-ouro: afasta o vaso que comprime a raiz) e radiocirurgia (Gamma Knife).',
        'Comparada à descompressão, a rizotomia está associada a mais ansiedade, dormência e queimação e menor qualidade de vida.',
        'A Ressonância Magnética é recomendada na avaliação inicial de todos os casos suspeitos.'
      ]}
    ],
    dica: 'Fale em três blocos: (1) por que é neuralgia (choque, segundos, gatilho leve, refratário, exame normal); (2) como diferenciar de dente e DTM; (3) conduta: RM, carbamazepina e encaminhamento.',
    erros: [
      'Indicar endodontia ou exodontia sem achado dentário que justifique (tratamento iatrogênico).',
      'Esquecer o período refratário como sinal diferencial.',
      'Não solicitar RM para afastar causas secundárias.',
      'Prescrever carbamazepina sem citar o monitoramento dos efeitos adversos.'
    ],
    termos: [
      ['Paroxismo', 'Crise súbita e intensa de dor, de início e fim abruptos.'],
      ['Zona de gatilho', 'Área onde um estímulo leve dispara a crise.'],
      ['Período refratário', 'Intervalo após a crise em que o estímulo não dispara nova dor.'],
      ['NT clássica', 'Por compressão neurovascular da raiz do trigêmeo.'],
      ['NT secundária', 'Por doença estrutural, como esclerose múltipla ou tumor.'],
      ['NT idiopática', 'Diagnóstico de exclusão, sem causa encontrada nos exames.'],
      ['Carbamazepina', 'Padrão-ouro; bloqueia canais de sódio voltagem-dependentes.'],
      ['Descompressão microvascular', 'Cirurgia padrão-ouro que afasta o vaso da raiz do nervo.'],
      ['SUNCT/SUNA', 'Cefaleias com paroxismos curtos e sinais autonômicos.']
    ],
    cards: [
      ['Como é a dor da neuralgia do trigêmeo?', 'Choque elétrico ou facada, súbita, de segundos a 2 minutos.'],
      ['Qual faixa etária é mais acometida?', 'Entre 60 e 70 anos; rara antes dos 40.'],
      ['Cite três gatilhos comuns.', 'Lavar o rosto, escovar os dentes, barbear (também mastigar, falar, sorrir).'],
      ['O que é o período refratário?', 'Após a crise, estimular a área não dispara nova dor imediatamente.'],
      ['Qual a causa da NT clássica?', 'Compressão neurovascular, frequentemente pela artéria cerebelar superior.'],
      ['Cite sinais de alerta para NT secundária.', 'Início antes dos 40, déficit sensorial, bilateralidade, outros sinais neurológicos.'],
      ['Qual exame de imagem pedir?', 'Ressonância magnética, para ver compressão e afastar causas secundárias.'],
      ['Qual o fármaco de primeira escolha?', 'Carbamazepina (nível A de evidência).'],
      ['Qual o risco grave da carbamazepina?', 'Síndrome de Stevens-Johnson / Necrólise Epidérmica Tóxica (além de hiponatremia e alterações hepáticas e sanguíneas).'],
      ['Qual a cirurgia padrão-ouro?', 'Descompressão microvascular.']
    ],
    questoes: [
      { e: 'Paciente de 62 anos relata choques de poucos segundos no lado direito do rosto ao lavar a face. Logo após uma crise, tocar a mesma área não provoca dor. Esse último achado corresponde a:',
        a: ['Alodinia', 'Período refratário', 'Hiperalgesia secundária', 'Dor referida'],
        c: 1,
        x: ['Errada: alodinia é dor a estímulo normalmente não doloroso, comum na neuropatia pós-traumática.', 'Correta: o período refratário é típico da neuralgia.', 'Errada: não descreve a ausência de resposta logo após a crise.', 'Errada: dor referida é sentida em local diferente da origem.'],
        g: ['logo após uma crise', 'não provoca dor'] },
      { e: 'A neuralgia do trigêmeo clássica é causada por:',
        a: ['Esclerose múltipla', 'Tumor do ângulo pontocerebelar', 'Compressão neurovascular da raiz do trigêmeo', 'Infecção dentária crônica'],
        c: 2,
        x: ['Errada: causa a forma SECUNDÁRIA.', 'Errada: lesões expansivas também são causa secundária.', 'Correta: geralmente pela artéria cerebelar superior.', 'Errada: não é causa de neuralgia; é diagnóstico diferencial.'],
        g: ['clássica'] },
      { e: 'Qual achado deve levantar suspeita de neuralgia do trigêmeo SECUNDÁRIA?',
        a: ['Paciente de 65 anos com dor unilateral', 'Período refratário presente', 'Início antes dos 40 anos com hipoestesia facial permanente', 'Gatilho ao escovar os dentes'],
        c: 2,
        x: ['Errada: é o perfil típico da forma clássica.', 'Errada: é característica comum da NT.', 'Correta: idade abaixo de 40 e déficit sensorial são sinais atípicos.', 'Errada: gatilho por toque é típico.'],
        g: ['secundária'] },
      { e: 'O tratamento farmacológico de primeira escolha (padrão-ouro) da neuralgia do trigêmeo é:',
        a: ['Amoxicilina', 'Carbamazepina', 'Ibuprofeno', 'Amitriptilina'],
        c: 1,
        x: ['Errada: antibiótico não trata dor neuropática.', 'Correta: bloqueador de canais de sódio, nível A de evidência.', 'Errada: AINEs não controlam os paroxismos.', 'Errada: não é a primeira escolha para NT.'],
        g: ['primeira escolha'] },
      { e: 'Paroxismos de dor em choque desencadeados pela deglutição, na região da tonsila e do fundo do ouvido, sugerem:',
        a: ['Neuralgia do trigêmeo ramo V3', 'Neuralgia do glossofaríngeo', 'Pulpite irreversível', 'DTM muscular'],
        c: 1,
        x: ['Errada: o gatilho e o local apontam para o IX par.', 'Correta: o glossofaríngeo é disparado por deglutição, fala ou mastigação.', 'Errada: a dor pulpar é provocada por estímulo térmico.', 'Errada: a dor muscular é em peso, contínua.'],
        g: ['deglutição', 'tonsila', 'ouvido'] },
      { e: 'Qual exame complementar é recomendado na avaliação inicial de todo paciente com suspeita de neuralgia do trigêmeo?',
        a: ['Radiografia panorâmica', 'Ressonância magnética', 'Tomografia cone beam', 'Hemograma'],
        c: 1,
        x: ['Errada: avalia dentes e ossos, não a raiz nervosa.', 'Correta: identifica compressão neurovascular e afasta causas secundárias.', 'Errada: não avalia tecidos nervosos adequadamente.', 'Errada: não é o exame principal neste caso.'],
        g: ['avaliação inicial'] },
      { e: 'A cirurgia considerada padrão-ouro para a neuralgia do trigêmeo é:',
        a: ['Rizotomia por balão', 'Descompressão microvascular', 'Exodontia do dente envolvido', 'Radiocirurgia Gamma Knife'],
        c: 1,
        x: ['Errada: é opção, mas com mais dormência, queimação e ansiedade.', 'Correta: afasta o vaso que comprime a raiz.', 'Errada: não há indicação dentária; seria iatrogenia.', 'Errada: é alternativa, não a padrão-ouro.'],
        g: ['padrão-ouro', 'cirurgia'] }
    ],
    casos: [
      { t: 'Choques ao escovar os dentes',
        paciente: 'Paciente, 62 anos, sexo feminino, aposentada',
        fala: 'Sinto pontadas e choques elétricos insuportáveis no lado direito do rosto e na gengiva quando vou escovar os dentes ou lavar a face.',
        dados: [['Duração', 'Poucos segundos, há 6 meses'], ['Intensidade', 'EVA 10/10'], ['Zona de gatilho', 'Sulco nasogeniano direito'], ['Dentes', 'Hígidos; molar superior com endodontia sem lesão'], ['Neurológico', 'Sensibilidade preservada'], ['ATM/músculos', 'Abertura 44 mm, sem dor à palpação']],
        perguntas: [
          { p: 'Qual o diagnóstico clínico provável e quais características da dor sustentam essa hipótese?',
            esp: [
              ['Neuralgia do trigêmeo', ['neuralgia']],
              ['Dor em choque, curta (segundos)', ['choque', 'segundo', 'paroxis']],
              ['Zona de gatilho / toque leve', ['gatilho', 'toque']],
              ['Período refratário', ['refrat']],
              ['Exame dental e neurológico normais', ['higido', 'normal', 'sem alteracao', 'neurolog']]
            ],
            modelo: 'O diagnóstico provável é neuralgia do trigêmeo, provavelmente do ramo maxilar. Sustentam essa hipótese a dor em choque elétrico, de poucos segundos e intensidade máxima, desencadeada por estímulo leve em uma zona de gatilho no sulco nasogeniano, com período refratário. O exame intrabucal mostra dentes hígidos, o dente tratado endodonticamente não tem lesão, a ATM e os músculos estão normais e a sensibilidade está preservada, o que afasta causa odontogênica e DTM e é compatível com a forma clássica.' },
          { p: 'Por que o tratamento endodôntico não aliviou a dor? Como diferenciar a neuralgia de uma pulpite ou de uma DTM muscular?',
            esp: [
              ['A dor não era de origem dental (neuropática)', ['nao era', 'neuropat', 'nao odontog', 'nao dental']],
              ['Pulpite: dor pulsátil, minutos a horas, estímulo térmico, achado dental', ['pulsatil', 'termic', 'frio', 'carie']],
              ['DTM: dor em peso, horas a dias, piora com função e palpação', ['peso', 'palpa', 'cansaco', 'funcao']],
              ['Neuralgia tem período refratário e gatilho leve', ['refrat', 'gatilho']]
            ],
            modelo: 'A endodontia não resolveu porque a dor não era odontogênica: é uma dor neuropática do nervo trigêmeo, então tratar o dente não muda o mecanismo. Para diferenciar: na pulpite a dor é pulsátil ou contínua, dura minutos a horas, é provocada por frio, calor ou mastigação e há achado dental como cárie ou restauração infiltrada. Na DTM muscular a dor é em peso ou cansaço, dura horas a dias e piora com a função e a palpação de masseter e temporal. A neuralgia é um choque de segundos, disparado por toque leve, com período refratário e exame normal.' },
          { p: 'Qual exame de imagem você solicitaria, qual a conduta farmacológica de primeira escolha e o que monitorar?',
            esp: [
              ['Ressonância magnética', ['ressonanc', ' rm']],
              ['Afastar causas secundárias / ver compressão', ['secundar', 'compress', 'tumor', 'esclerose']],
              ['Carbamazepina', ['carbamazepina']],
              ['Monitorar efeitos adversos (sódio, fígado, sangue, Stevens-Johnson)', ['stevens', 'hiponatrem', 'hepat', 'sangu', 'sonolenc', 'monitor']]
            ],
            modelo: 'Eu solicitaria uma ressonância magnética, recomendada para todos os casos suspeitos, para identificar compressão neurovascular e principalmente afastar causas secundárias, como tumores ou placas de esclerose múltipla. A primeira escolha é a carbamazepina, bloqueadora de canais de sódio, com dose inicial baixa e aumento gradual até controlar as crises. É preciso monitorar sonolência, vertigem, ataxia, hiponatremia, alterações sanguíneas e hepáticas e o risco de Síndrome de Stevens-Johnson, além de encaminhar para acompanhamento médico. Se falhar, considero descompressão microvascular.' }
        ] }
    ]
  },

  {
    id: 'dtm-clinica',
    titulo: 'DTM: diagnóstico e tratamento clínico',
    disciplina: 'DTM · Cirurgia',
    intro: 'Reúne os sintomas mais comuns das disfunções temporomandibulares, a avaliação clínica da dor facial, a palpação muscular e articular e o tratamento clínico: medicamentos, dispositivo intraoral, métodos adjuvantes, open-lock e luxação recidivante.',
    secoes: [
      { t: 'Sintomas mais comuns', p: [
        'Cefaleia, otalgia e dor ou pressão atrás dos olhos.',
        'Clique (estalido) ou sensação de desencaixe ao abrir ou fechar a boca.',
        'Dor ao bocejar, ao abrir muito a boca ou ao mastigar.',
        'Mandíbula que trava ou sai do lugar; mudança brusca no encaixe dos dentes.'
      ]},
      { t: 'Avaliação da dor facial', p: [
        'Mais comum em adultos; mulheres procuram mais atendimento; prevalência de 13% a 26%.',
        'Dor nociceptiva: sistema nervoso íntegro sinalizando lesão tecidual (a mais comum).',
        'Dor neuropática: a origem é o próprio sistema nervoso, com tecidos íntegros.',
        'Dor mista: componentes nociceptivo e neuropático. Dor psicogênica: conceito problemático.',
        'Investigar: localização, intensidade (0 a 10: leve, moderada, forte), irradiação, duração, periodicidade, ritmo, fatores de melhora, piora e desencadeantes, sono, perfil emocional e grau de incapacidade.'
      ]},
      { t: 'Cefaleias', p: [
        'Aguda emergente: dor nova e súbita; atenção para causas secundárias.',
        'Aguda recorrente: enxaqueca e cefaleia em salvas.',
        'Crônica progressiva: geralmente secundária (neoplasias, arterites, doenças cervicais).',
        'Crônica não progressiva: abuso de analgésicos, pseudotumor cerebral, fator psicológico.'
      ]},
      { t: 'Exame clínico', p: [
        'Palpação do masseter (porções superior, média e inferior), temporal, região mandibular posterior, região submandibular e ventre anterior do digástrico.',
        'Área do tendão do temporal, do pterigoideo lateral e do ligamento posterior.',
        'Avaliação da ATM na abertura e fechamento, guia canina e protrusão.'
      ]},
      { t: 'Tratamento medicamentoso e de suporte', p: [
        'Repouso mandibular com dieta leve ou pastosa.',
        'Dor aguda: analgésicos e AINEs; relaxantes musculares.',
        'Dor crônica: antidepressivos tricíclicos (nortriptilina, amitriptilina) e anticonvulsivantes (pregabalina).',
        'Dor articular crônica leve a moderada: injeção intra-articular única de corticoide.',
        'Outras: TENS, agulhamento, acupuntura, terapia cognitivo-comportamental, toxina botulínica, bloqueios anestésicos.'
      ]},
      { t: 'Dispositivo intraoral (placa)', p: [
        'Removível, em resina acrílica, superfície lisa e polida, espaço interoclusal de 2 a 3 mm e contato preciso com o antagonista.',
        'Modelo convencional sem guias caninas; não precisa ser usado em tempo integral nem por mais de 45 dias, exceto no bruxismo idiopático.',
        'Objetivos: reduzir sintomas e hiperatividade muscular, prevenir desgaste, corrigir a relação côndilo–fossa e romper o ciclo das interferências.',
        'Confecção: moldagem superior e inferior, registro em cera nº 7, gesso pedra tipo III. Placa superior, ou na arcada com ausência dentária.',
        'Instalação: estável, sem báscula, cúspides vestibulares inferiores tocando por igual em MIC.',
        'Ajustes: lateralidade com guia canina no trabalho sem interferência no balanceio; protrusiva sem contato posterior. Semanais no 1º mês, depois quinzenais. Tratamento de 4 a 6 meses.'
      ]},
      { t: 'Métodos adjuvantes', p: [
        'Termoterapia (calor): 15 min, 3x/dia; alivia dor e espasmo e melhora a circulação.',
        'Crioterapia (frio): 10 a 15 min, 3x/dia, em pontos localizados.',
        'TENS: 15 a 30 min em masseter, temporal anterior e cervicais.',
        'Fonoforese (ultrassom com pomada anti-inflamatória), massagens (15 min, 3x/dia) e exercícios terapêuticos.',
        'Infiltração em pontos-gatilho (anestésico, corticoide) e toxina botulínica (relaxamento por 8 a 16 semanas).'
      ]},
      { t: 'Open-lock e luxação recidivante', p: [
        'Open-lock: incapacidade súbita de fechar a boca, sem dor na ATM ou nos músculos, por fricção entre disco e fossa. Na panorâmica, côndilo abaixo da eminência; na RM, disco posterior ao côndilo. Tratamento: artrocentese.',
        'Luxação recidivante: côndilo à frente da eminência, por estiramento ligamentar; mais em mulheres na 3ª década. Unilateral desvia o mento para o lado oposto.',
        'Redução: paciente sentado com a cabeça apoiada; polegares sobre os segundos molares inferiores; força para baixo com leve pressão para trás. Quanto mais cedo, mais fácil.'
      ]}
    ],
    dica: 'Monte a resposta como uma consulta: anamnese da dor → palpação muscular e articular → hipótese → tratamento reversível primeiro (repouso, medicação, placa, adjuvantes) e cirurgia só se refratário.',
    erros: [
      'Indicar placa por tempo indefinido sem controle (exceto no bruxismo idiopático).',
      'Confundir open-lock (côndilo abaixo da eminência) com luxação (côndilo à frente da eminência).',
      'Pular a anamnese da dor e ir direto para o tratamento.',
      'Esquecer que a luxação unilateral desvia o mento para o lado contrário.'
    ],
    termos: [
      ['Dor nociceptiva', 'Sistema nervoso íntegro sinalizando lesão tecidual.'],
      ['Dor neuropática', 'Origem no próprio sistema nervoso, com tecidos íntegros.'],
      ['Dispositivo intraoral', 'Placa de resina acrílica com espaço interoclusal de 2 a 3 mm.'],
      ['TENS', 'Estimulação elétrica nervosa transcutânea.'],
      ['Fonoforese', 'Ultrassom com pomada anti-inflamatória.'],
      ['Open-lock', 'Incapacidade súbita de fechar a boca por fricção entre disco e fossa.'],
      ['Luxação recidivante', 'Côndilo à frente da eminência por estiramento ligamentar, de forma repetida.'],
      ['Crioterapia', 'Aplicação de frio por 10 a 15 min, 3x/dia.'],
      ['Termoterapia', 'Aplicação de calor por 15 min, 3x/dia.']
    ],
    cards: [
      ['Cite quatro sintomas comuns de DTM.', 'Cefaleia, otalgia, estalido e dor ao mastigar ou bocejar (também travamento).'],
      ['Diferença entre dor nociceptiva e neuropática?', 'Nociceptiva: nervo íntegro sinaliza lesão. Neuropática: o problema está no próprio sistema nervoso.'],
      ['O que sugere uma cefaleia crônica progressiva?', 'Causa secundária (neoplasia, arterite, doença cervical).'],
      ['Qual o espaço interoclusal da placa?', '2 a 3 mm.'],
      ['Por quanto tempo usar a placa convencional?', 'Não precisa ser integral nem passar de 45 dias, exceto no bruxismo idiopático.'],
      ['Quais medicamentos para dor crônica?', 'Antidepressivos tricíclicos e anticonvulsivantes.'],
      ['Tempo da termoterapia?', '15 minutos, 3 vezes ao dia.'],
      ['O que é open-lock e qual o tratamento?', 'Incapacidade súbita de fechar a boca; artrocentese.'],
      ['Na luxação unilateral, para onde desvia o mento?', 'Para o lado contrário ao da luxação.'],
      ['Como reduzir a luxação?', 'Paciente sentado, polegares nos molares inferiores, força para baixo e leve para trás.']
    ],
    questoes: [
      { e: 'A dor em que os tecidos estão íntegros e a origem é o próprio sistema nervoso, periférico ou central, é classificada como:',
        a: ['Nociceptiva', 'Neuropática', 'Psicogênica', 'Referida'],
        c: 1,
        x: ['Errada: na nociceptiva o sistema nervoso está íntegro e sinaliza lesão.', 'Correta.', 'Errada: é um conceito problemático e não é essa a definição.', 'Errada: refere-se ao local onde a dor é sentida.'],
        g: ['tecidos íntegros', 'próprio sistema nervoso'] },
      { e: 'Sobre o dispositivo intraoral convencional para DTM, é correto:',
        a: ['Deve ter guias caninas e ser usado 24 h por tempo indeterminado', 'Espaço interoclusal de 2 a 3 mm e uso não superior a 45 dias, exceto no bruxismo idiopático', 'É feito em gesso pedra tipo III', 'Deve ter superfície rugosa'],
        c: 1,
        x: ['Errada: o modelo convencional não tem guias caninas e não é de uso integral indefinido.', 'Correta: conforme a aula.', 'Errada: o gesso é usado no modelo; a placa é de resina acrílica.', 'Errada: a superfície deve ser lisa e polida.'],
        g: ['dispositivo intraoral'] },
      { e: 'Paciente não consegue fechar a boca de repente, sem dor. A panorâmica mostra o côndilo abaixo da eminência e a RM mostra o disco posterior ao côndilo. O diagnóstico e o tratamento são:',
        a: ['Luxação recidivante; eminectomia', 'Open-lock; artrocentese', 'Deslocamento sem redução; placa', 'Anquilose; artroplastia'],
        c: 1,
        x: ['Errada: na luxação o côndilo fica À FRENTE da eminência.', 'Correta: open-lock é tratado com artrocentese.', 'Errada: no deslocamento sem redução há limitação de ABERTURA.', 'Errada: anquilose é fusão, com limitação de abertura.'],
        g: ['não consegue fechar', 'abaixo da eminência', 'disco posterior'] },
      { e: 'Na luxação unilateral da ATM, o mento desvia:',
        a: ['Para o mesmo lado da luxação', 'Para o lado contralateral à luxação', 'Não desvia', 'Para cima'],
        c: 1,
        x: ['Errada.', 'Correta: o côndilo luxado vai à frente e empurra o mento para o lado oposto.', 'Errada: na unilateral há desvio.', 'Errada.'],
        g: ['unilateral', 'mento'] },
      { e: 'Para dor crônica na DTM, a aula indica principalmente:',
        a: ['Antibióticos', 'Antidepressivos tricíclicos e anticonvulsivantes', 'Apenas AINEs', 'Corticoide oral contínuo'],
        c: 1,
        x: ['Errada: não há infecção.', 'Correta.', 'Errada: AINEs e analgésicos são para dor aguda.', 'Errada: o corticoide é citado como injeção intra-articular única.'],
        g: ['dor crônica'] },
      { e: 'Uma cefaleia crônica progressiva geralmente indica:',
        a: ['Enxaqueca simples', 'Causa secundária, como neoplasias ou arterites', 'Uso de placa oclusal', 'Bruxismo'],
        c: 1,
        x: ['Errada: enxaqueca é causa de cefaleia aguda recorrente.', 'Correta: deve-se investigar secundariedade.', 'Errada.', 'Errada.'],
        g: ['crônica progressiva'] },
      { e: 'A termoterapia (calor) como método adjuvante na DTM é feita:',
        a: ['Por 15 minutos, 3 vezes ao dia', 'Por 1 hora contínua', 'Apenas uma vez por semana', 'Só no consultório, com ultrassom'],
        c: 0,
        x: ['Correta.', 'Errada.', 'Errada.', 'Errada: ultrassom com pomada é fonoforese.'],
        g: ['termoterapia'] }
    ],
    casos: [
      { t: 'Estalido, dor ao mastigar e dor de cabeça',
        paciente: 'Paciente, 30 anos, sexo feminino',
        fala: 'Minha mandíbula estala, dói quando eu mastigo carne e no fim do dia fico com dor de cabeça nas têmporas.',
        dados: [['Ruído', 'Estalido na abertura'], ['Palpação', 'Dor em masseter e temporal'], ['Hábitos', 'Relata apertar os dentes'], ['Abertura', 'Sem limitação']],
        perguntas: [
          { p: 'Na anamnese da dor, o que você investigaria?',
            esp: [
              ['Localização e irradiação', ['localiza', 'irradia']],
              ['Intensidade (escala 0 a 10)', ['intensidade', 'escala', '0 a 10']],
              ['Duração, periodicidade e ritmo', ['duracao', 'periodic', 'ritmo', 'frequenc']],
              ['Fatores de melhora, piora e desencadeantes', ['melhora', 'piora', 'desencade']],
              ['Sono, perfil emocional e incapacidade', ['sono', 'emocion', 'estresse', 'incapacid']]
            ],
            modelo: 'Eu investigaria a localização da dor e se ela irradia, a intensidade numa escala de 0 a 10, classificando em leve, moderada ou forte, e a duração, a periodicidade e o ritmo. Também perguntaria o que melhora, o que piora e o que desencadeia a dor, como mastigar ou apertar os dentes. Por fim, a relação com o sono, o perfil emocional, os tratamentos já feitos e o quanto a dor atrapalha a rotina. Depois faria a palpação do masseter, do temporal e da ATM na abertura e no fechamento.' },
          { p: 'Qual seria o seu plano de tratamento clínico inicial?',
            esp: [
              ['Repouso mandibular e dieta pastosa', ['repouso', 'dieta', 'pastosa']],
              ['Medicação (AINE / relaxante muscular)', ['aine', 'anti-inflamat', 'antiinflamat', 'relaxante', 'analges']],
              ['Dispositivo intraoral (placa)', ['placa', 'dispositivo']],
              ['Adjuvantes: calor, frio, massagem, exercícios, fisioterapia', ['calor', 'termoterap', 'crioterap', 'massag', 'exercic', 'fisioter']]
            ],
            modelo: 'Começaria por medidas reversíveis: repouso mandibular com dieta leve ou pastosa e orientação para evitar apertar os dentes. Para a dor aguda, anti-inflamatório e, se necessário, relaxante muscular. Indicaria um dispositivo intraoral em resina acrílica, com espaço interoclusal de 2 a 3 mm e ajustes periódicos. Como adjuvantes, termoterapia de 15 minutos três vezes ao dia, massagens e exercícios terapêuticos, com apoio de fisioterapia. A cirurgia só seria considerada se o quadro fosse refratário.' }
        ] },
      { t: 'Boca travada aberta após bocejar',
        paciente: 'Paciente, 27 anos, sexo feminino',
        fala: 'Eu bocejei e minha boca não fecha mais! Já aconteceu outras vezes.',
        dados: [['Situação', 'Boca aberta, não consegue fechar'], ['Mento', 'Desviado para a esquerda'], ['Histórico', 'Episódios anteriores']],
        perguntas: [
          { p: 'Qual a hipótese diagnóstica e como você faria a redução?',
            esp: [
              ['Luxação (recidivante) da ATM', ['luxa']],
              ['Côndilo à frente da eminência / lado direito', ['eminencia', 'direit']],
              ['Paciente sentado com cabeça apoiada', ['sentad', 'apoiad', 'parede']],
              ['Polegares nos molares inferiores, força para baixo e para trás', ['polegar', 'molar', 'para baixo', 'para tras', 'posterior']]
            ],
            modelo: 'A hipótese é luxação recidivante da ATM: o côndilo passou à frente da eminência articular por estiramento ligamentar. Como o mento está desviado para a esquerda, a luxação é do lado direito, porque o desvio é para o lado contrário. Para reduzir, coloco a paciente sentada com a cabeça apoiada na parede, posiciono os polegares sobre os segundos molares inferiores e aplico força para baixo com discreta pressão para trás. Quanto mais cedo, mais fácil a redução.' },
          { p: 'Como diferenciar esse quadro de um open-lock?',
            esp: [
              ['Open-lock: côndilo abaixo da eminência', ['abaixo']],
              ['Open-lock: disco posterior ao côndilo na RM', ['disco posterior', 'posterior ao condilo', 'ressonanc']],
              ['Luxação: côndilo à frente da eminência', ['frente', 'anterior']],
              ['Tratamento do open-lock: artrocentese', ['artrocentese']]
            ],
            modelo: 'Os dois causam incapacidade de fechar a boca. No open-lock, a panorâmica mostra o côndilo abaixo da eminência, e a ressonância mostra o disco posicionado atrás do côndilo, por fricção aumentada entre disco e fossa; não há dor na ATM nem nos músculos, e o tratamento é artrocentese. Na luxação recidivante, o côndilo está à frente da eminência articular. Para a luxação de repetição, a eminectomia é uma opção cirúrgica.' }
        ] }
    ]
  },

  {
    id: 'exames-imagem',
    titulo: 'Exames de imagem da ATM',
    disciplina: 'DTM · Cirurgia',
    intro: 'Quais exames de imagem usar para a ATM, o que cada um mostra, suas vantagens, desvantagens e contraindicações, lembrando que o diagnóstico depende da correlação com anamnese, exame clínico e neurológico.',
    secoes: [
      { t: 'Radiografias convencionais', p: [
        'Transfacial, transcraniana e transorbital: práticas na rotina da clínica ambulatorial.',
        'Também: axial de Hirtz, posteroanterior (Towne invertida) e anteroposterior (Towne convencional).',
        'As tomadas devem ser sempre bilaterais, em boca fechada e aberta.',
        'A panorâmica também é usada para uma visão geral.'
      ]},
      { t: 'Ressonância magnética: indicações e vantagens', p: [
        'Indicada para estudo dos reparos anatômicos e processos degenerativos dos componentes da articulação.',
        'Não usa radiação ionizante e não é invasiva.',
        'Alta resolução de tecidos moles; imagens multiplanares (axial, sagital, coronal).',
        'Mostra diretamente o disco articular, detecta lesões invisíveis ao raio X, define melhor a medula óssea e permite estudos dinâmicos.'
      ]},
      { t: 'Ressonância magnética: desvantagens e contraindicações', p: [
        'Alto custo do equipamento e do exame; diagnóstico inconclusivo de perfuração do disco; exame demorado.',
        'Pode exigir sedação em claustrofóbicos e mais experiência do profissional.',
        'Contraindicações: clipes de aneurisma e hemostáticos (se paramagnéticos), próteses auriculares, marca-passo, corpos estranhos em zonas nobres (cérebro, olho), implantes otológicos e gestantes com menos de 12 semanas (FDA).'
      ]},
      { t: 'Sequências T1, T2 e DP', p: [
        'T1: tempo para a magnetização longitudinal voltar ao equilíbrio após o pulso de 90º; é a imagem anatômica.',
        'T2: tempo para a magnetização transversal voltar ao menor estado de energia; é a imagem patológica. Relaxação longa = hipersinal (claro); curta = hipossinal (escuro).',
        'Densidade de prótons (DP): intermediária entre T1 e T2; o disco articular fica bem visível.',
        'Em DP, é possível ver o disco anteriorizado em boca fechada e sua recaptura na abertura máxima.'
      ]},
      { t: 'Artrografia e tomografia', p: [
        'Artrografia: com fluoroscopia, mostra a dinâmica do disco nos movimentos. É invasiva (contraste nos espaços articulares).',
        'Indicada na suspeita de mau posicionamento do disco: deslocamento anterior, perfuração, alterações degenerativas e adesões.',
        'Tomografia computadorizada (cone beam e fan beam): melhor para os componentes ÓSSEOS da ATM.',
        'Exemplos de achados: condrossarcoma e anquilose da ATM.'
      ]},
      { t: 'Há um exame mais eficiente?', p: [
        'O diagnóstico depende da correlação entre anamnese, exame clínico e exame neurológico.',
        'Na suspeita de arterite temporal: hemograma completo, VHS e proteína C reativa.',
        'Quando é preciso imagem, a ressonância magnética tem se tornado ferramenta importante.'
      ]}
    ],
    dica: 'Relacione o exame à estrutura: disco e tecidos moles → RM; osso → TC; triagem → radiografias bilaterais. Sempre cite as contraindicações da RM.',
    erros: [
      'Pedir tomografia para avaliar posição do disco (o exame indicado é a RM).',
      'Esquecer que as radiografias devem ser bilaterais.',
      'Não perguntar sobre marca-passo, clipes e gestação antes da RM.',
      'Dizer que a artrografia é não invasiva.'
    ],
    termos: [
      ['Hipersinal', 'Imagem clara na RM.'],
      ['Hipossinal', 'Imagem escura na RM.'],
      ['T1', 'Sequência anatômica (relação próton/tecido).'],
      ['T2', 'Sequência patológica (relação próton/próton).'],
      ['Densidade de prótons (DP)', 'Sequência intermediária em que o disco fica bem visível.'],
      ['Artrografia', 'Exame invasivo com contraste e fluoroscopia para ver a dinâmica do disco.'],
      ['Cone beam', 'Tomografia de feixe cônico, boa para osso.'],
      ['Recaptura do disco', 'Retorno do disco à posição sobre o côndilo na abertura.']
    ],
    cards: [
      ['Quais radiografias convencionais são práticas na clínica?', 'Transfacial, transcraniana e transorbital, sempre bilaterais.'],
      ['Qual o melhor exame para ver o disco?', 'Ressonância magnética.'],
      ['Cite duas vantagens da RM.', 'Sem radiação ionizante e alta resolução de tecidos moles.'],
      ['Cite três contraindicações da RM.', 'Marca-passo, clipes de aneurisma paramagnéticos e gestação abaixo de 12 semanas.'],
      ['T1 ou T2: qual é a imagem patológica?', 'T2.'],
      ['Em qual sequência o disco fica mais visível?', 'Densidade de prótons (DP).'],
      ['Qual exame é melhor para estrutura óssea?', 'Tomografia computadorizada (cone beam ou fan beam).'],
      ['A artrografia é invasiva?', 'Sim; usa contraste e fluoroscopia.'],
      ['Na suspeita de arterite temporal, o que pedir?', 'Hemograma, VHS e proteína C reativa.'],
      ['Qual desvantagem da RM no disco?', 'Diagnóstico inconclusivo de perfuração do disco.']
    ],
    questoes: [
      { e: 'Para avaliar a posição do disco articular em um paciente com estalido, o exame de escolha é:',
        a: ['Radiografia transcraniana', 'Tomografia cone beam', 'Ressonância magnética', 'Panorâmica'],
        c: 2,
        x: ['Errada: mostra o osso, não o disco.', 'Errada: é melhor para estruturas ósseas.', 'Correta: observa diretamente o disco e tecidos moles.', 'Errada: é de triagem e não mostra o disco.'],
        g: ['posição do disco'] },
      { e: 'É contraindicação para ressonância magnética:',
        a: ['Restauração em resina', 'Marca-passo cardíaco', 'Uso de aparelho ortodôntico removível', 'Paciente com mais de 60 anos'],
        c: 1,
        x: ['Errada.', 'Correta: há interferência com marca-passos.', 'Errada: aparelho removível pode ser retirado.', 'Errada: idade não é contraindicação.'],
        g: ['contraindicação'] },
      { e: 'Na ressonância magnética, a sequência considerada "imagem patológica", em que tecidos com relaxação longa aparecem em hipersinal, é:',
        a: ['T1', 'T2', 'Densidade de prótons', 'Fluoroscopia'],
        c: 1,
        x: ['Errada: T1 é a imagem anatômica.', 'Correta.', 'Errada: DP é intermediária e destaca o disco.', 'Errada: não é sequência de RM.'],
        g: ['patológica', 'hipersinal'] },
      { e: 'A tomografia computadorizada (cone beam e fan beam) é indicada principalmente para avaliar:',
        a: ['Posição do disco', 'Componentes ósseos da ATM', 'Líquido sinovial', 'Músculos da mastigação'],
        c: 1,
        x: ['Errada: disco é na RM.', 'Correta.', 'Errada.', 'Errada.'],
        g: ['tomografia'] },
      { e: 'Sobre a artrografia da ATM, é correto:',
        a: ['É não invasiva e sem contraste', 'Associada à fluoroscopia, mostra a dinâmica do disco, mas é invasiva', 'É o melhor exame para osso', 'Substitui a anamnese'],
        c: 1,
        x: ['Errada: usa contraste e é invasiva.', 'Correta.', 'Errada: osso é melhor na TC.', 'Errada: nenhum exame substitui a anamnese.'],
        g: ['artrografia'] },
      { e: 'Sobre as radiografias convencionais da ATM, é correto:',
        a: ['Devem ser feitas apenas do lado sintomático', 'As tomadas devem ser sempre bilaterais', 'Mostram o disco articular com clareza', 'Não têm uso clínico'],
        c: 1,
        x: ['Errada.', 'Correta: tomadas bilaterais em qualquer técnica.', 'Errada: radiografias não mostram o disco.', 'Errada: são práticas na clínica ambulatorial.'],
        g: ['radiografias convencionais'] },
      { e: 'Na suspeita de arterite temporal, antes da imagem, devem ser solicitados:',
        a: ['Panorâmica e periapical', 'Hemograma, VHS e proteína C reativa', 'Artrografia', 'Teste de vitalidade pulpar'],
        c: 1,
        x: ['Errada.', 'Correta.', 'Errada.', 'Errada.'],
        g: ['arterite temporal'] }
    ],
    casos: [
      { t: 'Suspeita de deslocamento de disco',
        paciente: 'Paciente, 34 anos, sexo feminino',
        fala: 'Minha mandíbula estala ao abrir e às vezes parece que trava um pouquinho antes de abrir tudo.',
        dados: [['Ruído', 'Estalido na abertura e no fechamento'], ['Histórico', 'Usa marca-passo? a confirmar'], ['Hipótese', 'Deslocamento de disco com redução']],
        perguntas: [
          { p: 'Qual exame de imagem você pediria e por quê?',
            esp: [
              ['Ressonância magnética', ['ressonanc']],
              ['Mostra o disco / tecidos moles', ['disco', 'tecido mole', 'tecidos moles']],
              ['Sem radiação ionizante, não invasiva', ['radiacao', 'invasiv']],
              ['Boca fechada e aberta / recaptura (DP)', ['boca fechada', 'abertura', 'recaptur', 'densidade de protons', ' dp ']]
            ],
            modelo: 'Eu pediria uma ressonância magnética, porque é o exame que mostra diretamente o disco articular e os tecidos moles, sem radiação ionizante e de forma não invasiva. Pediria imagens em boca fechada e em abertura máxima: na sequência de densidade de prótons dá para ver o disco anteriorizado em boca fechada e se ele é recapturado na abertura, o que confirma um deslocamento com redução. Radiografias e tomografia mostram osso, mas não o disco.' },
          { p: 'O que você precisa perguntar à paciente antes de encaminhá-la para a RM?',
            esp: [
              ['Marca-passo', ['marca-passo', 'marcapasso', 'marca passo']],
              ['Clipes de aneurisma / metais / corpos estranhos', ['clipe', 'metal', 'corpo estranho', 'corpos estranhos']],
              ['Implantes otológicos / próteses auriculares', ['otolog', 'auricular']],
              ['Gestação (menos de 12 semanas)', ['gestant', 'gravid', 'gestacao']],
              ['Claustrofobia (sedação)', ['claustrof', 'sedac']]
            ],
            modelo: 'Antes da ressonância eu perguntaria se ela usa marca-passo cardíaco, se tem clipes de aneurisma ou hemostáticos metálicos, corpos estranhos no olho ou no cérebro, implantes otológicos ou próteses auriculares, porque são contraindicações. Também perguntaria se está grávida, já que gestantes com menos de 12 semanas não devem fazer o exame, e se tem claustrofobia, que pode exigir sedação.' }
        ] }
    ]
  },

  {
    id: 'tratamento-cirurgico',
    titulo: 'Tratamento cirúrgico da DTM',
    disciplina: 'Cirurgia',
    intro: 'Apresenta as opções minimamente invasivas (artrocentese e viscossuplementação), os acessos cirúrgicos à ATM, os desarranjos internos (deslocamento de disco com e sem redução) e as cirurgias: artroscopia, discopexia e eminectomia.',
    secoes: [
      { t: 'Artrocentese', p: [
        'Lavagem do compartimento superior da ATM com soro fisiológico ou Ringer lactato, com ou sem medicamentos (anti-inflamatório, opioide, corticoide, viscoelástico).',
        'Restabelece a abertura de boca e alivia a dor; anestesia local ou geral, com agulhas transcutâneas.',
        'Usada em deslocamento de disco, ancoragem do disco, open-lock, sinovite, condromalácia e osteoartrite.',
        'Indicada em casos refratários ao tratamento clínico, quando o paciente recusa cirurgia aberta, ou no pós-operatório de artroscopia.',
        'Objetivos: afastar disco e fossa, liberar aderências e lavar partículas e mediadores inflamatórios (fosfolipase A2, espécies reativas de oxigênio).',
        'Volumes de 50 a 200 mL foram efetivos, sem diferença estatística após 1 ano.'
      ]},
      { t: 'Técnicas e complicações da artrocentese', p: [
        'Nitzan (2 agulhas): 1ª a 10 mm à frente do trágus e 2 mm abaixo da linha trágus–canto do olho; 2ª a 20 mm à frente e 10 mm abaixo.',
        'Laskin (2 agulhas): 1ª igual; 2ª a 4 mm à frente e 14 mm abaixo da linha.',
        'Complicações: falha na introdução da agulha, edema por extravasamento, equimose ou hematoma, paresia dos ramos zigomático ou temporal do nervo facial pela anestesia, paralisia (rara) e fratura do instrumento.',
        'O resultado depende da duração e intensidade da dor e da abertura máxima de boca.'
      ]},
      { t: 'Viscossuplementação', p: [
        'Injeção intra-articular de hialuronato de sódio; minimamente invasiva.',
        'Busca diminuir a dor e melhorar a função, qualificando o líquido sinovial.',
        'Indicações: deslocamento agudo ou crônico com ou sem redução, osteoartrose, osteoartrite e doença articular degenerativa.',
        'Na doença, metaloproteinases degradam colágeno e proteoglicanos, enfraquecendo a cartilagem e gerando inflamação sinovial.'
      ]},
      { t: 'Acessos cirúrgicos', p: [
        'Indicações de exposição: desarranjos internos, artrites e degenerações, traumatismos, alterações de desenvolvimento e neoplasias.',
        'Pré-auricular: lidocaína com epinefrina 1:200.000 no subcutâneo; incisão na fáscia temporal e descolamento do periósteo do arco zigomático até a cápsula. Ex.: hiperplasia condilar ativa, fratura de côndilo com grande deslocamento medial.',
        'Endoaural: inicia 1 a 1,5 mm medial à borda lateral do trágus, pela porção avascular anterior ao meato acústico.',
        'Extensão de Al-Kayat e Bramley: semicírculo na região temporal para evitar vasos temporais; indicada para anquilose, tumores de côndilo, remoção de coronoide e reconstrução do côndilo.'
      ]},
      { t: 'Desarranjos internos', p: [
        'Muito comuns; o deslocamento anteromedial do disco é o mais frequente.',
        'Pode causar estalos, crepitação, inflamação, artrite, reabsorção condilar, má oclusão e compressão da zona bilaminar com dor.',
        'Classificação: intra-articular (deslocamento do disco) e extra-articular (dor miofascial).',
        'Com redução: o disco é recapturado na abertura com estalo, a abertura é adequada e pode haver novo estalo no fechamento.',
        'Sem redução: evolução do caso não tratado; o disco é forçado anteromedialmente pelo pterigoideo lateral, com limitação de abertura (25 a 30 mm), deflexão para o lado afetado e dor.',
        'A dor articular é bem localizada; a miofascial é difusa e pode irradiar.'
      ]},
      { t: 'Tratamento escalonado', p: [
        'Dor miofascial e deslocamento com redução: tratamento clínico (placa + controle do estresse).',
        'Sem redução em fase inicial: pode ser clínico, com placa reposicionadora anterior.',
        'Sem redução em fase avançada, com aderências e degeneração do disco ou das superfícies: tratamento cirúrgico.'
      ]},
      { t: 'Artroscopia, discopexia e eminectomia', p: [
        'Artroscopia: cânula no espaço articular superior e artroscópio para ver fossa, espaço superior e disco. O 1º portal é puncionado no ponto A da linha de Holmlund-Hellsing.',
        'Diagnóstica: dor intra-articular persistente, confirmar hiper/hipomobilidade, estalos, artrite sistêmica, invasão tumoral.',
        'Operatória: desarranjos refratários, biópsia, sinovite, doença degenerativa, closed lock, lise/plastia, trauma e injeções sob visão direta.',
        'Discopexia: reposiciona o disco suturando-o aos tecidos retrodiscais, diretamente ou com miniâncoras no aspecto posterior do côndilo.',
        'Eminectomia: técnica de primeira escolha para luxação recidivante; preserva a articulação, é simples, extracapsular, por acesso pré-auricular e com baixa recidiva.'
      ]}
    ],
    dica: 'Mostre raciocínio em escada: clínico → minimamente invasivo (artrocentese, viscossuplementação) → artroscopia → cirurgia aberta (discopexia, eminectomia). Sempre justifique o degrau pela fase da doença.',
    erros: [
      'Indicar cirurgia aberta como primeira opção.',
      'Confundir deslocamento com redução (estalo, abertura normal) e sem redução (limitação de 25 a 30 mm).',
      'Dizer que a deflexão no deslocamento sem redução é para o lado sadio (é para o lado afetado).',
      'Esquecer a eminectomia como primeira escolha cirúrgica na luxação recidivante.'
    ],
    termos: [
      ['Artrocentese', 'Lavagem do compartimento superior da ATM com soro ou Ringer lactato.'],
      ['Viscossuplementação', 'Injeção intra-articular de hialuronato de sódio.'],
      ['Closed lock', 'Travamento com limitação de abertura (deslocamento sem redução).'],
      ['Artroscopia', 'Visualização e tratamento da articulação por artroscópio.'],
      ['Linha de Holmlund-Hellsing', 'Referência para a punção do 1º portal da artroscopia (ponto A).'],
      ['Discopexia', 'Reposicionamento e fixação do disco por sutura ou âncoras.'],
      ['Eminectomia', 'Remoção da eminência articular; 1ª escolha na luxação recidivante.'],
      ['Acesso pré-auricular', 'Acesso cirúrgico clássico à ATM, à frente da orelha.'],
      ['Al-Kayat e Bramley', 'Extensão do acesso para anquilose e tumores de côndilo.']
    ],
    cards: [
      ['O que é a artrocentese?', 'Lavagem do compartimento superior da ATM com soro ou Ringer lactato.'],
      ['Quais os objetivos da artrocentese?', 'Afastar disco e fossa, liberar aderências e lavar mediadores inflamatórios.'],
      ['Quantas agulhas nas técnicas de Nitzan e Laskin?', 'Duas.'],
      ['O que se injeta na viscossuplementação?', 'Hialuronato de sódio.'],
      ['Qual o desarranjo interno mais frequente?', 'Deslocamento anteromedial do disco.'],
      ['Como é a abertura no deslocamento sem redução?', 'Limitada a 25 a 30 mm, com deflexão para o lado afetado.'],
      ['Onde é feito o 1º portal da artroscopia?', 'No ponto A da linha de Holmlund-Hellsing.'],
      ['O que é discopexia?', 'Sutura do disco aos tecidos retrodiscais, direta ou com miniâncoras.'],
      ['Qual a cirurgia de escolha na luxação recidivante?', 'Eminectomia.'],
      ['Para que serve a extensão de Al-Kayat e Bramley?', 'Anquilose, tumores de côndilo, remoção de coronoide e reconstrução condilar.']
    ],
    questoes: [
      { e: 'A artrocentese da ATM consiste em:',
        a: ['Remoção da eminência articular', 'Lavagem do compartimento superior com soro fisiológico ou Ringer lactato', 'Sutura do disco com âncoras', 'Injeção de toxina botulínica no masseter'],
        c: 1,
        x: ['Errada: isso é eminectomia.', 'Correta.', 'Errada: isso é discopexia.', 'Errada: é outra modalidade.'],
        g: ['artrocentese'] },
      { e: 'Paciente com limitação de abertura de 27 mm e deflexão da mandíbula para o lado direito ao abrir. A hipótese mais provável é:',
        a: ['Deslocamento de disco com redução à direita', 'Deslocamento de disco sem redução à direita', 'Luxação recidivante à esquerda', 'Open-lock'],
        c: 1,
        x: ['Errada: na redução a abertura é adequada e há estalo.', 'Correta: abertura de 25 a 30 mm e deflexão para o lado afetado.', 'Errada: na luxação o paciente não fecha a boca.', 'Errada: no open-lock o paciente não consegue FECHAR.'],
        g: ['limitação', '27 mm', 'deflexão'] },
      { e: 'Na viscossuplementação da ATM é injetado:',
        a: ['Corticoide de depósito', 'Hialuronato de sódio', 'Anestésico com vasoconstritor', 'Soro fisiológico apenas'],
        c: 1,
        x: ['Errada.', 'Correta.', 'Errada.', 'Errada: lavagem com soro é a artrocentese.'],
        g: ['viscossuplementação'] },
      { e: 'Qual a técnica cirúrgica de primeira escolha para a luxação recidivante da ATM?',
        a: ['Discopexia', 'Eminectomia', 'Condilectomia', 'Artroscopia diagnóstica'],
        c: 1,
        x: ['Errada: reposiciona o disco.', 'Correta: preserva a articulação, simples e com baixa recidiva.', 'Errada.', 'Errada.'],
        g: ['luxação recidivante'] },
      { e: 'Na artroscopia da ATM, o ponto de punção do primeiro portal é referenciado pela:',
        a: ['Linha de Holmlund-Hellsing', 'Linha de Frankfurt', 'Técnica de Nitzan', 'Extensão de Al-Kayat'],
        c: 0,
        x: ['Correta: ponto A.', 'Errada.', 'Errada: é técnica de artrocentese.', 'Errada: é extensão de acesso aberto.'],
        g: ['artroscopia', 'primeiro portal'] },
      { e: 'A extensão de Al-Kayat e Bramley é indicada principalmente para:',
        a: ['Artrocentese', 'Anquilose da ATM e tumores do côndilo', 'Viscossuplementação', 'Ajuste de placa'],
        c: 1,
        x: ['Errada: a artrocentese é por punção.', 'Correta.', 'Errada.', 'Errada.'],
        g: ['Al-Kayat'] },
      { e: 'Deslocamento anterior de disco SEM redução em fase avançada, com aderência intracapsular e degeneração do disco, deve ser tratado com:',
        a: ['Apenas placa estabilizadora', 'Tratamento cirúrgico', 'Somente termoterapia', 'Exodontia de terceiros molares'],
        c: 1,
        x: ['Errada: placa é para fase inicial.', 'Correta.', 'Errada: é adjuvante.', 'Errada: não tem relação.'],
        g: ['fase avançada', 'aderência'] }
    ],
    casos: [
      { t: 'Travamento com limitação de abertura',
        paciente: 'Paciente, 32 anos, sexo feminino',
        fala: 'Antes minha mandíbula estalava. Agora parou de estalar, mas não consigo abrir a boca direito e dói do lado direito.',
        dados: [['Abertura', '27 mm'], ['Trajetória', 'Deflexão para a direita'], ['Histórico', 'Estalido prévio, tratado sem acompanhamento'], ['Tratamento clínico', 'Placa por 4 meses sem melhora']],
        perguntas: [
          { p: 'Qual a hipótese diagnóstica e qual o mecanismo?',
            esp: [
              ['Deslocamento anterior do disco sem redução', ['sem reducao']],
              ['Evolução do deslocamento com redução (estalido prévio)', ['com reducao', 'evolu', 'estal']],
              ['Pterigoideo lateral força o disco anteromedialmente', ['pterigoid', 'anteromedial', 'anterior']],
              ['Limitação de abertura e deflexão para o lado afetado', ['limita', 'deflex', '25', '30']]
            ],
            modelo: 'A hipótese é deslocamento anterior do disco sem redução à direita. O estalido anterior indica que havia um deslocamento com redução, que evoluiu sem tratamento adequado. Na translação, o disco é forçado anteromedialmente pela hiperatividade do pterigoideo lateral e deixa de ser recapturado, por isso o estalido parou. O movimento passa a ser só de rotação, a abertura fica em 25 a 30 mm, a mandíbula desvia para o lado afetado e há compressão dos tecidos retrodiscais, causando dor.' },
          { p: 'Como o tratamento clínico falhou, qual seria a conduta?',
            esp: [
              ['Artrocentese como opção minimamente invasiva', ['artrocentese']],
              ['Viscossuplementação (hialuronato de sódio)', ['viscossup', 'viscosup', 'hialuron']],
              ['Artroscopia', ['artroscop']],
              ['Cirurgia aberta (discopexia) se avançado/aderências', ['discopex', 'cirurgia aberta', 'aderenc']]
            ],
            modelo: 'Como é um caso refratário ao tratamento clínico, o próximo passo é a artrocentese: lavagem do compartimento superior com Ringer lactato para afastar disco e fossa, liberar aderências e remover mediadores inflamatórios, podendo associar viscossuplementação com hialuronato de sódio. Se não houver melhora, a artroscopia permite diagnosticar e tratar sob visão direta. Em fase avançada, com aderências e degeneração, indica-se cirurgia aberta por acesso pré-auricular, como a discopexia.' }
        ] }
    ]
  }
];
