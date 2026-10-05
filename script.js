// ================= Global Variables =================
const $ = (id) => document.getElementById(id);
let playerName = "";
let currentGame = 0;            // 0 = Sudoku, 1 = Math, 2 = Memory
let currentRound = 0, totalRounds = 10;
let currentScore = 0, correctAnswers = 0;
let locked = true;              // blocks input when a game isn't ready
let sudTimer;                   // Sudoku clock

// ================= Sound Effects (Web Audio, no files needed) =================
const sfx = (() => {
  let ctx = null;
  let muted = localStorage.getItem("cbMuted") === "1";

  function getCtx() {
    if (muted) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  function tone(freq, delay, dur, type, vol, slideTo) {
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + delay;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  return {
    isMuted: () => muted,
    toggle() {
      muted = !muted;
      localStorage.setItem("cbMuted", muted ? "1" : "0");
      if (!muted) this.click();
      return muted;
    },
    click()   { tone(520, 0, 0.09, "triangle", 0.13, 800); },
    round()   { tone(700, 0, 0.07, "sine", 0.07); },
    correct() { tone(660, 0, 0.12, "sine", 0.16); tone(880, 0.09, 0.12, "sine", 0.16); tone(1320, 0.18, 0.25, "sine", 0.15); },
    wrong()   { tone(240, 0, 0.28, "sawtooth", 0.1, 110); tone(180, 0.1, 0.25, "square", 0.05, 90); },
    show()    { tone(330, 0, 0.18, "sine", 0.1, 660); },
    tile(n)   { tone(380 + n * 70, 0, 0.1, "triangle", 0.14); },
    win()     { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.12, 0.28, "square", 0.08)); }
  };
})();

// ================= Helpers =================
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (list) => list.sort(() => Math.random() - 0.5);
const fmtTime = (s) => Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

// Each game is separate: it has its own intro, play screen and results.
const games = [
  {
    title: "SUDOKU",
    sub: "Logic & Focus",
    key: "sudokuBest",
    max: 1000,
    line: "Fill every row, column and 2×3 box with the numbers 1 to 6.",
    demo: "No repeats in a\nrow, column or box.",
    start: startSudoku
  },
  {
    title: "MATH MODE",
    sub: "Math + Number Memory",
    key: "mathBest",
    max: 1000,
    prefix: "math",
    line: "Compare, calculate, and remember. Stay sharp.",
    demo: "27  VS  43\n12 + 8 = ?",
    start: startMathMode
  },
  {
    title: "MEMORY MATRIX",
    sub: "Spatial Memory · 5 levels",
    key: "memoryBest",
    max: 500,
    prefix: "mem",
    line: "Watch the pattern. Remember the positions. One wrong tile moves you to the next level.",
    demo: "■ □ ■\n□ ■ □\n■ □ □",
    start: startMemoryMatrix
  }
];

// ================= Navigation =================
function show(screenId) {
  if (screenId !== "sudoku") clearInterval(sudTimer);
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
  window.scrollTo(0, 0);
}
function goHome() {
  show("home");
}
function openGame(index) {              // a landing-page card was clicked
  currentGame = index;
  if (playerName === "") {
    show("name");
    $("nameInput").value = "";
    $("nameError").textContent = "";
    $("nameInput").focus();
  } else {
    showIntro();
  }
}
function showIntro() {
  const g = games[currentGame];
  $("introIcon").textContent = "";
  $("introTitle").textContent = g.title;
  $("introSub").textContent = g.sub;
  $("introLine").textContent = g.line;
  $("introDemo").textContent = g.demo;
  show("intro");
}
function enterName() {
  const typedName = $("nameInput").value.trim();
  if (typedName === "") {
    $("nameError").textContent = "Please enter your name.";
    sfx.wrong();
    return;
  }
  playerName = typedName.toUpperCase();
  $("playerLabel").textContent = playerName;
  showIntro();
}

