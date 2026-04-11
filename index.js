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

    getCell(cellKey) {
        if (!this.map.has(cellKey)) this.map.set(cellKey, new Cell(this.map, ...cellKey.split(",").map(Number), 0, this));
        return this.map.get(cellKey);
    }

    drawSelection(startCell, endCell) {
        const x1 = Math.min(startCell.x, endCell.x);
        const y1 = Math.min(startCell.y, endCell.y);
        const x2 = Math.max(startCell.x, endCell.x);
        const y2 = Math.max(startCell.y, endCell.y);
        
        context.strokeStyle = "lightblue";
        context.lineWidth = 2;
        context.strokeRect(x1 * this.scale, y1 * this.scale, (x2 - x1 + 1) * this.scale, (y2 - y1 + 1) * this.scale);
    }


}

class Controls {
    constructor(board) {
        this.board = board;
        this.startDragCell = null;
        this.dragMode = null;
        this.historyDepth = -1;
        this.history = {};
        this.previousKey = null;

        canvas.addEventListener("pointerdown", (event) => {
            
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.board.scale);
            const y = Math.floor((event.clientY - rect.top) / this.board.scale);
            const startKey = key(x, y);
            this.startDragCell = this.board.getCell(startKey);
            this.previousKey = startKey;
            this.dragMode = this.interactionMode(event);
            
            if (this.dragMode === "draw" || this.dragMode === "erase") {
                this.history[++this.historyDepth] = []
            }
            
            this.clickHandler(startKey, this.dragMode);
        });

        canvas.addEventListener("pointermove", (event) => {
            
            if (event.buttons === 0) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left) / this.board.scale);
            const y = Math.floor((event.clientY - rect.top) / this.board.scale);
            const currentKey = key(x, y);
            if (currentKey === key(this.startDragCell.x, this.startDragCell.y)) return;
            
            this.dragLine(this.previousKey || key(this.startDragCell.x, this.startDragCell.y), currentKey, this.dragMode);
        });

        canvas.addEventListener("pointerup", (event) => {
            this.startDragCell = null;
            this.board.drawBoard();
        });

        window.addEventListener("keydown", (event) => {
            if (event.ctrlKey && event.key === "z") {
                event.metaKey && event.preventDefault();
                if (this.historyDepth < 0) return;
                
                const lastActions = this.history[this.historyDepth--];
                for (let action of lastActions) {
                    action.Cell.state = action.PreviousState;
                }
                
                this.board.drawBoard();
            }
        });
    }

    dragLine(startKey, endKey, mode) {
        const [x1, y1] = startKey.split(",").map(Number);
        const [x2, y2] = endKey.split(",").map(Number);

        const xDifference = Math.abs(x2 - x1);
        const yDifference = Math.abs(y2 - y1);

        if (xDifference + yDifference <= 1) {
            this.previousKey = endKey;
            return this.clickHandler(endKey, mode);
        }
        
        const distance = Math.max(xDifference, yDifference);

        for (let step = 0; step <= distance; step++) {
            const x = Math.round(x1 + (x2 - x1) * step / distance);
            const y = Math.round(y1 + (y2 - y1) * step / distance);
            this.clickHandler(key(x, y), mode);
        }

        this.previousKey = endKey;
    }


    clickHandler(cellKey, mode) {
        let cell = this.board.getCell(cellKey);
        
        if (mode === "select") {
            this.board.drawBoard();
            this.board.drawSelection(this.startDragCell, cell);
            return;
        }
        
        if (mode === "draw") {
            if (cell.state === 0) {
                this.history[this.historyDepth].push({
                    CellKey: cellKey,
                    PreviousState: cell.state,
                    newState: 1,
                    Cell: cell
                });
                cell.state = 1;
            }

        }

        if (mode === "erase") {
            if (cell.state === 1) {
                this.history[this.historyDepth].push({
                    CellKey: cellKey,
                    PreviousState: cell.state,
                    newState: 0,
                    Cell: cell
                });
                cell.state = 0;
            }
        }

        this.board.drawBoard();
    }

    interactionMode(Event) {
        if (Event.shiftKey) return "select";
        if (this.startDragCell.state === 1) return "erase"
        if (this.startDragCell.state === 0) return "draw";
        return null;
    }

}

const Cells = new Map();

const board = new Board(Cells, 10, canvas.width, canvas.height);
const testCell = new Cell(Cells, 1, 1, 1, board);
const controls = new Controls(board);

board.drawBoard();