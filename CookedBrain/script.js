// ================= Global Variables =================
const $ = (id) => document.getElementById(id);
let playerName = "";
let currentGame = 0;            // 0 = Flex, 1 = Math, 2 = Memory
let replayMode = false;         // true when replaying one game from results
let currentRound = 0, totalRounds = 10;
let currentScore = 0, correctAnswers = 0;
let locked = true;              // blocks input when a game isn't ready
let finalScores = [0, 0, 0], finalCorrect = [0, 0, 0], finalTotals = [10, 10, 8];

const games = [
  {
    icon: "",
    title: "FLEX MODE",
    sub: "Direction & Flexibility",
    key: "flexBest",
    prefix: "flex",
    line: "Follow where the leaf points. Ignore where it moves.",
    demo: "POINTS →\nMOVES ↓",
    start: startFlexMode
  },

  {
    icon: "",
    title: "MATH MODE",
    sub: "Math + Number Memory",
    key: "mathBest",
    prefix: "math",
    line: "Compare, calculate, and remember. Stay sharp.",
    demo: "27  VS  43\n12 + 8 = ?",
    start: startMathMode
  },

  {
    icon: "",
    title: "MEMORY MATRIX",
    sub: "Spatial Memory",
    key: "memoryBest",
    prefix: "mem",
    line: "Watch the pattern. Remember the positions.",
    demo: "■ □ ■\n□ ■ □\n■ □ □",
    start: startMemoryMatrix
  }
];

// ================= Navigation =================
function show(screenId) {
  if (screenId !== "flex") clearInterval(spawnTimer);
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(screenId).classList.add("active");
  $("progress").classList.toggle("hidden", screenId === "home" || screenId === "name");
  window.scrollTo(0, 0);
}
function goHome() {
  playerName = "";
  $("playerLabel").textContent = "";
  show("home");
}
function showIntro() {
  const g = games[currentGame];
  $("introIcon").textContent = g.icon;
  $("introTitle").textContent = g.title;
  $("introSub").textContent = g.sub;
  $("introLine").textContent = g.line;
  $("introDemo").textContent = g.demo;
  updateProgress(currentGame);
  show("intro");
}

// ================= Player Name =================
function startSession() {
  show("name");
  $("nameInput").value = "";
  $("nameError").textContent = "";
  $("nameInput").focus();
}
function enterName() {
  const typedName = $("nameInput").value.trim();
  if (typedName === "") {
    $("nameError").textContent = "Please enter your name.";
    return;
  }
  playerName = typedName.toUpperCase();
  $("playerLabel").textContent = playerName;
  $("welcomeName").textContent = playerName;
  updateProgress(-1);
  show("welcome");
}
function beginTraining() {
  currentGame = 0;
  replayMode = false;
  finalScores = [0, 0, 0];
  finalCorrect = [0, 0, 0];
  showIntro();
}

// ================= Progress Indicator =================
function updateProgress(stage) {
  document.querySelectorAll(".step").forEach((step, i) => {
    step.classList.toggle("done", i < stage);
    step.classList.toggle("active", i === stage);
    step.querySelector(".dot").textContent = i < stage ? "✓" : i === stage ? "●" : i + 1;
  });
}

// ================= Shared helpers =================
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (list) => list.sort(() => Math.random() - 0.5);

