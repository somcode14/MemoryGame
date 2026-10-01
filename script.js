/* ==========================================================================
   MEMORY CHALLENGE — SCRIPT.JS
   A vanilla JS memory training game with four playable modes,
   localStorage-backed statistics, a local leaderboard, and settings.
   ========================================================================== */

/* ==========================================================================
   1. CONSTANTS & CONFIG
   ========================================================================== */

const STORAGE_KEYS = {
  STATISTICS: 'mc_statistics_v1',
  LEADERBOARD: 'mc_leaderboard_v1',
  SETTINGS: 'mc_settings_v1'
};

const GAME_NAMES = {
  sequence: 'Sequence Memory',
  match: 'Memory Match',
  grid: 'Grid Memory',
  number: 'Number Memory'
};

const DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.25, hard: 1.5 };
const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const SEQUENCE_CONFIG = {
  easy:   { startLength: 3, revealMs: 750, gapMs: 320, tileCount: 4 },
  medium: { startLength: 4, revealMs: 600, gapMs: 260, tileCount: 4 },
  hard:   { startLength: 5, revealMs: 450, gapMs: 190, tileCount: 6 }
};
const SEQUENCE_COLORS_4 = ['red', 'blue', 'green', 'yellow'];
const SEQUENCE_COLORS_6 = ['red', 'blue', 'green', 'yellow', 'purple', 'teal'];

const MATCH_CONFIG = {
  easy:   { pairs: 4,  columns: 4 },
  medium: { pairs: 6,  columns: 4 },
  hard:   { pairs: 8,  columns: 4 }
};
const MATCH_SYMBOLS = ['★', '●', '▲', '♦', '✚', '◆', '☀', '☘', '❖', '✿', '⬟', '☾', '✦', '❂', '◈', '⬢'];

const GRID_CONFIG = {
  easy:   { start: 3, revealMs: 1500 },
  medium: { start: 5, revealMs: 1150 },
  hard:   { start: 7, revealMs: 850 }
};
const GRID_SIZE = 5; // 5 x 5 board

const NUMBER_CONFIG = {
  easy:   { start: 3, msPerDigit: 900 },
  medium: { start: 5, msPerDigit: 750 },
  hard:   { start: 7, msPerDigit: 600 }
};

/* ==========================================================================
   2. GLOBAL STATE
   ========================================================================== */

let statistics = null;   // loaded from localStorage
let leaderboard = null;  // loaded from localStorage
let settings = null;     // loaded from localStorage

let selectedGame = null;       // 'sequence' | 'match' | 'grid' | 'number'
let selectedDifficulty = null; // 'easy' | 'medium' | 'hard'

let game = null;          // the active game session state (see resetGameState)
let engine = null;        // per-game-mode working data (sequence/match/grid/number)
let activeTimeouts = [];  // tracked setTimeout ids so we can cancel them safely
let audioCtx = null;      // lazily created Web Audio context

/* ==========================================================================
   3. INITIALIZATION
   ========================================================================== */

function initializeApp() {
  loadStatistics();
  loadLeaderboard();
  loadSettings();

  wireNavigation();
  wireHomeScreen();
  wireGamesScreen();
  wireDifficultyScreen();
  wireGameHud();
  wireResultsScreen();
  wireStatisticsScreen();
  wireSettingsScreen();

  refreshHomeStatsPreview();
  showScreen('home-screen');
}

document.addEventListener('DOMContentLoaded', initializeApp);

/* ==========================================================================
   4. SCREEN NAVIGATION
   ========================================================================== */

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(function (el) {
    el.classList.remove('active');
  });
  const target = document.getElementById(screenId);
  if (target) target.classList.add('active');

  if (screenId === 'home-screen') refreshHomeStatsPreview();
  if (screenId === 'stats-screen') refreshStatisticsScreen();
  if (screenId === 'leaderboard-screen') refreshLeaderboardScreen();

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function wireNavigation() {
  document.querySelectorAll('[data-nav]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Leaving an in-progress game through nav counts as a quit.
      if (document.getElementById('game-screen').classList.contains('active')) {
        cleanupActiveGame();
      }
      showScreen(btn.getAttribute('data-nav'));
    });
  });
}

/* ==========================================================================
   5. HOME SCREEN
   ========================================================================== */

function wireHomeScreen() {
  document.getElementById('start-playing-btn').addEventListener('click', function () {
    showScreen('games-screen');
  });
}

function refreshHomeStatsPreview() {
  document.getElementById('home-games-played').textContent = statistics.totalGames;
  document.getElementById('home-best-score').textContent = statistics.bestScore;
  document.getElementById('home-best-streak').textContent = statistics.bestStreak;
  document.getElementById('home-highest-level').textContent = statistics.highestLevel;
}

/* ==========================================================================
   6. GAMES SELECTION SCREEN
   ========================================================================== */

