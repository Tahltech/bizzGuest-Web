export async function up(knex) {
  await knex.schema.createTable('guests', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    t.string('full_name', 150).notNullable();
    t.string('email', 190).nullable();
    t.string('phone', 30).nullable();
    t.string('country', 80).nullable();
    t.string('address', 255).nullable();
    t.string('id_type', 40).nullable(); // e.g. national_id, passport
    t.text('id_number_encrypted').nullable(); // AES-256-GCM, see lib/encryption.js
    t.string('id_document_storage_key', 255).nullable(); // private bucket path, never a public URL
    t.string('emergency_contact_name', 150).nullable();
    t.string('emergency_contact_phone', 30).nullable();
    t.boolean('is_verified').notNullable().defaultTo(false);
    t.text('notes').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at').nullable();
    t.index('email');
    t.index('phone');
  });

  await knex.schema.createTable('bookings', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('reference', 20).notNullable();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments');
    t.bigInteger('guest_id').unsigned().nullable().references('id').inTable('guests');
    t.date('check_in').notNullable();
    t.date('check_out').notNullable();
    t.smallint('nights').unsigned().notNullable();
    t.smallint('guests_count').unsigned().notNullable().defaultTo(1);

    t.enu('status', [
      'pending', 'awaiting_payment', 'confirmed', 'checked_in',
      'checked_out', 'cancelled', 'no_show', 'completed', 'expired'
    ]).notNullable().defaultTo('pending');

    t.enu('payment_status', ['unpaid', 'partially_paid', 'paid', 'refunded', 'failed']).notNullable().defaultTo('unpaid');

    t.integer('room_subtotal_minor').unsigned().notNullable().defaultTo(0);
    t.integer('tax_minor').unsigned().notNullable().defaultTo(0);
    t.integer('discount_minor').unsigned().notNullable().defaultTo(0);
    t.integer('fees_minor').unsigned().notNullable().defaultTo(0);
    t.integer('deposit_minor').unsigned().notNullable().defaultTo(0);
    t.integer('total_minor').unsigned().notNullable().defaultTo(0);
    t.integer('paid_minor').unsigned().notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('XAF');

    t.enu('source', ['website', 'admin', 'walk_in']).notNullable().defaultTo('website');

    t.timestamp('checked_in_at').nullable();
    t.bigInteger('checked_in_by').unsigned().nullable().references('id').inTable('users');
    t.timestamp('checked_out_at').nullable();
    t.bigInteger('checked_out_by').unsigned().nullable().references('id').inTable('users');
    t.text('room_condition_notes').nullable();

    t.string('cancelled_reason', 255).nullable();
    t.bigInteger('cancelled_by').unsigned().nullable().references('id').inTable('users');
    t.timestamp('cancelled_at').nullable();

    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    t.unique('reference');
    // The index every availability + concurrency check relies on — see architecture §9/§10.
    t.index(['apartment_id', 'status', 'check_in', 'check_out'], 'idx_bookings_apartment_overlap');
    t.index('guest_id');
  });

  await knex.schema.createTable('booking_guests', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('booking_id').unsigned().notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.string('full_name', 150).notNullable();
    t.boolean('is_primary').notNullable().defaultTo(false);
    t.index('booking_id');
  });

  // The concurrency seam from architecture §10 — protects a pending/awaiting_payment
  // booking for a short window without permanently locking the apartment.
  await knex.schema.createTable('booking_holds', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('booking_id').unsigned().notNullable().references('id').inTable('bookings').onDelete('CASCADE');
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments');
    t.timestamp('expires_at').notNullable();
    t.timestamp('released_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.unique('booking_id');
    t.index(['apartment_id', 'expires_at']);
  });

  // Atomic per-year counter for booking references (BG-2026-000001). Incremented
  // inside the same transaction as the booking insert via SELECT ... FOR UPDATE.
  await knex.schema.createTable('booking_reference_sequences', (t) => {
    t.smallint('year').unsigned().primary();
    t.integer('next_value').unsigned().notNullable().defaultTo(1);
  });

  await knex.schema.createTable('reviews', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('booking_id').unsigned().notNullable().references('id').inTable('bookings');
    t.bigInteger('guest_id').unsigned().notNullable().references('id').inTable('guests');
    t.tinyint('overall_rating').unsigned().notNullable();
    t.tinyint('cleanliness_rating').unsigned().nullable();
    t.tinyint('comfort_rating').unsigned().nullable();
    t.tinyint('service_rating').unsigned().nullable();
    t.text('comment').nullable();
    t.enu('status', ['pending', 'published', 'rejected']).notNullable().defaultTo('pending');
    t.bigInteger('moderated_by').unsigned().nullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.unique('booking_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('reviews');
  await knex.schema.dropTableIfExists('booking_reference_sequences');
  await knex.schema.dropTableIfExists('booking_holds');
  await knex.schema.dropTableIfExists('booking_guests');
  await knex.schema.dropTableIfExists('bookings');
  await knex.schema.dropTableIfExists('guests');
}
