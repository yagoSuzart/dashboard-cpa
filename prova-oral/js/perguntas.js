// Perguntas e respostas por tema: [pergunta, resposta direta, por quê (explicação curta)].
// O aluno tenta responder de cabeça e depois abre para conferir.

window.PERGUNTAS = {
  'anatomia-atm': [
    ['O que é a ATM?', 'É a articulação entre a mandíbula (côndilo) e o osso temporal (fossa e eminência), com um disco no meio.', 'É ela que permite abrir, fechar, mastigar e falar. Por isso, dor ou estalo ali atrapalham tudo.'],
    ['Por que a ATM é diferente das outras articulações?', 'Funciona dos dois lados ao mesmo tempo, é revestida por fibrocartilagem, tem um disco entre os ossos e faz rotação e translação.', 'Os ossos não se encaixam perfeitamente. O disco compensa isso e permite movimentos mais amplos.'],
    ['Para que serve o disco articular?', 'Para adaptar as superfícies dos ossos e absorver o impacto.', 'Côndilo e fossa têm formatos que não combinam; sem o disco, a articulação ficaria instável.'],
    ['Onde o disco se prende?', 'Na frente, no músculo pterigoideo lateral. Atrás, na zona bilaminar.', 'Isso explica por que o músculo pode puxar o disco para a frente e causar deslocamento.'],
    ['Qual região da ATM mais dói quando é comprimida?', 'O coxim retrodiscal, que fica atrás do disco.', 'É cheio de vasos e nervos. Já o centro do disco não tem vasos nem nervos.'],
    ['Qual ligamento impede a mandíbula de ir muito para trás?', 'O ligamento temporomandibular (lateral).', 'Ele protege as estruturas atrás do côndilo de serem comprimidas.'],
    ['Quais músculos fecham a boca e qual abre?', 'Fecham: temporal, masseter e pterigoideo medial. Abre e leva para a frente: pterigoideo lateral.', 'Saber a função de cada um ajuda na palpação e a entender a dor muscular da DTM.'],
    ['Quais nervos inervam a ATM?', 'Auriculotemporal, massetérico e temporal profundo posterior, ramos do nervo mandibular.', 'Por isso a dor da ATM pode ser sentida no ouvido e na têmpora.']
  ],
  'fisiologia-atm': [
    ['O que é propriocepção?', 'É a percepção da posição e do movimento da mandíbula e das forças sobre os dentes.', 'É ela que faz você perceber um osso na comida ou uma restauração alta.'],
    ['Quais são as classes de Greenfield e Wyke?', 'GW I: postura. GW II: movimento. GW III: proteção. GW IV: dor.', 'Cada tipo de receptor da ATM manda uma informação diferente para o cérebro.'],
    ['Por que soltamos a mordida quando mordemos uma pedra?', 'Por um reflexo dos receptores GW III.', 'Eles têm limiar altíssimo e adaptação rápida e relaxam os músculos que fecham a boca, protegendo dentes e ATM.'],
    ['Por que dói quando bocejamos muito?', 'Por causa dos receptores GW IV, que são de dor.', 'Eles só disparam em situações extremas, como a abertura máxima, para proteger a articulação.'],
    ['Qual a diferença entre rotação e translação?', 'Na rotação a mandíbula gira e o disco fica parado. Na translação o côndilo desliza para a frente junto com o disco.', 'A abertura começa com rotação e termina com translação. Problemas no disco atrapalham a translação.'],
    ['O que é relação central?', 'É a mandíbula na posição mais para trás, com os dentes em leve contato, limitada por músculos e ligamentos.', 'É uma posição estável da articulação, usada como referência nos tratamentos.'],
    ['O que acontece com os côndilos na lateralidade?', 'Lado de trabalho: o côndilo gira, com leve deslocamento para o lado. Lado de balanceio: vai para a frente, para baixo e para dentro.', 'É o movimento de Bennett. Contatos no lado de balanceio sobrecarregam a ATM.'],
    ['O que mostra o Gráfico de Posselt?', 'Os limites dos movimentos da mandíbula nos três planos.', 'Ajuda a entender até onde a mandíbula consegue ir em cada movimento.']
  ],
  'oclusao-atm': [
    ['Qual a diferença entre RC e MIC?', 'RC é uma posição da articulação; MIC é a posição dos dentes com o maior número de contatos.', 'Nem sempre coincidem. O ideal é que coincidam.'],
    ['O que é oclusão mutuamente protegida?', 'Os dentes de trás seguram a força quando fechamos a boca, e os da frente guiam os movimentos.', 'Cada grupo protege o outro e evita sobrecarga.'],
    ['Quem guia a mandíbula na protrusão?', 'Os incisivos (guia incisal).', 'Eles separam os dentes de trás quando a mandíbula vai para a frente.'],
    ['Quem guia a mandíbula na lateralidade?', 'O canino (guia canina) ou o canino junto com os dentes de trás (função em grupo).', 'Tiram os dentes de trás do contato e os protegem de forças laterais.'],
    ['Toda interferência oclusal causa DTM?', 'Não.', 'A DTM é multifatorial: a oclusão é só um fator, ao lado de estresse, apertamento, trauma e capacidade de adaptação.'],
    ['Quais os 4 critérios da oclusão ideal?', 'RC coincidindo com MIC, forças no longo eixo dos dentes, guia anterior efetiva e ausência de interferências.', 'Garantem estabilidade e distribuição correta das forças.'],
    ['Por que perder os dentes de trás afeta a ATM?', 'Porque se perde o apoio da mordida e a força vai para a ATM e para os dentes da frente.', 'Os dentes de trás são os que suportam as forças verticais.'],
    ['O que determina a altura das cúspides?', 'A guia anterior e a guia condilar.', 'Pouco espaço para o movimento exige cúspides mais baixas, para não haver interferência.']
  ],
  'nervo-trigemeo': [
    ['Quais são os ramos do trigêmeo?', 'Oftálmico (V1), maxilar (V2) e mandibular (V3).', 'Cada um cuida de uma região do rosto. Saber isso guia a anestesia.'],
    ['Por onde sai cada ramo do crânio?', 'V1: fissura orbital superior. V2: forame redondo. V3: forame oval.', 'É uma pergunta clássica de anatomia e ajuda a localizar lesões e bloqueios.'],
    ['Que nervo anestesiar para um molar superior?', 'Alveolar superior posterior, e o palatino maior para o lado do palato.', 'O posterior inerva 3º e 2º molares e parte do 1º; a raiz mesiovestibular do 1º é do alveolar superior médio.'],
    ['E para um pré-molar superior?', 'Alveolar superior médio e palatino maior.', 'O médio inerva os pré-molares por vestibular e o palatino maior inerva o palato.'],
    ['Que nervos anestesiar para extrair um molar inferior?', 'Alveolar inferior, lingual e bucal.', 'Dente, gengiva lingual e gengiva vestibular têm nervos diferentes.'],
    ['O lábio inferior ficou dormente. Qual nervo?', 'O mentual, ramo do alveolar inferior.', 'Ele sai pelo forame mentual e inerva o lábio inferior e o queixo.'],
    ['Quem dá o gosto e o tato da parte da frente da língua?', 'Gosto: corda do tímpano. Tato: nervo lingual.', 'São nervos diferentes para o paladar e para a sensibilidade geral.'],
    ['O trigêmeo é sensitivo ou motor?', 'É misto.', 'Sente o rosto e movimenta os músculos da mastigação.']
  ],
  'neuralgia-trigemeo': [
    ['O que é neuralgia do trigêmeo?', 'É uma dor em choque, súbita, de segundos, na região do nervo trigêmeo.', 'É uma dor do próprio nervo (neuropática), não do dente.'],
    ['Quem é o paciente típico?', 'Mulher entre 60 e 70 anos, com dor de um lado só do rosto, mais no lado direito.', 'Antes dos 40 anos é rara e faz suspeitar de outra causa.'],
    ['O que dispara a crise?', 'Toques leves em zonas de gatilho: lavar o rosto, escovar os dentes, barbear, falar.', 'O nervo está muito sensível, e um estímulo leve vira uma descarga elétrica.'],
    ['Como diferenciar de dor de dente?', 'Neuralgia: choque de segundos, toque leve, dentes saudáveis. Pulpite: dor que lateja por horas, piora com frio ou calor e há cárie.', 'Evita fazer canal ou extrair dente sem necessidade.'],
    ['Qual a causa mais comum?', 'Um vaso, geralmente a artéria cerebelar superior, comprimindo a raiz do nervo.', 'A compressão desgasta a mielina, a capa do nervo, e ele dispara sozinho.'],
    ['Que exame pedir?', 'Ressonância magnética.', 'Mostra a compressão e descarta tumor ou esclerose múltipla.'],
    ['Qual o remédio de escolha?', 'Carbamazepina.', 'Acalma os disparos do nervo. Precisa de exames de controle por causa dos efeitos colaterais.'],
    ['E se o remédio não funcionar?', 'Descompressão microvascular (padrão-ouro), rizotomia ou radiocirurgia.', 'A descompressão trata a causa: afasta o vaso do nervo.']
  ],
  'dtm-clinica': [
    ['Quais os sintomas mais comuns de DTM?', 'Dor ao mastigar ou bocejar, estalo, dor de cabeça, dor de ouvido e mandíbula que trava.', 'Músculos e articulação ficam sobrecarregados e a dor se espalha.'],
    ['Qual a diferença entre dor nociceptiva e neuropática?', 'Nociceptiva: o tecido está machucado e o nervo avisa. Neuropática: o problema está no próprio nervo.', 'Cada uma tem um tratamento diferente.'],
    ['O que perguntar sobre a dor?', 'Onde dói, intensidade de 0 a 10, quanto tempo dura, o que piora e o que melhora, sono e estresse.', 'Essas respostas separam a DTM de outras dores do rosto.'],
    ['Qual o primeiro tratamento da DTM?', 'Conservador: comida macia, compressa, remédio e placa.', 'São medidas reversíveis que resolvem a maioria dos casos. A cirurgia fica para quem não melhora.'],
    ['Como deve ser a placa?', 'De acrílico, lisa, com 2 a 3 mm de espaço entre os dentes e ajustada com papel carbono.', 'Relaxa os músculos e protege os dentes do apertamento.'],
    ['Calor ou frio?', 'Calor: 15 minutos, 3 vezes ao dia. Frio: 10 a 15 minutos, 3 vezes ao dia, em pontos de dor localizados.', 'O calor relaxa o músculo e melhora a circulação; o frio alivia a dor em pontos específicos.'],
    ['Como colocar no lugar uma mandíbula luxada?', 'Paciente sentado, polegares nos molares de baixo, empurrar para baixo e um pouco para trás.', 'Isso faz o côndilo passar de volta por baixo da eminência.'],
    ['Qual a diferença entre open-lock e luxação?', 'Open-lock: disco atrás do côndilo, côndilo abaixo da eminência. Luxação: côndilo na frente da eminência.', 'O open-lock é tratado com artrocentese; a luxação, com a manobra de redução.']
  ],
  'exames-imagem': [
    ['Qual exame mostra o disco?', 'A ressonância magnética.', 'É o exame que mostra o disco e as partes moles.'],
    ['Qual exame mostra melhor o osso?', 'A tomografia (cone beam ou fan beam).', 'Mostra com detalhe as estruturas ósseas da ATM.'],
    ['Quais as vantagens da ressonância?', 'Não usa radiação, não é invasiva e mostra muito bem as partes moles.', 'É segura e é a melhor para avaliar o disco.'],
    ['Quem não pode fazer ressonância?', 'Quem tem marca-passo, clipes metálicos, implantes no ouvido, metal no olho ou no cérebro e gestantes com menos de 12 semanas.', 'O ímã do aparelho interfere em metais e aparelhos eletrônicos.'],
    ['Qual a diferença entre T1 e T2?', 'T1 mostra a anatomia; T2 mostra o que está doente (inflamação e líquido aparecem claros).', 'Cada sequência destaca uma coisa diferente.'],
    ['Por que as radiografias da ATM são dos dois lados?', 'Para comparar um lado com o outro.', 'As duas ATMs funcionam juntas.'],
    ['O que é artrografia?', 'Contraste injetado na articulação com fluoroscopia, mostrando o disco em movimento.', 'É invasiva, por isso hoje a ressonância costuma ser preferida.'],
    ['Existe um exame que resolve o diagnóstico sozinho?', 'Não. O diagnóstico junta conversa com o paciente, exame clínico e exames.', 'A imagem só confirma o que a clínica já sugere.']
  ],
  'tratamento-cirurgico': [
    ['O que é artrocentese?', 'É a lavagem da ATM com soro ou Ringer lactato, usando agulhas.', 'Remove substâncias inflamatórias, solta aderências e devolve a abertura da boca.'],
    ['Quando indicar artrocentese?', 'Quando o tratamento clínico não funcionou, e em casos como open-lock, disco deslocado e inflamação.', 'É pouco invasiva: um passo antes da cirurgia.'],
    ['O que é viscossuplementação?', 'Injeção de ácido hialurônico (hialuronato de sódio) na ATM.', 'Melhora a lubrificação e diminui a dor.'],
    ['Qual a diferença entre deslocamento com e sem redução?', 'Com redução: estalo e abertura normal. Sem redução: sem estalo, abertura de 25 a 30 mm e desvio para o lado afetado.', 'No sem redução o disco não volta e bloqueia o deslizamento do côndilo.'],
    ['Qual a ordem do tratamento?', 'Clínico, depois artrocentese, artroscopia e, por último, cirurgia aberta.', 'Começa sempre pelo menos invasivo.'],
    ['O que é artroscopia?', 'Uma câmera fina dentro da ATM para ver e tratar a articulação.', 'Permite diagnosticar e tratar sem abrir a articulação.'],
    ['O que é discopexia?', 'Cirurgia que reposiciona o disco e o prende no lugar.', 'Corrige o disco deslocado que não volta sozinho.'],
    ['Qual cirurgia para a luxação que se repete?', 'Eminectomia.', 'Remove a eminência, assim o côndilo não fica mais preso na frente dela.']
  ]
};
