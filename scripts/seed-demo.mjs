// Cria ou RESETA a conta de demonstração (acesso do júri). Idempotente.
//
//   pnpm seed:demo        (= node --no-warnings --env-file=.env.local scripts/seed-demo.mjs)
//
// Variáveis (só nomes; valores ficam no .env.local, fora do repositório):
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, DEMO_EMAIL, DEMO_PASSWORD
//
// O que faz: (1) acha o usuário com o e-mail da demo; se existir SEM app_metadata.demo === true, ABORTA sem
// apagar nada; apaga TODA conta com app_metadata.demo === true (mesmo com e-mail trocado): arquivos do
// Storage e usuário (o cascade limpa perfil, lançamentos,
// aceites e ai_usage); (2) cria o usuário pela API admin, já confirmado e marcado app_metadata.demo = true;
// (3) entra como ele e grava perfil, lançamentos FICTÍCIOS (de lib/contracts/mocks) e os 3 aceites vigentes
// pelo client do usuário, com a RLS valendo. A secret key só faz Auth e Storage (CLAUDE.md).
// Nunca imprime chaves, senha, e-mail nem id: só contagens e códigos de erro.
import { createClient } from "@supabase/supabase-js";
import { VERSAO_CONSENTIMENTO } from "../lib/contracts/auth.ts";
import { mockLancamentos, mockPerfil } from "../lib/contracts/mocks.ts";
import { credenciaisDemo, decidirSeed, ehContaDemo } from "../lib/security/demo.ts";
import { montarLinhasDoSeed } from "./seed-demo-linhas.ts";

const SEM_SESSAO = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const BUCKET = "documentos";

function falhar(mensagem) {
  console.error(`seed-demo: ${mensagem}`);
  process.exit(1);
}

/** Só o código do erro (a mensagem do Supabase pode conter e-mail ou id). */
const codigo = (erro) => erro?.code ?? erro?.status ?? "sem código";

const faltam = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY"].filter(
  (nome) => !process.env[nome],
);
if (faltam.length) falhar(`variáveis ausentes: ${faltam.join(", ")}`);
const credenciais = credenciaisDemo({ DEMO_EMAIL: process.env.DEMO_EMAIL, DEMO_PASSWORD: process.env.DEMO_PASSWORD });
if (!credenciais) falhar("DEMO_EMAIL e DEMO_PASSWORD precisam estar definidas e não vazias");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SECRET_KEY, SEM_SESSAO);
const email = credenciais.email; // já em minúsculas (credenciaisDemo)

/** Todos os usuários do projeto (paginado pelo `nextPage` que o servidor devolve, sem supor o tamanho da página). */
async function listarUsuarios() {
  const todos = [];
  for (let pagina = 1; pagina; ) {
    const { data, error } = await admin.auth.admin.listUsers({ page: pagina, perPage: 1000 });
    if (error) falhar(`falha ao listar usuários (${codigo(error)})`);
    todos.push(...data.users);
    pagina = data.nextPage && data.nextPage > pagina ? data.nextPage : 0;
  }
  return todos;
}

/** Apaga os arquivos de documentos/{id}/ (o Storage não cai em cascata). Falhou = aborta antes de apagar o usuário. */
async function limparStorage(userId) {
  const { data, error } = await admin.storage.from(BUCKET).list(userId, { limit: 1000 });
  if (error) falhar(`falha ao listar o Storage (${codigo(error)}); nada foi apagado`);
  if (data.some((f) => f.id === null)) {
    falhar("há pasta aninhada em documentos/{id}/ (layout inesperado); apague à mão no painel. Nada foi apagado");
  }
  if (!data.length) return 0;
  const { error: erroRemover } = await admin.storage.from(BUCKET).remove(data.map((f) => `${userId}/${f.name}`));
  if (erroRemover) falhar(`falha ao apagar do Storage (${codigo(erroRemover)}); o usuário NÃO foi apagado`);
  return data.length;
}

// Quem apagar: TODA conta marcada como demo (inclui uma demo cujo e-mail foi trocado por um visitante, que
// senão ficaria órfã). O e-mail da demo sem a marca é conta real: aborta antes de apagar QUALQUER coisa.
const usuarios = await listarUsuarios();
const doEmail = usuarios.find((u) => u.email?.toLowerCase() === email);
if (decidirSeed(doEmail) === "abortar") {
  falhar("já existe um usuário com o e-mail da demo SEM a marca de demo. Nada foi apagado. Use outro DEMO_EMAIL.");
}
const anteriores = usuarios.filter((u) => ehContaDemo(u));
for (const anterior of anteriores) {
  const arquivos = await limparStorage(anterior.id);
  const { error } = await admin.auth.admin.deleteUser(anterior.id);
  if (error) falhar(`falha ao apagar a demo anterior (${codigo(error)})`);
  console.log(`seed-demo: demo anterior apagada (arquivos no Storage: ${arquivos})`);
}

const { data: criado, error: erroCriar } = await admin.auth.admin.createUser({
  email,
  password: credenciais.senha,
  email_confirm: true,
  app_metadata: { demo: true }, // só a API admin escreve app_metadata: o usuário não consegue forjar a marca
});
if (erroCriar || !criado.user) falhar(`falha ao criar a demo (${codigo(erroCriar)})`);

// Do login em diante qualquer falha DESFAZ a criação: uma demo pela metade deixaria o botão entrar numa conta
// sem perfil ou sem aceite. Sem demo o botão falha fechado, com a mensagem genérica.
async function popular() {
  // Client DO USUÁRIO (publishable key + login): a RLS vale, como no app.
  const db = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SEM_SESSAO);
  const { error: erroLogin } = await db.auth.signInWithPassword({ email, password: credenciais.senha });
  if (erroLogin) throw new Error(`falha ao entrar como a demo (${codigo(erroLogin)})`);

  const linhas = montarLinhasDoSeed({
    userId: criado.user.id,
    perfil: mockPerfil,
    lancamentos: mockLancamentos,
    versao: VERSAO_CONSENTIMENTO,
  });
  for (const [tabela, valores] of [
    ["perfis", linhas.perfil],
    ["lancamentos", linhas.lancamentos],
    ["consentimentos", linhas.consentimentos],
  ]) {
    const { error } = await db.from(tabela).insert(valores);
    if (error) throw new Error(`falha ao gravar ${tabela} (${codigo(error)})`);
  }

  const contar = async (tabela) => (await db.from(tabela).select("*", { count: "exact", head: true })).count;
  console.log(
    `seed-demo: ok. perfis=${await contar("perfis")} lancamentos=${await contar("lancamentos")} ` +
      `consentimentos=${await contar("consentimentos")} versao=${VERSAO_CONSENTIMENTO}`,
  );
  await db.auth.signOut({ scope: "local" });
}

try {
  await popular();
} catch (e) {
  const { error } = await admin.auth.admin.deleteUser(criado.user.id);
  falhar(
    `${e instanceof Error ? e.message : "erro desconhecido"}; ` +
      (error ? `ATENÇÃO: a demo incompleta NÃO foi desfeita (${codigo(error)}), rode de novo` : "criação desfeita, rode de novo"),
  );
}
