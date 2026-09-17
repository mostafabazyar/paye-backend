// src/controllers/profile.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

const genderMap: Record<string, string> = {
  FEMALE: 'WOMEN_ONLY',
  MALE: 'MEN_ONLY',
};

const parseDateOrNull = (value?: unknown) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
};

const isPastDate = (value?: Date | string | null) => {
  if (!value) return false;
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() <= Date.now();
};

const parseBirthDate = (value?: unknown): Date | null => {
  if (!value || typeof value !== 'string') return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

const calculateAge = (birthDate?: Date | null): number | null => {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);

  let age = today.getUTCFullYear() - birth.getUTCFullYear();

  if (
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate())
  ) {
    age--;
  }

  return age;
};

const formatBirthDate = (birthDate?: Date | null): string | null => {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Fetch the user's sport slugs from UserSport.
 * Returns [] if none.
 */
const loadUserSports = async (userId: string): Promise<string[]> => {
  const rows = await prisma.userSport.findMany({
    where: { userId },
    include: { sport: { select: { slug: true } } },
  });
  return rows.map((r) => r.sport.slug);
};

/**
 * Format a user for the API.
 * `sports` is passed in so we don't N+1 across lists.
 */
const formatUserResponse = (user: any, sports: string[] = []) => {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name || null,
    birthDate: formatBirthDate(user.birthDate),
    age: calculateAge(user.birthDate),
    gender: user.gender || null,
    interestedIn: user.interestedIn || 'EVERYONE',
    preferredSports: sports, // ← now from UserSport
    preferredSessionTypes: user.preferredSessionTypes
      ? user.preferredSessionTypes.split(',').filter(Boolean)
      : [],
    bio: user.bio || null,
    photos: user.photos ? JSON.parse(user.photos) : [],
    avgRating: user.avgRating,
    isVerified: user.isVerified,

    // new location fields
    countryId: user.countryId ?? null,
    cityId: user.cityId ?? null,
    neighborhoodId: user.neighborhoodId ?? null,
    latitude: user.latitude ?? null,
    longitude: user.longitude ?? null,
  };
};

/**
 * Upsert a DraftUser mirror for CRM/analytics.
 * Non-fatal — never fails the request if the draft write errors.
 */
const upsertDraft = async (params: {
  userId: string;
  phone: string;
  data: {
    name?: string | null;
    birthDate?: Date | null;
    gender?: string | null;
    interestedIn?: any;
    countryId?: number | null;
    cityId?: number | null;
    neighborhoodId?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    sportsSlugs?: string[];
    sessionTypes?: string[];
    bio?: string | null;
    lastStep?: number;
    completedAt?: Date | null;
  };
}) => {
  try {
    const { userId, phone, data } = params;
    const sportsJson = data.sportsSlugs ? JSON.stringify(data.sportsSlugs) : undefined;
    const sessionStr = data.sessionTypes ? data.sessionTypes.join(',') : undefined;

    await prisma.draftUser.upsert({
      where: { userId },
      update: {
        phone,
        name: data.name,
        birthDate: data.birthDate,
        gender: data.gender,
        interestedIn: data.interestedIn,
        countryId: data.countryId,
        cityId: data.cityId,
        neighborhoodId: data.neighborhoodId,
        latitude: data.latitude,
        longitude: data.longitude,
        sportsSlugs: sportsJson,
        sessionTypes: sessionStr,
        bio: data.bio,
        lastStep: data.lastStep,
        completedAt: data.completedAt,
      },
      create: {
        userId,
        phone,
        name: data.name ?? null,
        birthDate: data.birthDate ?? null,
        gender: data.gender ?? null,
        interestedIn: data.interestedIn ?? null,
        countryId: data.countryId ?? null,
        cityId: data.cityId ?? null,
        neighborhoodId: data.neighborhoodId ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        sportsSlugs: sportsJson ?? null,
        sessionTypes: sessionStr ?? null,
        bio: data.bio ?? null,
        lastStep: data.lastStep ?? 1,
        completedAt: data.completedAt ?? null,
      },
    });
  } catch (err) {
    console.error('Draft upsert error (non-fatal):', err);
  }
};

