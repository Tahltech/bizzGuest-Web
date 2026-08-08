const PERMISSIONS = [
  ['apartments.view', 'apartments'], ['apartments.manage', 'apartments'],
  ['bookings.view', 'bookings'], ['bookings.manage', 'bookings'],
  ['bookings.cancel', 'bookings'], ['bookings.checkin', 'bookings'], ['bookings.checkout', 'bookings'],
  ['guests.view', 'guests'], ['guests.manage', 'guests'],
  ['payments.view', 'payments'], ['payments.manage', 'payments'], ['payments.refund', 'payments'],
  ['expenses.view', 'finance'], ['expenses.manage', 'finance'],
  ['housekeeping.view', 'housekeeping'], ['housekeeping.manage', 'housekeeping'],
  ['maintenance.view', 'maintenance'], ['maintenance.manage', 'maintenance'],
  ['staff.view', 'staff'], ['staff.manage', 'staff'],
  ['reports.view', 'reports'], ['reports.financial', 'reports'],
  ['settings.view', 'settings'], ['settings.manage', 'settings'],
  ['reviews.moderate', 'reviews'],
  ['audit.view', 'audit']
];

const ROLES = [
  { slug: 'super_admin', name: 'Super Administrator', isSystem: true, permissions: '*' },
  {
    slug: 'manager',
    name: 'Manager',
    isSystem: true,
    permissions: [
      'apartments.view', 'apartments.manage',
      'bookings.view', 'bookings.manage', 'bookings.cancel', 'bookings.checkin', 'bookings.checkout',
      'guests.view', 'guests.manage',
      'payments.view',
      'expenses.view',
      'housekeeping.view', 'housekeeping.manage',
      'maintenance.view', 'maintenance.manage',
      'staff.view', 'staff.manage',
      'reports.view',
      'settings.view',
      'reviews.moderate'
    ]
  },
  {
    slug: 'receptionist',
    name: 'Receptionist',
    isSystem: true,
    permissions: [
      'apartments.view',
      'bookings.view', 'bookings.manage', 'bookings.checkin', 'bookings.checkout',
      'guests.view', 'guests.manage',
      'payments.view', 'payments.manage'
    ]
  },
  {
    slug: 'accountant',
    name: 'Accountant',
    isSystem: true,
    permissions: [
      'apartments.view', 'bookings.view', 'guests.view',
      'payments.view', 'payments.manage', 'payments.refund',
      'expenses.view', 'expenses.manage',
      'reports.view', 'reports.financial'
    ]
  },
  {
    slug: 'housekeeper',
    name: 'Housekeeper',
    isSystem: true,
    permissions: ['apartments.view', 'housekeeping.view', 'housekeeping.manage']
  },
  {
    slug: 'maintenance',
    name: 'Maintenance Staff',
    isSystem: true,
    permissions: ['apartments.view', 'maintenance.view', 'maintenance.manage']
  },
  {
    slug: 'guest',
    name: 'Guest',
    isSystem: true,
    // Guests act on their own records only — enforced by ownership checks in
    // the guest-facing routes, not by this permission list.
    permissions: []
  }
];

export async function seed(knex) {
  await knex('role_permissions').del();
  await knex('user_roles').del();
  await knex('permissions').del();
  await knex('roles').del();

  await knex('permissions').insert(
    PERMISSIONS.map(([slug, module]) => ({ slug, module }))
  );
  const allPermissions = await knex('permissions').select('id', 'slug');
  const permissionIdBySlug = Object.fromEntries(allPermissions.map((p) => [p.slug, p.id]));

  for (const role of ROLES) {
    const [roleId] = await knex('roles').insert({
      slug: role.slug,
      name: role.name,
      is_system: role.isSystem
    });

    const slugs = role.permissions === '*' ? allPermissions.map((p) => p.slug) : role.permissions;
    if (slugs.length) {
      await knex('role_permissions').insert(
        slugs.map((slug) => ({ role_id: roleId, permission_id: permissionIdBySlug[slug] }))
      );
    }
  }
}