function wireGamesScreen() {
  document.querySelectorAll('.play-game-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedGame = btn.getAttribute('data-game');
      selectedDifficulty = null;
      openDifficultyScreen();
    });
  });
}

function openDifficultyScreen() {
  document.getElementById('difficulty-game-title').textContent = GAME_NAMES[selectedGame];

  document.querySelectorAll('.difficulty-card').forEach(function (card) {
    card.classList.remove('selected');
  });
  const startBtn = document.getElementById('start-game-btn');
  startBtn.disabled = true;

  showScreen('difficulty-screen');
}

/* ==========================================================================
   7. DIFFICULTY SELECTION SCREEN
   ========================================================================== */

function wireDifficultyScreen() {
  document.querySelectorAll('.difficulty-card').forEach(function (card) {
    card.addEventListener('click', function () {
      document.querySelectorAll('.difficulty-card').forEach(function (c) {
        c.classList.remove('selected');
      });
      card.classList.add('selected');
      selectedDifficulty = card.getAttribute('data-difficulty');
      document.getElementById('start-game-btn').disabled = false;
    });
  });

  document.getElementById('start-game-btn').addEventListener('click', function () {
    if (!selectedDifficulty) return;
    startGame(selectedGame, selectedDifficulty);
  });
}

/* ==========================================================================
   8. GENERIC GAME SESSION MANAGEMENT
   ========================================================================== */

function resetGameState(type, difficulty) {
  return {
    type: type,
    difficulty: difficulty,
    multiplier: DIFFICULTY_MULTIPLIER[difficulty],
    level: 1,
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: 3,
    correctAttempts: 0,
    totalAttempts: 0,
    elapsedMs: 0,
    timerTickHandle: null,
    lastTickAt: null,
    paused: false,
    ended: false,
    roundStartedAt: null
  };
}

function startGame(type, difficulty) {
  clearAllTimeouts();
  game = resetGameState(type, difficulty);
  engine = {};

  document.getElementById('hud-game-name').textContent = GAME_NAMES[type].toUpperCase();
  document.getElementById('hud-difficulty').textContent = DIFFICULTY_LABEL[difficulty];
  document.getElementById('pause-overlay').classList.add('hidden');
  document.getElementById('countdown-overlay').classList.add('hidden');
  hideFeedback();

  updateHud();
  showScreen('game-screen');

  runCountdown(function () {
    startTimer();
    if (type === 'sequence') startSequenceGame();
    else if (type === 'match') startMemoryMatch();
    else if (type === 'grid') startGridMemory();
    else if (type === 'number') startNumberMemory();
  });
}

