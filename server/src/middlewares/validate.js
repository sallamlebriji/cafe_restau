import { ApiError } from "../utils/errors.js";

export const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw new ApiError(
      422,
      "Donnees invalides.",
      error.details.map((item) => item.message)
    );
  }

  req.body = value;
  next();
};

