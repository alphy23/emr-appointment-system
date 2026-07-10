const ApiError = require("../utils/ApiError");

// Generic middleware: pass any zod schema, it validates req.body
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    return next(new ApiError(400, messages));
  }
  req.body = result.data; // use parsed/sanitized data
  next();
};

module.exports = validate;