function updateHud() {
  document.getElementById('hud-level').textContent = game.level;
  document.getElementById('hud-score').textContent = game.score;
  document.getElementById('hud-streak').textContent = '🔥 ' + game.streak;
  document.getElementById('hud-timer').textContent = formatTime(game.elapsedMs);

  const hearts = [];
  for (let i = 0; i < 3; i++) {
    hearts.push(i < game.lives ? '♥' : '♡');
  }
  document.getElementById('hud-lives').textContent = hearts.join(' ');
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

function startTimer() {
  game.lastTickAt = Date.now();
  game.timerTickHandle = setInterval(function () {
    if (game.paused || game.ended) return;
    const now = Date.now();
    game.elapsedMs += now - game.lastTickAt;
    game.lastTickAt = now;
    document.getElementById('hud-timer').textContent = formatTime(game.elapsedMs);
  }, 250);
}

function stopTimer() {
  if (game && game.timerTickHandle) {
    clearInterval(game.timerTickHandle);
    game.timerTickHandle = null;
  }
}

function trackTimeout(id) {
  activeTimeouts.push(id);
  return id;
}

function clearAllTimeouts() {
  activeTimeouts.forEach(function (id) { clearTimeout(id); });
  activeTimeouts = [];
}

/* ==========================================================================
   9. GAME HUD CONTROLS (PAUSE / QUIT)
   ========================================================================== */

function wireGameHud() {
  document.getElementById('pause-btn').addEventListener('click', pauseGame);
  document.getElementById('resume-btn').addEventListener('click', resumeGame);
  document.getElementById('quit-btn').addEventListener('click', quitGame);
  document.getElementById('quit-from-pause-btn').addEventListener('click', quitGame);
}

function pauseGame() {
  if (!game || game.ended || game.paused) return;
  game.paused = true;
  document.getElementById('pause-overlay').classList.remove('hidden');
}

function resumeGame() {
  if (!game || !game.paused) return;
  game.paused = false;
  game.lastTickAt = Date.now();
  document.getElementById('pause-overlay').classList.add('hidden');
}

function quitGame() {
  cleanupActiveGame();
  showScreen('games-screen');
}

function cleanupActiveGame() {
  stopTimer();
  clearAllTimeouts();
  if (game) game.ended = true;
  document.getElementById('pause-overlay').classList.add('hidden');
}

/* ==========================================================================
   10. COUNTDOWN / FEEDBACK HELPERS
   ========================================================================== */

function runCountdown(onComplete) {
  const overlay = document.getElementById('countdown-overlay');
  const numberEl = document.getElementById('countdown-number');
  overlay.classList.remove('hidden');

  let count = 3;
  numberEl.textContent = count;
  playTone(440, 0.1);

  const tick = function () {
    count -= 1;
    if (count > 0) {
      numberEl.textContent = count;
      playTone(440, 0.1);
      trackTimeout(setTimeout(tick, 600));
    } else {
      numberEl.textContent = 'GO!';
      playTone(660, 0.15);
      trackTimeout(setTimeout(function () {
        overlay.classList.add('hidden');
        onComplete();
      }, 500));
    }
  };
  trackTimeout(setTimeout(tick, 600));
}

function showFeedback(text, type) {
  const toast = document.getElementById('feedback-toast');
  toast.textContent = text;
  toast.className = 'feedback-toast ' + type;
  toast.classList.remove('hidden');
}

function hideFeedback() {
  const toast = document.getElementById('feedback-toast');
  toast.classList.add('hidden');
}

function flashFeedback(text, type, duration) {
  showFeedback(text, type);
  trackTimeout(setTimeout(hideFeedback, duration || 900));
}

/* ==========================================================================
   11. SCORING
   ========================================================================== */

function calculateRoundScore(level, streak, timeTakenMs, maxTimeMs, multiplier) {
  const base = 50;
  const levelBonus = level * 8;
  const streakBonus = Math.min(streak, 20) * 6;

  let speedBonus = 0;
  if (timeTakenMs != null && maxTimeMs) {
    const ratio = Math.max(0, 1 - (timeTakenMs / maxTimeMs));
    speedBonus = Math.round(ratio * 40);
  }

  const raw = (base + levelBonus + streakBonus + speedBonus) * multiplier;
  return Math.max(0, Math.round(raw));
}

function mistakePenalty(multiplier) {
  return Math.round(15 * multiplier);
}

function registerCorrect(pointsEarned) {
  game.correctAttempts += 1;
  game.totalAttempts += 1;
  game.streak += 1;
  if (game.streak > game.bestStreak) game.bestStreak = game.streak;
  game.score += pointsEarned;
  updateHud();
}

function registerMistake() {
  game.totalAttempts += 1;
  game.streak = 0;
  game.lives -= 1;
  game.score = Math.max(0, game.score - mistakePenalty(game.multiplier));
  updateHud();
}

/* ==========================================================================
   12. GAME 1 — SEQUENCE MEMORY
   ========================================================================== */

function startSequenceGame() {
  const cfg = SEQUENCE_CONFIG[game.difficulty];
  const colors = cfg.tileCount === 6 ? SEQUENCE_COLORS_6 : SEQUENCE_COLORS_4;

  engine = {
    colors: colors,
    revealMs: cfg.revealMs,
    gapMs: cfg.gapMs,
    sequence: [],
    playerIndex: 0,
    accepting: false
  };

  renderSequenceBoard();
  buildSequenceRound(cfg.startLength);
}

function renderSequenceBoard() {
  const stage = document.getElementById('game-stage');
  const columns = engine.colors.length > 4 ? 3 : 2;

  const tilesHtml = engine.colors.map(function (color) {
    return '<button class="sequence-tile disabled" data-color="' + color + '" aria-label="' + color + ' tile"></button>';
  }).join('');

  stage.innerHTML =
    '<p class="stage-instruction" id="sequence-instruction">Watch the sequence carefully.</p>' +
    '<div class="sequence-board" id="sequence-board" style="grid-template-columns: repeat(' + columns + ', 120px);">' +
      tilesHtml +
    '</div>';

  document.querySelectorAll('.sequence-tile').forEach(function (tile) {
    tile.addEventListener('click', function () {
      onSequenceTileClick(tile.getAttribute('data-color'));
    });
  });
}

function buildSequenceRound(length) {
  if (engine.sequence.length === 0) {
    for (let i = 0; i < length; i++) {
      engine.sequence.push(randomChoice(engine.colors));
    }
  }
  playSequence();
}

function playSequence() {
  engine.accepting = false;
  engine.playerIndex = 0;
  document.getElementById('sequence-instruction').textContent = 'Watch the sequence carefully.';
  setSequenceTilesDisabled(true);

  let i = 0;
  const step = function () {
    if (i >= engine.sequence.length) {
      setSequenceTilesDisabled(false);
      engine.accepting = true;
      document.getElementById('sequence-instruction').textContent = 'Now repeat the sequence.';
      game.roundStartedAt = Date.now();
      return;
    }
    const color = engine.sequence[i];
    litSequenceTile(color, engine.revealMs);
    i += 1;
    trackTimeout(setTimeout(step, engine.revealMs + engine.gapMs));
  };
  trackTimeout(setTimeout(step, 400));
}

function litSequenceTile(color, duration) {
  const tile = document.querySelector('.sequence-tile[data-color="' + color + '"]');
  if (!tile) return;
  tile.classList.add('lit');
  playTone(colorToFrequency(color), 0.18);
  trackTimeout(setTimeout(function () {
    tile.classList.remove('lit');
  }, duration));
}

function colorToFrequency(color) {
  const map = { red: 330, blue: 392, green: 440, yellow: 523, purple: 294, teal: 587 };
  return map[color] || 440;
}

function setSequenceTilesDisabled(disabled) {
  document.querySelectorAll('.sequence-tile').forEach(function (tile) {
    tile.classList.toggle('disabled', disabled);
  });
}

function onSequenceTileClick(color) {
  if (game.paused || game.ended || !engine.accepting) return;

  const tile = document.querySelector('.sequence-tile[data-color="' + color + '"]');
  const expected = engine.sequence[engine.playerIndex];

  if (color === expected) {
    tile.classList.add('lit');
    trackTimeout(setTimeout(function () { tile.classList.remove('lit'); }, 200));
    engine.playerIndex += 1;

    if (engine.playerIndex === engine.sequence.length) {
      engine.accepting = false;
      const timeTaken = Date.now() - game.roundStartedAt;
      const maxTime = engine.sequence.length * (engine.revealMs + engine.gapMs) * 1.4;
      const points = calculateRoundScore(game.level, game.streak, timeTaken, maxTime, game.multiplier);
      registerCorrect(points);
      game.level += 1;
      flashFeedback('✓ Correct!', 'correct', 700);

      if (game.level % 3 === 0) {
        trackTimeout(setTimeout(function () { flashFeedback('LEVEL UP!', 'levelup', 900); }, 750));
      }

      engine.sequence.push(randomChoice(engine.colors));
      trackTimeout(setTimeout(function () {
        updateHud();
        playSequence();
      }, 1100));
    }
  } else {
    setSequenceTilesDisabled(true);
    tile.classList.add('wrong-flash-tile');
    flashFeedback('✕ Wrong!', 'wrong', 900);
    registerMistake();

    trackTimeout(setTimeout(function () {
      tile.classList.remove('wrong-flash-tile');
      if (game.lives <= 0) {
        endGame();
      } else {
        playSequence();
      }
    }, 1000));
  }
}

/* ==========================================================================
   13. GAME 2 — MEMORY MATCH
   ========================================================================== */

function startMemoryMatch() {
  const cfg = MATCH_CONFIG[game.difficulty];
  const symbols = MATCH_SYMBOLS.slice(0, cfg.pairs);
  let deck = symbols.concat(symbols);
  deck = shuffleArray(deck);

  engine = {
    columns: cfg.columns,
    totalPairs: cfg.pairs,
    matchesFound: 0,
    deck: deck,
    flipped: [],   // indices currently flipped, awaiting comparison
    matched: [],   // indices already matched
    locked: false
  };

  game.level = 1;
  game.roundStartedAt = Date.now();
  renderMatchBoard();
}

function renderMatchBoard() {
  const stage = document.getElementById('game-stage');
  const cardsHtml = engine.deck.map(function (symbol, index) {
    return (
      '<div class="match-card" data-index="' + index + '">' +
        '<div class="match-card-face match-card-back"></div>' +
        '<div class="match-card-face match-card-front">' + symbol + '</div>' +
      '</div>'
    );
  }).join('');

  stage.innerHTML =
    '<p class="stage-instruction">Find every matching pair.</p>' +
    '<div class="match-board" id="match-board" style="grid-template-columns: repeat(' + engine.columns + ', 90px);">' +
      cardsHtml +
    '</div>';

  document.querySelectorAll('.match-card').forEach(function (card) {
    card.addEventListener('click', function () {
      onMatchCardClick(parseInt(card.getAttribute('data-index'), 10));
    });
  });
}

function onMatchCardClick(index) {
  if (game.paused || game.ended || engine.locked) return;
  if (engine.flipped.includes(index) || engine.matched.includes(index)) return;
  if (engine.flipped.length >= 2) return;

  const cardEl = document.querySelector('.match-card[data-index="' + index + '"]');
  cardEl.classList.add('flipped');
  engine.flipped.push(index);
  playTone(500, 0.08);

  if (engine.flipped.length === 2) {
    engine.locked = true;
    const [i1, i2] = engine.flipped;
    const isMatch = engine.deck[i1] === engine.deck[i2];

    trackTimeout(setTimeout(function () {
      const card1 = document.querySelector('.match-card[data-index="' + i1 + '"]');
      const card2 = document.querySelector('.match-card[data-index="' + i2 + '"]');

      if (isMatch) {
        card1.classList.add('matched');
        card2.classList.add('matched');
        engine.matched.push(i1, i2);
        engine.matchesFound += 1;

        const timeTaken = Date.now() - game.roundStartedAt;
        const maxTime = 8000 / game.multiplier;
        const points = calculateRoundScore(game.level, game.streak, timeTaken, maxTime, game.multiplier);
        registerCorrect(points);
        game.level = engine.matchesFound + 1;
        flashFeedback('✓ Match!', 'correct', 700);
        updateHud();

        if (engine.matchesFound === engine.totalPairs) {
          trackTimeout(setTimeout(function () { endGame('complete'); }, 600));
        }
      } else {
        card1.classList.add('wrong-flash');
        card2.classList.add('wrong-flash');
        flashFeedback('✕ No match', 'wrong', 700);
        registerMistake();

        trackTimeout(setTimeout(function () {
          card1.classList.remove('flipped', 'wrong-flash');
          card2.classList.remove('flipped', 'wrong-flash');
          if (game.lives <= 0) {
            endGame();
          }
        }, 700));
      }

      engine.flipped = [];
      engine.locked = false;
      game.roundStartedAt = Date.now();
    }, 650));
  }
}

/* ==========================================================================
   14. GAME 3 — GRID MEMORY
   ========================================================================== */

function startGridMemory() {
  const cfg = GRID_CONFIG[game.difficulty];
  engine = {
    revealMs: cfg.revealMs,
    targetCount: cfg.start,
    targets: [],
    picks: [],
    showingPattern: true
  };

  renderGridBoard();
  playGridRound();
}

function renderGridBoard() {
  const stage = document.getElementById('game-stage');
  const cellsHtml = [];
  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    cellsHtml.push('<button class="grid-cell disabled" data-index="' + i + '"></button>');
  }

  stage.innerHTML =
    '<p class="stage-instruction" id="grid-instruction">Memorize the highlighted cells.</p>' +
    '<div class="grid-board" id="grid-board" style="grid-template-columns: repeat(' + GRID_SIZE + ', 56px);">' +
      cellsHtml.join('') +
    '</div>';

  document.querySelectorAll('.grid-cell').forEach(function (cell) {
    cell.addEventListener('click', function () {
      onGridCellClick(parseInt(cell.getAttribute('data-index'), 10));
    });
  });
}

