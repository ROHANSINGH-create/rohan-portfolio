import { assertUserExists } from "../auth/userContext.mjs";
import { readJsonBody, sendJson } from "../core/http.mjs";
import { createUser } from "../repositories/userRepository.mjs";
import { browseCareers, getCareerDetails, getUserCareerGoal, selectCareerGoal } from "../services/careerService.mjs";
import { ensureProfileForUser, getProfileForUser, saveProfileForUser } from "../services/profileService.mjs";

function parsePath(url) {
  return new URL(url, "http://127.0.0.1").pathname;
}

function notFound(res) {
  sendJson(res, 404, { error: "Not found" });
}

export async function handleApiRequest(req, res) {
  const pathname = parsePath(req.url || "/");
  const method = req.method || "GET";
  const query = new URL(req.url || "/", "http://127.0.0.1").searchParams;

  if (method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { status: "ok" });
    return true;
  }

  if (method === "POST" && pathname === "/api/users/bootstrap") {
    const user = createUser();
    const profile = ensureProfileForUser(user.id);
    sendJson(res, 201, { user, profile });
    return true;
  }

  if (method === "GET" && pathname === "/api/careers") {
    const careers = browseCareers(query.get("search") || "");
    sendJson(res, 200, { careers });
    return true;
  }

  const careerDetailMatch = pathname.match(/^\/api\/careers\/(\d+)$/);
  if (method === "GET" && careerDetailMatch) {
    const career = getCareerDetails(Number(careerDetailMatch[1]));
    if (!career) {
      notFound(res);
      return true;
    }
    sendJson(res, 200, { career });
    return true;
  }

  const profileMatch = pathname.match(/^\/api\/users\/(\d+)\/profile$/);
  if (profileMatch) {
    const user = assertUserExists(profileMatch[1]);

    if (method === "GET") {
      const profile = getProfileForUser(user.id);
      sendJson(res, 200, { profile });
      return true;
    }

    if (method === "PUT") {
      const payload = await readJsonBody(req);
      const profile = saveProfileForUser(user.id, payload);
      sendJson(res, 200, { profile });
      return true;
    }
  }

  const careerGoalMatch = pathname.match(/^\/api\/users\/(\d+)\/career-goal$/);
  if (careerGoalMatch) {
    const user = assertUserExists(careerGoalMatch[1]);

    if (method === "GET") {
      const profile = getProfileForUser(user.id);
      const goal = getUserCareerGoal(user.id, profile);
      sendJson(res, 200, { goal });
      return true;
    }

    if (method === "PUT") {
      const payload = await readJsonBody(req);
      selectCareerGoal(user.id, Number(payload.careerId), payload.note || "");
      const profile = getProfileForUser(user.id);
      const goal = getUserCareerGoal(user.id, profile);
      sendJson(res, 200, { goal });
      return true;
    }
  }

  return false;
}