// ================= Shared game helpers =================
function resetRun(rounds) {
  currentRound = 0; totalRounds = rounds;
  currentScore = 0; correctAnswers = 0;
}
function updateStats() {
  const p = games[currentGame].prefix;
  $(p + "Round").textContent = currentRound + " / " + totalRounds;
  $(p + "Score").textContent = currentScore;
}
function awardPoints(isCorrect, penalty) {
  const feedback = $(games[currentGame].prefix + "Fb");
  if (isCorrect) {
    currentScore += 100; correctAnswers++;
    feedback.textContent = "✓ Correct"; feedback.className = "feedback good";
    sfx.correct();
  } else {
    currentScore = Math.max(0, currentScore - penalty);
    feedback.textContent = "✕ Incorrect"; feedback.className = "feedback bad";
    sfx.wrong();
  }
  updateStats();
}
function clearFeedback() {
  $(games[currentGame].prefix + "Fb").textContent = "";
}
function saveBestScore(score) {         // returns true when it is a new best
  const key = games[currentGame].key;
  const best = Number(localStorage.getItem(key)) || 0;
  if (score > best) { localStorage.setItem(key, score); return score > 0; }
  return false;
}
// Ends the current game and shows ITS results (extras = two game-specific stats)
function finishGame(extras) {
  const isBest = saveBestScore(currentScore);
  showResults(extras, isBest);
}

// ================= Sudoku (6 x 6, one level) =================
// Board is 6x6 with 2-row x 3-column boxes. Numbers 1 to 6.
const SUD = 6;
let sudSolution = [], sudGrid = [], sudGiven = [], sudCells = [];
let sudSel = -1, sudMistakes = 0, sudHints = 0, sudSeconds = 0, sudDone = false;

// SUDOKU-GEN-START
function sudCandidates(grid, i) {
  const r = Math.floor(i / 6), c = i % 6;
  const used = new Set();
  for (let k = 0; k < 6; k++) { used.add(grid[r * 6 + k]); used.add(grid[k * 6 + c]); }
  const br = r - (r % 2), bc = c - (c % 3);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 3; x++) used.add(grid[(br + y) * 6 + bc + x]);
  const out = [];
  for (let n = 1; n <= 6; n++) if (!used.has(n)) out.push(n);
  return out;
}
// counts solutions (stops at `limit`) so every puzzle has exactly one answer
function sudCount(grid, limit) {
  let best = -1, bestList = null;
  for (let i = 0; i < 36; i++) {
    if (grid[i] !== 0) continue;
    const list = sudCandidates(grid, i);
    if (list.length === 0) return 0;
    if (!bestList || list.length < bestList.length) { best = i; bestList = list; if (list.length === 1) break; }
  }
  if (best === -1) return 1;
  let found = 0;
  for (const v of bestList) {
    grid[best] = v;
    found += sudCount(grid, limit - found);
    if (found >= limit) break;
  }
  grid[best] = 0;
  return found;
}
function generateSudoku() {
  const pattern = (r, c) => (3 * (r % 2) + Math.floor(r / 2) + c) % 6;
  const rows = shuffle([0, 1, 2]).flatMap((g) => shuffle([0, 1]).map((r) => g * 2 + r));
  const cols = shuffle([0, 1]).flatMap((g) => shuffle([0, 1, 2]).map((c) => g * 3 + c));
  const nums = shuffle([1, 2, 3, 4, 5, 6]);
  sudSolution = [];
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) sudSolution.push(nums[pattern(rows[r], cols[c])]);

  const puzzle = sudSolution.slice();
  const order = shuffle([...Array(36).keys()]);
  let removed = 0;
  for (const idx of order) {
    if (removed >= 20) break;            // about 16 clues left
    const backup = puzzle[idx];
    puzzle[idx] = 0;
    if (sudCount(puzzle.slice(), 2) !== 1) puzzle[idx] = backup; else removed++;
  }
  sudGrid = puzzle;
  sudGiven = puzzle.map((v) => v !== 0);
}
// SUDOKU-GEN-END

