import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';


const JWT_SECRET =
  process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';


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

export const completeDraft = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id || authUser.type !== 'DRAFT') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const draft = await prisma.draftUser.findUnique({
      where: { id: authUser.id },
    });

    if (!draft) {
      return res
        .status(404)
        .json({ success: false, message: 'Draft not found' });
    }

    if (!draft.name || !draft.birthDate) {
      return res.status(400).json({
        success: false,
        message: 'Draft is missing required fields (name, birthDate)',
      });
    }

    // Parse sports slugs
    let sportSlugs: string[] = [];
    try {
      sportSlugs = draft.sportsSlugs ? JSON.parse(draft.sportsSlugs) : [];
    } catch {
      sportSlugs = [];
    }

    const sports = await prisma.sport.findMany({
      where: { slug: { in: sportSlugs }, isActive: true },
      select: { id: true },
    });

    const sessionTypes = draft.sessionTypes
      ? draft.sessionTypes.split(',').filter(Boolean)
      : [];

    // Atomic: create User, copy sports, mark draft complete
    const createdUser = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          phone: draft.phone,
          name: draft.name,
          birthDate: draft.birthDate,
          gender: draft.gender,
          interestedIn: draft.interestedIn ?? 'EVERYONE',
          preferredSessionTypes:
            sessionTypes.length > 0 ? sessionTypes.join(',') : null,
          bio: draft.bio,
          countryId: draft.countryId,
          cityId: draft.cityId,
          neighborhoodId: draft.neighborhoodId,
          latitude: draft.latitude,
          longitude: draft.longitude,
          isVerified: true,
        },
      });

      if (sports.length > 0) {
        await tx.userSport.createMany({
          data: sports.map((s) => ({ userId: newUser.id, sportId: s.id })),
          skipDuplicates: true,
        });
      }

      // Link the draft to the new user and mark complete
      await tx.draftUser.update({
        where: { id: draft.id },
        data: {
          userId: newUser.id,
          completedAt: new Date(),
          abandonedAt: null,
        },
      });

      return newUser;
    });

    // Issue a real USER token — the DRAFT token is now dead
    const token = jwt.sign(
      { id: createdUser.id, phone: createdUser.phone, type: 'USER' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Reuse the same response shaper
    const userResponse = {
      id: createdUser.id,
      phone: createdUser.phone,
      name: createdUser.name,
      birthDate: createdUser.birthDate,
      gender: createdUser.gender,
      interestedIn: createdUser.interestedIn,
      preferredSports: sportSlugs,
      preferredSessionTypes: sessionTypes,
      bio: createdUser.bio,
      photos: createdUser.photos ? JSON.parse(createdUser.photos) : [],
      avgRating: createdUser.avgRating,
      isVerified: createdUser.isVerified,
    };

    return res.status(201).json({
      success: true,
      message: 'Signup complete',
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error('completeDraft error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to complete signup',
    });
  }
};