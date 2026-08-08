export async function up(knex) {
  await knex.schema.alterTable('payment_transactions', (t) => {
    t.enu('event_status', ['created', 'pending', 'succeeded', 'failed', 'webhook_received', 'refunded']).notNullable().alter();
  });
}

export async function down(knex) {
  await knex.schema.alterTable('payment_transactions', (t) => {
    t.enu('event_status', ['created', 'pending', 'succeeded', 'failed', 'webhook_received']).notNullable().alter();
  });
}
