export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.string('full_name', 150).notNullable();
    t.string('email', 190).notNullable();
    t.string('phone', 30).nullable();
    t.string('password_hash', 255).notNullable();
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('email_verified_at').nullable();
    t.timestamp('last_login_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('deleted_at').nullable();
    t.unique('email');
  });

  await knex.schema.createTable('roles', (t) => {
    t.increments('id').unsigned().primary();
    t.string('slug', 60).notNullable();
    t.string('name', 100).notNullable();
    t.string('description', 255).nullable();
    t.boolean('is_system').notNullable().defaultTo(false);
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    t.unique('slug');
  });

  await knex.schema.createTable('permissions', (t) => {
    t.increments('id').unsigned().primary();
    t.string('slug', 100).notNullable();
    t.string('module', 60).notNullable();
    t.string('description', 255).nullable();
    t.unique('slug');
    t.index('module');
  });

  await knex.schema.createTable('role_permissions', (t) => {
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.integer('permission_id').unsigned().notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    t.primary(['role_id', 'permission_id']);
  });

  await knex.schema.createTable('user_roles', (t) => {
    t.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.integer('role_id').unsigned().notNullable().references('id').inTable('roles').onDelete('CASCADE');
    t.primary(['user_id', 'role_id']);
  });

  await knex.schema.createTable('sessions', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('refresh_token_hash', 255).notNullable();
    t.string('user_agent', 255).nullable();
    t.string('ip', 64).nullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('revoked_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('user_id');
  });

  await knex.schema.createTable('password_reset_tokens', (t) => {
    t.bigIncrements('id').unsigned().primary();
    t.bigInteger('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    t.string('token_hash', 255).notNullable();
    t.timestamp('expires_at').notNullable();
    t.timestamp('used_at').nullable();
    t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    t.index('user_id');
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('password_reset_tokens');
  await knex.schema.dropTableIfExists('sessions');
  await knex.schema.dropTableIfExists('user_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('users');
}
