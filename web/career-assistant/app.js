const API = "/api";
const storageKey = "careerAssistantUserId";

const els = {
  form: document.getElementById("profileForm"),
  profileStatus: document.getElementById("profileStatus"),
  profileBar: document.getElementById("profileBar"),
  profileCompletenessLabel: document.getElementById("profileCompletenessLabel"),
  profileMissing: document.getElementById("profileMissing"),
  careerSearch: document.getElementById("careerSearch"),
  careerList: document.getElementById("careerList"),
  careerStatus: document.getElementById("careerStatus"),
  goalDetail: document.getElementById("goalDetail"),
  compareA: document.getElementById("compareA"),
  compareB: document.getElementById("compareB"),
  compareResult: document.getElementById("compareResult"),
};

const state = {
  userId: null,
  careers: [],
  profile: null,
  goal: null,
};

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function toCsv(items) {
  return Array.isArray(items) ? items.join(", ") : "";
}

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

async function ensureUser() {
  const existing = Number(localStorage.getItem(storageKey) || "");
  if (Number.isInteger(existing) && existing > 0) {
    state.userId = existing;
    return;
  }

  const data = await api("/users/bootstrap", { method: "POST" });
  state.userId = data.user.id;
  localStorage.setItem(storageKey, String(state.userId));
}

function fillProfileForm(profile) {
  if (!profile) return;
  const fd = new FormData(els.form);
  for (const [key] of fd.entries()) {
    const field = els.form.elements.namedItem(key);
    if (!field) continue;
    const value = profile[key];
    if (Array.isArray(value)) field.value = toCsv(value);
    else field.value = value ?? "";
  }
}

function renderCompleteness(completeness) {
  const percent = completeness?.percentage || 0;
  els.profileBar.style.width = `${percent}%`;
  els.profileCompletenessLabel.textContent = `${percent}% complete`;
  const missing = completeness?.missingFields || [];
  els.profileMissing.textContent = missing.length
    ? `Missing: ${missing.join(", ")}`
    : "Great job — profile is complete.";
}

function renderCareers(items) {
  els.careerList.innerHTML = "";
  for (const career of items) {
    const el = document.createElement("article");
    el.className = "career-item";
    el.innerHTML = `
      <h3>${career.title}</h3>
      <p>${career.description}</p>
      <span class="pill">Difficulty: ${career.difficultyLevel}</span>
      <button type="button" data-id="${career.id}">Select Career</button>
    `;
    el.querySelector("button").addEventListener("click", () => selectCareer(career.id));
    els.careerList.appendChild(el);
  }
}

function renderGoal() {
  if (!state.goal?.career) {
    els.goalDetail.className = "goal-empty";
    els.goalDetail.textContent = "No career selected yet.";
    return;
  }

  const { career, roleFit } = state.goal;
  const skills = (career.skills || []).map((x) => x.skillName);
  const reasons = roleFit?.reasons || [];
  els.goalDetail.className = "goal-box";
  els.goalDetail.innerHTML = `
    <h3>${career.title}</h3>
    <p>${career.description}</p>
    <p><strong>Difficulty:</strong> ${career.difficultyLevel}</p>
    <p><strong>Entry-level expectations:</strong> ${career.entryLevelExpectations}</p>
    <p><strong>Recommended direction:</strong> ${career.recommendedDirection}</p>
    <p><strong>Main required skills:</strong> ${skills.join(", ")}</p>
    <p><strong>Why this may fit:</strong> ${roleFit?.summary || "Role fit updates after profile data is available."}</p>
    <ul>${reasons.map((reason) => `<li>${reason}</li>`).join("")}</ul>
    <p class="subtle">Guidance only — this is not a guaranteed career outcome.</p>
  `;
}

function renderCompareOptions() {
  const options = ['<option value="">Select</option>']
    .concat(state.careers.map((career) => `<option value="${career.id}">${career.title}</option>`))
    .join("");
  els.compareA.innerHTML = options;
  els.compareB.innerHTML = options;
}

function renderComparison() {
  const left = state.careers.find((item) => String(item.id) === els.compareA.value);
  const right = state.careers.find((item) => String(item.id) === els.compareB.value);
  if (!left || !right) {
    els.compareResult.textContent = "Select two careers to compare role direction and difficulty.";
    return;
  }
  els.compareResult.innerHTML = `
    <strong>${left.title}</strong> vs <strong>${right.title}</strong><br />
    Difficulty: ${left.difficultyLevel} vs ${right.difficultyLevel}<br />
    Direction: ${left.recommendedDirection}<br />
    Direction: ${right.recommendedDirection}<br />
    <span class="subtle">Choose the role that best matches your interests, existing skills, and available weekly learning time.</span>
  `;
}

async function loadProfile() {
  const data = await api(`/users/${state.userId}/profile`);
  state.profile = data.profile;
  fillProfileForm(state.profile);
  renderCompleteness(state.profile?.completeness);
}

async function loadCareers(search = "") {
  const data = await api(`/careers?search=${encodeURIComponent(search)}`);
  state.careers = data.careers || [];
  renderCareers(state.careers);
  renderCompareOptions();
  renderComparison();
}

async function loadGoal() {
  const data = await api(`/users/${state.userId}/career-goal`);
  state.goal = data.goal;
  renderGoal();
}

async function saveProfile(event) {
  event.preventDefault();
  const formData = new FormData(els.form);
  const payload = {
    name: formData.get("name"),
    education: formData.get("education"),
    degree: formData.get("degree"),
    currentStage: formData.get("currentStage"),
    experienceLevel: formData.get("experienceLevel"),
    technicalSkills: splitCsv(formData.get("technicalSkills")),
    nonTechnicalSkills: splitCsv(formData.get("nonTechnicalSkills")),
    interests: splitCsv(formData.get("interests")),
    previousExperience: formData.get("previousExperience"),
    careerInterests: splitCsv(formData.get("careerInterests")),
    weeklyLearningHours: Number(formData.get("weeklyLearningHours")),
  };

  els.profileStatus.textContent = "Saving...";
  try {
    const data = await api(`/users/${state.userId}/profile`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    state.profile = data.profile;
    renderCompleteness(state.profile?.completeness);
    els.profileStatus.textContent = "Profile saved.";
    await loadGoal();
  } catch (error) {
    els.profileStatus.textContent = error.message;
  }
}

async function selectCareer(careerId) {
  els.careerStatus.textContent = "Saving career goal...";
  try {
    const data = await api(`/users/${state.userId}/career-goal`, {
      method: "PUT",
      body: JSON.stringify({ careerId }),
    });
    state.goal = data.goal;
    renderGoal();
    els.careerStatus.textContent = "Career goal saved.";
  } catch (error) {
    els.careerStatus.textContent = error.message;
  }
}

function wireEvents() {
  els.form.addEventListener("submit", saveProfile);
  els.careerSearch.addEventListener("input", (event) => loadCareers(event.target.value));
  els.compareA.addEventListener("change", renderComparison);
  els.compareB.addEventListener("change", renderComparison);
}

async function init() {
  try {
    wireEvents();
    await ensureUser();
    await Promise.all([loadProfile(), loadCareers(), loadGoal()]);
  } catch (error) {
    els.profileStatus.textContent = error.message;
  }
}

init();