function playGridRound() {
  engine.picks = [];
  engine.showingPattern = true;
  document.getElementById('grid-instruction').textContent = 'Memorize the highlighted cells.';
  setGridCellsDisabled(true);

  const totalCells = GRID_SIZE * GRID_SIZE;
  const count = Math.min(engine.targetCount, totalCells - 2);
  engine.targets = pickUniqueRandomIndices(totalCells, count);

  document.querySelectorAll('.grid-cell').forEach(function (cell) {
    cell.classList.remove('lit', 'picked-correct', 'picked-wrong');
  });

  engine.targets.forEach(function (idx) {
    document.querySelector('.grid-cell[data-index="' + idx + '"]').classList.add('lit');
  });
  playTone(420, 0.12);

  trackTimeout(setTimeout(function () {
    document.querySelectorAll('.grid-cell').forEach(function (cell) {
      cell.classList.remove('lit');
    });
    engine.showingPattern = false;
    setGridCellsDisabled(false);
    document.getElementById('grid-instruction').textContent =
      'Click the ' + engine.targets.length + ' cells you saw light up.';
    game.roundStartedAt = Date.now();
  }, engine.revealMs));
}

function setGridCellsDisabled(disabled) {
  document.querySelectorAll('.grid-cell').forEach(function (cell) {
    cell.classList.toggle('disabled', disabled);
  });
}

