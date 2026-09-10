(function () {
  "use strict";

  const WORD_LENGTH = 5;
  const MAX_GUESSES = 6;

  const KEYBOARD_ROWS = [
    ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
    ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
    ["enter", "z", "x", "c", "v", "b", "n", "m", "backspace"],
  ];

  const boardEl = document.getElementById("board");
  const keyboardEl = document.getElementById("keyboard");
  const toastContainer = document.getElementById("toast-container");
  const statusBanner = document.getElementById("status-banner");
  const newGameBtn = document.getElementById("new-game-btn");

  /** @type {{secret: string, board: string[][], row: number, col: number, over: boolean, keyStatus: Record<string,string>}} */
  let state;

  function pickSecret() {
    return SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  }

  function newGame() {
    state = {
      secret: pickSecret(),
      board: Array.from({ length: MAX_GUESSES }, () => Array(WORD_LENGTH).fill("")),
      row: 0,
      col: 0,
      over: false,
      keyStatus: {},
    };
    statusBanner.textContent = "";
    statusBanner.classList.add("hidden");
    renderBoard();
    renderKeyboard();
  }

  function renderBoard() {
    boardEl.innerHTML = "";
    for (let r = 0; r < MAX_GUESSES; r++) {
      const rowEl = document.createElement("div");
      rowEl.className = "row";
      rowEl.dataset.row = String(r);
      for (let c = 0; c < WORD_LENGTH; c++) {
        const tileEl = document.createElement("div");
        tileEl.className = "tile";
        tileEl.dataset.row = String(r);
        tileEl.dataset.col = String(c);
        tileEl.textContent = state.board[r][c];
        if (state.board[r][c]) tileEl.classList.add("filled");
        rowEl.appendChild(tileEl);
      }
      boardEl.appendChild(rowEl);
    }
  }

  function renderKeyboard() {
    keyboardEl.innerHTML = "";
    for (const rowKeys of KEYBOARD_ROWS) {
      const rowEl = document.createElement("div");
      rowEl.className = "kb-row";
      for (const key of rowKeys) {
        const keyEl = document.createElement("button");
        keyEl.type = "button";
        keyEl.dataset.key = key;
        keyEl.className = "key";
        if (key === "enter" || key === "backspace") keyEl.classList.add("wide");
        keyEl.textContent = key === "backspace" ? "⌫" : key === "enter" ? "Enter" : key;
        const status = state.keyStatus[key];
        if (status) keyEl.classList.add(status);
        keyEl.addEventListener("click", () => handleKey(key));
        rowEl.appendChild(keyEl);
      }
      keyboardEl.appendChild(rowEl);
    }
  }

  function updateKeyboardStatuses() {
    for (const keyEl of keyboardEl.querySelectorAll(".key")) {
      const key = keyEl.dataset.key;
      keyEl.classList.remove("absent", "present", "correct");
      const status = state.keyStatus[key];
      if (status) keyEl.classList.add(status);
    }
  }

  function showToast(message) {
    const toastEl = document.createElement("div");
    toastEl.className = "toast";
    toastEl.textContent = message;
    toastContainer.appendChild(toastEl);
    setTimeout(() => toastEl.remove(), 1600);
  }

  function shakeRow(rowIndex) {
    const rowEl = boardEl.querySelector(`.row[data-row="${rowIndex}"]`);
    if (!rowEl) return;
    rowEl.classList.add("shake");
    setTimeout(() => rowEl.classList.remove("shake"), 400);
  }

  // Standard two-pass Wordle scoring: greens first, then yellows/greys
  // using remaining-letter counts so duplicate letters score correctly.
  function scoreGuess(guess, secret) {
    const result = Array(WORD_LENGTH).fill("absent");
    const secretLetters = secret.split("");
    const remaining = {};

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guess[i] === secretLetters[i]) {
        result[i] = "correct";
      } else {
        remaining[secretLetters[i]] = (remaining[secretLetters[i]] || 0) + 1;
      }
    }

    for (let i = 0; i < WORD_LENGTH; i++) {
      if (result[i] === "correct") continue;
      const letter = guess[i];
      if (remaining[letter] > 0) {
        result[i] = "present";
        remaining[letter] -= 1;
      }
    }

    return result;
  }

  function applyKeyStatus(letter, status) {
    const rank = { absent: 0, present: 1, correct: 2 };
    const current = state.keyStatus[letter];
    if (!current || rank[status] > rank[current]) {
      state.keyStatus[letter] = status;
    }
  }

  function revealRow(rowIndex, statuses) {
    const rowEl = boardEl.querySelector(`.row[data-row="${rowIndex}"]`);
    const tiles = rowEl.querySelectorAll(".tile");
    tiles.forEach((tileEl, i) => {
      setTimeout(() => {
        tileEl.classList.add(statuses[i]);
      }, i * 220);
    });
  }

  function endGame(won) {
    state.over = true;
    const finishUp = () => {
      let message;
      if (won) {
        const rowEl = boardEl.querySelector(`.row[data-row="${state.row}"]`);
        if (rowEl) rowEl.classList.add("win");
        const praise = ["Genius!", "Magnificent!", "Impressive!", "Splendid!", "Great!", "Phew!"][state.row] || "You win!";
        message = `${praise} The word was ${state.secret.toUpperCase()}.`;
      } else {
        message = `Out of guesses! The word was ${state.secret.toUpperCase()}.`;
      }
      statusBanner.textContent = message;
      statusBanner.classList.remove("hidden");
    };
    setTimeout(finishUp, WORD_LENGTH * 220 + 100);
  }

  function submitGuess() {
    const guess = state.board[state.row].join("");

    if (guess.length < WORD_LENGTH) {
      showToast("Not enough letters");
      shakeRow(state.row);
      return;
    }

    if (!VALID_GUESSES.has(guess)) {
      showToast("Not in word list");
      shakeRow(state.row);
      return;
    }

    const statuses = scoreGuess(guess, state.secret);
    for (let i = 0; i < WORD_LENGTH; i++) {
      applyKeyStatus(guess[i], statuses[i]);
    }
    revealRow(state.row, statuses);
    setTimeout(updateKeyboardStatuses, WORD_LENGTH * 220);

    const won = statuses.every((s) => s === "correct");

    if (won) {
      endGame(true);
      return;
    }

    if (state.row === MAX_GUESSES - 1) {
      endGame(false);
      return;
    }

    state.row += 1;
    state.col = 0;
  }

  function typeLetter(letter) {
    if (state.col >= WORD_LENGTH) return;
    state.board[state.row][state.col] = letter;
    state.col += 1;
    const tileEl = boardEl.querySelector(`.tile[data-row="${state.row}"][data-col="${state.col - 1}"]`);
    if (tileEl) {
      tileEl.textContent = letter;
      tileEl.classList.add("filled");
    }
  }

  function deleteLetter() {
    if (state.col <= 0) return;
    state.col -= 1;
    state.board[state.row][state.col] = "";
    const tileEl = boardEl.querySelector(`.tile[data-row="${state.row}"][data-col="${state.col}"]`);
    if (tileEl) {
      tileEl.textContent = "";
      tileEl.classList.remove("filled");
    }
  }

  function handleKey(key) {
    if (state.over) return;
    if (key === "enter") {
      submitGuess();
    } else if (key === "backspace") {
      deleteLetter();
    } else if (/^[a-z]$/.test(key)) {
      typeLetter(key);
    }
  }

  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "enter") {
      handleKey("enter");
    } else if (key === "backspace") {
      handleKey("backspace");
    } else if (/^[a-z]$/.test(key)) {
      handleKey(key);
    }
  });

  newGameBtn.addEventListener("click", newGame);

  newGame();
})();