/* ------------------------------------------------------------------ *
 * SETUP PROFILE — the wizard's final submit
 * ------------------------------------------------------------------ */
export const setupProfile = async (req: Request, res: Response) => {
  try {
    const authUser = (req as any).user;

    if (!authUser?.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Only DRAFT tokens reach this endpoint
    if (authUser.type !== 'DRAFT') {
      return res.status(403).json({
        success: false,
        message: 'Profile setup is only available for draft users',
      });
    }

    const {
      name,
      birthDate,
      gender,
      interestedIn,
      preferredSessionTypes,
      sportSlugs,
      bio,
      countryId,
      cityId,
      neighborhoodId,
      latitude,
      longitude,
    } = req.body;

    const parsedBirthDate = parseBirthDate(birthDate);
    if (!parsedBirthDate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid birth date. Expected format YYYY-MM-DD',
      });
    }

    const age = calculateAge(parsedBirthDate);
    if (age === null || age < 16 || age > 70) {
      return res.status(400).json({
        success: false,
        message: 'Age must be between 16 and 70',
      });
    }

    const sessionTypes = Array.isArray(preferredSessionTypes)
      ? preferredSessionTypes.map(String)
      : [];

    const sportSlugsArray = Array.isArray(sportSlugs)
      ? sportSlugs.map(String)
      : [];

    // Validate sport slugs against Sport table
    let resolvedSports: { id: string; slug: string }[] = [];
    if (sportSlugsArray.length > 0) {
      resolvedSports = await prisma.sport.findMany({
        where: { slug: { in: sportSlugsArray }, isActive: true },
        select: { id: true, slug: true },
      });
      if (resolvedSports.length !== sportSlugsArray.length) {
        const found = new Set(resolvedSports.map((s) => s.slug));
        const missing = sportSlugsArray.filter((s) => !found.has(s));
        return res.status(400).json({
          success: false,
          message: `Unknown or inactive sport(s): ${missing.join(', ')}`,
        });
      }
    }

    const draft = await prisma.draftUser.update({
      where: { id: authUser.id },
      data: {
        name,
        birthDate: parsedBirthDate,
        gender,
        interestedIn,
        sessionTypes: sessionTypes.length > 0 ? sessionTypes.join(',') : null,
        sportsSlugs:
          sportSlugsArray.length > 0
            ? JSON.stringify(sportSlugsArray)
            : null,
        bio,
        countryId: countryId != null ? Number(countryId) : null,
        cityId: cityId != null ? Number(cityId) : null,
        neighborhoodId: neighborhoodId != null ? Number(neighborhoodId) : null,
        latitude: latitude != null ? Number(latitude) : null,
        longitude: longitude != null ? Number(longitude) : null,
        lastStep: 7,
      },
    });

    // No token change — the DRAFT token is still valid.
    return res.json({
      success: true,
      message: 'Draft updated',
      draftId: draft.id,
    });
  } catch (error) {
    console.error('setupProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save profile',
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const sports = await loadUserSports(userId);

    res.json({ success: true, user: formatUserResponse(user, sports) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

/* ------------------------------------------------------------------ *
 * Listings — unchanged logic, but formatUserResponse needs sports
 * ------------------------------------------------------------------ */

export const createProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const {
      sports,
      exerciseType,
      genderPreference,
      title,
      location,
      scheduledAt,
      maxInvites = 1,
      goDutch = false,
      moreInfo,
      tags,
    } = req.body;
    const parsedScheduledAt = parseDateOrNull(scheduledAt);

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (scheduledAt && !parsedScheduledAt) {
      return res.status(400).json({ success: false, message: 'Invalid schedule time' });
    }

    const preference = genderMap[genderPreference] || genderPreference || 'ANY';
    const tagsString = Array.isArray(sports)
      ? sports.map((sport: string) => sport.trim().toLowerCase()).join(',')
      : String(tags || '').toLowerCase();

    const profile = await prisma.profile.create({
      data: {
        userId,
        exerciseType: exerciseType || 'ONE_ON_ONE',
        genderPreference: preference,
        title,
        location,
        scheduledAt: parsedScheduledAt,
        maxInvites: Number(maxInvites) || 1,
        goDutch: !!goDutch,
        moreInfo: moreInfo || null,
        tags: tagsString,
        isActive: !isPastDate(parsedScheduledAt),
      },
    });

    res.status(201).json({ success: true, profile });
  } catch (error) {
    console.error('Create profile listing error:', error);
    res.status(500).json({ success: false, message: 'Failed to create profile listing' });
  }
};

export const exploreListings = async (req: Request, res: Response) => {
  try {
    const {
      sport, skip = '0', take = '20',
      exerciseType, genderPreference, location,
      sortBy = 'newest',
    } = req.query as any;

    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    await prisma.profile.updateMany({
      where: { isActive: true, scheduledAt: { lte: new Date() } },
      data: { isActive: false },
    });

    const where: any = { isActive: true, userId: { not: userId } };
    if (sport) where.tags = { contains: String(sport).toLowerCase() };
    if (exerciseType) where.exerciseType = exerciseType;
    if (genderPreference) where.genderPreference = genderPreference;
    if (location) where.location = { contains: String(location).toLowerCase() };

    const orderBy =
      sortBy === 'soonest'
        ? [{ scheduledAt: 'asc' as const }, { createdAt: 'desc' as const }]
        : sortBy === 'oldest'
          ? { createdAt: 'asc' as const }
          : { createdAt: 'desc' as const };

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true, phone: true, name: true, birthDate: true,
            photos: true, avgRating: true,
            // bring sports via relation
            sports: { include: { sport: { select: { slug: true } } } },
          },
        },
        requests: { where: { requesterId: userId }, select: { status: true } },
      },
      skip: parseInt(skip, 10),
      take: parseInt(take, 10),
      orderBy,
    });

    const formatted = profiles.map((p) => ({
      id: p.id,
      title: p.title,
      location: p.location,
      exerciseType: p.exerciseType,
      genderPreference: p.genderPreference,
      tags: p.tags ? p.tags.split(',').filter(Boolean) : [],
      maxInvites: p.maxInvites,
      goDutch: p.goDutch,
      moreInfo: p.moreInfo,
      scheduledAt: p.scheduledAt,
      isActive: p.isActive,
      createdAt: p.createdAt,
      requestStatus: p.requests[0]?.status || null,
      user: formatUserResponse(
        p.user,
        p.user.sports.map((s) => s.sport.slug)
      ),
    }));

    return res.json({ success: true, profiles: formatted });
  } catch (error) {
    console.error('Explore listings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to explore listings' });
  }
};