function onGridCellClick(index) {
  if (game.paused || game.ended || engine.showingPattern) return;
  if (engine.picks.includes(index)) return;

  const cell = document.querySelector('.grid-cell[data-index="' + index + '"]');
  const isTarget = engine.targets.includes(index);

  if (isTarget) {
    cell.classList.add('picked-correct');
    engine.picks.push(index);
    playTone(500, 0.1);

    if (engine.picks.length === engine.targets.length) {
      setGridCellsDisabled(true);
      const timeTaken = Date.now() - game.roundStartedAt;
      const maxTime = engine.targets.length * 1500;
      const points = calculateRoundScore(game.level, game.streak, timeTaken, maxTime, game.multiplier);
      registerCorrect(points);
      game.level += 1;
      engine.targetCount += 1;
      flashFeedback('✓ Correct!', 'correct', 700);

      if (game.level % 3 === 0) {
        trackTimeout(setTimeout(function () { flashFeedback('LEVEL UP!', 'levelup', 900); }, 750));
      }

      trackTimeout(setTimeout(playGridRound, 1100));
    }
  } else {
    cell.classList.add('picked-wrong');
    setGridCellsDisabled(true);
    flashFeedback('✕ Wrong!', 'wrong', 900);
    registerMistake();

    trackTimeout(setTimeout(function () {
      if (game.lives <= 0) {
        endGame();
      } else {
        playGridRound();
      }
    }, 1000));
  }
}