function startSudoku() {
  generateSudoku();
  sudSel = -1; sudMistakes = 0; sudHints = 0; sudSeconds = 0; sudDone = false;
  $("sudMistakes").textContent = "0";
  $("sudTime").textContent = "0:00";
  $("sudFb").textContent = "";
  show("sudoku");
  buildSudokuGrid();
  renderSudoku();
  clearInterval(sudTimer);
  sudTimer = setInterval(() => { sudSeconds++; $("sudTime").textContent = fmtTime(sudSeconds); }, 1000);
}
function buildSudokuGrid() {
  const grid = $("sudGrid");
  grid.innerHTML = "";
  sudCells = [];
  for (let i = 0; i < 36; i++) {
    const cell = document.createElement("button");
    const col = i % 6, row = Math.floor(i / 6);
    // thick lines between the 2x3 boxes
    cell.className = "scell" + (col === 2 ? " bR" : "") + (row === 1 || row === 3 ? " bB" : "");
    cell.addEventListener("click", () => { sudSel = i; sfx.round(); renderSudoku(); });
    grid.appendChild(cell);
    sudCells.push(cell);
  }
}
function renderSudoku() {
  const selValue = sudSel >= 0 ? sudGrid[sudSel] : 0;
  const sr = Math.floor(sudSel / 6), sc = sudSel % 6;
  sudCells.forEach((cell, i) => {
    const v = sudGrid[i];
    const r = Math.floor(i / 6), c = i % 6;
    const related = sudSel >= 0 && i !== sudSel &&
      (r === sr || c === sc || (Math.floor(r / 2) === Math.floor(sr / 2) && Math.floor(c / 3) === Math.floor(sc / 3)));
    cell.textContent = v || "";
    cell.classList.toggle("given", sudGiven[i]);
    cell.classList.toggle("rel", related);
    cell.classList.toggle("same", selValue !== 0 && v === selValue && i !== sudSel);
    cell.classList.toggle("sel", i === sudSel);
    cell.classList.toggle("bad", v !== 0 && v !== sudSolution[i]);
  });
}
function sudFeedback(text, kind) {
  $("sudFb").textContent = text;
  $("sudFb").className = "feedback " + kind;
}
function placeNumber(n) {
  if (sudDone) return;
  if (sudSel < 0) { sudFeedback("Pick a cell first", ""); return; }
  if (sudGiven[sudSel]) return;
  if (n === 0) { sudGrid[sudSel] = 0; renderSudoku(); return; }
  if (sudGrid[sudSel] === n) return;
  sudGrid[sudSel] = n;
  if (n !== sudSolution[sudSel]) {
    sudMistakes++;
    $("sudMistakes").textContent = sudMistakes;
    sudFeedback("✕ That number doesn't fit", "bad");
    sfx.wrong();
  } else {
    sudFeedback("✓ Nice", "good");
    sfx.tile(4);
  }
  renderSudoku();
  checkSudokuDone();
}
function useHint() {
  if (sudDone) return;
  if (sudSel < 0 || sudGiven[sudSel] || sudGrid[sudSel] === sudSolution[sudSel]) {
    sudFeedback("Pick an empty or wrong cell for a hint", "");
    return;
  }
  sudGrid[sudSel] = sudSolution[sudSel];
  sudHints++;
  sudFeedback("💡 Hint used (−75 points)", "");
  sfx.show();
  renderSudoku();
  checkSudokuDone();
}
function moveSelection(key) {
  if (sudSel < 0) sudSel = 0;
  else {
    const r = Math.floor(sudSel / 6), c = sudSel % 6;
    if (key === "ArrowUp") sudSel = Math.max(0, r - 1) * 6 + c;
    if (key === "ArrowDown") sudSel = Math.min(5, r + 1) * 6 + c;
    if (key === "ArrowLeft") sudSel = r * 6 + Math.max(0, c - 1);
    if (key === "ArrowRight") sudSel = r * 6 + Math.min(5, c + 1);
  }
  renderSudoku();
}
function checkSudokuDone() {
  if (!sudGrid.every((v, i) => v === sudSolution[i])) return;
  sudDone = true;
  clearInterval(sudTimer);
  currentScore = Math.max(100, 1000 - sudMistakes * 50 - sudHints * 75 - Math.floor(sudSeconds / 3));
  setTimeout(() => finishGame([
    { label: "Time", value: fmtTime(sudSeconds) },
    { label: "Mistakes", value: sudMistakes }
  ]), 800);
}

