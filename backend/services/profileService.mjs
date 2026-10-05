import {
  createEmptyProfile,
  getProfileByUserId,
  upsertProfile,
} from "../repositories/profileRepository.mjs";

const COMPLETENESS_FIELDS = [
  "name",
  "education",
  "degree",
  "currentStage",
  "experienceLevel",
  "technicalSkills",
  "nonTechnicalSkills",
  "interests",
  "careerInterests",
  "weeklyLearningHours",
];

function normalizeList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function ensureProfileForUser(userId) {
  createEmptyProfile(userId);
  return getProfileForUser(userId);
}

export function getProfileForUser(userId) {
  const profile = getProfileByUserId(userId);
  if (!profile) return null;

  const completeness = calculateProfileCompleteness(profile);
  return { ...profile, completeness };
}

export function saveProfileForUser(userId, payload) {
  const normalized = {
    name: String(payload.name || "").trim(),
    education: String(payload.education || "").trim(),
    degree: String(payload.degree || "").trim(),
    currentStage: String(payload.currentStage || "").trim(),
    experienceLevel: String(payload.experienceLevel || "").trim(),
    technicalSkills: normalizeList(payload.technicalSkills),
    nonTechnicalSkills: normalizeList(payload.nonTechnicalSkills),
    interests: normalizeList(payload.interests),
    previousExperience: String(payload.previousExperience || "").trim(),
    careerInterests: normalizeList(payload.careerInterests),
    weeklyLearningHours: Math.max(0, Number(payload.weeklyLearningHours) || 0),
  };

  upsertProfile(userId, normalized);
  return getProfileForUser(userId);
}

function calculateProfileCompleteness(profile) {
  const missingFields = [];
  let completed = 0;

  for (const field of COMPLETENESS_FIELDS) {
    const value = profile[field];
    const isDone = Array.isArray(value)
      ? value.length > 0
      : typeof value === "number"
        ? value > 0
        : String(value || "").trim().length > 0;

    if (isDone) completed += 1;
    else missingFields.push(field);
  }

  return {
    totalFields: COMPLETENESS_FIELDS.length,
    completedFields: completed,
    percentage: Math.round((completed / COMPLETENESS_FIELDS.length) * 100),
    missingFields,
  };
}
