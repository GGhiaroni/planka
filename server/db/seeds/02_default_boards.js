/*!
 * Seeds the default Planka workspace expected by the ticket-form service.
 *
 * Boards seeded under "PDView ERP" project (nomes finais — 06/2026):
 *   - Artes          — kanban — lists: PEDIDO DE ARTE, EXECUTADO (closed)
 *   - Operacional    — table  — lists: CHAMADOS, ROTA, CONCLUÍDO (closed)
 *                             — labels: ASSISTÊNCIA TÉCNICA, INSTALAÇÃO
 *                                       (+ 8 legacy priority labels kept)
 *   - Pedido de Venda — table — lists: PEDIDO DE VENDA, PEDIDO DE ARTE,
 *                                     OS CHAMADO (intake/triage board)
 *   - Atendimento    — kanban — lists: AGENDAR TREINAMENTO,
 *                                      TREINAMENTO EXECUTADO, CHAMADOS,
 *                                      EM ANDAMENTO, CONCLUÍDO (closed)
 *                             — labels: same 2 as Operacional (mirrored)
 *
 * Boards antigos (Design / Chamados Técnicos / Comercial) são renomeados
 * in-place via renameLegacyBoards — cards e IDs ficam preservados. Listas
 * e labels também migram in-place. Projetos vazios criados por instalações
 * anteriores são removidos do projeto canônico "PDView ERP".
 *
 * O seed é idempotente: roda sempre que o container reinicia.
 */

const PROJECT_NAME = 'PDView ERP';
const POSITION_GAP = 65536;

// `type: 'active'` is the default. `type: 'closed'` represents the final
// "Concluído" column — moving a card there triggers the auto-archive sweep
// after AUTO_ARCHIVE_CLOSED_AFTER_DAYS days.
const DESIGN_LISTS = [{ name: 'PEDIDO DE ARTE' }, { name: 'EXECUTADO', type: 'closed' }];

const CHAMADOS_LISTS = [
  { name: 'CHAMADOS' },
  { name: 'ROTA' },
  { name: 'CONCLUÍDO', type: 'closed' },
];

// Comercial é um board de *intake/triagem* — colunas categoriais, sem
// estado de conclusão. As 3 colunas representam o tipo de solicitação que
// o time recebe; ninguém é movido pra "concluído" aqui.
const COMERCIAL_LISTS = [
  { name: 'PEDIDO DE VENDA' },
  { name: 'PEDIDO DE ARTE' },
  { name: 'OS CHAMADO' },
];

const ATENDIMENTO_LISTS = [
  { name: 'AGENDAR TREINAMENTO' },
  { name: 'TREINAMENTO EXECUTADO' },
  { name: 'CHAMADOS' },
  { name: 'EM ANDAMENTO' },
  { name: 'CONCLUÍDO', type: 'closed' },
];

// 8 priority labels herdadas dos formularios antigos. Mantidas porque o
// time ainda usa manualmente — o novo form de chamado (PR #21) não atribui
// prioridade automaticamente.
const PRIORITY_LABELS = [
  { name: 'BAIXA PRIORIDADE', color: 'bright-moss' },
  { name: 'MÉDIA GRAVIDADE', color: 'egg-yellow' },
  { name: 'URGÊNCIA', color: 'berry-red' },
  { name: 'EM TRATAMENTO', color: 'turquoise-sea' },
  { name: 'ATUALIZAÇÃO DO TRATAMENTO', color: 'midnight-blue' },
  { name: 'PENDÊNCIAS DE INSTALAÇÃO', color: 'pumpkin-orange' },
  { name: 'EM ESPERA', color: 'pink-tulip' },
  { name: 'MÁXIMA PRIORIDADE', color: 'lilac-eyes' },
];