// ================= Math Mode =================
const mathTypes = ["larger", "add", "smaller", "mul", "memory", "sub", "larger", "mul", "memory", "smaller"];
let mathOrder = [], correctMathAnswer;

function startMathMode() {
  resetRun(10);
  mathOrder = shuffle([...mathTypes]);
  show("math");
  nextMathRound();
}
function nextMathRound() {
  if (currentRound >= totalRounds) {
    finishGame([
      { label: "Accuracy", value: Math.round((correctAnswers / totalRounds) * 100) + "%" },
      { label: "Correct", value: correctAnswers + " / " + totalRounds }
    ]);
    return;
  }
  currentRound++;
  updateStats();
  clearFeedback();
  generateQuestion(mathOrder[currentRound - 1]);
}
function generateQuestion(type) {
  let a = rand(10, 99), b = rand(10, 99);
  while (b === a) b = rand(10, 99);
  if (type === "larger") showQuestion("Which number is larger?", "", [a, b], Math.max(a, b));
  else if (type === "smaller") showQuestion("Which number is smaller?", "", [a, b], Math.min(a, b));
  else if (type === "add") {
    a = rand(5, 40); b = rand(5, 40);
    showQuestion("Solve it", a + " + " + b + " = ?", makeChoices(a + b), a + b);
  } else if (type === "sub") {
    a = rand(20, 60); b = rand(5, 19);
    showQuestion("Solve it", a + " − " + b + " = ?", makeChoices(a - b), a - b);
  } else if (type === "mul") {
    a = rand(3, 9); b = rand(3, 9);
    showQuestion("Solve it", a + " × " + b + " = ?", makeChoices(a * b), a * b);
  } else {                                 // number memory
    const secretNumber = rand(10000, 99999);
    locked = true;
    $("mathPrompt").textContent = "Remember this number";
    $("mathBig").textContent = secretNumber;
    $("mathOptions").innerHTML = "";
    sfx.show();
    setTimeout(() => {                     // hide the number after 2 seconds
      showQuestion("What was the number?", "?", makeNumberChoices(secretNumber), secretNumber);
    }, 2000);
  }
}
function showQuestion(prompt, bigText, options, answer) {
  correctMathAnswer = answer;
  $("mathPrompt").textContent = prompt;
  $("mathBig").textContent = bigText;
  $("mathOptions").innerHTML = "";
  options.forEach((value) => {
    const tile = document.createElement("button");
    tile.textContent = value;
    tile.addEventListener("click", () => checkMathAnswer(value));
    $("mathOptions").appendChild(tile);
  });
  locked = false;
}
function makeChoices(answer) {
  const choices = [answer];
  while (choices.length < 4) {
    const wrongAnswer = answer + rand(-10, 10);
    if (wrongAnswer > 0 && !choices.includes(wrongAnswer)) choices.push(wrongAnswer);
  }
  return shuffle(choices);
}
function makeNumberChoices(number) {
  const choices = [number];
  while (choices.length < 4) {
    const digits = String(number).split("");
    digits[rand(1, 4)] = rand(0, 9);       // change one digit
    const similar = Number(digits.join(""));
    if (!choices.includes(similar)) choices.push(similar);
  }
  return shuffle(choices);
}
function checkMathAnswer(value) {
  if (locked) return;
  locked = true;
  awardPoints(value === correctMathAnswer, 50);
  setTimeout(nextMathRound, 900);
}

// ================= Memory Matrix (5 levels) =================
const gridSizes = [3, 3, 4, 4, 5];
const tileCounts = [3, 4, 5, 6, 8];
let memoryPattern = [], selectedTiles = [];

