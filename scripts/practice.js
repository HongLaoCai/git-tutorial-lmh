#!/usr/bin/env node
"use strict";

const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PLAY = path.join(ROOT, "examples", "playground");
const WORKSPACE = path.join(ROOT, "thuc-hanh.code-workspace");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function git(cwd, args) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (err) {
    return (err.stdout || "").trim();
  }
}

function gitOk(cwd, args) {
  try {
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return true;
  } catch {
    return false;
  }
}

function snapshot(work) {
  const branch = git(work, ["branch", "--show-current"]) || "(detached)";
  const branches = git(work, ["branch", "--list"])
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const status = git(work, ["status", "--porcelain"]);
  const log = git(work, ["log", "--oneline", "-8"]);
  const aheadBehind = git(work, ["status", "-sb"]).split("\n")[0] || "";
  const files = {
    modified: [],
    untracked: [],
    staged: [],
  };
  for (const line of status.split("\n").filter(Boolean)) {
    const m = line.match(/^(..) (.*)$/);
    const code = m ? m[1] : line.slice(0, 2);
    const file = m ? m[2] : line.slice(3);
    if (code.includes("?")) files.untracked.push(file);
    else if (code[0] !== " " && code[0] !== "?") files.staged.push(file);
    if (code[1] === "M" || code[1] === "D" || code[1] === "A") files.modified.push(file);
  }
  const dirty = status.length > 0;
  const headMsg = git(work, ["log", "-1", "--pretty=%s"]);
  const fileExists = (rel) => fs.existsSync(path.join(work, rel));
  const fileHas = (rel, text) => {
    const p = path.join(work, rel);
    return fs.existsSync(p) && fs.readFileSync(p, "utf8").includes(text);
  };
  const inHead = (rel) => gitOk(work, ["cat-file", "-e", `HEAD:${rel}`]);
  const trackedEnv = git(work, ["ls-files", ".env"]);
  return {
    branch,
    branches,
    status,
    log,
    aheadBehind,
    files,
    dirty,
    headMsg,
    fileExists,
    fileHas,
    inHead,
    trackedEnv,
    work,
  };
}

function checksFor(id, s) {
  const onFeature =
    s.branch === "feature-moi" || s.branch === "ten-branch-moi";
  switch (id) {
    case "2a":
      return [
        ["Đang ở branch mới (không phải main)", s.branch !== "main", `đang ở ${s.branch}`],
        ["Working tree sạch (đã commit)", !s.dirty, s.dirty ? "còn changes chưa commit" : "sạch"],
      ];
    case "2b":
    case "2c":
      return [
        ["Đã rời commit nhầm khỏi main / đã sang branch mới", s.branch !== "main" || !s.dirty, `branch ${s.branch}`],
        ["Có branch feature-moi", s.branches.some((b) => b.includes("feature-moi")), s.branches.join(", ")],
      ];
    case "3a":
    case "3b":
      return [
        ["Không còn ahead/behind lệch", !s.aheadBehind.includes("[ahead") && !s.aheadBehind.includes("[behind"), s.aheadBehind],
        ["Working tree sạch hoặc đã giải quyết xong", !s.status.includes("UU"), s.dirty ? "còn file chưa xong" : "ok"],
      ];
    case "4a":
      return [
        ["app.js đã về như commit (không còn BROKEN)", !s.fileHas("app.js", "BROKEN"), s.fileHas("app.js", "BROKEN") ? "vẫn BROKEN" : "đã restore"],
        ["version.txt vẫn đang sửa (chưa discard)", s.fileHas("version.txt", "9.9.9"), s.fileHas("version.txt", "9.9.9") ? "giữ thay đổi" : "bị mất luôn version"],
      ];
    case "4b":
      return [
        ["app.js không còn bản SAI", !s.fileHas("app.js", "SAI"), s.fileHas("app.js", "OK") ? "đã lấy bản OK" : "chưa lấy file cũ"],
      ];
    case "5a":
    case "5b":
      return [
        ["version.txt đã vào git (1.1.0)", s.inHead("version.txt") && s.fileHas("version.txt", "1.1.0") && !s.dirty, s.dirty ? "còn chưa commit" : "HEAD có version"],
      ];
    case "6a":
      return [
        [".env không còn tracked", !s.trackedEnv, s.trackedEnv ? "vẫn đang trong git" : "đã bỏ"],
        [".gitignore có .env", s.fileHas(".gitignore", ".env"), s.fileExists(".gitignore") ? "đã có gitignore" : "chưa có gitignore"],
      ];
    case "6b":
      return [
        [".env không còn trong commit hiện tại", !s.trackedEnv, s.trackedEnv || "ok"],
      ];
    case "7":
      return [
        ["Code không còn throw Error", !s.fileHas("app.js", "throw new Error"), s.fileHas("app.js", "TOT") ? "đã về bản TOT" : "chưa về A / chưa revert"],
      ];
    case "8":
      return [
        ["Đang ở ten_branch (không push nhầm main)", s.branch === "ten_branch", `đang ở ${s.branch}`],
        ["Không còn conflict", !s.status.includes("UU") && !s.fileHas("app.js", "<<<<<<<"), s.status.includes("UU") ? "đang conflict" : "ok"],
      ];
    case "9":
      return [
        ["Có login.js", s.fileExists("login.js"), s.fileExists("login.js") ? "có" : "chưa cherry-pick"],
        ["Không có dark-mode.js", !s.fileExists("dark-mode.js"), s.fileExists("dark-mode.js") ? "lấy nhầm dark-mode" : "đúng, chưa lấy dark-mode"],
      ];
    case "10":
      return [
        ["Message không còn 'bugx'", !s.headMsg.includes("bugx"), `message: ${s.headMsg}`],
      ];
    case "12":
      return [
        ["Branch đã đổi thành ten-branch-moi", s.branch === "ten-branch-moi", `đang ở ${s.branch}`],
      ];
    case "13":
      return [
        ["Đã xóa ten-branch-muon-xoa", !s.branches.some((b) => b.includes("ten-branch-muon-xoa")), s.branches.join(", ")],
        ["Đang ở main", s.branch === "main", `đang ở ${s.branch}`],
      ];
    case "conflict":
      return [
        ["Không còn conflict marker", !s.fileHas("app.js", "<<<<<<<"), s.status.includes("UU") ? "đang conflict" : "đã xử lý / chưa merge"],
        ["Đã commit xong conflict", !s.dirty || s.status.length === 0, s.dirty ? "còn chưa commit" : "sạch"],
      ];
    case "cherry-pick":
      return [
        ["main đã có login.js", s.fileExists("login.js"), s.fileExists("login.js") ? "có" : "chưa pick"],
        ["Không có dark-mode.js", !s.fileExists("dark-mode.js"), ""],
      ];
    default:
      return [["Sandbox tồn tại", true, "không có checklist riêng — xem PRACTICE.md"]];
  }
}

