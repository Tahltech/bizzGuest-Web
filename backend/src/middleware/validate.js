/**
 * Validates req.body / req.query / req.params against Zod schemas and
 * replaces them with the parsed (typed, defaulted) result.
 * Usage: router.post('/', validate({ body: createApartmentSchema }), controller.create)
 */
export function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      next(err);
    }
  };
}
