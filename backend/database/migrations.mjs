const CAREERS = [
  {
    slug: "frontend-developer",
    title: "Frontend Developer",
    description: "Build responsive user interfaces and web experiences.",
    difficultyLevel: "Medium",
    entryLevelExpectations: "Strong HTML/CSS/JavaScript basics and at least 2 UI projects.",
    recommendedDirection: "Master JavaScript fundamentals, React, accessibility, and API integration.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "REST APIs"],
  },
  {
    slug: "backend-developer",
    title: "Backend Developer",
    description: "Design APIs, services, and database-driven applications.",
    difficultyLevel: "Medium",
    entryLevelExpectations: "Comfort with one backend language and SQL plus 2 backend projects.",
    recommendedDirection: "Focus on Python/Node.js, SQL, API design, and authentication.",
    skills: ["Python", "Node.js", "SQL", "REST APIs", "Git", "Authentication"],
  },
  {
    slug: "full-stack-developer",
    title: "Full Stack Developer",
    description: "Build complete applications across frontend and backend.",
    difficultyLevel: "High",
    entryLevelExpectations: "Ability to build and deploy end-to-end projects independently.",
    recommendedDirection: "Strengthen frontend + backend foundations, then build integrated projects.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Node.js", "SQL", "Git"],
  },
  {
    slug: "cybersecurity-analyst",
    title: "Cybersecurity Analyst",
    description: "Protect systems by monitoring, assessing, and improving security posture.",
    difficultyLevel: "High",
    entryLevelExpectations: "Security fundamentals, Linux basics, networking, and lab-based practice.",
    recommendedDirection: "Start with networking, Linux, web security, and security tools.",
    skills: ["Networking", "Linux", "Python", "Security Fundamentals", "Web Security"],
  },
  {
    slug: "data-analyst",
    title: "Data Analyst",
    description: "Analyze data and deliver business insights using visualization and statistics.",
    difficultyLevel: "Medium",
    entryLevelExpectations: "SQL + spreadsheets + dashboard project and data storytelling ability.",
    recommendedDirection: "Learn SQL, Python data stack, statistics, and dashboarding tools.",
    skills: ["SQL", "Python", "Pandas", "Statistics", "Data Visualization"],
  },
  {
    slug: "machine-learning-engineer",
    title: "Machine Learning Engineer",
    description: "Build and deploy machine learning models for real-world use.",
    difficultyLevel: "High",
    entryLevelExpectations: "Strong Python, math basics, ML projects, and deployment understanding.",
    recommendedDirection: "Build strong Python + math fundamentals, then model training and deployment.",
    skills: ["Python", "Machine Learning", "TensorFlow", "Data Preprocessing", "Model Deployment"],
  },
];

export function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INTEGER PRIMARY KEY,
      name TEXT DEFAULT '',
      education TEXT DEFAULT '',
      degree TEXT DEFAULT '',
      current_stage TEXT DEFAULT '',
      experience_level TEXT DEFAULT '',
      technical_skills TEXT NOT NULL DEFAULT '[]',
      non_technical_skills TEXT NOT NULL DEFAULT '[]',
      interests TEXT NOT NULL DEFAULT '[]',
      previous_experience TEXT DEFAULT '',
      career_interests TEXT NOT NULL DEFAULT '[]',
      weekly_learning_hours INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS careers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      difficulty_level TEXT NOT NULL,
      entry_level_expectations TEXT NOT NULL,
      recommended_direction TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS career_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      career_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      requirement_type TEXT NOT NULL DEFAULT 'required',
      UNIQUE(career_id, skill_name),
      FOREIGN KEY (career_id) REFERENCES careers(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS career_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      career_id INTEGER NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (career_id) REFERENCES careers(id)
    );
  `);

  seedReferenceCareers(db);
}

function seedReferenceCareers(db) {
  const careerCount = db.prepare("SELECT COUNT(*) AS count FROM careers").get().count;
  if (careerCount > 0) return;

  const insertCareer = db.prepare(`
    INSERT INTO careers (slug, title, description, difficulty_level, entry_level_expectations, recommended_direction)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertSkill = db.prepare(`
    INSERT INTO career_skills (career_id, skill_name, requirement_type)
    VALUES (?, ?, 'required')
  `);

  db.exec("BEGIN TRANSACTION");
  try {
    for (const career of CAREERS) {
      const result = insertCareer.run(
        career.slug,
        career.title,
        career.description,
        career.difficultyLevel,
        career.entryLevelExpectations,
        career.recommendedDirection
      );
      const careerId = Number(result.lastInsertRowid);
      for (const skill of career.skills) insertSkill.run(careerId, skill);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
