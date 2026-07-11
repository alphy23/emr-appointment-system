const ApiError = require("../utils/ApiError");

// Same idea as validate.js but for query params instead of body
const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(", ");
    return next(new ApiError(400, messages));
  }
  req.query = result.data;
  next();
};

module.exports = validateQuery;