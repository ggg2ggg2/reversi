var matrix_dim = 8;
let player = true; // true = White, false = Black
var gameEndMessage = null;
var depth = 3;
const BOT_COLOR = false;

class Cell {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        this.color = null;
    }
}

class Matrix {
    constructor(matrix_dim) {
        this.matrix_dim = matrix_dim;
        this.matrix = [];
        this.white_count = 0;
        this.black_count = 0;

        for (let i = 0; i < this.matrix_dim; i++) {
            this.matrix[i] = [];
            for (let j = 0; j < this.matrix_dim; j++) {
                this.matrix[i][j] = new Cell(i, j);
            }
        }
    }

    put_circle(row, col, player) {
        let cell = this.matrix[row][col];

        if (cell.color === true) this.white_count--;
        else if (cell.color === false) this.black_count--;

        cell.color = player;

        if (player === true) this.white_count++;
        else this.black_count++;

        document.getElementById('white_count').textContent = this.white_count;
        document.getElementById('black_count').textContent = this.black_count;

        place_img(cell);
    }

    create_bord() {
        let s = "";
        for (let i = 0; i < this.matrix_dim; i++) {
            s += "<div style='display:flex'>";
            for (let j = 0; j < this.matrix_dim; j++) {
                s += `<button id="${i * this.matrix_dim + j}" 
                        style="width:60px;height:60px;background:green"
                        onclick="tochange(this)"></button>`;
            }
            s += "</div>";
        }
        return s;
    }
}

function check_next_move_possible(player, change_color) {
    let possible_moves = [];

    for (let i = 0; i < matrix_dim; i++) {
        for (let j = 0; j < matrix_dim; j++) {
            let cells = check_move(the_matrix.matrix[i][j], player, false);
            if (cells.length !== 0) {
                possible_moves.push(the_matrix.matrix[i][j]);
                if (change_color) {
                    document.getElementById(i * matrix_dim + j).style.backgroundColor = "brown";
                }
            }
        }
    }
    return possible_moves;
}

function check_move(cell, player, alertUser) {
    if (cell.color != null) {
        if (alertUser) alert("Taken");
        return [];
    }

    let result = [];
    result.push(...cell_color(player, cell, -1, 0));
    result.push(...cell_color(player, cell, 1, 0));
    result.push(...cell_color(player, cell, 0, 1));
    result.push(...cell_color(player, cell, 0, -1));
    result.push(...cell_color(player, cell, -1, 1));
    result.push(...cell_color(player, cell, -1, -1));
    result.push(...cell_color(player, cell, 1, 1));
    result.push(...cell_color(player, cell, 1, -1));

    return result;
}

function cell_color(player, cell, dr, dc) {
    let res = [];
    let r = cell.row;
    let c = cell.col;
    let seenOpponent = false;

    while (true) {
        r += dr;
        c += dc;

        if (r < 0 || c < 0 || r >= matrix_dim || c >= matrix_dim) return [];

        let next = the_matrix.matrix[r][c];

        if (next.color == null) return [];

        if (next.color === player) {
            return seenOpponent ? res : [];
        }

        res.push(next);
        seenOpponent = true;
    }
}

function tochange(button) {
    let cell = the_matrix.matrix[Math.floor(button.id / matrix_dim)][button.id % matrix_dim];
    let flips = check_move(cell, player, true);

    if (flips.length === 0) return;

    // reset colors
    for (let i = 0; i < matrix_dim; i++) {
        for (let j = 0; j < matrix_dim; j++) {
            document.getElementById(i * matrix_dim + j).style.backgroundColor = "green";
        }
    }

    the_matrix.put_circle(cell.row, cell.col, player);

    for (let f of flips) {
        the_matrix.put_circle(f.row, f.col, player);
    }

    handleTurnAfterMove();
}

function handleTurnAfterMove() {
    player = !player;
    document.getElementById('turn').textContent = player ? "White" : "Black";

    if (!player) {
        setTimeout(() => playbot(depth), 500);
    }

    let moves = check_next_move_possible(player, true);

    if (moves.length > 0) return;

    player = !player;

    if (!player) {
        setTimeout(() => playbot(depth), 500);
    }

    let myMoves = check_next_move_possible(player, true);

    if (myMoves.length === 0) {
        end_game();
    } else {
        alert("No moves for opponent");
    }
}

function end_game() {
    let msg = `White: ${the_matrix.white_count}\nBlack: ${the_matrix.black_count}\n`;
    msg += the_matrix.white_count > the_matrix.black_count ? "White wins!" :
        the_matrix.black_count > the_matrix.white_count ? "Black wins!" : "Tie";

    gameEndMessage.textContent = msg;
    gameEndMessage.style.display = "block";
}

function create_circle(color) {
    let d = document.createElement("div");
    d.className = "disc " + (color ? "white" : "black");
    return d;
}