export const myCreatedProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profiles = await prisma.profile.findMany({
      where: { userId },
      include: { _count: { select: { requests: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const formattedProfiles = profiles.map((profile) => ({
      id: profile.id,
      title: profile.title,
      location: profile.location,
      exerciseType: profile.exerciseType,
      genderPreference: profile.genderPreference,
      tags: profile.tags ? profile.tags.split(',') : [],
      maxInvites: profile.maxInvites,
      goDutch: profile.goDutch,
      moreInfo: profile.moreInfo,
      scheduledAt: profile.scheduledAt,
      isActive: profile.isActive,
      createdAt: profile.createdAt,
      totalRequests: profile._count.requests,
      isOwner: true,
    }));

    return res.json({ success: true, profiles: formattedProfiles });
  } catch (error) {
    console.error('Fetch user profiles error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your listings' });
  }
};

export const editCreatedProfileListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || (req as any).userId;
    const { id } = req.params;
    const {
      sports, exerciseType, genderPreference, title, location,
      scheduledAt, maxInvites, goDutch, moreInfo, tags, isActive,
    } = req.body;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profileId = parseInt(id as string, 10);
    if (Number.isNaN(profileId)) {
      return res.status(400).json({ success: false, message: 'Invalid profile ID format' });
    }

    const existingProfile = await prisma.profile.findFirst({ where: { id: profileId, userId } });
    if (!existingProfile) {
      return res.status(404).json({ success: false, message: 'Listing not found or you do not have permission to edit it.' });
    }

    const validExerciseTypes = ['ONE_ON_ONE', 'ONE_ON_MANY', 'MANY_ON_MANY'];
    if (exerciseType !== undefined && !validExerciseTypes.includes(exerciseType)) {
      return res.status(400).json({ success: false, message: 'Invalid exercise type' });
    }

    const validGenderPreferences = ['ANY', 'MEN_ONLY', 'WOMEN_ONLY'];
    const mappedGenderPreference =
      genderPreference !== undefined
        ? genderMap[genderPreference] || genderPreference
        : undefined;

    if (mappedGenderPreference !== undefined && !validGenderPreferences.includes(mappedGenderPreference)) {
      return res.status(400).json({ success: false, message: 'Invalid gender preference' });
    }

    let parsedScheduledAt = existingProfile.scheduledAt;
    let computedIsActive = existingProfile.isActive;

    if (scheduledAt !== undefined) {
      const parsed = parseDateOrNull(scheduledAt);
      if (scheduledAt && !parsed) {
        return res.status(400).json({ success: false, message: 'Invalid schedule time' });
      }
      parsedScheduledAt = parsed;
      computedIsActive = !isPastDate(parsed);
    }

    let tagsString = existingProfile.tags;
    if (sports !== undefined) {
      tagsString = Array.isArray(sports)
        ? sports.map((s: string) => s.trim().toLowerCase()).filter(Boolean).join(',')
        : String(sports || '').toLowerCase();
    } else if (tags !== undefined) {
      tagsString = Array.isArray(tags)
        ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean).join(',')
        : String(tags || '').toLowerCase();
    }

    let parsedMaxInvites = existingProfile.maxInvites;
    if (maxInvites !== undefined) {
      parsedMaxInvites = Number(maxInvites);
      if (!Number.isInteger(parsedMaxInvites) || parsedMaxInvites < 1) {
        return res.status(400).json({ success: false, message: 'maxInvites must be at least 1' });
      }
    }

    const approvedCount = await prisma.request.count({
      where: { profileId, status: 'APPROVED' },
    });

    const finalMaxInvites = parsedMaxInvites ?? existingProfile.maxInvites;
    if (approvedCount >= finalMaxInvites) {
      computedIsActive = false;
    } else if (isActive !== undefined) {
      computedIsActive = !!isActive;
    }
    if (isPastDate(parsedScheduledAt)) computedIsActive = false;

    const updateData: any = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (location !== undefined) updateData.location = String(location).trim();
    if (exerciseType !== undefined) updateData.exerciseType = exerciseType;
    if (mappedGenderPreference !== undefined) updateData.genderPreference = mappedGenderPreference;
    if (scheduledAt !== undefined) updateData.scheduledAt = parsedScheduledAt;
    if (maxInvites !== undefined) updateData.maxInvites = parsedMaxInvites;
    if (goDutch !== undefined) updateData.goDutch = !!goDutch;
    if (moreInfo !== undefined) updateData.moreInfo = moreInfo ? String(moreInfo).trim() : null;
    if (sports !== undefined || tags !== undefined) updateData.tags = tagsString;
    updateData.isActive = computedIsActive;

    const updatedProfile = await prisma.profile.update({
      where: { id: existingProfile.id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Listing updated successfully',
      profile: {
        ...updatedProfile,
        tags: updatedProfile.tags ? updatedProfile.tags.split(',').filter(Boolean) : [],
      },
    });
  } catch (error) {
    console.error('Edit profile listing error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile listing',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};