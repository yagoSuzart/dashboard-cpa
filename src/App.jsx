import { useState } from "react";

export default function App() {
  const coordenadores = [
    {
      nome: "Diego Braga",
      area: "Negócios e Gestão",
      status: "Atenção",
      cursos: [
        "Administração",
        "Marketing",
        "Ciências Contábeis",
        "Gestão Financeira",
        "Gestão RH",
        "Logística",
        "Processos Gerenciais",
      ],
      problemas: [
        "Baixa integração prática com o mercado",
        "Engajamento discente",
        "Comunicação acadêmica",
      ],
      melhorias: [
        "Projetos integradores",
        "Plano de retenção",
        "Experiência acadêmica",
      ],
      insight:
        "Os cursos da área de negócios possuem potencial competitivo, mas demandam maior integração prática.",
    },

    {
      nome: "Osvaldo Jr.",
      area: "Tecnologia e Engenharia",
      status: "Crítico",
      cursos: [
        "ADS",
        "Engenharia Civil",
        "Engenharia da Computação",
        "Engenharia Elétrica",
        "Engenharia de Produção",
        "TI",
      ],
      problemas: [
        "Infraestrutura laboratorial",
        "Equipamentos defasados",
        "Atualização tecnológica",
      ],
      melhorias: [
        "Modernização dos laboratórios",
        "Aquisição de equipamentos",
        "Expansão prática",
      ],
      insight:
        "A área tecnológica apresenta a maior criticidade estrutural da instituição.",
    },

    {
      nome: "Marcela Granda",
      area: "Arquitetura e Design",
      status: "Estável",
      cursos: [
        "Arquitetura e Urbanismo",
        "Design de Interiores",
      ],
      problemas: [
        "Espaços acadêmicos",
        "Necessidade prática",
      ],
      melhorias: [
        "Modernização dos ambientes",
        "Integração multidisciplinar",
      ],
      insight:
        "Área com boa percepção pedagógica e estabilidade institucional.",
    },

    {
      nome: "Juliana Pachioni",
      area: "Saúde",
      status: "Atenção",
      cursos: [
        "Biomedicina",
        "Farmácia",
      ],
      problemas: [
        "Estrutura laboratorial",
        "Demandas práticas",
      ],
      melhorias: [
        "Atualização técnica",
        "Fortalecimento laboratorial",
      ],
      insight:
        "Os cursos da saúde necessitam ampliação técnica e prática.",
    },

    {
      nome: "Anicarine",
      area: "Saúde",
      status: "Atenção",
      cursos: ["Radiologia"],
      problemas: [
        "Infraestrutura técnica",
        "Práticas laboratoriais",
      ],
      melhorias: [
        "Modernização estrutural",
        "Ampliação prática",
      ],
      insight:
        "Radiologia demanda fortalecimento técnico-operacional.",
    },

    {
      nome: "Luan",
      area: "Saúde",
      status: "Estável",
      cursos: ["Nutrição"],
      problemas: [
        "Engajamento acadêmico",
      ],
      melhorias: [
        "Projetos integradores",
      ],
      insight:
        "Curso com estabilidade institucional e potencial de crescimento.",
    },

    {
      nome: "Marcio Scatigno",
      area: "Humanas",
      status: "Estável",
      cursos: ["Pedagogia"],
      problemas: [
        "Comunicação institucional",
      ],
      melhorias: [
        "Fortalecimento pedagógico",
      ],
      insight:
        "Pedagogia apresenta cenário estável e percepção positiva.",
    },

    {
      nome: "Mayke Iyusuka",
      area: "Humanas",
      status: "Atenção",
      cursos: ["Direito"],
      problemas: [
        "Experiência acadêmica",
        "Demandas operacionais",
      ],
      melhorias: [
        "Projetos extensionistas",
        "Melhorias operacionais",
      ],
      insight:
        "Direito possui grande potencial competitivo mediante maior integração prática.",
    },

    {
      nome: "Paula Coimbra",
      area: "Saúde",
      status: "Estável",
      cursos: ["Psicologia"],
      problemas: [
        "Estrutura prática",
      ],
      melhorias: [
        "Ampliação dos estágios",
      ],
      insight:
        "Psicologia demonstra boa estabilidade institucional.",
    },

    {
      nome: "Renata Pilli Jóias",
      area: "Saúde",
      status: "Crítico",
      cursos: ["Odontologia"],
      problemas: [
        "Clínicas",
        "Materiais",
        "Insumos",
      ],
      melhorias: [
        "Reestruturação clínica",
        "Ampliação de recursos",
      ],
      insight:
        "Odontologia apresenta alta criticidade operacional.",
    },

    {
      nome: "Solival Filho",
      area: "Saúde",
      status: "Estável",
      cursos: ["Educação Física"],
      problemas: [
        "Infraestrutura esportiva",
      ],
      melhorias: [
        "Ampliação dos espaços",
      ],
      insight:
        "Educação Física possui estabilidade com melhorias pontuais.",
    },

    {
      nome: "Tereza Cristina",
      area: "Saúde",
      status: "Atenção",
      cursos: [
        "Estética e Cosmética",
        "Fisioterapia",
      ],
      problemas: [
        "Experiência prática",
        "Laboratórios",
      ],
      melhorias: [
        "Atualização estrutural",
        "Ampliação técnica",
      ],
      insight:
        "Cursos com potencial competitivo mediante fortalecimento técnico-prático.",
    },

    {
      nome: "Vânia Lucia",
      area: "Saúde",
      status: "Crítico",
      cursos: ["Enfermagem"],
      problemas: [
        "Campos de estágio",
        "Operacional acadêmico",
      ],
      melhorias: [
        "Ampliação de convênios",
        "Melhoria operacional",
      ],
      insight:
        "Enfermagem exige atenção institucional prioritária.",
    },
  ];

  const [selecionado, setSelecionado] = useState(
    coordenadores[0]
  );

  const statusColor = {
    Crítico: "#ef4444",
    Atenção: "#f59e0b",
    Estável: "#10b981",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f1f5f9",
        display: "flex",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: "320px",
          background: "#1A3666",
          color: "white",
          padding: "25px",
          overflowY: "auto",
        }}
      >
        <h1
          style={{
            fontSize: "32px",
            marginBottom: "10px",
          }}
        >
          UniFECAF
        </h1>

        <p
          style={{
            color: "#cbd5e1",
            marginBottom: "35px",
          }}
        >
          Central de Inteligência Acadêmica
        </p>

        {coordenadores.map((coord, index) => (
          <button
            key={index}
            onClick={() => setSelecionado(coord)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "18px",
              border: "none",
              borderRadius: "18px",
              marginBottom: "12px",
              cursor: "pointer",
              background:
                selecionado.nome === coord.nome
                  ? "#0E77CC"
                  : "#0f2b57",
              color: "white",
              transition: "0.2s",
            }}
          >
            <strong>{coord.nome}</strong>

            <div
              style={{
                fontSize: "13px",
                marginTop: "4px",
                color: "#cbd5e1",
              }}
            >
              {coord.area}
            </div>
          </button>
        ))}
      </aside>

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          padding: "40px",
        }}
      >
        <h1
          style={{
            fontSize: "48px",
            color: "#1A3666",
            marginBottom: "10px",
          }}
        >
          Dashboard CPA
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom: "35px",
          }}
        >
          Painel estratégico institucional baseado nos
          planos de melhoria da CPA.
        </p>

        {/* CARDS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "22px",
            }}
          >
            <p style={{ color: "#64748b" }}>
              Coordenações
            </p>

            <h2
              style={{
                fontSize: "48px",
                color: "#1A3666",
              }}
            >
              13
            </h2>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "22px",
            }}
          >
            <p style={{ color: "#64748b" }}>
              Cursos
            </p>

            <h2
              style={{
                fontSize: "48px",
                color: "#1A3666",
              }}
            >
              24
            </h2>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "22px",
            }}
          >
            <p style={{ color: "#64748b" }}>
              Maior Criticidade
            </p>

            <h2
              style={{
                fontSize: "28px",
                color: "#ef4444",
              }}
            >
              Infraestrutura
            </h2>
          </div>

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "22px",
            }}
          >
            <p style={{ color: "#64748b" }}>
              Potencialidade
            </p>

            <h2
              style={{
                fontSize: "28px",
                color: "#10b981",
              }}
            >
              Corpo Docente
            </h2>
          </div>
        </div>

        {/* CONTEÚDO */}
        <div
          style={{
            background: "white",
            borderRadius: "30px",
            padding: "35px",
          }}
        >
          <h2
            style={{
              fontSize: "38px",
              color: "#1A3666",
            }}
          >
            {selecionado.nome}
          </h2>

          <p
            style={{
              color: "#64748b",
              marginBottom: "20px",
            }}
          >
            {selecionado.area}
          </p>

          <div
            style={{
              display: "inline-block",
              background:
                statusColor[selecionado.status],
              color: "white",
              padding: "10px 18px",
              borderRadius: "14px",
              marginBottom: "30px",
              fontWeight: "bold",
            }}
          >
            {selecionado.status}
          </div>

          <h3>📚 Cursos</h3>

          <ul>
            {selecionado.cursos.map((curso, i) => (
              <li key={i}>{curso}</li>
            ))}
          </ul>

          <h3 style={{ marginTop: "25px" }}>
            🚨 Problemas
          </h3>

          <ul>
            {selecionado.problemas.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h3 style={{ marginTop: "25px" }}>
            ✅ Melhorias Estratégicas
          </h3>

          <ul>
            {selecionado.melhorias.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <div
            style={{
              background: "#eff6ff",
              padding: "25px",
              borderRadius: "20px",
              marginTop: "35px",
            }}
          >
            <h3
              style={{
                color: "#1A3666",
              }}
            >
              🧠 Insight Estratégico
            </h3>

            <p
              style={{
                color: "#334155",
                lineHeight: "1.7",
              }}
            >
              {selecionado.insight}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}