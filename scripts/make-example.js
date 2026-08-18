#!/usr/bin/env node
"use strict";

const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PLAY = path.join(ROOT, "examples", "playground");

function git(cwd, args, opts = {}) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: opts.stdio || ["ignore", "pipe", "pipe"],
  });
}

function write(dir, rel, content) {
  const p = path.join(dir, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function freshWork(id) {
  const work = path.join(PLAY, id);
  const origin = path.join(PLAY, `${id}.origin.git`);
  rmrf(work);
  rmrf(origin);
  fs.mkdirSync(work, { recursive: true });
  git(work, ["init", "-b", "main"]);
  git(work, ["config", "user.name", "Hoc Vien"]);
  git(work, ["config", "user.email", "hocvien@example.com"]);
  git(work, ["config", "commit.gpgsign", "false"]);
  git(work, ["config", "advice.statusHints", "false"]);
  return { work, origin };
}

function makeBare(origin) {
  fs.mkdirSync(path.dirname(origin), { recursive: true });
  git(path.dirname(origin), ["init", "--bare", "-b", "main", origin]);
}

function commitAll(work, message) {
  git(work, ["add", "."]);
  git(work, ["commit", "-m", message]);
}

function seedApp(work) {
  write(
    work,
    "app.js",
    [
      "function greet(name) {",
      '  return "Xin chao " + name;',
      "}",
      "",
      'console.log(greet("ban"));',
      "",
    ].join("\n")
  );
  write(work, "version.txt", "1.0.0\n");
  write(work, "README.txt", "Mini app dung de thuc hanh Git.\n");
  commitAll(work, "initial commit");
}

function attachOrigin(work, origin) {
  makeBare(origin);
  git(work, ["remote", "add", "origin", origin]);
  git(work, ["push", "-u", "origin", "main"]);
}

function writePractice(work, meta) {
  const body = [
    `# ${meta.title}`,
    "",
    `Tinh huong tut: **${meta.tut}**`,
    "",
    "## Ban dang o dau",
    meta.setup,
    "",
    "## Muc tieu",
    meta.goal,
    "",
    "## Goi y (dung dung lenh trong tut)",
    "```bash",
    meta.commands.trim(),
    "```",
    "",
    "## Kiem tra",
    meta.check,
    "",
    "Thu muc nay la sandbox. Khong lien quan den slide `index.html`.",
    "Tao lai: `yarn make-example " + meta.id + "`",
    "",
  ].join("\n");
  write(work, "PRACTICE.md", body);
  const exclude = path.join(work, ".git", "info", "exclude");
  fs.mkdirSync(path.dirname(exclude), { recursive: true });
  fs.appendFileSync(exclude, "\nPRACTICE.md\nTHEO_DOI.md\n");
}

const catalog = [];

function def(item) {
  catalog.push(item);
}

function runBuilder(item) {
  const { work, origin } = freshWork(item.id);
  item.build({ work, origin });
  writePractice(work, item);
  return work;
}

def({
  id: "2a",
  tut: "2a — Code xong quen tao branch (chua commit)",
  title: "Quen tao branch — chua commit",
  aliases: ["2"],
  setup:
    "Ban dang dung `main`. Da sua `app.js` nhung **chua** `git add` / `git commit`. Can tao branch de lam MR.",
  goal: "Chuyen sang branch moi, giu changes, roi add + commit.",
  commands: `
git checkout -b feature-moi
# Hoac: git switch -c feature-moi

git add .
git status
git commit -m "commit"
`,
  check: "`git branch` phai thay `feature-moi`. `git status` sach.",
  build({ work }) {
    seedApp(work);
    write(
      work,
      "app.js",
      [
        "function greet(name) {",
        '  return "Xin chao " + name + "!";',
        "}",
        "",
        'console.log(greet("ban"));',
        "",
      ].join("\n")
    );
  },
});

def({
  id: "2b",
  tut: "2b — Quen tao branch (da commit tren main)",
  title: "Quen tao branch — da commit",
  aliases: ["2"],
  setup:
    "Ban dang dung `main` va **da commit** tinh nang tren main (sai cho). Chua push.",
  goal: "Dung `reset HEAD~1` de khoi phuc, roi tao branch nhu 2a.",
  commands: `
git reset HEAD~1
git checkout -b feature-moi
git add .
git commit -m "commit"
`,
  check: "`main` khong con commit tinh nang. Commit nam tren `feature-moi`.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\nconsole.log(greet('ban'));\n");
    commitAll(work, "tinh nang moi (nham commit tren main)");
  },
});

