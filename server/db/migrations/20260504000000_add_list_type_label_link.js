module.exports.up = (knex) =>
  knex.schema.alterTable('list', (table) => {
    table.bigInteger('label_id').nullable().references('id').inTable('label').onDelete('SET NULL');
  });

module.exports.down = (knex) =>
  knex.schema.alterTable('list', (table) => {
    table.dropColumn('label_id');
  });
