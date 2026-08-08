import { db } from '../../db/knex.js';

export const apartmentTypes = {
  list: () => db('apartment_types').orderBy('name'),
  findById: (id) => db('apartment_types').where({ id }).first(),
  findBySlug: (slug) => db('apartment_types').where({ slug }).first(),
  create: (data) => db('apartment_types').insert(data),
  update: (id, data) => db('apartment_types').where({ id }).update(data)
};

export const amenities = {
  list: () => db('amenities').orderBy('label'),
  findById: (id) => db('amenities').where({ id }).first(),
  create: (data) => db('amenities').insert(data)
};
