-- A pergunta "Portal do aluno UniFECAF ONE" não é de responsabilidade do NEAD: passa para a T.I. O NEAD fica sem
-- nota da pesquisa até ter perguntas próprias (a nota vinha só dessa pergunta).
update setor_perguntas set setor_id = 'ti' where setor_id = 'nead' and pergunta = 'Portal do aluno UniFECAF ONE';
update setores set nota = null where id = 'nead';
