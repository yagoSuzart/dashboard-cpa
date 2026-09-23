import { PROJETO, NOVIDADES } from '../lib/config.js'

const FLUXO = [
  { t: 'Planilha no Google Drive', d: 'A CPA edita onde já trabalha' },
  { t: 'Função segura na nuvem', d: 'Cloudflare lê a planilha a cada 2 min' },
  { t: 'Painel de curadoria', d: 'Cada avaliadora decide, edita e cria' },
  { t: 'Escolhas por e-mail', d: 'Guardadas separadas, sem misturar' },
  { t: 'Relatório para o T.I', d: 'PDF ou Word, pronto para cadastrar' },
]

const PROXIMOS = [
  {
    t: 'Resultados da CPA no mesmo painel',
    d: 'Cruzar as respostas dos alunos com cada eixo e dimensão e ver a evolução semestre a semestre.',
  },
  {
    t: 'Relatório de Autoavaliação Institucional',
    d: 'Gerar a base do relatório anual para o MEC a partir das perguntas e dos resultados.',
  },
  {
    t: 'Planos de ação por coordenação',
    d: 'Transformar cada ponto fraco da avaliação em ação com responsável e prazo, e acompanhar.',
  },
  {
    t: 'Módulo do Comitê de Ética em Pesquisa',
    d: 'Protocolos, pareceres e prazos do CEP num fluxo digital, sem planilhas soltas.',
  },
]

export default function Sobre({ model }) {
  const nSetores = model.outras.reduce((n, o) => n + o.perguntas.length, 0)
  return (
    <>
      <section className="hero">
        <div className="deco" aria-hidden="true">
          <i className="a" />
          <i className="b" />
          <i className="c" />
        </div>
        <div className="eyebrow" style={{ color: '#8fd3b0' }}>
          Sobre o sistema · versão {PROJETO.versao}
        </div>
        <h1>De planilhas soltas a um painel que decide junto com a CPA</h1>
        <p>
          O instrumento da CPA precisa cobrir os 5 eixos e as 10 dimensões do SINAES. Antes, isso era conferido à mão,
          em várias planilhas. Agora a planilha continua sendo a fonte, e o painel mostra as lacunas, organiza a
          decisão e entrega o documento pronto.
        </p>
      </section>

      <div className="grid g4" style={{ marginBottom: 20 }}>
        <div className="card kpi">
          <div className="lbl">Perguntas mapeadas</div>
          <div className="val num">{model.atual.length + model.propostas.length + nSetores}</div>
          <div className="sub">em uso, propostas e dos setores</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Abas lidas automaticamente</div>
          <div className="val num">{2 + model.outras.length}</div>
          <div className="sub">direto do Google Drive</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Eixos e dimensões</div>
          <div className="val num">
            5<small> · 10</small>
          </div>
          <div className="sub">Lei nº 10.861/2004 (SINAES)</div>
        </div>
        <div className="card kpi">
          <div className="lbl">Senhas para decorar</div>
          <div className="val num">0</div>
          <div className="sub">login só com o e-mail institucional</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <h2>Como funciona</h2>
        </div>
        <div className="card-b">
          <ol className="fluxo">
            {FLUXO.map((f, i) => (
              <li key={f.t}>
                <span className="fluxo-n">{i + 1}</span>
                <b>{f.t}</b>
                <span className="muted">{f.d}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="card-h">
            <h2>Segurança e privacidade</h2>
          </div>
          <div className="card-b">
            <ul className="lista-check">
              <li>Só entra quem está na lista de e-mails autorizados, com código enviado na hora.</li>
              <li>Cada acesso é conferido pela assinatura digital do login, não por um campo que o navegador informa.</li>
              <li>Cada avaliadora vê e edita apenas as próprias escolhas; a visão conjunta é restrita à administração.</li>
              <li>Nenhum dado de aluno é armazenado: o painel trabalha só com as perguntas do instrumento.</li>
              <li>O texto original das perguntas nunca é alterado; redações novas ficam guardadas ao lado.</li>
            </ul>
          </div>
        </div>
        <div className="card">
          <div className="card-h">
            <h2>Tecnologia</h2>
          </div>
          <div className="card-b">
            <div className="stack">
              {['React', 'Vite', 'Cloudflare Pages', 'Cloudflare Functions', 'Cloudflare KV', 'Cloudflare Access', 'Google Drive', 'GitHub'].map(
                (t) => (
                  <span key={t} className="tag">
                    {t}
                  </span>
                ),
              )}
            </div>
            <p className="muted" style={{ fontFamily: 'var(--f-text)', fontSize: 14.5 }}>
              Custo de infraestrutura: zero, dentro do plano gratuito do Cloudflare. Código versionado no GitHub, com
              publicação automática a cada atualização.
            </p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-h">
          <h2>Próximos passos possíveis</h2>
        </div>
        <div className="card-b grid g2">
          {PROXIMOS.map((p) => (
            <div key={p.t} className="prox">
              <b>{p.t}</b>
              <span className="muted">{p.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="card-h">
            <h2>Novidades</h2>
          </div>
          <div className="card-b">
            {NOVIDADES.map((n) => (
              <div key={n.versao} style={{ marginBottom: 12 }}>
                <span className="tag dim">v{n.versao}</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontFamily: 'var(--f-text)', fontSize: 14.5 }}>
                  {n.itens.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="card autor">
          <div className="card-b">
            <div className="eyebrow">Quem fez</div>
            <div className="autor-row">
              <span className="avatar grande">{PROJETO.autor[0]}</span>
              <div>
                <h2>{PROJETO.autor}</h2>
                <div className="muted">{PROJETO.cargo}</div>
              </div>
            </div>
            <p className="muted" style={{ fontFamily: 'var(--f-text)', fontSize: 14.5 }}>
              {PROJETO.nota}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
