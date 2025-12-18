// VARIABLES GLOBALES
let board = [];
let rows, cols, minesCount;
let gameOver = false;

// Variables para el cronómetro
let timerInterval;
let seconds = 0;
let timerStarted = false;

// REFERENCIAS AL DOM
const boardElement = document.getElementById("board");
const resetBtn = document.getElementById("reset-btn");
const difficultySelect = document.getElementById("difficulty");
const timerDisplay = document.getElementById("timer");
const mineCountDisplay = document.getElementById("mine-count");

// 1. INICIALIZACIÓN
resetBtn.addEventListener("click", initGame);
difficultySelect.addEventListener("change", initGame);

function initGame() {
  const config = difficultySelect.value.split("-");
  rows = parseInt(config[0]);
  cols = rows;
  minesCount = parseInt(config[1]);

  // Reset de estado
  gameOver = false;
  stopTimer();
  seconds = 0;
  timerStarted = false;
  timerDisplay.innerText = "0";
  mineCountDisplay.innerText = minesCount;

  // Mostrar el récord de esta dificultad
  updateBestTimeDisplay();

  createBoard();
}

// 2. MOSTRAR RÉCORD (LocalStorage)
function updateBestTimeDisplay() {
  const difficulty = difficultySelect.value;
  const bestTime = localStorage.getItem(`bestTime-${difficulty}`);

  // Si no existe el elemento en el HTML, lo creamos debajo del tiempo
  let recordElement = document.getElementById("best-record");
  if (!recordElement) {
    recordElement = document.createElement("div");
    recordElement.id = "best-record";
    recordElement.style.fontSize = "0.8rem";
    recordElement.style.marginTop = "5px";
    document.querySelector(".stats").appendChild(recordElement);
  }

  recordElement.innerText = bestTime ? `Récord: ${bestTime}s` : "Récord: --";
}

// 3. CRONÓMETRO
function startTimer() {
  if (!timerStarted) {
    timerStarted = true;
    timerInterval = setInterval(() => {
      seconds++;
      timerDisplay.innerText = seconds;
    }, 1000);
  }
}

function stopTimer() {
  clearInterval(timerInterval);
}

// 4. CREAR TABLERO
function createBoard() {
  board = [];
  boardElement.innerHTML = "";
  boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

  for (let r = 0; r < rows; r++) {
    board[r] = [];
    for (let c = 0; c < cols; c++) {
      const cellData = {
        r,
        c,
        mine: false,
        revealed: false,
        flagged: false,
        neighborCount: 0,
      };

      const cellDiv = document.createElement("div");
      cellDiv.classList.add("cell");
      cellDiv.id = `cell-${r}-${c}`;

      cellDiv.addEventListener("click", () => clickCell(r, c));
      cellDiv.oncontextmenu = (e) => {
        e.preventDefault();
        toggleFlag(r, c);
      };

      boardElement.appendChild(cellDiv);
      board[r][c] = cellData;
    }
  }
  plantMines();
  calculateNumbers();
}

function plantMines() {
  let planted = 0;
  while (planted < minesCount) {
    let r = Math.floor(Math.random() * rows);
    let c = Math.floor(Math.random() * cols);
    if (!board[r][c].mine) {
      board[r][c].mine = true;
      planted++;
    }
  }
}

function calculateNumbers() {
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (
            board[r + dr] &&
            board[r + dr][c + dc] &&
            board[r + dr][c + dc].mine
          ) {
            count++;
          }
        }
      }
      board[r][c].neighborCount = count;
    }
  }
}

// 5. LÓGICA DE JUEGO
function clickCell(r, c) {
  if (gameOver || board[r][c].revealed || board[r][c].flagged) return;

  startTimer(); // Iniciar tiempo en el primer clic

  const cell = board[r][c];
  const el = document.getElementById(`cell-${r}-${c}`);
  cell.revealed = true;
  el.classList.add("revealed");

  if (cell.mine) {
    endGame(false);
    return;
  }

  if (cell.neighborCount > 0) {
    el.innerText = cell.neighborCount;
    el.classList.add(`n-${cell.neighborCount}`);
  } else {
    // Algoritmo de inundación (Flood Fill) recursivo
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (board[r + dr] && board[r + dr][c + dc]) {
          clickCell(r + dr, c + dc);
        }
      }
    }
  }
  checkWin();
}

function toggleFlag(r, c) {
  if (gameOver || board[r][c].revealed) return;
  const el = document.getElementById(`cell-${r}-${c}`);
  board[r][c].flagged = !board[r][c].flagged;
  el.classList.toggle("flag");
  el.innerText = board[r][c].flagged ? "🚩" : "";
}

function endGame(win) {
  gameOver = true;
  stopTimer();
  if (!win) {
    alert("¡BOOM! Has pisado una mina.");
    revealAllMines();
  }
}

function revealAllMines() {
  board.flat().forEach((cell) => {
    if (cell.mine) {
      const el = document.getElementById(`cell-${cell.r}-${cell.c}`);
      el.classList.add("mine");
      el.innerText = "💣";
    }
  });
}

function checkWin() {
  const totalCells = rows * cols;
  const revealedCount = board.flat().filter((c) => c.revealed).length;

  if (revealedCount === totalCells - minesCount) {
    gameOver = true;
    stopTimer();

    const difficulty = difficultySelect.value;
    const bestTime = localStorage.getItem(`bestTime-${difficulty}`);

    if (!bestTime || seconds < parseInt(bestTime)) {
      localStorage.setItem(`bestTime-${difficulty}`, seconds);
      alert(`¡NUEVO RÉCORD! Ganaste en ${seconds} segundos.`);
    } else {
      alert(`¡Ganaste! Tiempo final: ${seconds}s`);
    }
    updateBestTimeDisplay();
  }
}

// Iniciar al cargar la ventana
window.onload = initGame;
