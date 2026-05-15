export const notFound = (req, _res, next) => {
  const error = new Error(`Route introuvable: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (err, _req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Erreur serveur.";
  let details = err.details || null;

  if (err?.code === 11000) {
    statusCode = 409;
    message = "Donnee deja existante.";
    details = { fields: Object.keys(err.keyPattern || {}) };
  }

  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Token invalide.";
  }

  res.status(statusCode).json({
    success: false,
    message,
    details,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};
