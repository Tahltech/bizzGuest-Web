export async function up(knex) {
  await knex.schema.createTable('apartment_types', (t) => {
    t.increments('id').unsigned().primary();
    t.string('name', 100).notNullable();
    t.string('slug', 100).notNullable();
    t.text('description').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique('slug');
  });

  await knex.schema.createTable('apartments', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.integer('property_id').unsigned().nullable(); // multi-property seam, see architecture §0
    t.integer('apartment_type_id').unsigned().notNullable().references('id').inTable('apartment_types');
    t.string('code', 20).notNullable();
    t.string('name', 150).notNullable();
    t.string('slug', 170).notNullable();
    t.text('description').nullable();
    t.integer('price_night_minor').unsigned().notNullable();
    t.integer('price_week_minor').unsigned().nullable();
    t.integer('price_month_minor').unsigned().nullable();
    t.smallint('max_guests').unsigned().notNullable().defaultTo(2);
    t.smallint('beds').unsigned().notNullable().defaultTo(1);
    t.smallint('bathrooms').unsigned().notNullable().defaultTo(1);
    t.string('floor', 20).nullable();
    t.enu('status', ['available', 'reserved', 'occupied', 'cleaning', 'maintenance', 'out_of_service']).notNullable().defaultTo('available');
    t.boolean('is_featured').notNullable().defaultTo(false);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.text('maintenance_notes').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at').nullable();
    t.unique('code');
    t.unique('slug');
    t.index(['status', 'is_active']);
  });

  await knex.schema.createTable('amenities', (t) => {
    t.increments('id').unsigned().primary();
    t.string('label', 80).notNullable();
    t.string('icon_key', 60).notNullable();
    t.unique('label');
  });

  await knex.schema.createTable('apartment_amenities', (t) => {
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments').onDelete('CASCADE');
    t.integer('amenity_id').unsigned().notNullable().references('id').inTable('amenities').onDelete('CASCADE');
    t.primary(['apartment_id', 'amenity_id']);
  });

  await knex.schema.createTable('apartment_media', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments').onDelete('CASCADE');
    t.enu('type', ['image', 'video']).notNullable().defaultTo('image');
    t.string('storage_key', 255).notNullable();
    t.string('url', 500).notNullable();
    t.integer('sort_order').unsigned().notNullable().defaultTo(0);
    t.boolean('is_featured').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['apartment_id', 'sort_order']);
  });

  await knex.schema.createTable('pricing_rules', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments').onDelete('CASCADE');
    t.enu('rule_type', ['weekend', 'seasonal', 'long_stay_discount']).notNullable();
    t.date('starts_on').nullable();
    t.date('ends_on').nullable();
    t.enu('modifier_type', ['percent', 'fixed']).notNullable();
    t.integer('modifier_value').notNullable(); // percent: basis points off 100; fixed: minor units
    t.integer('min_nights').unsigned().nullable(); // for long_stay_discount
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['apartment_id', 'is_active']);
  });

  await knex.schema.createTable('blocked_dates', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('apartment_id').unsigned().notNullable().references('id').inTable('apartments').onDelete('CASCADE');
    t.date('starts_on').notNullable();
    t.date('ends_on').notNullable();
    t.string('reason', 255).notNullable();
    t.bigInteger('created_by').unsigned().notNullable().references('id').inTable('users');
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index(['apartment_id', 'starts_on', 'ends_on']);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('blocked_dates');
  await knex.schema.dropTableIfExists('pricing_rules');
  await knex.schema.dropTableIfExists('apartment_media');
  await knex.schema.dropTableIfExists('apartment_amenities');
  await knex.schema.dropTableIfExists('amenities');
  await knex.schema.dropTableIfExists('apartments');
  await knex.schema.dropTableIfExists('apartment_types');
}
