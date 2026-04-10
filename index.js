const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

// Set canvas size to match viewport, accounting for device pixel ratio
function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

function key(x, y) {
    return `${x},${y}`;
}

class Cell {
    constructor(map, x, y, state, board) {
        this.x = x;
        this.y = y;
        this.state = state;
        this.board = board;
        map.set(key(this.x, this.y), this);
    }

}

class Board {
    constructor(map, scale, drawWidth, drawHeight) {
        this.map = map;
        this.scale = scale; // pixels per cell
        this.drawWidth = drawWidth;
        this.drawHeight = drawHeight;
    }

    drawBoard() {
        
        context.clearRect(0, 0, this.drawWidth, this.drawHeight);
        for (let cell of this.map.values()) {
            
            context.fillStyle = "black";

            if (cell.state === 1) {
                context.fillStyle = "white";
                context.fillRect(cell.x * this.scale, cell.y * this.scale, this.scale, this.scale);
            }

        }

    }
}

class Controls {
    constructor(board) {
        this.board = board;
    }
}

const Cells = new Map();

const board = new Board(Cells, 10, canvas.width, canvas.height);
const testCell = new Cell(Cells, 1, 1, 1, board);
board.drawBoard();