/* ==========================================================================
   15. GAME 4 — NUMBER MEMORY
   ========================================================================== */

function startNumberMemory() {
  const cfg = NUMBER_CONFIG[game.difficulty];
  engine = {
    length: cfg.start,
    msPerDigit: cfg.msPerDigit,
    currentNumber: ''
  };
  renderNumberStage();
  playNumberRound();
}

function renderNumberStage() {
  const stage = document.getElementById('game-stage');
  stage.innerHTML =
    '<p class="stage-instruction" id="number-instruction">Memorize the number.</p>' +
    '<div class="number-display" id="number-display"></div>' +
    '<input type="text" inputmode="numeric" pattern="[0-9]*" class="number-input hidden" id="number-input" placeholder="Enter the number" autocomplete="off">';

  const input = document.getElementById('number-input');
  input.addEventListener('input', function () {
    input.value = input.value.replace(/[^0-9]/g, '');
  });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitNumberAnswer();
  });
}

function playNumberRound() {
  engine.currentNumber = generateRandomDigits(engine.length);
  const display = document.getElementById('number-display');
  const input = document.getElementById('number-input');

  document.getElementById('number-instruction').textContent = 'Memorize the number.';
  display.textContent = engine.currentNumber;
  display.classList.remove('hidden');
  input.classList.add('hidden');
  input.value = '';
  playTone(400, 0.1);

  const revealTime = Math.max(1200, engine.length * engine.msPerDigit);
  trackTimeout(setTimeout(function () {
    display.classList.add('hidden');
    input.classList.remove('hidden');
    document.getElementById('number-instruction').textContent = 'Enter the number you saw. Press Enter to submit.';
    input.focus();
    game.roundStartedAt = Date.now();
  }, revealTime));
}

function submitNumberAnswer() {
  if (game.paused || game.ended) return;
  const input = document.getElementById('number-input');
  if (input.classList.contains('hidden')) return;

  const answer = input.value.trim();
  if (answer.length === 0) return;

  if (answer === engine.currentNumber) {
    const timeTaken = Date.now() - game.roundStartedAt;
    const maxTime = engine.length * 1800;
    const points = calculateRoundScore(game.level, game.streak, timeTaken, maxTime, game.multiplier);
    registerCorrect(points);
    game.level += 1;
    engine.length += 1;
    flashFeedback('✓ Correct!', 'correct', 700);

    if (game.level % 3 === 0) {
      trackTimeout(setTimeout(function () { flashFeedback('LEVEL UP!', 'levelup', 900); }, 750));
    }
    trackTimeout(setTimeout(playNumberRound, 900));
  } else {
    flashFeedback('✕ Wrong!', 'wrong', 900);
    registerMistake();
    input.value = '';

    trackTimeout(setTimeout(function () {
      if (game.lives <= 0) {
        endGame();
      } else {
        playNumberRound();
      }
    }, 1000));
  }
}

/* ==========================================================================
   16. ENDING A GAME / RESULTS
   ========================================================================== */

function endGame(reason) {
  if (!game || game.ended) return;
  game.ended = true;
  stopTimer();
  clearAllTimeouts();

  const accuracy = game.totalAttempts > 0
    ? Math.round((game.correctAttempts / game.totalAttempts) * 100)
    : 0;

  if (reason === 'complete') {
    flashFeedback('BOARD CLEARED!', 'levelup', 900);
  } else {
    flashFeedback('GAME OVER', 'gameover', 900);
  }

  saveGameStatistics(game, accuracy);
  showResultsScreen(game, accuracy);
}

function showResultsScreen(finishedGame, accuracy) {
  document.getElementById('results-final-score').textContent = finishedGame.score;
  document.getElementById('results-level').textContent = finishedGame.level;
  document.getElementById('results-accuracy').textContent = accuracy + '%';
  document.getElementById('results-streak').textContent = finishedGame.bestStreak;
  document.getElementById('results-time').textContent = formatTime(finishedGame.elapsedMs);

  let message = 'Keep practicing!';
  if (accuracy >= 90) message = 'Excellent memory!';
  else if (accuracy >= 70) message = 'Great job!';
  document.getElementById('results-message').textContent = message;

  const qualifies = qualifiesForLeaderboard(finishedGame.score);
  const entryForm = document.getElementById('leaderboard-entry-form');
  entryForm.classList.toggle('hidden', !qualifies);
  document.getElementById('player-name-input').value = '';

  trackTimeout(setTimeout(function () { showScreen('results-screen'); }, 350));
}