function resetRun(rounds) {
  currentRound = 0; totalRounds = rounds;
  currentScore = 0; correctAnswers = 0;
}
function updateStats() {
  const p = games[currentGame].prefix;
  $(p + "Round").textContent = currentRound + " / " + totalRounds;
  $(p + "Score").textContent = currentScore;
}
// Adds or subtracts points and shows feedback
function awardPoints(isCorrect, penalty) {
  const feedback = $(games[currentGame].prefix + "Fb");
  if (isCorrect) {
    currentScore += 100; correctAnswers++;
    feedback.textContent = "✓ Correct"; feedback.className = "feedback good";
  } else {
    currentScore = Math.max(0, currentScore - penalty);
    feedback.textContent = "✕ Incorrect"; feedback.className = "feedback bad";
  }
  updateStats();
}
function clearFeedback() {
  $(games[currentGame].prefix + "Fb").textContent = "";
}
function finishGame() {
  clearInterval(spawnTimer);
  finalScores[currentGame] = currentScore;
  finalCorrect[currentGame] = correctAnswers;
  finalTotals[currentGame] = totalRounds;
  saveBestScore(currentGame, currentScore);
  $("completeTitle").textContent = games[currentGame].title + " COMPLETE ✓";
  $("completeScore").textContent = currentScore;
  $("completeAcc").textContent = Math.round((correctAnswers / totalRounds) * 100) + "%";
  updateProgress(currentGame + 1);
  show("complete");
}
function continueAfterGame() {
  if (replayMode || currentGame === 2) {
    showResults();
  } else {
    currentGame++;
    showIntro();
  }
}

// ================= Flex Mode =================
const directions = [
  { key: "ArrowUp", symbol: "↑", angle: -90, dx: 0, dy: -1 },
  { key: "ArrowDown", symbol: "↓", angle: 90, dx: 0, dy: 1 },
  { key: "ArrowLeft", symbol: "←", angle: 180, dx: -1, dy: 0 },
  { key: "ArrowRight", symbol: "→", angle: 0, dx: 1, dy: 0 }
];
let pointingDirection, movingDirection, flexRule;

