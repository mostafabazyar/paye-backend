import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * GET /api/locations/countries
 * Returns all countries.
 */
export const listCountries = async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await prisma.country.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        nameFa: true,
      },
    });

    res.json({ success: true, countries });
  } catch (error) {
    console.error("listCountries error:", error);
    res.status(500).json({ success: false, message: "Failed to load countries" });
  }
};

/**
 * GET /api/locations/cities?countryId=1
 */
export const listCities = async (req: Request, res: Response): Promise<void> => {
  try {
    const countryId = Number(req.query.countryId);

    if (!Number.isInteger(countryId) || countryId <= 0) {
      res.status(400).json({ success: false, message: "countryId is required" });
      return;
    }

    const cities = await prisma.city.findMany({
      where: { countryId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameFa: true,
      },
    });

    res.json({ success: true, cities });
  } catch (error) {
    console.error("listCities error:", error);
    res.status(500).json({ success: false, message: "Failed to load cities" });
  }
};

/**
 * GET /api/locations/neighborhoods?cityId=1
 * Returns neighborhoods for a city. May be empty for smaller cities.
 */
export const listNeighborhoods = async (req: Request, res: Response): Promise<void> => {
  try {
    const cityId = Number(req.query.cityId);

    if (!Number.isInteger(cityId) || cityId <= 0) {
      res.status(400).json({ success: false, message: "cityId is required" });
      return;
    }

    const neighborhoods = await prisma.neighborhood.findMany({
      where: { cityId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        nameFa: true,
      },
    });

    res.json({ success: true, neighborhoods });
  } catch (error) {
    console.error("listNeighborhoods error:", error);
    res.status(500).json({ success: false, message: "Failed to load neighborhoods" });
  }
};