// Rótulos novos (06/2026) que classificam o chamado em "Instalação" ou
// "Assistência Técnica" — aplicados tanto no board Operacional quanto no
// Atendimento, já que cada chamado vira 2 cards (um em cada board) e o
// futuro espelhamento precisa do mesmo label dos 2 lados.
const TIPO_CHAMADO_LABELS = [
  { name: 'ASSISTÊNCIA TÉCNICA', color: 'pumpkin-orange' },
  { name: 'INSTALAÇÃO', color: 'turquoise-sea' },
];

// Boards renomeados in-place. ensureBoard procura pelo NOME NOVO; se não
// achar e o antigo existir, renomeia o registro existente — cards/listas
// preservados. Idempotente: depois do primeiro run, só o nome novo existe.
const BOARD_RENAMES = {
  Design: 'Artes',
  'Chamados Técnicos': 'Operacional',
  Comercial: 'Pedido de Venda',
};

// Renames idempotentes: mapeia nome antigo → { name, type } novo. A função
// renameLegacyLists procura cada nome antigo e renomeia in-place, então
// cards existentes continuam linkados sem precisar de migração.
const LIST_RENAMES = {
  // Keys são os nomes NOVOS dos boards (depois do BOARD_RENAMES). Essa
  // migração é noop em instalações já feitas (as listas já têm nome novo).
  Artes: {
    Demanda: { name: 'PEDIDO DE ARTE', type: 'active' },
    Finalizado: { name: 'EXECUTADO', type: 'closed' },
  },
  Operacional: {
    'Em Espera': { name: 'CHAMADOS', type: 'active' },
    'Em Execução': { name: 'ROTA', type: 'active' },
    Executados: { name: 'CONCLUÍDO', type: 'closed' },
  },
  'Pedido de Venda': {
    'Em Espera': { name: 'PEDIDO DE VENDA', type: 'active' },
    'Em Execução': { name: 'PEDIDO DE ARTE', type: 'active' },
    Executados: { name: 'OS CHAMADO', type: 'active' },
  },
};

// Listas legadas do Design que vão sumir (Produção/Aprovação/Entregue/Falar
// com o cliente). Cards são realocados para PEDIDO DE ARTE antes da exclusão
// para não perder dados.
const DESIGN_LEGACY_LISTS_TO_MIGRATE = ['Produção', 'Aprovação', 'Entregue', 'Falar com o cliente'];

async function ensureProject(knex, adminUserId) {
  const existing = await knex('project').where('name', PROJECT_NAME).first();
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const [{ id: projectId }] = await knex('project')
    .insert({
      name: PROJECT_NAME,
      is_hidden: false,
      created_at: now,
      updated_at: now,
    })
    .returning('id');

  // Add the admin as project manager (also marks them as owner).
  if (adminUserId) {
    const [{ id: managerId }] = await knex('project_manager')
      .insert({
        project_id: projectId,
        user_id: adminUserId,
        created_at: now,
        updated_at: now,
      })
      .returning('id');

    await knex('project').where('id', projectId).update({ owner_project_manager_id: managerId });
  }

  return projectId;
}

// Renomeia in-place todos os boards listados em BOARD_RENAMES. Cards,
// listas e labels mantêm seus IDs — só o nome do board muda. Roda antes
// de qualquer ensureBoard pra garantir que as chamadas seguintes encontrem
// o registro pelo nome novo.
async function renameLegacyBoards(knex) {
  const entries = Object.entries(BOARD_RENAMES);
  for (let i = 0; i < entries.length; i += 1) {
    const [oldName, newName] = entries[i];
    // eslint-disable-next-line no-await-in-loop
    const existing = await knex('board').where({ name: oldName }).first();
    if (existing) {
      // eslint-disable-next-line no-await-in-loop
      const collision = await knex('board').where({ name: newName }).first();
      // Se já existir um board com o nome novo (instalação que rodou o seed
      // depois do rename ter sido aplicado manualmente), não sobrescreve —
      // o board antigo vira o canônico e o duplicado fica intocado pra que
      // o time decida o que fazer.
      if (!collision) {
        // eslint-disable-next-line no-await-in-loop
        await knex('board').where({ id: existing.id }).update({ name: newName });
      }
    }
  }
}