def({
  id: "2c",
  tut: "2c — Quen tao branch (da push, chua merge)",
  title: "Quen tao branch — da push",
  aliases: ["2"],
  setup:
    "Commit nham tren `main` **da push** len origin. Chua merge MR. Origin gia nam trong thu muc `.origin.git`.",
  goal: "Van dung `git reset HEAD~1` (vi chua merge), roi tao branch.",
  commands: `
git reset HEAD~1
git checkout -b feature-moi
git add .
git commit -m "commit"
`,
  check: "Local `main` lui 1 commit. Branch `feature-moi` giu commit.",
  build({ work, origin }) {
    seedApp(work);
    attachOrigin(work, origin);
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\n");
    commitAll(work, "tinh nang moi (da push nham vao main)");
    git(work, ["push", "origin", "main"]);
  },
});

def({
  id: "3a",
  tut: "3a — Pull khong duoc (chua commit)",
  title: "Pull ket — chua commit",
  aliases: ["3"],
  setup:
    "Origin co 2 commit moi. May ban co **changes chua commit** (va se conflict khi pull).",
  goal: "Stash lai, pull ve, stash pop, fix conflict neu co.",
  commands: `
git stash
git pull
git stash pop
# sua conflict neu co
git add .
git commit -m "commit"
`,
  check: "`git pull` thanh cong, code local + remote deu giu duoc.",
  build({ work, origin }) {
    seedApp(work);
    attachOrigin(work, origin);

    const other = path.join(PLAY, "3a-other");
    rmrf(other);
    git(PLAY, ["clone", origin, other]);
    git(other, ["config", "user.name", "Dong Nghiep"]);
    git(other, ["config", "user.email", "dongnghiep@example.com"]);
    git(other, ["config", "commit.gpgsign", "false"]);
    write(other, "app.js", "function greet(n) { return 'Hello ' + n; }\nconsole.log(greet('team'));\n");
    commitAll(other, "commit remote 1");
    write(other, "version.txt", "1.0.1\n");
    commitAll(other, "commit remote 2");
    git(other, ["push", "origin", "main"]);
    rmrf(other);

    write(work, "app.js", "function greet(n) { return 'Xin chao ' + n; }\nconsole.log(greet('toi'));\n");
  },
});

def({
  id: "3b",
  tut: "3b — Pull khong duoc (da commit local)",
  title: "Pull ket — da commit local",
  aliases: ["3"],
  setup:
    "Origin co 2 commit can pull. May ban co **1 commit local chua push**.",
  goal: "Reset HEAD~1, stash, pull, stash pop, fix conflict.",
  commands: `
git reset HEAD~1
git stash
git pull
git stash pop
# sua conflict neu co
git add .
git commit -m "commit"
`,
  check: "Lich su local da lay 2 commit remote + commit cua ban.",
  build({ work, origin }) {
    seedApp(work);
    attachOrigin(work, origin);

    const other = path.join(PLAY, "3b-other");
    rmrf(other);
    git(PLAY, ["clone", origin, other]);
    git(other, ["config", "user.name", "Dong Nghiep"]);
    git(other, ["config", "user.email", "dongnghiep@example.com"]);
    git(other, ["config", "commit.gpgsign", "false"]);
    write(other, "app.js", "function greet(n) { return 'Hello ' + n; }\n");
    commitAll(other, "commit remote 1");
    write(other, "version.txt", "1.0.1\n");
    commitAll(other, "commit remote 2");
    git(other, ["push", "origin", "main"]);
    rmrf(other);

    write(work, "app.js", "function greet(n) { return 'Xin chao ' + n; }\n");
    commitAll(work, "commit local chua push");
  },
});

def({
  id: "4a",
  tut: "4a — Bo changes chua commit",
  title: "Bo changes — chua commit",
  aliases: ["4"],
  setup:
    "Dang sua tinh nang, `app.js` va `version.txt` deu sai. Chi muon lam lai **mot file**.",
  goal: "Discard `app.js`, giu `version.txt`.",
  commands: `
git restore app.js
# hoac: git checkout app.js

git status
`,
  check: "`app.js` ve nhu commit cu. `version.txt` van con sua.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "BROKEN CODE // lam sai\n");
    write(work, "version.txt", "9.9.9\n");
  },
});

