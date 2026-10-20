// Casos da prova oral: um paciente (ator) faz três perguntas diretas e o site mostra como responder.
//   1. O que pode ser?   2. Por que está acontecendo?   3. O que vamos fazer?
// As respostas-modelo são curtas e faladas para o paciente, em palavras simples.
//
// Formato: { t, paciente, fala, dados: [[rótulo, valor]], perguntas: [{ p, esp: [[ponto que não pode faltar, [palavras-chave]]], modelo }] }
// O site mostra a pergunta, a resposta-modelo (modelo) e os pontos (esp). As palavras-chave ficam guardadas caso se volte a corrigir respostas escritas.

window.CASOS = {
  'anatomia-atm': [
    { t: 'Estalo ao abrir a boca',
      paciente: 'Paciente, 28 anos, sexo feminino',
      fala: 'Quando eu abro a boca, alguma coisa estala aqui na frente da orelha. Não dói muito, mas me incomoda.',
      dados: [['Local', 'Frente da orelha, lado direito'], ['Abertura', 'Normal, sem travar'], ['Hábitos', 'Masca chiclete todo dia']],
      perguntas: [
        { p: 'Doutor(a), o que é esse estalo? É grave?',
          esp: [
            ['Vem da ATM (articulação da mandíbula)', ['atm', 'articula']],
            ['Disco deslocado que volta ao lugar (com redução)', ['disco', 'desloca']],
            ['Não é grave / é comum / tem tratamento', ['nao e grave', 'comum', 'tratamento', 'tratavel']]
          ],
          modelo: 'Esse estalo vem da sua ATM, a articulação da mandíbula. O mais provável é que o disco que fica entre os ossos esteja um pouco deslocado para a frente e volte ao lugar quando você abre a boca, fazendo o barulho. Chamamos de deslocamento de disco com redução. É comum e tem tratamento.' },
        { p: 'Mas por que isso acontece?',
          esp: [
            ['O disco funciona como uma almofada entre os ossos', ['almofada', 'amortec', 'choque']],
            ['Músculo (pterigoideo lateral) puxa o disco para a frente', ['pterigoid', 'musculo']],
            ['Hábitos: chiclete, apertar os dentes, estresse', ['chiclete', 'apert', 'bruxis', 'estresse', 'habito']]
          ],
          modelo: 'Entre a mandíbula e o crânio existe um disco, como uma almofada, que amortece os movimentos. Ele fica preso na frente a um músculo, o pterigoideo lateral. Quando esse músculo trabalha demais, por mascar chiclete, apertar os dentes ou estresse, o disco sai um pouco da posição e estala.' },
        { p: 'E o que eu faço para melhorar?',
          esp: [
            ['Parar o chiclete / evitar abrir muito / comida macia', ['chiclete', 'evitar', 'macia', 'pastosa', 'abrir muito']],
            ['Compressa morna e exercícios', ['compressa', 'calor', 'morna', 'exercic', 'massag']],
            ['Placa se tiver dor; ressonância se precisar', ['placa', 'dispositivo', 'ressonanc']],
            ['Voltar se travar', ['retorn', 'volte', 'voltar', 'travar', 'acompanh']]
          ],
          modelo: 'Primeiro, pare com o chiclete e evite abrir muito a boca e comer coisas duras. Compressa morna e exercícios leves ajudam o músculo a relaxar. Se começar a doer, faço uma placa para usar à noite e, se precisar, peço uma ressonância para ver o disco. Se a boca travar algum dia, volte logo.' }
      ] },
    { t: 'Pancada no queixo',
      paciente: 'Paciente, 22 anos, sexo masculino',
      fala: 'Caí de bicicleta ontem e bati o queixo. Agora dói aqui na frente da orelha quando eu mastigo.',
      dados: [['Trauma', 'Queda de bicicleta há 1 dia'], ['Dor', 'Frente da orelha, ao mastigar'], ['Mordida', 'Encaixe dos dentes normal']],
      perguntas: [
        { p: 'Doutor(a), o que eu tenho?',
          esp: [
            ['Inflamação na ATM pela pancada', ['inflama', 'atm', 'articula']],
            ['Precisa descartar fratura do côndilo', ['fratura', 'condilo', 'quebr']]
          ],
          modelo: 'A pancada no queixo subiu até a articulação da mandíbula, aqui na frente da orelha. O mais provável é uma inflamação na ATM. Mas como foi um trauma, preciso descartar uma fratura do côndilo, que é a ponta da mandíbula que fica dentro da articulação.' },
        { p: 'Por que dói aqui perto da orelha se eu bati no queixo?',
          esp: [
            ['O impacto empurra o côndilo para trás', ['empurr', 'tras', 'comprim']],
            ['Atrás do disco há uma região cheia de vasos e nervos', ['vaso', 'nervo', 'retrodiscal', 'vasculariz', 'inervad']],
            ['Essa região inflama e dói ao mastigar', ['inflam', 'mastig']]
          ],
          modelo: 'Quando você bate o queixo, a mandíbula é empurrada para trás e o côndilo aperta a região que fica atrás do disco. Essa região, o coxim retrodiscal, é cheia de vasos e nervos. Ela foi comprimida, inflamou, e por isso dói quando você mastiga.' },
        { p: 'E o que vamos fazer?',
          esp: [
            ['Exame de imagem para ver o osso', ['panoram', 'tomograf', 'radiograf', 'raio-x', 'raio x', 'imagem']],
            ['Repouso e comida pastosa', ['repouso', 'pastosa', 'macia', 'dieta']],
            ['Anti-inflamatório', ['anti-inflamat', 'antiinflamat', 'aine', 'analges', 'remedio']],
            ['Compressa fria', ['gelo', 'fria', 'frio', 'crioterap']]
          ],
          modelo: 'Vou pedir um exame de imagem, como panorâmica ou tomografia, para ver se o osso está inteiro. Se não houver fratura, você faz repouso da mandíbula com comida pastosa, toma anti-inflamatório por alguns dias e faz compressa fria de 10 a 15 minutos, três vezes ao dia. Se não melhorar, volte para reavaliarmos.' }
      ] }
  ],

  'fisiologia-atm': [
    { t: 'Dor ao bocejar',
      paciente: 'Paciente, 24 anos, sexo masculino',
      fala: 'Toda vez que eu bocejo bem grande, dá uma dor aqui do lado do rosto e eu tenho que fechar a boca na hora.',
      dados: [['Quando dói', 'Só no bocejo grande'], ['Mastigação', 'Sem dor'], ['Exame', 'Abertura normal, sem estalo']],
      perguntas: [
        { p: 'Doutor(a), o que é essa dor quando eu bocejo?',
          esp: [
            ['É um alarme / proteção da articulação', ['alarme', 'protec', 'protege', 'defesa', 'limite']],
            ['Receptores de dor (GW IV) da ATM', ['receptor', 'gw iv', 'gw 4', 'nocicep']],
            ['Não parece grave', ['nao e grave', 'nao parece grave', 'tranquil', 'normal']]
          ],
          modelo: 'Quando você abre demais a boca, a articulação chega no limite. Lá existem receptores de dor, os GW IV, que funcionam como um alarme e fazem doer para proteger a ATM. Como só acontece no bocejo e a mastigação está normal, não parece nada grave.' },
        { p: 'Por que isso acontece só quando eu abro muito?',
          esp: [
            ['Primeiro a mandíbula gira (rotação)', ['rotac', 'gira']],
            ['Depois o côndilo desliza para a frente (translação)', ['translac', 'desliza', 'frente']],
            ['No limite, estica cápsula e ligamentos', ['estica', 'estira', 'capsula', 'ligament', 'limite']]
          ],
          modelo: 'Para abrir a boca, primeiro a mandíbula gira, que é a rotação, e depois o côndilo desliza para a frente junto com o disco, que é a translação. No bocejo bem grande, o côndilo vai até o limite e estica a cápsula e os ligamentos. Esse estiramento ativa os receptores de dor.' },
        { p: 'E o que eu faço para não doer?',
          esp: [
            ['Apoiar a mão no queixo ao bocejar / não abrir demais', ['mao', 'queixo', 'limitar', 'abrir demais', 'abrir muito']],
            ['Compressa morna e massagem', ['compressa', 'calor', 'morna', 'massag']],
            ['Voltar se estalar, travar ou doer ao mastigar', ['voltar', 'volte', 'retorn', 'estal', 'travar']]
          ],
          modelo: 'Ao bocejar, apoie a mão embaixo do queixo para não abrir demais. Evite morder pedaços muito grandes. Compressa morna e massagem nos músculos do rosto por 15 minutos ajudam a relaxar. Se começar a estalar, travar ou doer para mastigar, volte para avaliarmos.' }
      ] },
    { t: 'Dente "batendo primeiro" depois da restauração',
      paciente: 'Paciente, 45 anos, sexo feminino',
      fala: 'Fiz uma restauração semana passada. Desde então sinto esse dente batendo antes dos outros e meu rosto fica cansado no fim do dia.',
      dados: [['Procedimento', 'Restauração em molar há 1 semana'], ['Queixa', 'Contato prematuro e cansaço muscular'], ['Antes', 'Sem dor nenhuma']],
      perguntas: [
        { p: 'Doutor(a), o que está acontecendo com o meu dente?',
          esp: [
            ['Restauração ficou alta', ['alta', 'mais alta', 'excesso']],
            ['Contato prematuro / interferência', ['contato prematuro', 'prematur', 'interferenc', 'bate primeiro', 'batendo']]
          ],
          modelo: 'O mais provável é que a restauração tenha ficado um pouco alta. Assim, esse dente encosta antes dos outros quando você fecha a boca. Chamamos isso de contato prematuro, ou interferência. É simples de resolver.' },
        { p: 'Mas por que o meu rosto fica cansado?',
          esp: [
            ['Receptores do dente e da ATM percebem o contato (propriocepção)', ['receptor', 'propriocep', 'percebe', 'ligamento periodontal']],
            ['O cérebro muda o jeito dos músculos trabalharem para desviar', ['desvi', 'cerebro', 'muda', 'padrao']],
            ['Os músculos trabalham mais e cansam', ['cans', 'muscul', 'trabalh']]
          ],
          modelo: 'O dente e a articulação têm receptores que avisam o cérebro de tudo que encosta; isso é a propriocepção. Quando o dente alto bate primeiro, o cérebro muda o jeito dos músculos trabalharem para desviar desse ponto. Os músculos passam o dia fazendo esse esforço extra e cansam.' },
        { p: 'E como resolve?',
          esp: [
            ['Marcar com papel carbono', ['carbono', 'marcar', 'papel']],
            ['Ajustar / desgastar o excesso da restauração', ['ajust', 'desgast', 'polir', 'excesso']],
            ['Compressa morna / analgésico se doer', ['compressa', 'calor', 'analges', 'morna']]
          ],
          modelo: 'Vou pedir para você morder um papel carbono, que marca exatamente onde o dente está batendo antes. Depois desgasto só esse excesso da restauração e dou o polimento, até os dentes encostarem por igual. Em poucos dias os músculos relaxam. Se ficar dolorido, compressa morna ajuda.' }
      ] }
  ],

  'oclusao-atm': [
    { t: 'Sem os dentes de trás',
      paciente: 'Paciente, 55 anos, sexo feminino',
      fala: 'Perdi os dentes de trás dos dois lados. Agora mastigo com os da frente e começou a doer perto do ouvido.',
      dados: [['Ausências', 'Molares superiores e inferiores'], ['Dor', 'Região da ATM, dos dois lados'], ['Dentes da frente', 'Com desgaste']],
      perguntas: [
        { p: 'Doutor(a), o que está causando essa dor?',
          esp: [
            ['Sobrecarga na ATM / DTM', ['sobrecarga', 'atm', 'dtm', 'disfun', 'articula']],
            ['Causada pela falta dos dentes de trás', ['dentes de tras', 'falta', 'perda', 'posterior']]
          ],
          modelo: 'Pela falta dos dentes de trás, o mais provável é uma sobrecarga na sua ATM, uma disfunção temporomandibular. Os dentes de trás são os que seguram a força da mordida. Sem eles, a articulação e os dentes da frente estão trabalhando demais.' },
        { p: 'Por que perder os dentes de trás afeta a articulação?',
          esp: [
            ['Os dentes de trás seguram a força ao fechar', ['segur', 'forca', 'apoio', 'suport']],
            ['Os da frente só guiam os movimentos (proteção mútua)', ['frente', 'guia', 'mutuamente', 'protegid']],
            ['Sem apoio, a força vai para a ATM e para os dentes da frente', ['articula', 'atm', 'condilo', 'desgast']]
          ],
          modelo: 'Numa mordida equilibrada, os dentes de trás seguram a força quando você fecha a boca e os da frente só guiam os movimentos: é a oclusão mutuamente protegida. Sem os de trás, a mandíbula fecha demais, a força vai para a articulação e para os dentes da frente, que doem e desgastam.' },
        { p: 'E o que podemos fazer?',
          esp: [
            ['Repor os dentes: prótese ou implante', ['protese', 'implante', 'repor', 'reabilit']],
            ['Placa enquanto isso', ['placa', 'dispositivo']],
            ['Comida macia, compressa, anti-inflamatório', ['macia', 'pastosa', 'compressa', 'calor', 'anti-inflamat', 'analges']]
          ],
          modelo: 'O tratamento principal é repor os dentes de trás, com prótese ou implantes, para devolver o apoio da mordida. Enquanto isso, podemos usar uma placa para proteger a articulação, comer alimentos mais macios e fazer compressa morna. Se a dor estiver forte, uso um anti-inflamatório por poucos dias.' }
      ] },
    { t: '"Minha mordida é torta, vou ter DTM?"',
      paciente: 'Paciente, 20 anos, sexo masculino',
      fala: 'Meu dentista falou que minha mordida é Classe II. Não sinto nada, mas fiquei com medo de ter problema na articulação.',
      dados: [['Oclusão', 'Classe II'], ['Sintomas', 'Nenhum'], ['Hábitos', 'Aperta os dentes quando estuda']],
      perguntas: [
        { p: 'Doutor(a), minha mordida torta vai me dar DTM?',
          esp: [
            ['Não necessariamente', ['nao necessariamente', 'nem sempre', 'nao quer dizer', 'nao obrigatoriamente', 'nao significa']],
            ['A DTM é multifatorial; a mordida é só um fator', ['multifatorial', 'varios fatores', 'um dos fatores', 'fator']]
          ],
          modelo: 'Não necessariamente. Ter uma mordida diferente, como a Classe II, não quer dizer que você vai ter DTM. A DTM é multifatorial: a mordida é só um dos fatores. Muita gente com mordida torta nunca sente nada, porque o corpo se adapta.' },
        { p: 'Então por que algumas pessoas têm DTM e outras não?',
          esp: [
            ['Apertar ou ranger os dentes', ['apert', 'rang', 'bruxis', 'parafun']],
            ['Estresse e ansiedade', ['estresse', 'ansied', 'emocion']],
            ['Traumas e capacidade de adaptação', ['trauma', 'pancada', 'adapta']]
          ],
          modelo: 'Porque depende de vários fatores juntos: apertar ou ranger os dentes, estresse e ansiedade, pancadas no rosto, a estrutura da articulação e a capacidade de cada um se adaptar. Quando vários se somam e passam do limite, aí aparecem os sintomas.' },
        { p: 'E o que eu devo fazer agora?',
          esp: [
            ['Sem dor, não precisa tratar agora; só acompanhar', ['acompanh', 'nao precisa', 'observ', 'consulta']],
            ['Evitar apertar os dentes e chiclete', ['apert', 'chiclete', 'habito']],
            ['Avisar se surgir dor, estalo ou travamento', ['dor', 'estal', 'travar', 'avis']]
          ],
          modelo: 'Como você não sente nada, não precisa de tratamento agora: não desgastamos dente nem colocamos aparelho só para prevenir DTM. Tente não apertar os dentes enquanto estuda e evite chiclete. Vamos acompanhar nas consultas e, se surgir dor, estalo ou travamento, você me avisa.' }
      ] }
  ],

  'nervo-trigemeo': [
    { t: 'Lábio dormente depois da extração',
      paciente: 'Paciente, 35 anos, sexo masculino',
      fala: 'Já faz quatro horas que tirei o dente de baixo e meu lábio e meu queixo continuam dormentes. Isso é normal?',
      dados: [['Procedimento', 'Exodontia do 46'], ['Anestesia', 'Bloqueio do alveolar inferior, lingual e bucal'], ['Queixa', 'Lábio inferior e mento dormentes']],
      perguntas: [
        { p: 'Doutor(a), por que meu lábio ainda está dormente?',
          esp: [
            ['É o efeito da anestesia', ['anestesi']],
            ['Nervo alveolar inferior / mentual', ['alveolar inferior', 'mentual', 'mentoniano']],
            ['É esperado nas primeiras horas', ['normal', 'esperad', 'primeiras horas']]
          ],
          modelo: 'Para tirar o seu dente, eu anestesiei o nervo alveolar inferior. Um ramo dele, o nervo mentual, cuida da sensibilidade do lábio de baixo e do queixo. Então essa dormência é efeito da anestesia e é normal nas primeiras horas.' },
        { p: 'Mas por que está demorando tanto para passar?',
          esp: [
            ['É um bloqueio grande, pode durar horas', ['horas', 'demora', 'bloqueio', 'dura']],
            ['Se durar dias, pode ser parestesia (nervo irritado)', ['parestes', 'lesao', 'irritad', 'comprim', 'machuc']],
            ['O nervo passa perto das raízes', ['raiz', 'raizes', 'perto']]
          ],
          modelo: 'O bloqueio do alveolar inferior é uma anestesia grande e pode durar algumas horas. Se a dormência continuar por dias, pode ser uma parestesia: o nervo foi irritado ou comprimido durante a extração, porque ele passa bem perto das raízes dos dentes de trás.' },
        { p: 'E o que eu faço?',
          esp: [
            ['Cuidado para não morder o lábio nem se queimar', ['morder', 'queim', 'quente', 'cuidado']],
            ['Aguardar a sensibilidade voltar', ['aguard', 'esperar', 'espere', 'ate a sensibilidade voltar', 'amanha']],
            ['Voltar se não passar para reavaliar', ['volte', 'voltar', 'retorn', 'reavali', 'acompanh']]
          ],
          modelo: 'Por enquanto, cuidado para não morder o lábio e não comer nada muito quente até a sensibilidade voltar. Se amanhã ainda estiver dormente, volte para eu avaliar: vamos acompanhar a sensibilidade e, se precisar, pedir exame de imagem e tratar o nervo.' }
      ] },
    { t: 'Ainda dói no céu da boca',
      paciente: 'Paciente, 40 anos, sexo feminino',
      fala: 'O dente já está dormente, mas quando você mexe na gengiva do lado do céu da boca, eu ainda sinto dor.',
      dados: [['Procedimento', 'Exodontia do 14'], ['Anestesia feita', 'Só por vestibular'], ['Queixa', 'Dor na gengiva palatina']],
      perguntas: [
        { p: 'Doutor(a), por que ainda está doendo se eu tomei anestesia?',
          esp: [
            ['A anestesia feita foi só por fora (vestibular)', ['vestibular', 'por fora', 'alveolar superior medio']],
            ['O palato tem outro nervo: palatino maior', ['palatino maior', 'palatino', 'outro nervo']]
          ],
          modelo: 'A anestesia que eu fiz foi por fora do dente, onde passa o nervo alveolar superior médio, que cuida do pré-molar. Mas a gengiva do lado do céu da boca tem outro nervo, o palatino maior. Por isso o dente está anestesiado, mas o palato ainda sente.' },
        { p: 'Por que precisa de mais uma picada?',
          esp: [
            ['Na arcada de cima há nervos diferentes por fora e por dentro', ['dois nervos', 'nervos diferentes', 'outro nervo', 'vestibular', 'palat']],
            ['Na extração mexemos nos dois lados da gengiva', ['dois lados', 'os dois', 'ambos', 'gengiva']]
          ],
          modelo: 'Na arcada de cima, cada lado da gengiva tem nervos diferentes: por fora, os alveolares superiores, e por dentro, o palatino maior e o nasopalatino. Para tirar o dente, eu mexo nos dois lados, então os dois precisam estar anestesiados.' },
        { p: 'E agora, o que vamos fazer?',
          esp: [
            ['Anestesia complementar no palatino maior', ['palatino maior', 'complement', 'anestesi']],
            ['É rápida, com pouco anestésico', ['rapid', 'pouco', 'tranquil']],
            ['Esperar e testar antes de continuar', ['esper', 'aguard', 'testar', 'teste']]
          ],
          modelo: 'Vou fazer uma anestesia complementar no palato, no nervo palatino maior. É rápida e com pouco anestésico. Espero alguns minutos, testo a sensibilidade com você e só continuo quando não estiver doendo nada.' }
      ] }
  ],

  'neuralgia-trigemeo': [
    { t: 'Choques ao escovar os dentes',
      paciente: 'Paciente, 62 anos, sexo feminino, aposentada',
      fala: 'Sinto pontadas e choques elétricos insuportáveis no lado direito do rosto e na gengiva quando vou escovar os dentes ou lavar a face.',
      dados: [['Duração', 'Poucos segundos; há 6 meses'], ['Gatilho', 'Toque leve no sulco nasogeniano'], ['Dentes', 'Saudáveis; molar com canal sem lesão'], ['ATM e músculos', 'Normais']],
      perguntas: [
        { p: 'Doutor(a), o que eu tenho?',
          esp: [
            ['Neuralgia do trigêmeo', ['neuralgia']],
            ['Choque de segundos com toque leve (gatilho)', ['choque', 'segundo', 'gatilho', 'toque']],
            ['Não é dente nem DTM', ['nao e dente', 'nao e do dente', 'dentes estao', 'saudave', 'dtm']]
          ],
          modelo: 'Pelo que a senhora descreve, choques de poucos segundos que aparecem quando toca o rosto ou escova os dentes, o mais provável é neuralgia do trigêmeo. Não é dor de dente, porque seus dentes estão saudáveis, nem DTM, porque a articulação e os músculos estão normais.' },
        { p: 'Mas por que isso está acontecendo comigo?',
          esp: [
            ['Um vaso comprime a raiz do nervo', ['vaso', 'arteria', 'compress', 'aperta']],
            ['A capa do nervo (mielina) se desgasta', ['mielina', 'capa', 'desgast']],
            ['Toque leve vira descarga elétrica', ['descarga', 'disparo', 'choque']]
          ],
          modelo: 'O nervo trigêmeo leva a sensibilidade do rosto. Na maioria das vezes, um vaso sanguíneo encosta e comprime a raiz desse nervo, perto do cérebro. Com o tempo, a capa de proteção do nervo, a mielina, se desgasta, e um toque leve vira uma descarga elétrica: é o choque que a senhora sente.' },
        { p: 'E o que vamos fazer?',
          esp: [
            ['Não mexer nos dentes', ['nao vamos mexer', 'nao mexer', 'nao extrair', 'canal nao', 'dente nao']],
            ['Ressonância magnética', ['ressonanc']],
            ['Carbamazepina / encaminhar ao neurologista', ['carbamazepina', 'neurolog', 'encaminh', 'medico']]
          ],
          modelo: 'Não vamos mexer em nenhum dente, porque isso não resolveria. Vou pedir uma ressonância magnética para ver a compressão e descartar outras causas, e encaminhar a senhora ao neurologista. O remédio de escolha é a carbamazepina, com exames de controle. Se não funcionar, existe a cirurgia de descompressão microvascular.' }
      ] },
    { t: 'Dor que lateja com gelado',
      paciente: 'Paciente, 35 anos, sexo masculino',
      fala: 'Meu dente lateja, piora muito quando tomo coisa gelada e a dor fica por horas. Vi na internet que pode ser neuralgia.',
      dados: [['Dor', 'Latejante, dura horas'], ['Gatilho', 'Frio'], ['Exame', 'Cárie profunda no 36']],
      perguntas: [
        { p: 'Doutor(a), isso é neuralgia?',
          esp: [
            ['Provavelmente não; é do dente', ['nao e neuralgia', 'nao parece', 'provavelmente nao', 'do dente', 'dental']],
            ['Inflamação da polpa (pulpite)', ['pulpit', 'polpa', 'nervo do dente']],
            ['Neuralgia é choque de segundos, com dentes saudáveis', ['choque', 'segundo', 'saudave']]
          ],
          modelo: 'Provavelmente não. Dor que lateja, piora com gelado e dura horas é típica de inflamação na polpa do dente, a pulpite. A neuralgia é diferente: são choques de poucos segundos ao tocar o rosto, e os dentes estão saudáveis.' },
        { p: 'Por que meu dente está doendo assim?',
          esp: [
            ['A cárie profunda chegou perto da polpa', ['carie', 'bacteria']],
            ['A polpa inflamou', ['inflam', 'polpa']],
            ['Espaço fechado: aumenta a pressão e lateja', ['pressao', 'fechad', 'lateja', 'incha']]
          ],
          modelo: 'Você tem uma cárie profunda nesse dente, e as bactérias chegaram perto da polpa, que inflamou. A polpa fica dentro de um espaço fechado, então o inchaço aumenta a pressão e a dor lateja, piorando com o frio.' },
        { p: 'E o que vamos fazer?',
          esp: [
            ['Teste de sensibilidade ao frio e percussão', ['teste', 'frio', 'sensibilidade', 'vitalidade', 'percuss']],
            ['Radiografia periapical', ['periapical', 'radiograf', 'raio-x', 'raio x']],
            ['Restaurar ou fazer canal', ['canal', 'endodon', 'restaur']]
          ],
          modelo: 'Vou fazer o teste de sensibilidade ao frio, a percussão e uma radiografia periapical para confirmar. Se a inflamação ainda for reversível, removo a cárie e restauro. Se for irreversível, o tratamento é o canal. Até lá, posso indicar um analgésico.' }
      ] }
  ],

  'dtm-clinica': [
    { t: 'Estalo, dor ao mastigar e dor de cabeça',
      paciente: 'Paciente, 30 anos, sexo feminino',
      fala: 'Minha mandíbula estala, dói quando mastigo carne e no fim do dia fico com dor de cabeça aqui nas têmporas.',
      dados: [['Palpação', 'Dor em masseter e temporal'], ['Ruído', 'Estalo ao abrir'], ['Hábitos', 'Aperta os dentes; muito estresse no trabalho']],
      perguntas: [
        { p: 'Doutor(a), o que eu tenho?',
          esp: [
            ['DTM (disfunção temporomandibular)', ['dtm', 'disfun', 'temporomandibular']],
            ['Componente muscular (masseter e temporal)', ['muscul', 'masseter', 'temporal', 'miofasc']],
            ['A dor de cabeça vem do músculo temporal', ['cabeca', 'tempora']]
          ],
          modelo: 'Pelo que você conta e pelo que senti no exame, você tem uma disfunção temporomandibular, a DTM, com um componente muscular: o masseter e o temporal estão doloridos. O estalo mostra que a articulação também está envolvida, e a dor de cabeça nas têmporas vem do músculo temporal cansado.' },
        { p: 'Por que isso está acontecendo?',
          esp: [
            ['Apertar os dentes', ['apert', 'bruxis', 'rang']],
            ['Estresse e ansiedade', ['estresse', 'ansied', 'emocion']],
            ['Músculos sobrecarregados que doem e irradiam', ['sobrecarg', 'cans', 'contra', 'tensao', 'irradi']]
          ],
          modelo: 'O hábito de apertar os dentes, que piora com estresse e ansiedade, deixa os músculos da mastigação contraídos por muito tempo. Eles cansam e doem, e a dor irradia para a cabeça. Essa força também sobrecarrega a articulação, o que favorece o estalo.' },
        { p: 'E o que vamos fazer para melhorar?',
          esp: [
            ['Comida macia, sem chiclete, não apertar os dentes', ['macia', 'pastosa', 'chiclete', 'apert', 'dieta']],
            ['Compressa morna e massagem', ['compressa', 'calor', 'morna', 'massag', 'termoterap']],
            ['Placa para usar à noite', ['placa', 'dispositivo']],
            ['Anti-inflamatório ou relaxante muscular', ['anti-inflamat', 'antiinflamat', 'relaxante', 'aine', 'analges']]
          ],
          modelo: 'Vamos começar pelo simples: comida mais macia, nada de chiclete e prestar atenção para não apertar os dentes durante o dia. Compressa morna de 15 minutos, três vezes ao dia, e massagem nos músculos. Vou fazer uma placa para usar à noite e, para a dor, um anti-inflamatório ou relaxante muscular por alguns dias.' }
      ] },
    { t: 'Boca travada aberta depois de bocejar',
      paciente: 'Paciente, 27 anos, sexo feminino',
      fala: 'Eu bocejei e minha boca não fecha mais! Já aconteceu outras vezes.',
      dados: [['Situação', 'Boca aberta, não consegue fechar'], ['Queixo', 'Desviado para a esquerda'], ['Histórico', 'Episódios anteriores']],
      perguntas: [
        { p: 'Doutor(a), o que aconteceu com a minha boca?',
          esp: [
            ['Luxação: a mandíbula saiu do lugar', ['luxa', 'saiu do lugar', 'desloc']],
            ['O côndilo passou para a frente da eminência', ['eminencia', 'frente']],
            ['Lado direito (queixo desvia para o lado oposto)', ['direit', 'oposto', 'contrario']]
          ],
          modelo: 'Sua mandíbula saiu do lugar: é uma luxação da ATM. Ao bocejar, o côndilo passou para a frente de uma saliência do osso, a eminência articular, e ficou preso ali. Como o queixo foi para a esquerda, foi o lado direito que saiu.' },
        { p: 'Por que isso fica acontecendo comigo?',
          esp: [
            ['Ligamentos esticados / frouxos', ['ligament', 'frouxo', 'estica', 'estir']],
            ['Por isso se repete (recidivante)', ['recidiv', 'repet', 'de novo', 'outras vezes']]
          ],
          modelo: 'Como já aconteceu outras vezes, os ligamentos que seguram a articulação estão esticados, mais frouxos. Assim o côndilo passa do limite quando você abre muito a boca. Por isso chamamos de luxação recidivante: ela se repete.' },
        { p: 'E o que você vai fazer?',
          esp: [
            ['Colocar no lugar: polegares nos dentes de trás, para baixo e para trás', ['polegar', 'molar', 'dentes de tras', 'para baixo', 'para tras', 'manobra']],
            ['Paciente sentada com a cabeça apoiada', ['sentad', 'apoiad', 'cabeca']],
            ['Evitar abrir muito; mão no queixo ao bocejar', ['evitar', 'mao', 'queixo', 'abrir muito']],
            ['Se repetir, avaliar cirurgia (eminectomia)', ['eminectomia', 'cirurgi']]
          ],
          modelo: 'Vou colocar a mandíbula no lugar agora: com você sentada e a cabeça apoiada, coloco os polegares sobre os dentes de trás de baixo e empurro para baixo e um pouco para trás. Depois, evite abrir muito a boca e apoie a mão no queixo ao bocejar. Como está se repetindo, vamos avaliar a eminectomia, uma cirurgia que resolve.' }
      ] }
  ],

  'exames-imagem': [
    { t: 'Estalo e sensação de travar',
      paciente: 'Paciente, 34 anos, sexo feminino',
      fala: 'Minha mandíbula estala ao abrir e às vezes parece que trava um pouquinho antes de abrir tudo. Tenho marca-passo, isso importa?',
      dados: [['Ruído', 'Estalo ao abrir e ao fechar'], ['Abertura', 'Normal'], ['Saúde geral', 'Usa marca-passo cardíaco']],
      perguntas: [
        { p: 'Doutor(a), o que pode ser esse estalo?',
          esp: [
            ['Disco deslocado que volta ao lugar (com redução)', ['disco', 'desloca', 'com reducao']],
            ['A sensação de travar é o disco voltando', ['volta', 'recaptur', 'travar']]
          ],
          modelo: 'O mais provável é um deslocamento do disco com redução. O disco da articulação está um pouco para a frente quando a boca está fechada e, ao abrir, ele volta para o lugar. Essa volta é o estalo e a sensação de que trava um pouquinho.' },
        { p: 'Normalmente se pede ressonância. Por que não dá para ver no raio-X?',
          esp: [
            ['O raio-X/tomografia mostra só osso', ['osso', 'ossea']],
            ['A ressonância mostra o disco e as partes moles', ['ressonanc', 'disco', 'partes moles', 'tecido mole', 'tecidos moles']],
            ['A ressonância não usa radiação', ['radiacao', 'nao usa', 'sem radia']]
          ],
          modelo: 'O raio-X e a tomografia mostram bem o osso, mas o disco é uma cartilagem e não aparece neles. A ressonância magnética mostra o disco e as partes moles, com a boca fechada e aberta, e não usa radiação.' },
        { p: 'Mas eu tenho marca-passo. E agora?',
          esp: [
            ['Marca-passo é contraindicação da ressonância', ['contraindic', 'nao pode', 'marca-passo', 'marcapasso', 'marca passo']],
            ['Diagnóstico pelo exame clínico / outros exames', ['clinic', 'exame clinico', 'palpa']],
            ['Tratar sintomas de forma conservadora', ['placa', 'conservador', 'compressa', 'acompanh']]
          ],
          modelo: 'Marca-passo é uma contraindicação para a ressonância, porque o aparelho sofre interferência do ímã. Então vamos fechar o diagnóstico pelo exame clínico: palpação, avaliação dos ruídos e da abertura. Como você não tem dor nem limitação, o tratamento é conservador: orientações, compressa e, se precisar, uma placa, com acompanhamento.' }
      ] },
    { t: 'Abro cada vez menos a boca',
      paciente: 'Paciente, 19 anos, sexo masculino',
      fala: 'Desde criança eu abro pouco a boca, e está piorando. Não consigo nem morder um sanduíche.',
      dados: [['Histórico', 'Queda de bicicleta aos 6 anos, bateu o queixo'], ['Abertura', 'Muito limitada, sem estalo'], ['Rosto', 'Mandíbula pequena de um lado']],
      perguntas: [
        { p: 'Doutor(a), o que pode ser isso?',
          esp: [
            ['Anquilose da ATM', ['anquilos']],
            ['O côndilo se fundiu ao osso do crânio', ['fundiu', 'fusao', 'grudou', 'colou', 'uniu']]
          ],
          modelo: 'Uma abertura que vem diminuindo desde a infância, depois de uma pancada no queixo, pode ser anquilose da ATM: o côndilo, a ponta da mandíbula, se fundiu ao osso do crânio e a articulação não se movimenta.' },
        { p: 'Mas por que isso aconteceu?',
          esp: [
            ['A queda na infância machucou a articulação', ['queda', 'caiu', 'bateu', 'pancada', 'trauma']],
            ['A cicatriz virou osso e uniu côndilo e crânio', ['cicatriz', 'osso', 'calcific', 'uniu', 'fusao']],
            ['A mandíbula cresceu menos desse lado', ['cresc', 'menor', 'pequena']]
          ],
          modelo: 'Quando você caiu e bateu o queixo, a articulação foi machucada e cicatrizou de forma errada. Essa cicatriz foi virando osso até unir o côndilo ao crânio. Como você ainda estava crescendo, esse lado da mandíbula também cresceu menos.' },
        { p: 'E o que vamos fazer?',
          esp: [
            ['Tomografia para ver o osso', ['tomograf', 'cone beam']],
            ['Cirurgia com o bucomaxilofacial', ['cirurg', 'bucomaxilo', 'buco-maxilo', 'encaminh']],
            ['Fisioterapia e exercícios depois', ['fisioter', 'exercic']]
          ],
          modelo: 'Vou pedir uma tomografia, que é o melhor exame para ver o osso da articulação. Se confirmar a anquilose, o tratamento é cirúrgico: você será encaminhado ao cirurgião bucomaxilofacial para remover o bloco de osso e reconstruir a articulação. Depois, fisioterapia com exercícios de abertura é essencial para não voltar.' }
      ] }
  ],

  'tratamento-cirurgico': [
    { t: 'Parou de estalar, mas não abre',
      paciente: 'Paciente, 32 anos, sexo feminino',
      fala: 'Antes minha mandíbula estalava. Agora parou de estalar, mas não consigo abrir a boca direito e dói do lado direito. Já usei placa por quatro meses.',
      dados: [['Abertura', '27 mm'], ['Ao abrir', 'Desvia para a direita'], ['Tratamento prévio', 'Placa por 4 meses, sem melhora']],
      perguntas: [
        { p: 'Doutor(a), o que eu tenho?',
          esp: [
            ['Deslocamento do disco SEM redução', ['sem reducao']],
            ['O disco ficou preso na frente e não volta mais', ['preso', 'nao volta', 'travad', 'frente']]
          ],
          modelo: 'Você tem um deslocamento do disco sem redução. Antes o disco saía do lugar e voltava, por isso estalava. Agora ele ficou preso na frente e não volta mais: o estalo parou, mas a boca não abre direito e desvia para o lado direito.' },
        { p: 'Por que a minha boca não abre?',
          esp: [
            ['O côndilo não consegue deslizar para a frente, só gira', ['deslizar', 'translac', 'so gira', 'rotac']],
            ['Abertura fica em 25 a 30 mm', ['25', '30', 'milimetr']],
            ['Tecidos atrás do disco comprimidos e inflamados', ['comprim', 'inflam', 'retrodiscal']]
          ],
          modelo: 'Com o disco preso na frente, o côndilo não consegue deslizar para a frente, só gira. Por isso a abertura fica entre 25 e 30 milímetros. Os tecidos que ficam atrás do disco estão sendo comprimidos e inflamaram, e isso causa a dor.' },
        { p: 'A placa não resolveu. E agora?',
          esp: [
            ['Artrocentese: lavagem da articulação', ['artrocentese', 'lavagem', 'lavar']],
            ['Pode associar ácido hialurônico', ['hialuron', 'viscossup', 'viscosup']],
            ['Se não melhorar: artroscopia ou cirurgia', ['artroscop', 'cirurgia', 'discopex']]
          ],
          modelo: 'Como a placa não resolveu, o próximo passo é a artrocentese: uma lavagem da articulação com soro, feita com duas agulhas na frente da orelha, com anestesia. Ela solta o disco e tira as substâncias inflamatórias. Podemos associar ácido hialurônico. Se não melhorar, partimos para artroscopia ou cirurgia.' }
      ] },
    { t: 'Boca travada aberta, sem dor',
      paciente: 'Paciente, 40 anos, sexo feminino',
      fala: 'Minha boca ficou aberta e não fecha, mas não está doendo. Isso nunca tinha acontecido.',
      dados: [['Situação', 'Não consegue fechar a boca'], ['Dor', 'Nenhuma'], ['Panorâmica', 'Côndilo abaixo da eminência']],
      perguntas: [
        { p: 'Doutor(a), o que aconteceu?',
          esp: [
            ['Open-lock (travamento aberto)', ['open-lock', 'open lock', 'travamento', 'travou aberta']],
            ['O disco ficou preso atrás do côndilo', ['disco', 'atras', 'posterior']],
            ['Não é luxação: o côndilo está abaixo da eminência', ['luxa', 'abaixo', 'eminencia']]
          ],
          modelo: 'Sua boca travou aberta: é um open-lock. O disco da articulação ficou preso atrás do côndilo e impede a mandíbula de voltar. Não é uma luxação, porque no raio-X o côndilo está abaixo da eminência, e não na frente dela.' },
        { p: 'Por que o disco travou assim?',
          esp: [
            ['Atrito aumentado entre o disco e a fossa', ['atrito', 'fric']],
            ['Falta de lubrificação da articulação', ['lubrific', 'sinovial', 'liquido']]
          ],
          modelo: 'O disco normalmente desliza suave porque a articulação é lubrificada pelo líquido sinovial. Quando essa lubrificação piora, aumenta o atrito entre o disco e a fossa, o disco "gruda", fica para trás do côndilo e a boca não fecha.' },
        { p: 'E o que vamos fazer?',
          esp: [
            ['Artrocentese', ['artrocentese']],
            ['Lavagem com soro ou Ringer lactato', ['lavagem', 'soro', 'ringer']],
            ['Solta o disco e melhora a lubrificação', ['solta', 'lubrific', 'afasta', 'hialuron']]
          ],
          modelo: 'O tratamento é a artrocentese: com anestesia, coloco duas agulhas na articulação e faço uma lavagem com soro ou Ringer lactato. Isso afasta o disco da fossa, solta o que está preso e melhora a lubrificação, permitindo fechar a boca. Podemos complementar com ácido hialurônico.' }
      ] }
  ]
};
