/*!
 * Ensures every board named "Design" has a default "Falar com o cliente"
 * (active) list. Idempotent: skipped when the list already exists.
 */

const DEFAULT_LIST_NAME = 'Falar com o cliente';
const TARGET_BOARD_NAME = 'Design';
const POSITION_GAP = 65536;

exports.seed = async (knex) => {
  const designBoards = await knex('board').where('name', TARGET_BOARD_NAME).select('id');

  // eslint-disable-next-line no-restricted-syntax
  for (const { id: boardId } of designBoards) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await knex('list')
      .where({
        board_id: boardId,
        name: DEFAULT_LIST_NAME,
        type: 'active',
      })
      .first();

    if (existing) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const last = await knex('list')
      .where({ board_id: boardId })
      .whereIn('type', ['active', 'category', 'status', 'closed'])
      .max('position as max')
      .first();

    const nextPosition = Number((last && last.max) || 0) + POSITION_GAP;
    const now = new Date().toISOString();

    // eslint-disable-next-line no-await-in-loop
    await knex('list').insert({
      board_id: boardId,
      type: 'active',
      position: nextPosition,
      name: DEFAULT_LIST_NAME,
      created_at: now,
      updated_at: now,
    });
  }
};