// Remove projetos vazios (sem boards) cujo nome bate com algum nome antigo
// de board — sobra do tempo em que cada board ficava no seu próprio projeto
// auto-criado. Limpa o seletor de projetos no Planka.
async function cleanupOrphanProjects(knex) {
  const oldNames = Object.keys(BOARD_RENAMES);
  for (let i = 0; i < oldNames.length; i += 1) {
    const name = oldNames[i];
    // eslint-disable-next-line no-await-in-loop
    const project = await knex('project').where({ name }).first();
    if (project) {
      // eslint-disable-next-line no-await-in-loop
      const boardCount = await knex('board')
        .where({ project_id: project.id })
        .count('id as n')
        .first();
      if (Number(boardCount.n) === 0) {
        // eslint-disable-next-line no-await-in-loop
        await knex('project_manager').where({ project_id: project.id }).delete();
        // eslint-disable-next-line no-await-in-loop
        await knex('project').where({ id: project.id }).delete();
      }
    }
  }
}

// Reuses an existing board with the given name (in ANY project) before
// creating a new one. Returns { boardId, projectId }. Boards encontrados
// em outro projeto são migrados para `fallbackProjectId` — isso conserta
// instalações antigas onde cada board ficava no seu próprio projeto
// auto-criado pelo Planka (ex.: project "Chamados Técnicos" → board
// "Chamados Técnicos"), o que quebra o lookup do ticket-form que sempre
// procura dentro do projeto canônico "PDView ERP".
async function ensureBoard(knex, fallbackProjectId, name, defaultView, position) {
  const existing = await knex('board').where({ name }).first();
  if (existing) {
    if (existing.project_id !== fallbackProjectId) {
      await knex('board').where({ id: existing.id }).update({ project_id: fallbackProjectId });
      // Move também as memberships para o projeto canônico, senão usuários
      // perdem permissão no board após o move.
      await knex('board_membership')
        .where({ board_id: existing.id })
        .update({ project_id: fallbackProjectId });
    }
    return { boardId: existing.id, projectId: fallbackProjectId };
  }

  const now = new Date().toISOString();
  const [{ id: boardId }] = await knex('board')
    .insert({
      project_id: fallbackProjectId,
      position,
      name,
      default_view: defaultView,
      default_card_type: 'project',
      limit_card_types_to_default_one: false,
      always_display_card_creator: false,
      expand_task_lists_by_default: true,
      display_card_ages: false,
      created_at: now,
      updated_at: now,
    })
    .returning('id');

  return { boardId, projectId: fallbackProjectId };
}

async function ensureBoardMembership(knex, projectId, boardId, userId) {
  if (!userId) return;
  const existing = await knex('board_membership')
    .where({ board_id: boardId, user_id: userId })
    .first();
  if (existing) return;

  const now = new Date().toISOString();
  await knex('board_membership').insert({
    project_id: projectId,
    board_id: boardId,
    user_id: userId,
    role: 'editor',
    can_comment: true,
    created_at: now,
    updated_at: now,
  });
}

// Renames any list whose name matches an entry in LIST_RENAMES for the given
// board. Updates the list's `type` to match (handling both active→closed and
// closed→active transitions) and keeps `card.is_closed` in sync. Cards stay
// linked to the renamed list, so no data is lost.
async function renameLegacyLists(knex, boardId, boardName) {
  const renames = Object.entries(LIST_RENAMES[boardName] || {});
  for (let i = 0; i < renames.length; i += 1) {
    const [oldName, { name: newName, type: newType }] = renames[i];
    // eslint-disable-next-line no-await-in-loop
    const existing = await knex('list').where({ board_id: boardId, name: oldName }).first();
    if (existing) {
      // eslint-disable-next-line no-await-in-loop
      await knex('list').where({ id: existing.id }).update({ name: newName, type: newType });
      // eslint-disable-next-line no-await-in-loop
      await knex('card')
        .where({ list_id: existing.id })
        .update({ is_closed: newType === 'closed' });
    }
  }
}