function wireResultsScreen() {
  document.getElementById('play-again-btn').addEventListener('click', function () {
    startGame(selectedGame, selectedDifficulty);
  });
  document.getElementById('choose-another-btn').addEventListener('click', function () {
    showScreen('games-screen');
  });
  document.getElementById('view-stats-btn').addEventListener('click', function () {
    showScreen('stats-screen');
  });
  document.getElementById('submit-score-btn').addEventListener('click', submitLeaderboardScore);
  document.getElementById('player-name-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitLeaderboardScore();
  });
}

/* ==========================================================================
   17. STATISTICS (localStorage)
   ========================================================================== */

function defaultStatistics() {
  const perGame = {};
  Object.keys(GAME_NAMES).forEach(function (key) {
    perGame[key] = { gamesPlayed: 0, bestScore: 0, bestLevel: 0, bestAccuracy: 0 };
  });
  return {
    totalGames: 0,
    bestScore: 0,
    bestStreak: 0,
    highestLevel: 0,
    totalPlayTimeMs: 0,
    perGame: perGame
  };
}

function loadStatistics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATISTICS);
    if (!raw) {
      statistics = defaultStatistics();
      return;
    }
    const parsed = JSON.parse(raw);
    const safe = defaultStatistics();

    safe.totalGames = Number(parsed.totalGames) || 0;
    safe.bestScore = Number(parsed.bestScore) || 0;
    safe.bestStreak = Number(parsed.bestStreak) || 0;
    safe.highestLevel = Number(parsed.highestLevel) || 0;
    safe.totalPlayTimeMs = Number(parsed.totalPlayTimeMs) || 0;

    if (parsed.perGame) {
      Object.keys(safe.perGame).forEach(function (key) {
        const src = parsed.perGame[key] || {};
        safe.perGame[key] = {
          gamesPlayed: Number(src.gamesPlayed) || 0,
          bestScore: Number(src.bestScore) || 0,
          bestLevel: Number(src.bestLevel) || 0,
          bestAccuracy: Number(src.bestAccuracy) || 0
        };
      });
    }
    statistics = safe;
  } catch (err) {
    statistics = defaultStatistics();
  }
}

function persistStatistics() {
  try {
    localStorage.setItem(STORAGE_KEYS.STATISTICS, JSON.stringify(statistics));
  } catch (err) {
    /* localStorage unavailable — statistics simply won't persist */
  }
}

function saveGameStatistics(finishedGame, accuracy) {
  statistics.totalGames += 1;
  statistics.bestScore = Math.max(statistics.bestScore, finishedGame.score);
  statistics.bestStreak = Math.max(statistics.bestStreak, finishedGame.bestStreak);
  statistics.highestLevel = Math.max(statistics.highestLevel, finishedGame.level);
  statistics.totalPlayTimeMs += finishedGame.elapsedMs;

  const perGame = statistics.perGame[finishedGame.type];
  perGame.gamesPlayed += 1;
  perGame.bestScore = Math.max(perGame.bestScore, finishedGame.score);
  perGame.bestLevel = Math.max(perGame.bestLevel, finishedGame.level);
  perGame.bestAccuracy = Math.max(perGame.bestAccuracy, accuracy);

  persistStatistics();
}

function wireStatisticsScreen() {
  /* Statistics screen has no interactive controls beyond navigation,
     which is already wired in wireNavigation(). */
}

function refreshStatisticsScreen() {
  document.getElementById('stat-total-games').textContent = statistics.totalGames;
  document.getElementById('stat-best-score').textContent = statistics.bestScore;
  document.getElementById('stat-best-streak').textContent = statistics.bestStreak;
  document.getElementById('stat-highest-level').textContent = statistics.highestLevel;
  document.getElementById('stat-total-time').textContent = formatTime(statistics.totalPlayTimeMs);

  const container = document.getElementById('stats-per-game');
  container.innerHTML = Object.keys(GAME_NAMES).map(function (key) {
    const g = statistics.perGame[key];
    return (
      '<div class="stats-game-card">' +
        '<h4>' + GAME_NAMES[key] + '</h4>' +
        '<div class="stats-game-row"><span>Games Played</span><span>' + g.gamesPlayed + '</span></div>' +
        '<div class="stats-game-row"><span>Best Score</span><span>' + g.bestScore + '</span></div>' +
        '<div class="stats-game-row"><span>Best Level</span><span>' + g.bestLevel + '</span></div>' +
        '<div class="stats-game-row"><span>Best Accuracy</span><span>' + g.bestAccuracy + '%</span></div>' +
      '</div>'
    );
  }).join('');
}

/* ==========================================================================
   18. LEADERBOARD (localStorage)
   ========================================================================== */

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    const parsed = raw ? JSON.parse(raw) : [];
    leaderboard = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    leaderboard = [];
  }
}

