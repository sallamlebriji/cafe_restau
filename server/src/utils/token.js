import jwt from "jsonwebtoken";

export const signToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      role: user.roleName,
      establishmentId: user.establishmentId
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