// Migrates cards from now-defunct Design lists (Produção/Aprovação/...) into
// PEDIDO DE ARTE, then deletes the old lists. Safe to run repeatedly — only
// fires when both source and destination lists are present.
async function migrateLegacyDesignLists(knex, boardId) {
  const destination = await knex('list')
    .where({ board_id: boardId, name: 'PEDIDO DE ARTE' })
    .first();
  if (!destination) return;

  for (let i = 0; i < DESIGN_LEGACY_LISTS_TO_MIGRATE.length; i += 1) {
    const oldName = DESIGN_LEGACY_LISTS_TO_MIGRATE[i];
    // eslint-disable-next-line no-await-in-loop
    const old = await knex('list').where({ board_id: boardId, name: oldName }).first();
    if (old) {
      // eslint-disable-next-line no-await-in-loop
      await knex('card')
        .where({ list_id: old.id })
        .update({ list_id: destination.id, is_closed: false });
      // eslint-disable-next-line no-await-in-loop
      await knex('list').where({ id: old.id }).delete();
    }
  }
}

async function ensureList(knex, boardId, name, position, type = 'active') {
  // Reuse a list with the same name if it already exists. Promote it to the
  // requested type when the seed asks for `closed` and the row is still
  // active (idempotent — does nothing on subsequent runs).
  const existing = await knex('list').where({ board_id: boardId, name }).first();
  if (existing) {
    if (type === 'closed' && existing.type === 'active') {
      await knex('list').where({ id: existing.id }).update({ type: 'closed' });
      // Reflect the closed state on cards that already live in the list.
      await knex('card').where({ list_id: existing.id }).update({ is_closed: true });
    }
    return existing.id;
  }

  const now = new Date().toISOString();
  const [{ id }] = await knex('list')
    .insert({
      board_id: boardId,
      type,
      position,
      name,
      created_at: now,
      updated_at: now,
    })
    .returning('id');
  return id;
}

async function ensureLabel(knex, boardId, name, color, position) {
  const existing = await knex('label').where({ board_id: boardId, name }).first();
  if (existing) return existing.id;

  const now = new Date().toISOString();
  const [{ id }] = await knex('label')
    .insert({
      board_id: boardId,
      position,
      name,
      color,
      created_at: now,
      updated_at: now,
    })
    .returning('id');
  return id;
}

async function seedListsOnBoard(knex, boardId, lists) {
  for (let i = 0; i < lists.length; i += 1) {
    const { name, type } = lists[i];
    // eslint-disable-next-line no-await-in-loop
    await ensureList(knex, boardId, name, (i + 1) * POSITION_GAP, type);
  }
}

async function seedLabelsOnBoard(knex, boardId, labels, positionStart = POSITION_GAP) {
  for (let i = 0; i < labels.length; i += 1) {
    const { name, color } = labels[i];
    // eslint-disable-next-line no-await-in-loop
    await ensureLabel(knex, boardId, name, color, positionStart + i * POSITION_GAP);
  }
}