let spawnTimer;                     // creates a new leaf every 450 ms
function spawnLeaf(progress) {      // progress 0 = at the edge, 0.5 = halfway across
  const stage = document.querySelector(".stage");
  const width = stage.clientWidth, height = stage.clientHeight;
  const dx = movingDirection.dx, dy = movingDirection.dy;
  const startX = dx === 1 ? -60 : dx === -1 ? width + 60 : rand(20, width - 20);
  const endX = dx === 0 ? startX : dx === 1 ? width + 60 : -60;
  const startY = dy === 1 ? -60 : dy === -1 ? height + 60 : rand(20, height - 20);
  const endY = dy === 0 ? startY : dy === 1 ? height + 60 : -60;
  const duration = 3500 * (1 - progress);
  const drifter = document.createElement("div");
  drifter.className = "drifter";
  drifter.style.transform = "translate(" + (startX + (endX - startX) * progress) + "px," + (startY + (endY - startY) * progress) + "px)";
  const leaf = document.createElement("div");
  leaf.className = "leaf";
  leaf.style.transform = "rotate(" + pointingDirection.angle + "deg) scale(" + (rand(55, 100) / 100) + ")";
  drifter.appendChild(leaf);
  $("leafMover").appendChild(drifter);
  void drifter.offsetWidth;         // let the browser register the start position
  drifter.style.transition = "transform " + duration + "ms linear";
  drifter.style.transform = "translate(" + endX + "px," + endY + "px)";
  setTimeout(() => drifter.remove(), duration);   // leaf leaves the screen and is deleted
}
function refillLeaves() {           // new round: fresh leaves already spread across the stage
  $("leafMover").innerHTML = "";
  for (let i = 0; i < 8; i++) spawnLeaf(i / 9);
}
function startFlexMode() {
  resetRun(10);
  show("flex");
  nextFlexRound();
  clearInterval(spawnTimer);
  spawnTimer = setInterval(() => spawnLeaf(0), 450);
}
function nextFlexRound() {
  if (currentRound >= totalRounds) { finishGame(); return; }
  currentRound++;
  updateStats();
  clearFeedback();
  pointingDirection = directions[rand(0, 3)];
  movingDirection = directions[rand(0, 3)];
  flexRule = Math.random() < 0.5 ? "point" : "move";
  $("flexRule").textContent = flexRule === "point"
    ? "FOLLOW WHERE THE LEAF IS POINTING" : "FOLLOW WHERE THE LEAF IS MOVING";
  refillLeaves();
  locked = false;
}
function answerFlex(pressedKey) {
  if (locked) return;
  locked = true;
  const correctDirection = flexRule === "point" ? pointingDirection : movingDirection;
  awardPoints(pressedKey === correctDirection.key, 50);
  setTimeout(nextFlexRound, 800);
}
function handleKeyPress(event) {
  if (!$("flex").classList.contains("active")) return;
  if (event.key.startsWith("Arrow")) {
    event.preventDefault();               // stop the page from scrolling
    answerFlex(event.key);
  } else if (event.key === "Home") {      // reminder of the current rule
    $("flexFb").textContent = "Rule: " + $("flexRule").textContent.toLowerCase();
    $("flexFb").className = "feedback";
  } else if (event.key === "PageDown" && !locked) {   // skip the round
    locked = true;
    $("flexFb").textContent = "Skipped";
    setTimeout(nextFlexRound, 600);
  }
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
  if (currentRound >= totalRounds) { finishGame(); return; }
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

// ================= Memory Matrix =================
const gridSizes = [3, 3, 4, 4, 4, 5, 5, 5];
const tileCounts = [3, 3, 5, 5, 5, 7, 7, 7];
let memoryPattern = [], selectedTiles = [];

function startMemoryMatrix() {
  resetRun(8);
  show("memory");
  nextMemoryRound();
}
function nextMemoryRound() {
  if (currentRound >= totalRounds) { finishGame(); return; }
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
  tile.classList.add("picked");
  if (selectedTiles.length === memoryPattern.length) checkMemoryPattern();
}
function checkMemoryPattern() {
  locked = true;
  const tiles = $("grid").children;
  const isCorrect = selectedTiles.every((index) => memoryPattern.includes(index));
  if (!isCorrect) {
    selectedTiles.forEach((index) => { if (!memoryPattern.includes(index)) tiles[index].classList.add("wrong"); });
    memoryPattern.forEach((index) => tiles[index].classList.add("lit"));   // reveal answer
  }
  awardPoints(isCorrect, 0);
  setTimeout(nextMemoryRound, 1300);
}

// ================= Results =================
function showResults() {
  updateProgress(3);
  $("resultsTitle").textContent = "GREAT WORK, " + playerName + "!";
  const overallScore = Math.round((finalScores[0] + finalScores[1] + finalScores[2]) / 3);
  $("resultsMsg").textContent = (overallScore >= 600 ? "Not bad, brainiac. " : "Still a little cooked. ") +
    "Here's " + playerName + "'s performance.";
  $("resultCards").innerHTML = "";
  games.forEach((g, i) => {
    const accuracy = Math.round((finalCorrect[i] / finalTotals[i]) * 100);
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = "<h3>" + g.icon + " " + g.title + "</h3>Score<div class='num'>" + finalScores[i] +
      "</div>Accuracy<div class='num'>" + accuracy + "%</div><small>Best: " +
      (localStorage.getItem(g.key) || 0) + "</small>";
    const retry = document.createElement("button");
    retry.className = "ghost";
    retry.textContent = "TRY AGAIN";
    retry.addEventListener("click", () => { currentGame = i; replayMode = true; showIntro(); });
    card.appendChild(retry);
    $("resultCards").appendChild(card);
  });
  $("overall").textContent = overallScore;
  show("results");
}

// ================= Local Storage =================
function saveBestScore(gameIndex, score) {
  const key = games[gameIndex].key;
  const best = Number(localStorage.getItem(key)) || 0;
  if (score > best) localStorage.setItem(key, score);
}

// ================= Event Listeners =================
$("brand").addEventListener("click", goHome);
$("startBtn").addEventListener("click", startSession);
$("nameBtn").addEventListener("click", enterName);
$("nameInput").addEventListener("keydown", (e) => { if (e.key === "Enter") enterName(); });
$("welcomeBtn").addEventListener("click", beginTraining);
$("introBtn").addEventListener("click", () => games[currentGame].start());
$("completeBtn").addEventListener("click", continueAfterGame);
$("playAgainBtn").addEventListener("click", beginTraining);
$("homeBtn").addEventListener("click", goHome);
document.querySelectorAll(".pad button").forEach((btn) =>
  btn.addEventListener("click", () => answerFlex(btn.dataset.key)));
document.addEventListener("keydown", handleKeyPress);
