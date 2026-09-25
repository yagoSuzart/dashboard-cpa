import { fmtNota } from '../lib/cpa.js'
import { BarraNota, SeloNota } from '../components/ui.jsx'
import { ListaPlanos } from './Planos.jsx'

// Núcleo de Facilities agrupa Limpeza, Manutenção e Segurança (regra do sistema atual)
const NUCLEO_SETORES = { facilities: ['limpeza', 'manutencao', 'seguranca'] }

export default function Setores({ perfil, base, planos, recarregarBase }) {
  const { setores, setorPerguntas } = base
  let visiveis = setores
  if (perfil.role === 'setor') visiveis = setores.filter((s) => s.id === perfil.setor)
  if (perfil.role === 'diretor_nucleo_setor') visiveis = setores.filter((s) => (NUCLEO_SETORES[perfil.nucleoSetor] || []).includes(s.id))
  const ordenados = [...visiveis].sort((a, b) => a.nota - b.nota)

  return (
    <>
      <div className="cab">
        <div className="txt">
          <div className="eyebrow">Infraestrutura e atendimento</div>
          <h1>{visiveis.length === 1 ? visiveis[0].nome : 'Setores avaliados pelos alunos'}</h1>
        </div>
      </div>
      <div className="grid2" style={{ gridTemplateColumns: visiveis.length === 1 ? 'minmax(0,1fr) minmax(0,1fr)' : undefined }}>
        {ordenados.map((s) => {
          const pergs = setorPerguntas.filter((p) => p.setor_id === s.id).sort((a, b) => a.nota - b.nota)
          return (
            <div key={s.id} className="card">
              <div className="card-h">
                <div className="t">
                  <h2>{s.nome}</h2>
                  <SeloNota v={Number(s.nota)} />
                </div>
                <div className="spacer" />
                <span className="valor-grande">{fmtNota(Number(s.nota))}</span>
              </div>
              <div>
                {pergs.map((p) => (
                  <div key={p.pergunta} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 120px 48px', gap: 14, alignItems: 'center', padding: '10px 0', borderTop: '1px solid var(--line-2)' }}>
                    <span style={{ fontWeight: 600 }}>{p.pergunta}</span>
                    <BarraNota v={Number(p.nota)} fina />
                    <span className="num" style={{ fontSize: 18, textAlign: 'right' }}>{fmtNota(Number(p.nota))}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        {visiveis.length === 1 && (
          <div className="card">
            <div className="card-h"><div className="t"><h2>Planos e demandas do setor</h2></div></div>
            <ListaPlanos planos={planos} base={base} perfil={perfil} onMudou={() => recarregarBase()} />
          </div>
        )}
      </div>
    </>
  )
}