exports.seed = async (knex) => {
  const admin = await knex('user_account').where('role', 'admin').orderBy('id').first();
  if (!admin) {
    // No admin yet (DEFAULT_ADMIN_EMAIL not set) — nothing to own the project.
    return;
  }

  const fallbackProjectId = await ensureProject(knex, admin.id);

  // Renomeia primeiro pra que as chamadas ensureBoard seguintes encontrem
  // os boards pelo nome novo (Artes, Operacional, Pedido de Venda).
  await renameLegacyBoards(knex);

  // --- Artes board (ex-Design) ---
  const { boardId: designBoardId, projectId: designProjectId } = await ensureBoard(
    knex,
    fallbackProjectId,
    'Artes',
    'kanban',
    POSITION_GAP,
  );
  await ensureBoardMembership(knex, designProjectId, designBoardId, admin.id);
  await renameLegacyLists(knex, designBoardId, 'Artes');
  await migrateLegacyDesignLists(knex, designBoardId);
  await seedListsOnBoard(knex, designBoardId, DESIGN_LISTS);

  // --- Operacional board (ex-Chamados Técnicos) ---
  const { boardId: chamadosBoardId, projectId: chamadosProjectId } = await ensureBoard(
    knex,
    fallbackProjectId,
    'Operacional',
    'table',
    POSITION_GAP * 2,
  );
  await ensureBoardMembership(knex, chamadosProjectId, chamadosBoardId, admin.id);
  await renameLegacyLists(knex, chamadosBoardId, 'Operacional');
  await seedListsOnBoard(knex, chamadosBoardId, CHAMADOS_LISTS);

  // Migra duplicatas legacy de "Finalizado/Finalizados" → CONCLUÍDO. Roda
  // só se a coluna CONCLUÍDO já existir (rename + seed acima garantem isso).
  // Cards são realocados; o stray "Falar com o cliente" só é apagado se
  // estiver vazio (não temos para onde migrar com segurança).
  const concluido = await knex('list')
    .where({ board_id: chamadosBoardId, name: 'CONCLUÍDO' })
    .first();
  if (concluido) {
    const dupes = await knex('list')
      .where({ board_id: chamadosBoardId })
      .whereIn('name', ['Finalizado', 'Finalizados']);
    await Promise.all(
      dupes.map(async (dupe) => {
        await knex('card')
          .where({ list_id: dupe.id })
          .update({ list_id: concluido.id, is_closed: true });
        await knex('list').where({ id: dupe.id }).delete();
      }),
    );
  }

  const strayChamados = await knex('list')
    .where({ board_id: chamadosBoardId, name: 'Falar com o cliente' })
    .first();
  if (strayChamados) {
    const cardCount = await knex('card')
      .where({ list_id: strayChamados.id })
      .count('id as n')
      .first();
    if (Number(cardCount.n) === 0) {
      await knex('list').where({ id: strayChamados.id }).delete();
    }
  }

  await seedLabelsOnBoard(knex, chamadosBoardId, PRIORITY_LABELS);
  // Tipo de chamado labels come AFTER priority labels in position order so
  // they show up at the bottom of the label picker without disturbing the
  // existing priority ordering the team is used to.
  await seedLabelsOnBoard(
    knex,
    chamadosBoardId,
    TIPO_CHAMADO_LABELS,
    POSITION_GAP * (PRIORITY_LABELS.length + 1),
  );

  // --- Pedido de Venda board (ex-Comercial) ---
  const { boardId: comercialBoardId, projectId: comercialProjectId } = await ensureBoard(
    knex,
    fallbackProjectId,
    'Pedido de Venda',
    'table',
    POSITION_GAP * 3,
  );
  await ensureBoardMembership(knex, comercialProjectId, comercialBoardId, admin.id);
  await renameLegacyLists(knex, comercialBoardId, 'Pedido de Venda');
  await seedListsOnBoard(knex, comercialBoardId, COMERCIAL_LISTS);

  // --- Atendimento board (06/2026) ---
  const { boardId: atendimentoBoardId, projectId: atendimentoProjectId } = await ensureBoard(
    knex,
    fallbackProjectId,
    'Atendimento',
    'kanban',
    POSITION_GAP * 4,
  );
  await ensureBoardMembership(knex, atendimentoProjectId, atendimentoBoardId, admin.id);
  await seedListsOnBoard(knex, atendimentoBoardId, ATENDIMENTO_LISTS);
  // Mesmos labels do board Operacional — o card espelhado precisa carregar
  // o mesmo rótulo (a integração de espelhamento entra em PR seguinte).
  await seedLabelsOnBoard(knex, atendimentoBoardId, TIPO_CHAMADO_LABELS);

  // Limpa projetos órfãos (vazios, com nome igual ao board antigo). São
  // resquícios de instalações anteriores que tinham 1 projeto por board.
  await cleanupOrphanProjects(knex);
};
