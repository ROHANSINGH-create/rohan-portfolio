import { getCareerGoalByUserId, upsertCareerGoal } from "../repositories/careerGoalRepository.mjs";
import { getCareerById, listCareers } from "../repositories/careerRepository.mjs";

export function browseCareers(search = "") {
  return listCareers(search);
}

export function getCareerDetails(careerId) {
  return getCareerById(careerId);
}

export function selectCareerGoal(userId, careerId, note = "") {
  const career = getCareerById(careerId);
  if (!career) {
    const error = new Error("Career not found");
    error.statusCode = 404;
    throw error;
  }

  upsertCareerGoal(userId, careerId, String(note || "").trim());
  return getUserCareerGoal(userId);
}

export function getUserCareerGoal(userId, profile = null) {
  const goal = getCareerGoalByUserId(userId);
  if (!goal) return null;

  const career = getCareerById(goal.careerId);
  return {
    ...goal,
    career,
    roleFit: buildRoleFit(profile, career),
  };
}

function buildRoleFit(profile, career) {
  if (!career) return null;
  if (!profile) {
    return {
      summary: "Add your profile details to get a personalized role-fit explanation.",
      reasons: [],
    };
  }

  const profileInterests = new Set((profile.interests || []).map((x) => x.toLowerCase()));
  const profileCareerInterests = new Set((profile.careerInterests || []).map((x) => x.toLowerCase()));
  const profileSkills = new Set((profile.technicalSkills || []).map((x) => x.toLowerCase()));
  const matchedSkills = (career.skills || [])
    .map((skill) => skill.skillName)
    .filter((skill) => profileSkills.has(skill.toLowerCase()));

  const reasons = [];
  if (matchedSkills.length) reasons.push(`You already have ${matchedSkills.length} aligned technical skill(s): ${matchedSkills.join(", ")}.`);
  if (profileInterests.has("security") && career.title.toLowerCase().includes("security")) reasons.push("Your interests show security-focused motivation.");
  if (profileInterests.has("web development") && /(frontend|backend|full stack)/i.test(career.title)) reasons.push("Your interests include web development, aligned with this role.");
  if (profileCareerInterests.has(career.title.toLowerCase())) reasons.push("You marked this role in your career interests.");
  if (profile.weeklyLearningHours > 0) reasons.push(`You can dedicate ${profile.weeklyLearningHours} learning hour(s) weekly, which supports steady progress.`);

  if (!reasons.length) reasons.push("This recommendation is based on your selected target role; complete profile details for deeper personalization.");

  return {
    summary: `Role-fit guidance for ${career.title} is based on your current profile and tracked interests.`,
    reasons,
  };
}
