import { Router } from "express";
import {
  listTenants,
  getTenant,
  provisionTenant,
  updateTenant,
  toggleTenant,
  deleteTenant,
  getTenantStats,
  impersonateTenant,
  resetAdminPassword,
  createTenantAdmin
} from "../controllers/tenantController.js";
import { allowRoles, protect } from "../middlewares/auth.js";

const router = Router();

// Toutes les routes tenants sont réservées au SUPER_ADMIN
router.use(protect, allowRoles("SUPER_ADMIN"));

router.get  ("/",                   listTenants);           // Liste paginée + search
router.post ("/provision",          provisionTenant);       // Créer un tenant complet
router.get  ("/:id",                getTenant);             // Détail d'un tenant
router.put  ("/:id",                updateTenant);          // Modifier un tenant
router.patch("/:id/toggle",         toggleTenant);          // Activer/désactiver
router.delete("/:id",               deleteTenant);          // Supprimer (cascade)
router.get  ("/:id/stats",          getTenantStats);        // Stats d'un tenant
router.post ("/:id/impersonate",    impersonateTenant);     // Se connecter comme admin
router.post ("/:id/reset-admin",    resetAdminPassword);    // Reset mot de passe admin
router.post ("/:id/admin",          createTenantAdmin);     // Creer admin manquant

export default router;
