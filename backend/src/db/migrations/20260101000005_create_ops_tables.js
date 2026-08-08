export async function up(knex) {
  await knex.schema.createTable('housekeeping_tasks', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments');
    t.bigInteger('assigned_to').unsigned().nullable().references('id').inTable('users');
    t.bigInteger('booking_id').unsigned().nullable().references('id').inTable('bookings');
    t.enu('priority', ['low', 'normal', 'urgent']).notNullable().defaultTo('normal');
    t.enu('status', ['pending', 'in_progress', 'done']).notNullable().defaultTo('pending');
    t.enu('triggered_by', ['checkout', 'manual']).notNullable().defaultTo('manual');
    t.text('notes').nullable();
    t.timestamp('completed_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['status', 'priority']);
    t.index('apartment_id');
  });

  await knex.schema.createTable('maintenance_requests', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments');
    t.bigInteger('reported_by').unsigned().notNullable().references('id').inTable('users');
    t.bigInteger('assigned_to').unsigned().nullable().references('id').inTable('users');
    t.string('title', 150).notNullable();
    t.text('description').nullable();
    t.enu('severity', ['low', 'medium', 'high', 'critical']).notNullable().defaultTo('medium');
    t.enu('status', ['open', 'in_progress', 'resolved', 'cancelled']).notNullable().defaultTo('open');
    t.timestamp('resolved_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['status', 'severity']);
    t.index('apartment_id');
  });

  await knex.schema.createTable('notifications', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('type', 60).notNullable();
    t.string('title', 150).notNullable();
    t.string('body', 500).nullable();
    t.string('related_type', 60).nullable();
    t.bigInteger('related_id').unsigned().nullable();
    t.timestamp('read_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['user_id', 'read_at']);
  });

  // Append-only. No update/delete grant — enforced at the application layer,
  // never written from a controller directly, only from service methods.
  await knex.schema.createTable('audit_logs', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().nullable().references('id').inTable('users');
    t.string('action', 80).notNullable();
    t.string('entity_type', 60).notNullable();
    t.bigInteger('entity_id').unsigned().nullable();
    t.string('ip', 64).nullable();
    t.json('metadata').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['entity_type', 'entity_id']);
    t.index('user_id');
    t.index('created_at');
  });

  await knex.schema.createTable('settings', (t) => {
    t.increments('id').unsigned().primary();
    t.integer('property_id').unsigned().nullable();
    t.string('key', 100).notNullable();
    t.json('value').notNullable();
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique('key');
  });

  // Powers the honest "N guests viewing" signal from architecture §57 — real
  // data only, never fabricated.
  await knex.schema.createTable('apartment_views', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments').onDelete('CASCADE');
    t.string('session_id', 64).notNullable();
    t.timestamp('viewed_at').notNullable().defaultTo(knex.fn.now());
    t.index(['apartment_id', 'viewed_at']);
  });

  await knex.schema.createTable('email_jobs', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('template', 80).notNullable();
    t.string('to_email', 190).notNullable();
    t.json('payload').notNullable();
    t.enu('status', ['queued', 'sending', 'sent', 'failed']).notNullable().defaultTo('queued');
    t.tinyint('attempts').unsigned().notNullable().defaultTo(0);
    t.text('last_error').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('sent_at').nullable();
    t.index(['status', 'created_at']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('email_jobs');
  await knex.schema.dropTableIfExists('apartment_views');
  await knex.schema.dropTableIfExists('settings');
  await knex.schema.dropTableIfExists('audit_logs');
  await knex.schema.dropTableIfExists('notifications');
  await knex.schema.dropTableIfExists('maintenance_requests');
  await knex.schema.dropTableIfExists('housekeeping_tasks');
}
