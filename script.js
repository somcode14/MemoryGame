console.log("JavaScript is working!");

/* =========================
   GAME STATE
========================= */

const gameState = {
    selectedGame: null,
    difficulty: null
};


/* =========================
   SCREEN NAVIGATION
========================= */

function showScreen(screenId) {

    console.log("Opening screen:", screenId);

    const screens = document.querySelectorAll(".screen");

    screens.forEach(screen => {
        screen.classList.remove("active");
    });

    const targetScreen =
        document.getElementById(screenId);

    if (targetScreen) {

        targetScreen.classList.add("active");

        console.log(
            "Screen opened successfully:",
            screenId
        );

    } else {

        console.error(
            "Screen not found:",
            screenId
        );

    }
}


/* =========================
   NAVBAR BUTTONS
========================= */

const navigationButtons =
    document.querySelectorAll("[data-screen]");

console.log(
    "Navigation buttons:",
    navigationButtons.length
);

navigationButtons.forEach(button => {

    button.addEventListener("click", function () {

        const screen =
            this.getAttribute("data-screen");

        console.log(
            "Navbar clicked:",
            screen
        );

        showScreen(screen);

    });

});


/* =========================
   GAME SELECTION
========================= */

const gameButtons =
    document.querySelectorAll(".game-select");

console.log(
    "Game buttons:",
    gameButtons.length
);

gameButtons.forEach(button => {

    button.addEventListener("click", function () {

        gameState.selectedGame =
            this.getAttribute("data-game");

        console.log(
            "Game selected:",
            gameState.selectedGame
        );

        showScreen("difficulty");

    });

});


/* =========================
   DIFFICULTY SELECTION
========================= */

const difficultyCards =
    document.querySelectorAll(".difficulty-card");

console.log(
    "Difficulty cards:",
    difficultyCards.length
);

difficultyCards.forEach(card => {

    card.addEventListener("click", function () {

        /* Remove selection from all cards */

        difficultyCards.forEach(item => {
            item.classList.remove("selected");
        });

        /* Select clicked card */

        this.classList.add("selected");

        gameState.difficulty =
            this.getAttribute("data-difficulty");

        console.log(
            "Difficulty selected:",
            gameState.difficulty
        );

    });

});


/* =========================
   START GAME
========================= */

const startButton =
    document.getElementById(
        "difficulty-start"
    );

console.log(
    "Start button:",
    startButton
);

if (startButton) {

    startButton.addEventListener(
        "click",
        function () {

            console.log(
                "START GAME CLICKED"
            );

            if (!gameState.difficulty) {

                alert(
                    "Please select a difficulty first."
                );

                return;
            }

            showScreen("game");

            startSequenceGame();

        }
    );

}


/* =========================
   SEQUENCE MEMORY
========================= */

function startSequenceGame() {

    console.log(
        "Starting Sequence Memory..."
    );

    const gameArea =
        document.getElementById(
            "sequence-game"
        );

    if (!gameArea) {

        console.error(
            "ERROR: #sequence-game not found"
        );

        return;
    }

    gameArea.innerHTML = `

        <div class="sequence-container">

            <h2>🧠 Sequence Memory</h2>

            <p>
                Memorize the sequence
            </p>

            <div class="sequence-board">

                <button class="sequence-card">
                    🟥
                </button>

                <button class="sequence-card">
                    🟦
                </button>

                <button class="sequence-card">
                    🟩
                </button>

                <button class="sequence-card">
                    🟨
                </button>

            </div>

            <p id="sequence-message">
                Game is ready!
            </p>

        </div>

    `;

    console.log(
        "Sequence game loaded!"
    );

}
/* =========================
   START PLAYING BUTTON
========================= */

const startPlaying =
    document.getElementById("start-playing");

console.log(
    "Start Playing button:",
    startPlaying
);

if (startPlaying) {

    startPlaying.addEventListener("click", function () {

        console.log("Start Playing clicked!");

        showScreen("games");

    });

} else {

    console.error(
        "Start Playing button not found!"
    );

}