def({
  id: "4b",
  tut: "4b — Bo changes da commit / lay file tu commit cu",
  title: "Lay lai file tu commit cu",
  aliases: ["4"],
  setup:
    "Da commit nhieu lan. `app.js` o commit cu tot hon. Xem `git log --oneline`.",
  goal: "Lay `app.js` tu commit cu, hoac tu `main` neu dang o branch khac.",
  commands: `
git log --oneline
git checkout <ma_commit> -- app.js

# neu muon lay dung file tu main:
git checkout main -- app.js
`,
  check: "`app.js` giong noi dung o commit/nhanh da chon.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'OK ' + n; }\n");
    commitAll(work, "app.js tot");
    git(work, ["checkout", "-b", "feature-sai"]);
    write(work, "app.js", "function greet(n) { return 'SAI ' + n; }\n");
    commitAll(work, "lam sai lan 1");
    write(work, "app.js", "function greet() { return 'SAI HON'; }\n");
    commitAll(work, "lam sai lan 2");
  },
});

def({
  id: "5a",
  tut: "5a — Commit thieu file (amend)",
  title: "Commit thieu file — amend",
  aliases: ["5"],
  setup:
    "Vua commit tinh nang nhung **quen tang version**. Chua push. `version.txt` dang sua do, chua nam trong commit.",
  goal: "Gom change version vao commit vua tao bang amend.",
  commands: `
git add .
git commit --amend --no-edit
`,
  check: "`git status` sach. `git log -1` van 1 commit, da gom ca version.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\n");
    commitAll(work, "them tinh nang (thieu version)");
    write(work, "version.txt", "1.1.0\n");
  },
});

def({
  id: "5b",
  tut: "5b — Commit thieu file (reset roi commit lai)",
  title: "Commit thieu file — reset",
  aliases: ["5"],
  setup: "Giong 5a: commit thieu version. Chua push. Lan nay dung reset.",
  goal: "Reset HEAD~1, sua, add, commit lai.",
  commands: `
git reset HEAD~1
# sua file neu can
git add .
git commit -m "commit"
`,
  check: "Mot commit moi gom ca app.js va version.txt.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\n");
    commitAll(work, "them tinh nang (thieu version)");
    write(work, "version.txt", "1.1.0\n");
  },
});

def({
  id: "6a",
  tut: "6a — Commit nham .env (chua push)",
  title: "Commit nham .env — chua push",
  aliases: ["6"],
  setup: "Vua commit `.env` (nhay cam). Chua push. Chua co `.gitignore`.",
  goal: "Reset, discard/bo .env, them vao .gitignore, commit lai.",
  commands: `
git reset HEAD~1
# discard file .env (khong commit no)
# them .env vao .gitignore
git add .
git commit -m "commit"
`,
  check: "`.env` khong con trong commit. `.gitignore` co `.env`.",
  build({ work }) {
    seedApp(work);
    write(work, ".env", "SECRET=super-secret-do-not-commit\n");
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\n");
    commitAll(work, "tinh nang + .env (nham)");
  },
});

def({
  id: "6b",
  tut: "6b — .env da push qua nhieu commit",
  title: "Boc .env ra khoi lich su",
  aliases: ["6"],
  setup:
    "`.env` nam trong nhieu commit da push len origin. Can boc sach lich su roi force push.",
  goal: "Dung dung lenh filter-branch trong tut, roi gitignore + commit + force push.",
  commands: `
git filter-branch --force --index-filter \\
  "git rm --cached --ignore-unmatch .env" \\
  --prune-empty --tag-name-filter cat -- --all

# them .env vao .gitignore
git add .
git commit -m "remove file .env from git"
git push origin main --force
`,
  check: "`.env` khong con trong `git log --all -- .env`. Origin da duoc force push.",
  build({ work, origin }) {
    seedApp(work);
    attachOrigin(work, origin);
    write(work, ".env", "SECRET=aaa\n");
    commitAll(work, "add .env");
    write(work, "app.js", "function greet(n) { return 'A ' + n; }\n");
    commitAll(work, "feature 1 (van con .env)");
    write(work, ".env", "SECRET=bbb\n");
    write(work, "version.txt", "1.0.2\n");
    commitAll(work, "feature 2 (van con .env)");
    git(work, ["push", "origin", "main"]);
  },
});

