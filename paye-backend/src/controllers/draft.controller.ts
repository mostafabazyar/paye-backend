import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * POST /api/draft/step
 *
 * Called at each wizard step. Saves progress to DraftUser so we
 * capture abandoned signups for CRM.
 *
 * Body: { phone, lastStep, ...any wizard fields }
 * Auth: expects the user to be logged in (verify OTP created the User).
 */
export const saveDraftStep = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const {
      lastStep,
      name,
      birthDate,
      gender,
      interestedIn,
      countryId,
      cityId,
      neighborhoodId,
      latitude,
      longitude,
      sportSlugs,
      sessionTypes,
      bio,
    } = req.body;

    const parsedBirthDate = birthDate ? new Date(String(birthDate)) : null;
    const validBirth =
      parsedBirthDate && !Number.isNaN(parsedBirthDate.getTime())
        ? parsedBirthDate
        : undefined;

    const sportsJson = Array.isArray(sportSlugs)
      ? JSON.stringify(sportSlugs)
      : undefined;
    const sessionStr = Array.isArray(sessionTypes)
      ? sessionTypes.join(',')
      : undefined;

    const draft = await prisma.draftUser.upsert({
      where: { userId },
      update: {
        phone: user.phone,
        lastStep: Number.isInteger(lastStep) ? lastStep : undefined,
        name: name !== undefined ? String(name) : undefined,
        birthDate: validBirth,
        gender: gender !== undefined ? String(gender) : undefined,
        interestedIn: interestedIn !== undefined ? interestedIn : undefined,
        countryId:
          countryId !== undefined && countryId !== null
            ? Number(countryId)
            : undefined,
        cityId:
          cityId !== undefined && cityId !== null ? Number(cityId) : undefined,
        neighborhoodId:
          neighborhoodId !== undefined && neighborhoodId !== null
            ? Number(neighborhoodId)
            : undefined,
        latitude: latitude !== undefined ? Number(latitude) : undefined,
        longitude: longitude !== undefined ? Number(longitude) : undefined,
        sportsSlugs: sportsJson,
        sessionTypes: sessionStr,
        bio: bio !== undefined ? String(bio) : undefined,
      },
      create: {
        userId,
        phone: user.phone,
        lastStep: Number.isInteger(lastStep) ? lastStep : 1,
        name: name != null ? String(name) : null,
        birthDate: validBirth ?? null,
        gender: gender != null ? String(gender) : null,
        interestedIn: interestedIn ?? null,
        countryId: countryId != null ? Number(countryId) : null,
        cityId: cityId != null ? Number(cityId) : null,
        neighborhoodId: neighborhoodId != null ? Number(neighborhoodId) : null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        sportsSlugs: sportsJson ?? null,
        sessionTypes: sessionStr ?? null,
        bio: bio != null ? String(bio) : null,
      },
    });

    return res.json({ success: true, draftId: draft.id, lastStep: draft.lastStep });
  } catch (error) {
    console.error('saveDraftStep error:', error);
    return res.status(500).json({ success: false, message: 'Failed to save draft step' });
  }
};

/**
 * POST /api/draft/abandon
 *
 * Called when the user explicitly backs out of the wizard.
 * Marks the draft with an abandonedAt timestamp.
 */
export const abandonDraft = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const draft = await prisma.draftUser.findUnique({ where: { userId } });
    if (!draft) {
      return res.json({ success: true, message: 'No draft to abandon' });
    }

    await prisma.draftUser.update({
      where: { userId },
      data: { abandonedAt: new Date() },
    });

    return res.json({ success: true });
  } catch (error) {
    console.error('abandonDraft error:', error);
    return res.status(500).json({ success: false, message: 'Failed to abandon draft' });
  }
};

/**
 * GET /api/draft/me
 *
 * Used by the wizard on mount to resume from `lastStep`.
 */
export const getMyDraft = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const draft = await prisma.draftUser.findUnique({ where: { userId } });
    return res.json({ success: true, draft: draft ?? null });
  } catch (error) {
    console.error('getMyDraft error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load draft' });
  }
};