function evaluate(id, s) {
  const rows = checksFor(id, s);
  const pass = rows.every((r) => r[1]);
  return { rows, pass };
}

function renderMd(id, s, ev) {
  const mark = (ok) => (ok ? "✅ ĐÚNG" : "❌ CHƯA");
  const fileLines = [];
  if (!s.dirty) fileLines.push("- (không có changes — working tree sạch)");
  else {
    s.files.staged.forEach((f) => fileLines.push(`- staged: \`${f}\``));
    s.files.modified.forEach((f) => fileLines.push(`- đang sửa: \`${f}\``));
    s.files.untracked.forEach((f) => fileLines.push(`- file mới: \`${f}\``));
    if (fileLines.length === 0 && s.status) {
      s.status.split("\n").forEach((l) => fileLines.push(`- \`${l}\``));
    }
  }
  const checkLines = ev.rows.map(
    ([label, ok, note]) => `- ${ok ? "✅" : "❌"} **${label}**${note ? ` — ${note}` : ""}`
  );
  return [
    `# Bảng theo dõi — ${id}`,
    "",
    `## Kết quả: ${ev.pass ? "✅ ĐÚNG — xong tình huống này" : "❌ CHƯA XONG"}`,
    "",
    "| | |",
    "|---|---|",
    `| Branch hiện tại | \`${s.branch}\` |`,
    `| So với remote | \`${s.aheadBehind}\` |`,
    `| Working tree | ${s.dirty ? "còn thay đổi" : "sạch"} |`,
    `| Commit mới nhất | ${s.headMsg} |`,
    "",
    "## Changes (file đang đổi)",
    "",
    fileLines.join("\n") || "- (trống)",
    "",
    "## Branch",
    "",
    s.branches.map((b) => `- \`${b}\``).join("\n"),
    "",
    "## Commit gần đây",
    "",
    "```",
    s.log || "(không có)",
    "```",
    "",
    "## Checklist đúng / sai",
    "",
    checkLines.join("\n"),
    "",
    "## Làm sao thấy Changes trong Cursor",
    "",
    "Repo slide **không hiện** sandbox vì `examples/playground` bị gitignore.",
    "",
    "1. Mở workspace `thuc-hanh.code-workspace` (File → Open Workspace from File).",
    "2. Trái: Explorer có **02 Sandbox đang làm** — sửa file ở đó.",
    "3. Source Control: bấm tên repo trên cùng, chọn repo sandbox (vd. `2a`), không chọn `git-tutorial-lmh`.",
    "",
    "File này tự cập nhật khi chạy `yarn practice " + id + "`.",
    "",
  ].join("\n");
}

