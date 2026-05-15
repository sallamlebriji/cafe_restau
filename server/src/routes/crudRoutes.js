import { Router } from "express";
import { createCrudController } from "../controllers/crudController.js";
import { allowRoles, protect, scopeEstablishment } from "../middlewares/auth.js";
import { ApiError } from "../utils/errors.js";

const managerRoles = ["SUPER_ADMIN", "ADMIN_ESTABLISHMENT", "MANAGER"];

export const buildCrudRouter = (model, options = {}) => {
  const router = Router();
  const controller = createCrudController(model, options);
  const canWrite = async (req, _res, next) => {
    try {
      if (options.canWrite && !(await options.canWrite(req))) {
        throw new ApiError(403, "Vous n'avez pas la permission d'effectuer cette action.");
      }
      next();
    } catch (error) {
      next(error);
    }
  };
  const canRead = async (req, _res, next) => {
    try {
      if (options.canRead && !(await options.canRead(req))) {
        throw new ApiError(403, "Vous n'avez pas la permission de consulter cette ressource.");
      }
      next();
    } catch (error) {
      next(error);
    }
  };

  router.get("/", protect, canRead, scopeEstablishment, controller.list);
  router.post("/", protect, allowRoles(...(options.writeRoles || managerRoles)), scopeEstablishment, canWrite, controller.create);
  router.get("/:id", protect, canRead, controller.get);
  router.put("/:id", protect, allowRoles(...(options.writeRoles || managerRoles)), scopeEstablishment, canWrite, controller.update);
  router.delete("/:id", protect, allowRoles(...(options.writeRoles || managerRoles)), canWrite, controller.remove);

  return router;
};