function place_img(cell) {
    let el = document.getElementById(cell.row * matrix_dim + cell.col);

    if (el.firstChild) {
        el.firstChild.className = "disc " + (cell.color ? "white" : "black");
    } else {
        el.appendChild(create_circle(cell.color));
    }
}

/* ===== BOT ===== */

var WEIGHTS = [
    [120, -20, 20, 5, 5, 20, -20, 120],
    [-20, -40, -10, -5, -5, -10, -40, -20],
    [20, -10, 15, 3, 3, 15, -10, 20],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [5, -5, 3, 3, 3, 3, -5, 5],
    [20, -10, 15, 3, 3, 15, -10, 20],
    [-20, -40, -10, -5, -5, -10, -40, -20],
    [120, -20, 20, 5, 5, 20, -20, 120]
];
function evaluateBoard() {
    let score = 0;
    let player = BOT_COLOR;       // הבוט (שחור)
    let opponent = !BOT_COLOR;    // השחקן (לבן)

    let myMoves = check_next_move_possible(player, false).length;
    let oppMoves = check_next_move_possible(opponent, false).length;

    for (let r = 0; r < matrix_dim; r++) {
        for (let c = 0; c < matrix_dim; c++) {
            let cell = the_matrix.matrix[r][c];

            if (cell.color === player) score += WEIGHTS[r][c];
            if (cell.color === opponent) score -= WEIGHTS[r][c];
        }
    }

    // מוביליות
    score += (myMoves - oppMoves) * 10;

    // פינות
    const corners = [
        [0, 0], [0, 7], [7, 0], [7, 7]
    ];

    for (let [r, c] of corners) {
        let cell = the_matrix.matrix[r][c];

        if (cell.color === player) score += 300;
        if (cell.color === opponent) score -= 300;
    }

    // X-squares (מסוכן ליד פינות)
    const dangerSquares = [
        { x: 1, y: 1, cx: 0, cy: 0 },
        { x: 1, y: 6, cx: 0, cy: 7 },
        { x: 6, y: 1, cx: 7, cy: 0 },
        { x: 6, y: 6, cx: 7, cy: 7 }
    ];

    for (let d of dangerSquares) {
        let corner = the_matrix.matrix[d.cx][d.cy];
        let cell = the_matrix.matrix[d.x][d.y];

        if (corner.color === null) {
            if (cell.color === player) score -= 150;
            if (cell.color === opponent) score += 150;
        }
    }

    // סוף משחק – משקל לספירה
    let total = the_matrix.white_count + the_matrix.black_count;

    if (total > 50) {
        score += (the_matrix.black_count - the_matrix.white_count) * 20;
    }

    return score;
}

function playbot(depth) {
    let result = minimax(BOT_COLOR, depth, -Infinity, Infinity, true);

    if (result.move) {
        let btn = document.getElementById(result.move.row * matrix_dim + result.move.col);
        tochange(btn);
    }
}

function minimax(player, depth, alpha, beta, maximizing) {
    let moves = check_next_move_possible(player, false);

    if (depth === 0 || moves.length === 0) {
        return { score: evaluateBoard(), move: null };
    }

    let bestMove = null;

    if (maximizing) {
        let maxEval = -Infinity;

        for (let m of moves) {
            let changes = tempplay(m, player);
            let eval = minimax(!player, depth - 1, alpha, beta, false).score;
            undoplay(changes);

            if (eval > maxEval) {
                maxEval = eval;
                bestMove = m;
            }

            alpha = Math.max(alpha, eval);
            if (beta <= alpha) break;
        }

        return { score: maxEval, move: bestMove };

    } else {
        let minEval = Infinity;

        for (let m of moves) {
            let changes = tempplay(m, player);
            let eval = minimax(!player, depth - 1, alpha, beta, true).score;
            undoplay(changes);

            if (eval < minEval) {
                minEval = eval;
                bestMove = m;
            }

            beta = Math.min(beta, eval);
            if (beta <= alpha) break;
        }

        return { score: minEval, move: bestMove };
    }
}

function tempplay(cell, player) {
    let changes = [];
    let flips = check_move(cell, player, false);

    changes.push({ cell: cell, prev: cell.color });
    cell.color = player;

    for (let f of flips) {
        changes.push({ cell: f, prev: f.color });
        f.color = player;
    }

    return changes;
}

function undoplay(changes) {
    for (let c of changes) {
        c.cell.color = c.prev;
    }
}

/* ===== INIT ===== */

window.onload = function () {
    gameEndMessage = document.getElementById("game-end-message");

    the_matrix = new Matrix(matrix_dim);
    document.getElementById("bord").innerHTML = the_matrix.create_bord();

    let c = matrix_dim / 2;

    the_matrix.put_circle(c, c, false);
    the_matrix.put_circle(c - 1, c, true);
    the_matrix.put_circle(c, c - 1, true);
    the_matrix.put_circle(c - 1, c - 1, false);

    player = true;
    document.getElementById('turn').textContent = "White";

    check_next_move_possible(player, true);
};