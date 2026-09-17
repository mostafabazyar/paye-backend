import { Router } from "express";
import {
  listCountries,
  listCities,
  listNeighborhoods,
} from "../controllers/location.controller";

const router = Router();

// Public — no auth
router.get("/countries", listCountries);
router.get("/cities", listCities);
router.get("/neighborhoods", listNeighborhoods);

export default router;