function renderTerm(id, s, ev) {
  const bar = ev.pass
    ? `${GREEN}${BOLD}  KET QUA: DUNG — xong roi${RESET}`
    : `${RED}${BOLD}  KET QUA: CHUA XONG${RESET}`;
  const lines = [
    "",
    `${CYAN}╔════════════════════════════════════════════════════╗${RESET}`,
    `${CYAN}║${RESET}  Sandbox ${BOLD}${id}${RESET}`.padEnd(62) + `${CYAN}║${RESET}`,
    `${CYAN}╚════════════════════════════════════════════════════╝${RESET}`,
    bar,
    "",
    `  ${BOLD}Branch:${RESET}  ${YELLOW}${s.branch}${RESET}`,
    `  ${DIM}${s.aheadBehind}${RESET}`,
    "",
    `  ${BOLD}Changes:${RESET}`,
  ];
  if (!s.dirty) lines.push(`    ${DIM}(sạch — không có file đang sửa)${RESET}`);
  else {
    s.status.split("\n").filter(Boolean).forEach((l) => lines.push(`    ${l}`));
  }
  lines.push("", `  ${BOLD}Checklist:${RESET}`);
  ev.rows.forEach(([label, ok, note]) => {
    lines.push(`    ${ok ? GREEN + "OK  " : RED + "CHUA"}${RESET} ${label}${note ? DIM + " (" + note + ")" + RESET : ""}`);
  });
  lines.push("");
  return lines.join("\n");
}

function excludeWatchFiles(work) {
  const exclude = path.join(work, ".git", "info", "exclude");
  fs.mkdirSync(path.dirname(exclude), { recursive: true });
  const cur = fs.existsSync(exclude) ? fs.readFileSync(exclude, "utf8") : "";
  let next = cur;
  for (const name of ["PRACTICE.md", "THEO_DOI.md"]) {
    if (!next.includes(name)) next += `\n${name}\n`;
  }
  fs.writeFileSync(exclude, next);
}

function writeWorkspace(id) {
  const data = {
    folders: [
      { name: "01 Slide tut", path: "." },
      { name: `02 Sandbox ${id}`, path: `examples/playground/${id}` },
    ],
    settings: {
      "git.autoRepositoryDetection": true,
      "git.repositoryScanMaxDepth": 6,
      "git.openRepositoryInParentFolders": "never",
    },
  };
  try {
    fs.writeFileSync(WORKSPACE, JSON.stringify(data, null, 2) + "\n");
  } catch {
    /* workspace file may be locked by the editor */
  }
}

function tick(id, work) {
  const s = snapshot(work);
  const ev = evaluate(id, s);
  excludeWatchFiles(work);
  fs.writeFileSync(path.join(work, "THEO_DOI.md"), renderMd(id, s, ev));
  writeWorkspace(id);
  return { s, ev };
}

function usage() {
  console.log(`
${BOLD}Theo doi sandbox truc quan${RESET}

  yarn practice 2a          theo doi live (cap nhat THEO_DOI.md)
  yarn practice 2a --once   kiem tra 1 lan roi thoat
  yarn check-example 8      giong --once

Mo ${CYAN}thuc-hanh.code-workspace${RESET} de Cursor hien Changes + branch cua sandbox.
Mo file ${CYAN}THEO_DOI.md${RESET} trong sandbox de thay DUNG / CHUA xong.
`);
}

function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--once");
  const once = process.argv.includes("--once") || path.basename(process.argv[1]).includes("check-example");
  const id = args[0];
  if (!id || id === "help" || id === "-h") {
    usage();
    process.exit(0);
  }
  const work = path.join(PLAY, id);
  if (!fs.existsSync(path.join(work, ".git"))) {
    console.error(`${RED}Chua co sandbox ${id}.${RESET} Chay: yarn make-example ${id}`);
    process.exit(1);
  }

  const first = tick(id, work);
  console.clear();
  console.log(renderTerm(id, first.s, first.ev));
  console.log(`  File theo doi: ${work}/THEO_DOI.md`);
  console.log(`  Workspace:     thuc-hanh.code-workspace`);
  console.log("");
  if (once) {
    process.exit(first.ev.pass ? 0 : 2);
  }
  console.log(`${DIM}Dang theo doi moi 1.5s — sua file / chay git, bang nay tu cap nhat. Ctrl+C de dung.${RESET}\n`);
  setInterval(() => {
    const { s, ev } = tick(id, work);
    process.stdout.write("\x1b[H\x1b[2J");
    console.log(renderTerm(id, s, ev));
    console.log(`  File theo doi: ${work}/THEO_DOI.md`);
    console.log(`${DIM}Ctrl+C de dung.${RESET}\n`);
  }, 1500);
}

main();