function persistLeaderboard() {
  try {
    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
  } catch (err) {
    /* localStorage unavailable — leaderboard simply won't persist */
  }
}

function qualifiesForLeaderboard(score) {
  if (score <= 0) return false;
  if (leaderboard.length < 10) return true;
  const lowest = leaderboard[leaderboard.length - 1].score;
  return score > lowest;
}

function submitLeaderboardScore() {
  const input = document.getElementById('player-name-input');
  let name = input.value.trim().toUpperCase();
  if (!name) name = 'PLAYER';
  name = name.slice(0, 12);

  leaderboard.push({
    name: name,
    score: game.score,
    game: GAME_NAMES[game.type],
    difficulty: DIFFICULTY_LABEL[game.difficulty],
    date: new Date().toISOString()
  });

  leaderboard.sort(function (a, b) { return b.score - a.score; });
  leaderboard = leaderboard.slice(0, 10);
  persistLeaderboard();

  document.getElementById('leaderboard-entry-form').classList.add('hidden');
  flashFeedback('Added to leaderboard!', 'correct', 1200);
}

function refreshLeaderboardScreen() {
  const list = document.getElementById('leaderboard-list');

  if (leaderboard.length === 0) {
    list.innerHTML = '<div class="leaderboard-empty">No scores yet. Play a game to set the first record!</div>';
    return;
  }

  list.innerHTML = leaderboard.map(function (entry, index) {
    return (
      '<div class="leaderboard-row">' +
        '<span class="leaderboard-rank">' + (index + 1) + '</span>' +
        '<span class="leaderboard-name">' + escapeHtml(entry.name) + '</span>' +
        '<span class="leaderboard-game">' + escapeHtml(entry.game) + ' · ' + escapeHtml(entry.difficulty) + '</span>' +
        '<span class="leaderboard-score">' + entry.score + '</span>' +
      '</div>'
    );
  }).join('');
}

/* ==========================================================================
   19. SETTINGS (localStorage)
   ========================================================================== */

function defaultSettings() {
  return { soundOn: true, animationsOn: true };
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      settings = defaultSettings();
      return;
    }
    const parsed = JSON.parse(raw);
    settings = {
      soundOn: typeof parsed.soundOn === 'boolean' ? parsed.soundOn : true,
      animationsOn: typeof parsed.animationsOn === 'boolean' ? parsed.animationsOn : true
    };
  } catch (err) {
    settings = defaultSettings();
  }
}

function persistSettings() {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (err) {
    /* localStorage unavailable — settings simply won't persist */
  }
}

function wireSettingsScreen() {
  const soundToggle = document.getElementById('setting-sound');
  const animToggle = document.getElementById('setting-animations');

  soundToggle.checked = settings.soundOn;
  animToggle.checked = settings.animationsOn;
  document.body.classList.toggle('no-animations', !settings.animationsOn);

  soundToggle.addEventListener('change', function () {
    settings.soundOn = soundToggle.checked;
    persistSettings();
  });

  animToggle.addEventListener('change', function () {
    settings.animationsOn = animToggle.checked;
    document.body.classList.toggle('no-animations', !settings.animationsOn);
    persistSettings();
  });

  document.getElementById('reset-stats-btn').addEventListener('click', function () {
    document.getElementById('reset-confirm-overlay').classList.remove('hidden');
  });
  document.getElementById('cancel-reset-btn').addEventListener('click', function () {
    document.getElementById('reset-confirm-overlay').classList.add('hidden');
  });
  document.getElementById('confirm-reset-btn').addEventListener('click', function () {
    statistics = defaultStatistics();
    leaderboard = [];
    persistStatistics();
    persistLeaderboard();
    document.getElementById('reset-confirm-overlay').classList.add('hidden');
    refreshHomeStatsPreview();
    flashFeedback('All data reset', 'correct', 1200);
  });
}

/* ==========================================================================
   20. AUDIO (Web Audio API — no external files)
   ========================================================================== */

function playTone(frequency, durationSeconds) {
  if (!settings || !settings.soundOn) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.08;

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0.08, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds);

    oscillator.start(now);
    oscillator.stop(now + durationSeconds);
  } catch (err) {
    /* Web Audio unavailable — game continues silently */
  }
}

/* ==========================================================================
   21. UTILITIES
   ========================================================================== */

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray(arr) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

function pickUniqueRandomIndices(total, count) {
  const pool = [];
  for (let i = 0; i < total; i++) pool.push(i);
  const shuffled = shuffleArray(pool);
  return shuffled.slice(0, count);
}

function generateRandomDigits(length) {
  let result = '';
  result += String(Math.floor(Math.random() * 9) + 1); // no leading zero
  for (let i = 1; i < length; i++) {
    result += String(Math.floor(Math.random() * 10));
  }
  return result;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
