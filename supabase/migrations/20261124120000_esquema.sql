-- Esquema do MVP (docs/DADOS.md). Domínios fixos = CHECK em text (sem tabela de domínio).
-- RLS e GRANTs ficam em 20261124120200_rls_grants.sql.

create table public.perfis (
  user_id uuid primary key references auth.users (id) on delete cascade,
  nome_negocio text not null check (char_length(nome_negocio) between 1 and 80),
  eh_mei boolean not null,
  atividade text not null check (atividade in ('comercio', 'servicos', 'ambos')),
  uf char(2) not null check (uf ~ '^[A-Z]{2}$'),
  municipio text not null check (char_length(municipio) between 1 and 80),
  data_abertura date not null check (data_abertura >= date '1990-01-01'),
  receita_inicial_centavos bigint not null default 0 check (receita_inicial_centavos >= 0),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  storage_path text not null unique,
  mime text not null check (mime in ('image/jpeg', 'image/png', 'image/webp')),
  tamanho_bytes int not null check (tamanho_bytes between 1 and 5242880), -- 5 MiB
  criado_em timestamptz not null default now(),
  -- alvo da FK composta de lancamentos: impede apontar para documento de outro usuário
  unique (id, user_id),
  -- formato {user_id}/{id}.{ext}
  check (storage_path ~ ('^' || user_id::text || '/' || id::text || '\.(jpg|jpeg|png|webp)$'))
);

create table public.lancamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  documento_id uuid,
  tipo text not null check (tipo in ('receita', 'despesa')),
  data date not null check (data between date '2000-01-01' and date '2100-12-31'),
  valor_centavos bigint not null check (valor_centavos > 0 and valor_centavos <= 1000000000),
  categoria text not null check (categoria in (
    'vendas', 'servicos_prestados', 'estoque', 'aluguel', 'contas_consumo', 'frete',
    'marketing', 'impostos_das', 'salario', 'material_consumo', 'retirada', 'outras'
  )),
  descricao text not null check (char_length(descricao) between 1 and 200),
  contraparte text check (char_length(contraparte) <= 120),
  forma_pgto text check (forma_pgto in ('pix', 'cartao', 'dinheiro', 'boleto', 'outro')),
  origem text not null check (origem in ('foto', 'audio', 'texto', 'print', 'manual')),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  foreign key (documento_id, user_id)
    references public.documentos (id, user_id) on delete set null (documento_id)
);

create table public.consentimentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  finalidade text not null check (finalidade in ('termos_uso', 'privacidade', 'envio_ia')),
  versao text not null check (char_length(versao) between 1 and 40),
  aceito_em timestamptz not null default now(),
  revogado_em timestamptz check (revogado_em >= aceito_em),
  unique (user_id, finalidade, versao)
);

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  dia date not null, -- dia em America/Sao_Paulo
  chamadas int not null default 0 check (chamadas >= 0),
  custo_centavos int not null default 0 check (custo_centavos >= 0),
  primary key (user_id, dia)
);

-- Índices: consultas 1-4 (igualdade em user_id antes do intervalo em data), FKs, exportar/excluir.
create index lancamentos_user_data_idx on public.lancamentos (user_id, data);
create index lancamentos_documento_idx on public.lancamentos (documento_id) where documento_id is not null;
create index documentos_user_idx on public.documentos (user_id);
