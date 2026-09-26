/* =========================================
   MEMORY CHALLENGE
   MAIN JAVASCRIPT
========================================= */


/* =========================================
   GAME STATE
========================================= */

const gameState = {

    selectedGame: null,

    difficulty: null,

    level: 1,

    score: 0,

    streak: 0,

    lives: 3,

    gamesPlayed: 0,

    bestScore: 0,

    bestStreak: 0,

    highestLevel: 0
};


/* =========================================
   SCREEN NAVIGATION
========================================= */

const screens = document.querySelectorAll(".screen");

const navButtons = document.querySelectorAll(
    "[data-screen]"
);


function showScreen(screenId) {

    screens.forEach(screen => {

        screen.classList.remove("active");

    });


    const targetScreen =
        document.getElementById(screenId);

    if (targetScreen) {

        targetScreen.classList.add("active");

    }


    /* Update navbar */

    document.querySelectorAll(".nav-btn")
        .forEach(button => {

            button.classList.remove("active");

            if (button.dataset.screen === screenId) {

                button.classList.add("active");

            }

        });


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


navButtons.forEach(button => {

    button.addEventListener("click", () => {

        const screen =
            button.dataset.screen;

        showScreen(screen);

    });

});


/* =========================================
   HOME → GAMES
========================================= */

const startButton =
    document.getElementById("start-btn");


startButton.addEventListener("click", () => {

    showScreen("games");

});


/* =========================================
   GAME SELECTION
========================================= */

const gameButtons =
    document.querySelectorAll(".game-select");


gameButtons.forEach(button => {

    button.addEventListener("click", () => {

        gameState.selectedGame =
            button.dataset.game;


        updateGameTitle();

        showScreen("difficulty");

    });

});


/* =========================================
   UPDATE GAME TITLE
========================================= */

function updateGameTitle() {

    const title =
        document.getElementById(
            "selected-game-title"
        );


    const gameNames = {

        sequence: "Sequence Memory",

        match: "Memory Match",

        grid: "Grid Memory",

        number: "Number Memory"

    };


    title.textContent =
        gameNames[gameState.selectedGame]
        || "Choose Difficulty";
}


/* =========================================
   DIFFICULTY SELECTION
========================================= */

const difficultyButtons =
    document.querySelectorAll(
        ".difficulty-card"
    );


difficultyButtons.forEach(button => {

    button.addEventListener("click", () => {

        /* Remove previous selection */

        difficultyButtons.forEach(btn => {

            btn.classList.remove("selected");

        });


        /* Select current */

        button.classList.add("selected");


        gameState.difficulty =
            button.dataset.difficulty;


        document.getElementById(
            "difficulty-start"
        ).disabled = false;

    });

});


/* =========================================
   START GAME
========================================= */

const difficultyStart =
    document.getElementById(
        "difficulty-start"
    );


difficultyStart.addEventListener(
    "click",
    startGame
);


function startGame() {

    if (
        !gameState.selectedGame ||
        !gameState.difficulty
    ) {

        return;

    }


    /* Reset game */

    gameState.level = 1;

    gameState.score = 0;

    gameState.streak = 0;

    gameState.lives = 3;


    updateGameScreen();


    /* Show game screen */

    showScreen("game");


    /*
       Temporary message.
       Actual games will replace this.
    */

    document.getElementById(
        "game-instruction"
    ).textContent =
        "Game engine coming next!";


    document.getElementById(
        "game-area"
    ).innerHTML = `
        <div>
            <div style="font-size:70px;">🧠</div>

            <h2 style="margin:20px 0;">
                ${getGameName()}
            </h2>

            <p style="color:#777;">
                ${capitalize(gameState.difficulty)}
                difficulty selected.
            </p>

            <br>

            <button
                id="demo-complete"
                class="primary-btn">
                Complete Demo Level
            </button>
        </div>
    `;


    document
        .getElementById("demo-complete")
        .addEventListener(
            "click",
            completeDemo
        );
}


/* =========================================
   GAME NAME
========================================= */

function getGameName() {

    const names = {

        sequence: "Sequence Memory",

        match: "Memory Match",

        grid: "Grid Memory",

        number: "Number Memory"

    };


    return names[gameState.selectedGame]
        || "Memory Challenge";
}


/* =========================================
   DEMO LEVEL
========================================= */

function completeDemo() {

    gameState.score = 100;

    gameState.streak = 1;

    gameState.highestLevel =
        Math.max(
            gameState.highestLevel,
            gameState.level
        );


    updateGameScreen();


    showResults();

}


/* =========================================
   UPDATE GAME SCREEN
========================================= */

function updateGameScreen() {

    document.getElementById(
        "game-name"
    ).textContent =
        getGameName();


    document.getElementById(
        "game-difficulty"
    ).textContent =
        capitalize(
            gameState.difficulty
        );


    document.getElementById(
        "game-level"
    ).textContent =
        gameState.level;


    document.getElementById(
        "game-score"
    ).textContent =
        gameState.score;


    document.getElementById(
        "game-streak"
    ).textContent =
        `${gameState.streak} 🔥`;


    document.getElementById(
        "game-lives"
    ).textContent =
        getLivesDisplay();

}


/* =========================================
   LIVES DISPLAY
========================================= */

function getLivesDisplay() {

    const hearts = [];

    for (let i = 0; i < 3; i++) {

        if (i < gameState.lives) {

            hearts.push("❤️");

        } else {

            hearts.push("🖤");

        }

    }

    return hearts.join(" ");

}


/* =========================================
   RESULTS
========================================= */

function showResults() {

    gameState.gamesPlayed++;

    gameState.bestScore =
        Math.max(
            gameState.bestScore,
            gameState.score
        );


    gameState.bestStreak =
        Math.max(
            gameState.bestStreak,
            gameState.streak
        );


    gameState.highestLevel =
        Math.max(
            gameState.highestLevel,
            gameState.level
        );


    document.getElementById(
        "final-score"
    ).textContent =
        gameState.score;


    document.getElementById(
        "result-level"
    ).textContent =
        gameState.level;


    document.getElementById(
        "result-accuracy"
    ).textContent =
        "100%";


    document.getElementById(
        "result-streak"
    ).textContent =
        gameState.streak;


    document.getElementById(
        "result-time"
    ).textContent =
        "5s";


    updateHomeStats();

    updateStatistics();


    showScreen("results");

}


/* =========================================
   PLAY AGAIN
========================================= */

document.getElementById(
    "play-again"
).addEventListener("click", () => {

    startGame();

});


/* =========================================
   QUIT GAME
========================================= */

document.getElementById(
    "quit-game"
).addEventListener("click", () => {

    showScreen("games");

});


/* =========================================
   PAUSE
========================================= */

document.getElementById(
    "pause-game"
).addEventListener("click", () => {

    alert(
        "Pause functionality will be added with the game engine."
    );

});


/* =========================================
   HOME STATISTICS
========================================= */

function updateHomeStats() {

    document.getElementById(
        "home-games"
    ).textContent =
        gameState.gamesPlayed;


    document.getElementById(
        "home-score"
    ).textContent =
        gameState.bestScore;


    document.getElementById(
        "home-streak"
    ).textContent =
        gameState.bestStreak;


    document.getElementById(
        "home-level"
    ).textContent =
        gameState.highestLevel;

}


/* =========================================
   STATISTICS
========================================= */

function updateStatistics() {

    document.getElementById(
        "stats-games"
    ).textContent =
        gameState.gamesPlayed;


    document.getElementById(
        "stats-score"
    ).textContent =
        gameState.bestScore;


    document.getElementById(
        "stats-streak"
    ).textContent =
        gameState.bestStreak;


    document.getElementById(
        "stats-level"
    ).textContent =
        gameState.highestLevel;

}


/* =========================================
   HELPER
========================================= */

function capitalize(text) {

    if (!text) {
        return "";
    }

    return text.charAt(0).toUpperCase()
        + text.slice(1);

}


/* =========================================
   INITIALIZE
========================================= */

updateHomeStats();

updateStatistics();