def({
  id: "7",
  tut: "7 — Quay lai commit cu (A roi B, da push)",
  title: "Quay lai commit A",
  setup:
    "Commit A (tot) roi commit B (loi). Ca hai da push. `git log --oneline` de xem. Thu reset --hard hoac revert theo tut.",
  goal: "Ve commit A bang mot trong cac cach trong tut.",
  commands: `
git log --oneline

# a. checkout commit A (thu cong, copy file)
git checkout <ma_commit_A>

# b. lui theo HEAD (vi du A la commit thu 1 sau B => HEAD~1)
git reset HEAD~1

# cach chuan hon (xoa B o local + remote)
git reset --hard <ma_commit_A>
git push origin main --force

# hoac an toan hon: revert B
git revert <ma_commit_B>
`,
  check: "Code giong commit A, hoac co commit revert B.",
  build({ work, origin }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'TOT ' + n; }\n");
    commitAll(work, "commit A tot");
    attachOrigin(work, origin);
    write(work, "app.js", "function greet(n) { throw new Error('loi rat nhieu'); }\n");
    commitAll(work, "commit B loi");
    git(work, ["push", "origin", "main"]);
  },
});

def({
  id: "8",
  tut: "8 — MR bi conflict, khong merge vao main",
  title: "MR conflict",
  setup:
    "Ban dang o `ten_branch`. Origin/main da tien len va **conflict** voi branch. MR khong merge duoc.",
  goal: "Checkout main, pull, checkout branch, merge main, fix, push **ten_branch**.",
  commands: `
git checkout main
git pull origin main
git checkout ten_branch
git merge main

# sua conflict
git add .
git commit -m "fix conflict"
git push origin ten_branch
`,
  check: "Push `ten_branch` (khong phai main). Merge khong con conflict.",
  build({ work, origin }) {
    seedApp(work);
    attachOrigin(work, origin);

    git(work, ["checkout", "-b", "ten_branch"]);
    write(work, "app.js", "function greet(n) { return 'FEATURE ' + n; }\n");
    commitAll(work, "tinh nang tren branch");
    git(work, ["push", "-u", "origin", "ten_branch"]);

    git(work, ["checkout", "main"]);
    const other = path.join(PLAY, "8-other");
    rmrf(other);
    git(PLAY, ["clone", origin, other]);
    git(other, ["config", "user.name", "Dong Nghiep"]);
    git(other, ["config", "user.email", "dongnghiep@example.com"]);
    git(other, ["config", "commit.gpgsign", "false"]);
    git(other, ["checkout", "main"]);
    write(other, "app.js", "function greet(n) { return 'MAIN ' + n; }\n");
    commitAll(other, "main tien len");
    git(other, ["push", "origin", "main"]);
    rmrf(other);

    git(work, ["checkout", "ten_branch"]);
  },
});

def({
  id: "9",
  tut: "9 — dev nhieu tinh nang, chi lay mot phan vao main",
  title: "Cherry-pick / merge chon loc tu dev",
  setup:
    "`dev` co 2 tinh nang (login + dark-mode). Chi duoc dua **login** vao main. Dark-mode cho khach duyet.",
  goal: "Tao branch tu main, cherry-pick commit login (C1) hoac merge nhanh tinh nang (C2).",
  commands: `
git checkout main
git checkout -b release-partial

# C1: cherry-pick dung commit login (xem git log --oneline dev)
git log --oneline dev
git cherry-pick <ma_commit_login>

# C2: merge nhanh tinh nang (neu co)
# git merge branch_tinh_nang
`,
  check: "Branch moi co login, khong co dark-mode.",
  build({ work }) {
    seedApp(work);
    git(work, ["checkout", "-b", "dev"]);
    write(work, "login.js", "module.exports = function login() { return 'ok'; }\n");
    commitAll(work, "feature: login");
    write(work, "dark-mode.js", "module.exports = function darkMode() { return true; }\n");
    commitAll(work, "feature: dark-mode (cho khach duyet)");
    git(work, ["checkout", "main"]);
  },
});

def({
  id: "10",
  tut: "10 — Sua commit message vua go",
  title: "Sua commit message (sai chinh ta)",
  setup: 'Commit cuoi co message sai: `"fix bugx"`. Chua push.',
  goal: "Sua message bang reset + commit lai, hoac amend.",
  commands: `
# C1
git reset HEAD~1
git add .
git commit -m "fix bugs"

# C2
git commit --amend -m "fix bugs"
`,
  check: "`git log -1 --oneline` khong con chu `bugx`.",
  build({ work }) {
    seedApp(work);
    write(work, "app.js", "function greet(n) { return 'Hi ' + n; }\n");
    commitAll(work, "fix bugx");
  },
});

def({
  id: "12",
  tut: "12 — Doi ten branch",
  title: "Doi ten branch",
  setup: "Dang dung branch ten sai: `ten-sai`.",
  goal: "Doi thanh `ten-branch-moi`.",
  commands: `
git branch -m ten-branch-moi
git branch
`,
  check: "`git branch` hien `ten-branch-moi`, khong con `ten-sai`.",
  build({ work }) {
    seedApp(work);
    git(work, ["checkout", "-b", "ten-sai"]);
  },
});

