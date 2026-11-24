// Linhas da conta de demo, puras (sem rede). Usado por scripts/seed-demo.mjs, que o Node carrega direto
// (type stripping): só `import type`, sem enum, sem alias em valor.
import type { FinalidadeConsentimento, Lancamento, Perfil } from "@/lib/contracts";

const FINALIDADES: FinalidadeConsentimento[] = ["termos_uso", "privacidade", "envio_ia"];

/**
 * Perfil, lançamentos e aceites da demo, nas colunas do banco (docs/DADOS.md). Os lançamentos vêm dos
 * mocks (dados FICTÍCIOS); o id e o documento dos mocks não vão: o banco gera o id e o documento do mock
 * não existe (a FK composta recusaria). Os aceites são vigentes (sem revogado_em) e incluem envio_ia.
 */
export function montarLinhasDoSeed(entrada: {
  userId: string;
  perfil: Perfil;
  lancamentos: Lancamento[];
  versao: string;
}) {
  const { userId, perfil, lancamentos, versao } = entrada;
  return {
    perfil: {
      user_id: userId,
      nome_negocio: perfil.nomeNegocio,
      eh_mei: perfil.ehMei,
      atividade: perfil.atividade,
      uf: perfil.uf,
      municipio: perfil.municipio,
      data_abertura: perfil.dataAbertura,
      receita_inicial_centavos: perfil.receitaInicialCentavos,
    },
    lancamentos: lancamentos.map((l) => ({
      user_id: userId,
      documento_id: null,
      tipo: l.tipo,
      data: l.data,
      valor_centavos: l.valorCentavos,
      categoria: l.categoria,
      descricao: l.descricao,
      contraparte: l.contraparte,
      forma_pgto: l.formaPgto,
      origem: l.origem,
    })),
    consentimentos: FINALIDADES.map((finalidade) => ({ user_id: userId, finalidade, versao })),
  };
}