function startMemoryMatrix() {
  resetRun(5);
  show("memory");
  nextMemoryRound();
}
function nextMemoryRound() {
  if (currentRound >= totalRounds) {
    finishGame([
      { label: "Levels cleared", value: correctAnswers + " / " + totalRounds },
      { label: "Accuracy", value: Math.round((correctAnswers / totalRounds) * 100) + "%" }
    ]);
    return;
  }
  currentRound++;
  updateStats();
  clearFeedback();
  const size = gridSizes[currentRound - 1];
  generatePattern(size, tileCounts[currentRound - 1]);
  selectedTiles = [];
  locked = true;                           // ignore clicks while pattern shows
  const grid = $("grid");
  grid.innerHTML = "";
  grid.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";
  for (let i = 0; i < size * size; i++) {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.addEventListener("click", () => handleTileClick(i, tile));
    grid.appendChild(tile);
  }
  $("memStatus").textContent = "Remember the highlighted tiles";
  const tiles = grid.children;
  memoryPattern.forEach((index) => tiles[index].classList.add("lit"));
  sfx.show();
  setTimeout(() => {
    memoryPattern.forEach((index) => tiles[index].classList.remove("lit"));
    $("memStatus").textContent = "Reproduce the pattern";
    locked = false;
  }, 1500);
}
function generatePattern(size, count) {
  memoryPattern = [];
  while (memoryPattern.length < count) {
    const position = rand(0, size * size - 1);
    if (!memoryPattern.includes(position)) memoryPattern.push(position);
  }
}
function handleTileClick(index, tile) {
  if (locked || selectedTiles.includes(index)) return;   // no clicks during preview, no duplicates
  selectedTiles.push(index);
  const tiles = $("grid").children;
  if (!memoryPattern.includes(index)) {
    // wrong tile: reveal the answer and jump straight to the next level
    locked = true;
    tile.classList.add("wrong");
    memoryPattern.forEach((i) => tiles[i].classList.add("lit"));
    awardPoints(false, 0);
    setTimeout(nextMemoryRound, 1300);
    return;
  }
  tile.classList.add("picked");
  sfx.tile(selectedTiles.length);
  if (selectedTiles.length === memoryPattern.length) {   // found them all
    locked = true;
    awardPoints(true, 0);
    setTimeout(nextMemoryRound, 1000);
  }
}

// ================= Results =================
const CONFETTI_COLORS = ["#ff4fa3", "#c6ff3d", "#2fd6a0", "#4de1ff", "#a99bff", "#ffe66d"];

// Poppers pop up from both bottom corners (confetti only when you did well)
function celebrate(win) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ["left", "right"].forEach((side) => {
    const popper = document.createElement("div");
    popper.className = "popper " + side;
    popper.textContent = win ? (side === "left" ? "🎉" : "🎊") : (side === "left" ? "🫠" : "😵‍💫");
    document.body.appendChild(popper);
    setTimeout(() => popper.remove(), 3400);
    if (!win) return;
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti";
      piece.style[side] = "40px";
      piece.style.background = CONFETTI_COLORS[rand(0, CONFETTI_COLORS.length - 1)];
      document.body.appendChild(piece);
      const angle = (side === "left" ? rand(-80, -25) : rand(-155, -100)) * Math.PI / 180;
      const speed = rand(260, 620);
      const dx = Math.cos(angle) * speed, dy = Math.sin(angle) * speed;
      const spin = rand(-540, 540);
      piece.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + dx + "px," + dy + "px) rotate(" + spin / 2 + "deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(" + dx * 1.15 + "px," + (dy + 520) + "px) rotate(" + spin + "deg)", opacity: 0 }
      ], { duration: rand(1500, 2500), delay: rand(0, 200), easing: "cubic-bezier(.2,.7,.5,1)", fill: "both" })
        .onfinish = () => piece.remove();
    }
  });
}

