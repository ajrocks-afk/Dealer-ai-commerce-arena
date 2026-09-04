import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const dealerDir = path.join(root, ".dealer");

const state = JSON.parse(
  fs.readFileSync(path.join(dealerDir, "state.json"), "utf8")
);

const roadmap = fs.readFileSync(
  path.join(dealerDir, "roadmap.md"),
  "utf8"
);

const decisions = fs.readFileSync(
  path.join(dealerDir, "decisions.md"),
  "utf8"
);

const changelog = fs.readFileSync(
  path.join(dealerDir, "changelog.md"),
  "utf8"
);

const brain = `# 🧠 DEALER — PROJECT BRAIN

> Automatically generated project overview.
>
> Do not manually edit this file.
> Edit the files inside \`.dealer/\` instead.

---

# 🔴 CURRENT STATE

**Project:** ${state.project}

**Status:** ${state.status}

**Current Phase:** ${state.currentPhase}

**Current Task:** ${state.currentTask}

**Last Completed:** ${state.lastCompleted}

---

# 🟢 COMPLETED

${state.completed.map((item) => `- [x] ${item}`).join("\n")}

---

# 🟡 IN PROGRESS

${state.inProgress.map((item) => `- [ ] ${item}`).join("\n")}

---

# 🔵 NEXT

${state.next.map((item) => `- [ ] ${item}`).join("\n")}

---

# 🔌 INTEGRATIONS

${Object.entries(state.integrations)
  .map(([name, status]) => `- **${name}:** ${status}`)
  .join("\n")}

---

# 🗺️ ROADMAP

${roadmap}

---

# 📜 ARCHITECTURE DECISIONS

${decisions}

---

# 📝 CHANGELOG

${changelog}

---

# ⚠️ BRAIN RULE

This file is generated automatically.

Do not manually edit BRAIN.md.

Update project state inside:

\`.dealer/state.json\`

Update architectural decisions inside:

\`.dealer/decisions.md\`

Update roadmap inside:

\`.dealer/roadmap.md\`

Update development history inside:

\`.dealer/changelog.md\`
`;

fs.writeFileSync(
  path.join(root, "BRAIN.md"),
  brain,
  "utf8"
);

console.log("🧠 Dealer Brain updated successfully.");