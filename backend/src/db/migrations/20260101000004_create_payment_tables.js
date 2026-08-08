export async function up(knex) {
  await knex.schema.createTable('payments', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('booking_id').unsigned().notNullable().references('id').inTable('bookings');
    t.enu('method', ['mtn_momo', 'orange_money', 'card', 'bank_transfer', 'cash', 'manual']).notNullable();
    t.enu('provider', ['campay', 'manual']).notNullable().defaultTo('manual');
    t.integer('amount_minor').unsigned().notNullable();
    t.string('currency', 3).notNullable().defaultTo('XAF');
    t.enu('status', ['pending', 'processing', 'succeeded', 'failed', 'refunded']).notNullable().defaultTo('pending');
    t.string('idempotency_key', 100).notNullable();
    t.string('provider_reference', 100).nullable(); // Campay reference once created
    t.bigInteger('recorded_by').unsigned().nullable().references('id').inTable('users'); // set for manual/cash payments
    t.text('notes').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique('idempotency_key');
    t.index('booking_id');
    t.index('provider_reference');
  });

  // Append-only event log — never updated, only inserted. payments.status is
  // derived from the latest row here. See architecture §11.
  await knex.schema.createTable('payment_transactions', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('payment_id').unsigned().notNullable().references('id').inTable('payments');
    t.string('provider', 40).notNullable();
    t.string('provider_reference', 100).notNullable();
    t.enu('event_status', ['created', 'pending', 'succeeded', 'failed', 'webhook_received']).notNullable();
    t.json('raw_payload').nullable();
    t.timestamp('occurred_at').notNullable().defaultTo(knex.fn.now());
    // Deduplicates replayed webhooks: the same (provider, provider_reference, event_status)
    // can only be recorded once.
    t.unique(['provider', 'provider_reference', 'event_status'], 'uniq_provider_event');
  });

  await knex.schema.createTable('expense_categories', (t) => {
    t.increments('id').unsigned().primary();
    t.string('name', 100).notNullable();
    t.unique('name');
  });

  await knex.schema.createTable('expenses', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.integer('category_id').unsigned().notNullable().references('id').inTable('expense_categories');
    t.string('description', 255).notNullable();
    t.integer('amount_minor').unsigned().notNullable();
    t.string('currency', 3).notNullable().defaultTo('XAF');
    t.date('incurred_on').notNullable();
    t.enu('payment_method', ['cash', 'bank_transfer', 'mobile_money', 'card', 'other']).notNullable();
    t.bigInteger('recorded_by').unsigned().notNullable().references('id').inTable('users');
    t.string('receipt_storage_key', 255).nullable();
    t.text('notes').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['incurred_on', 'category_id']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('expenses');
  await knex.schema.dropTableIfExists('expense_categories');
  await knex.schema.dropTableIfExists('payment_transactions');
  await knex.schema.dropTableIfExists('payments');
}