// Gen Z feedback: picks a title + line based on how well the run went
const VIBES = {
  zero: { title: "OOPS", emoji: "😭", lines: [
    "Zero points?? That's an L, but the comeback is gonna be iconic. Run it back, bestie.",
    "Your brain said 'brb' and never came back. It happens, so lock in and go again."
  ] },
  low: { title: "NOT IT... YET", emoji: "😬", lines: [
    "Rough run, but your villain origin story starts now. Go again!",
    "Low-key you're learning the map. Next one's yours, no cap."
  ] },
  mid: { title: "ALMOST THERE", emoji: "👀", lines: [
    "Mid, but mid is progress. One more run and you're cooking.",
    "We're getting there! Your brain is warming up, don't fumble now."
  ] },
  high: { title: "YOU ATE THAT", emoji: "🔥", lines: [
    "Slay! Your brain is NOT cooked, period.",
    "Big brain energy detected. Keep that streak going!"
  ] },
  top: { title: "BIG W", emoji: "👑", lines: [
    "Main character energy. Absolutely goated, no notes.",
    "Certified big brain. That was a masterclass, fr fr."
  ] }
};
function pickVibe(score, max) {
  const r = score / max;
  if (score === 0) return VIBES.zero;
  if (r < 0.3) return VIBES.low;
  if (r < 0.6) return VIBES.mid;
  if (r < 0.9) return VIBES.high;
  return VIBES.top;
}

function showResults(extras, isBest) {
  const g = games[currentGame];
  const vibe = pickVibe(currentScore, g.max);
  const lines = vibe.lines;
  $("resultsTitle").textContent = vibe.title + ", " + playerName + "! " + vibe.emoji;
  $("resultsMsg").textContent = lines[rand(0, lines.length - 1)] + (isBest ? " New personal best, let's gooo! 🚀" : "");
  const stats = [
    { label: "Score", value: currentScore },
    { label: "Best", value: localStorage.getItem(g.key) || 0 }
  ].concat(extras);
  $("resultCards").innerHTML = stats.map((s) =>
    "<div class='result-card'>" + s.label + "<div class='num'>" + s.value + "</div></div>").join("");
  show("results");
  const won = currentScore / g.max >= 0.3;     // below this it's an "oops" moment
  if (won) sfx.win(); else sfx.wrong();
  celebrate(won);
}

// ================= Keyboard =================
function handleKeyPress(event) {
  if (!$("sudoku").classList.contains("active")) return;
  if (/^[1-6]$/.test(event.key)) placeNumber(Number(event.key));
  else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") placeNumber(0);
  else if (event.key.startsWith("Arrow")) { event.preventDefault(); moveSelection(event.key); }
}

// ================= Mute button =================
const muteBtn = document.createElement("button");
muteBtn.id = "muteBtn";
muteBtn.type = "button";
muteBtn.setAttribute("aria-label", "Toggle sound");
muteBtn.textContent = sfx.isMuted() ? "🔇" : "🔊";
muteBtn.addEventListener("click", () => {
  muteBtn.textContent = sfx.toggle() ? "🔇" : "🔊";
  muteBtn.blur();
});
document.body.appendChild(muteBtn);

// ================= Scroll reveal (contributors fade in as you scroll) =================
const revealItems = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add("in"); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.25 });
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add("in"));
}

// ================= Event Listeners =================
$("brand").addEventListener("click", goHome);
$("startBtn").addEventListener("click", () => $("games").scrollIntoView({ behavior: "smooth", block: "center" }));
document.querySelectorAll("#games .mini").forEach((card) =>
  card.addEventListener("click", () => openGame(Number(card.dataset.game))));
$("nameBtn").addEventListener("click", enterName);
$("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") enterName(); });
$("introBtn").addEventListener("click", () => games[currentGame].start());
$("playAgainBtn").addEventListener("click", () => games[currentGame].start());
$("homeBtn").addEventListener("click", goHome);
document.querySelectorAll("#numpad button").forEach((btn) =>
  btn.addEventListener("click", () => placeNumber(Number(btn.dataset.n))));
$("eraseBtn").addEventListener("click", () => placeNumber(0));
$("hintBtn").addEventListener("click", useHint);
document.addEventListener("keydown", handleKeyPress);
document.addEventListener("click", (e) => {
  if (e.target.closest(".cta, .ghost, .brand, .mini")) sfx.click();
});