def({
  id: "13",
  tut: "13 — Xoa branch",
  title: "Xoa branch",
  setup: "Co branch `ten-branch-muon-xoa`. Ban dang dung `main`.",
  goal: "Xoa branch do.",
  commands: `
git branch -D ten-branch-muon-xoa
git branch
`,
  check: "`git branch` khong con `ten-branch-muon-xoa`.",
  build({ work }) {
    seedApp(work);
    git(work, ["branch", "ten-branch-muon-xoa"]);
  },
});

def({
  id: "conflict",
  tut: "Phan B — Xu ly conflict khi merge",
  title: "Merge conflict (ours / theirs)",
  setup:
    "Dang dung `feature`. Merge `main` se conflict `app.js`. Luyen `--ours` / `--theirs` / sua tung file.",
  goal: "Merge, chon ours/theirs hoac sua file, add, commit.",
  commands: `
git merge main

# giu nhanh hien tai:
git checkout --ours .
# hoac giu nhanh dich (theirs):
git checkout --theirs .

git checkout app.js
# sua, save
git add app.js
git commit -m "fix-conflict-app.js"
`,
  check: "Khong con conflict marker. `git status` sach.",
  build({ work }) {
    seedApp(work);
    git(work, ["checkout", "-b", "feature"]);
    write(work, "app.js", "function greet(n) { return 'FEATURE ' + n; }\n");
    commitAll(work, "sua tren feature");
    git(work, ["checkout", "main"]);
    write(work, "app.js", "function greet(n) { return 'MAIN ' + n; }\n");
    commitAll(work, "sua tren main");
    git(work, ["checkout", "feature"]);
  },
});

def({
  id: "cherry-pick",
  tut: "Phan B — Cherry-pick",
  title: "Cherry-pick 1 commit",
  setup: "Nhanh `feature` co 2 commit. Ban dung `main`, chi muon lay commit **fix-login**.",
  goal: "Cherry-pick dung 1 SHA.",
  commands: `
git log --oneline feature
git cherry-pick <ma_commit_fix-login>
`,
  check: "`main` co fix-login, khong co commit dark-mode.",
  build({ work }) {
    seedApp(work);
    git(work, ["checkout", "-b", "feature"]);
    write(work, "login.js", "module.exports = 'fixed';\n");
    commitAll(work, "fix-login");
    write(work, "dark-mode.js", "module.exports = true;\n");
    commitAll(work, "add dark-mode");
    git(work, ["checkout", "main"]);
  },
});

function listItems() {
  return catalog.map((c) => {
    const pad = c.id.padEnd(12);
    return `  ${pad} ${c.tut}`;
  });
}

function resolveIds(arg) {
  if (!arg || arg === "all") return catalog.map((c) => c.id);
  if (arg === "list" || arg === "--list" || arg === "-l") return ["__list__"];
  const wanted = catalog
    .filter((c) => c.id === arg || c.tut.startsWith(arg) || (c.aliases || []).includes(arg))
    .map((c) => c.id);
  const unique = [...new Set(wanted)];
  if (unique.length) return unique;
  return null;
}

function printBanner(work, item) {
  console.log("");
  console.log(`=== ${item.title} ===`);
  console.log(`Tut: ${item.tut}`);
  console.log(`Thu muc: ${work}`);
  console.log("");
  console.log("Vao sandbox:");
  console.log(`  cd "${work}"`);
  console.log("");
  console.log("Doc PRACTICE.md roi lam. Tao lai bat cu luc nao:");
  console.log(`  yarn make-example ${item.id}`);
  console.log("");
}

function main() {
  const arg = (process.argv[2] || "list").trim();
  const ids = resolveIds(arg);

  if (!ids) {
    console.error(`Khong co vi du "${arg}".`);
    console.log("Danh sach:");
    console.log(listItems().join("\n"));
    process.exit(1);
  }

  if (ids[0] === "__list__") {
    console.log("yarn make-example <id>");
    console.log("yarn make-example all");
    console.log("");
    console.log(listItems().join("\n"));
    console.log("");
    console.log("Vi du: yarn make-example 8");
    return;
  }

  fs.mkdirSync(PLAY, { recursive: true });
  for (const id of ids) {
    const item = catalog.find((c) => c.id === id);
    const work = runBuilder(item);
    printBanner(work, item);
  }

  if (ids.length > 1) {
    console.log(`Da tao ${ids.length} sandbox trong ${PLAY}`);
  }
}

main();
