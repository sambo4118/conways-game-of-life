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

    neighbors() {
        const contextSize = 1;
        const neighbors = [];
        for (let dx = -1; dx <= contextSize; dx++) {
            for (let dy = -1; dy <= contextSize; dy++) {
                if (dx === 0 && dy === 0) continue;
                neighbors.push(this.board.getCell(key(this.x + dx, this.y + dy)));
            }
        }
        return neighbors;
    }

    step() {
        const aliveNeighbors = this.neighbors().filter(neighbor => neighbor.state === 1).length;

        // Conway's Game of Life rules:
        // 1. Any live cell with 2-3 neighbors survives
        // 2. Any dead cell with exactly 3 neighbors becomes alive
        // 3. All other cells die or stay dead
        
        if (this.state === 1) {

            if (aliveNeighbors === 2 || aliveNeighbors === 3) {
                return 1;
            }
            return 0;
        } else {

            if (aliveNeighbors === 3) {
                return 1;
            }
            return 0;
        }
    }

}

class Board {
    constructor(origin, map, scale, drawWidth, drawHeight) {
        this.map = map;
        this.scale = scale; // pixels per cell
        this.drawWidth = drawWidth;
        this.drawHeight = drawHeight;
        this.origin = origin;
        this.selectedCells = new Set();
        this.selectionCorners = null;
    }

    drawBoard() {
        
        context.clearRect(0, 0, this.drawWidth, this.drawHeight);
        
        // Calculate visible cell bounds for viewport culling
        const minX = Math.floor(this.origin.x / this.scale) - 1;
        const minY = Math.floor(this.origin.y / this.scale) - 1;
        const maxX = Math.ceil((this.origin.x + this.drawWidth) / this.scale) + 1;
        const maxY = Math.ceil((this.origin.y + this.drawHeight) / this.scale) + 1;
        
        // Draw all alive cells in one batch
        context.fillStyle = "white";
        for (let cell of this.map.values()) {
            if (cell.state === 1) {
                // Viewport culling - skip cells outside visible area
                if (cell.x < minX || cell.x > maxX || cell.y < minY || cell.y > maxY) continue;
                
                const screenX = (cell.x * this.scale) - this.origin.x;
                const screenY = (cell.y * this.scale) - this.origin.y;
                context.fillRect(screenX, screenY, this.scale, this.scale);
            }
        }

        // Draw persistent selection if it exists
        if (this.selectionCorners) {
            this.drawSelection(this.selectionCorners.start, this.selectionCorners.end);
        }

    }

    drawPastePreview(pasteData, offsetX, offsetY) {
        context.fillStyle = "rgba(100, 200, 255, 0.5)"; // Semi-transparent blue
        for (let cellData of pasteData) {
            const x = cellData.x + offsetX;
            const y = cellData.y + offsetY;
            if (cellData.state === 1) {
                const screenX = (x * this.scale) - this.origin.x;
                const screenY = (y * this.scale) - this.origin.y;
                context.fillRect(screenX, screenY, this.scale, this.scale);
            }
        }
    }

    step() {
        // Use a Map to store cells to check (avoids repeated getCell lookups)
        const cellsToCheck = new Map();
        
        // First pass: collect all cells that need checking
        for (let cell of this.map.values()) {
            const cellKey = key(cell.x, cell.y);
            cellsToCheck.set(cellKey, cell);
            
            if (cell.state === 1) {
                // Add all neighbors of alive cells
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        const neighborKey = key(cell.x + dx, cell.y + dy);
                        if (!cellsToCheck.has(neighborKey)) {
                            cellsToCheck.set(neighborKey, this.getCell(neighborKey));
                        }
                    }
                }
            }
        }
        
        // Calculate next states in one pass
        const nextStates = new Map();
        for (let [cellKey, cell] of cellsToCheck) {
            nextStates.set(cellKey, cell.step());
        }
        
        // Apply all state changes
        for (let [cellKey, newState] of nextStates) {
            cellsToCheck.get(cellKey).state = newState;
        }
        
        this.drawBoard();
    }

    getCell(cellKey) {
        let cell = this.map.get(cellKey);
        if (!cell) {
            const [x, y] = cellKey.split(",").map(Number);
            cell = new Cell(this.map, x, y, 0, this);
        }
        return cell;
    }

    drawSelection(startCell, endCell) {
        const x1 = Math.min(startCell.x, endCell.x);
        const y1 = Math.min(startCell.y, endCell.y);
        const x2 = Math.max(startCell.x, endCell.x);
        const y2 = Math.max(startCell.y, endCell.y);

        this.selectionCorners = { start: startCell, end: endCell };

        context.strokeStyle = "lightblue";
        context.lineWidth = 2;
        const screenX = (x1 * this.scale) - this.origin.x;
        const screenY = (y1 * this.scale) - this.origin.y;
        context.strokeRect(screenX, screenY, (x2 - x1 + 1) * this.scale, (y2 - y1 + 1) * this.scale);
    }

    saveSelection(startCell, endCell) {
        this.selectedCells.clear();
        const x1 = Math.min(startCell.x, endCell.x);
        const y1 = Math.min(startCell.y, endCell.y);
        const x2 = Math.max(startCell.x, endCell.x);
        const y2 = Math.max(startCell.y, endCell.y);

        for (let x = x1; x <= x2; x++) {
            for (let y = y1; y <= y2; y++) {
                this.selectedCells.add(key(x, y));
            }
        }
        
        // Save the corners for persistent drawing
        this.selectionCorners = { start: startCell, end: endCell };
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
        this.pasteMode = false;
        this.pasteData = null;
        this.pasteOffset = { x: 0, y: 0 };
        this.currentMouseCell = { x: 0, y: 0 };
        this.pasteAnimationFrame = null;
        this.drawPending = false;

        canvas.addEventListener("pointerdown", (event) => {
            
            // cell interaction start handling
            if (event.button === 0) {
                const rect = canvas.getBoundingClientRect();
                const x = Math.floor((event.clientX - rect.left + this.board.origin.x) / this.board.scale);
                const y = Math.floor((event.clientY - rect.top + this.board.origin.y) / this.board.scale);
                const startKey = key(x, y);
                this.startDragCell = this.board.getCell(startKey);
                this.previousKey = startKey;
                this.dragMode = this.interactionMode(event);
            
                if (this.dragMode === "draw" || this.dragMode === "erase") {
                    this.history[++this.historyDepth] = [];
                    // Clear selection when drawing or erasing
                    this.board.selectionCorners = null;
                }
            
                return this.clickHandler(startKey, this.dragMode);

            }
            
            // viewport drag start handling
            if (event.button === 1) {
                const rect = canvas.getBoundingClientRect();
                const x = (event.clientX - rect.left);
                const y = (event.clientY - rect.top);
                this.startViewportDrag = { x, y };
                this.startOrigin = { ...this.board.origin };
                canvas.style.cursor = "grabbing";
                event.preventDefault();
            }

        });

        canvas.addEventListener("pointermove", (event) => {
            // Update current mouse cell position
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - rect.left + this.board.origin.x) / this.board.scale);
            const y = Math.floor((event.clientY - rect.top + this.board.origin.y) / this.board.scale);
            this.currentMouseCell = { x, y };

            // Handle paste preview with throttling via requestAnimationFrame
            if (this.pasteMode && this.pasteData) {
                if (!this.pasteAnimationFrame) {
                    this.pasteAnimationFrame = requestAnimationFrame(() => {
                        this.board.drawBoard();
                        this.board.drawPastePreview(this.pasteData, this.currentMouseCell.x, this.currentMouseCell.y);
                        this.pasteAnimationFrame = null;
                    });
                }
                return;
            }

            // Middle mouse button (buttons & 4)
            if (event.buttons & 4) return this.viewportDrag(event);
            if (event.buttons === 0) return;
            if (!this.startDragCell) return; // No drag in progress
            
            const currentKey = key(x, y);
            if (currentKey === key(this.startDragCell.x, this.startDragCell.y)) return;
            
            return this.dragLine(this.previousKey || key(this.startDragCell.x, this.startDragCell.y), currentKey, this.dragMode);
        });

        canvas.addEventListener("pointerup", (event) => {

            if (event.button === 1) {
                canvas.style.cursor = "default";
                return;
            }
            
            if (this.dragMode === "select") {
                this.board.saveSelection(this.startDragCell, this.board.getCell(this.previousKey));
            }

            this.startDragCell = null;
            return this.board.drawBoard();
        });

        window.addEventListener("keydown", (event) => {
            if (event.ctrlKey && event.key === "z") {
                event.metaKey && event.preventDefault();
                if (this.historyDepth < 0) return;
                
                const lastActions = this.history[this.historyDepth--];
                for (let action of lastActions) {
                    action.Cell.state = action.PreviousState;
                }
                
                return this.board.drawBoard();
            }
            if (event.ctrlKey && event.key === "y") {
                event.metaKey && event.preventDefault();
                if (this.historyDepth >= Object.keys(this.history).length - 1) return;
                const nextActions = this.history[++this.historyDepth];
                for (let action of nextActions) {
                    action.Cell.state = action.newState;
                }
                return this.board.drawBoard();
            }
            if (event.ctrlKey && event.key === "c") {
                event.metaKey && event.preventDefault();

                if (!this.board.selectionCorners) return;

                const { start, end } = this.board.selectionCorners;
                const copiedCells = [];
                for (let x = Math.min(start.x, end.x); x <= Math.max(start.x, end.x); x++) {
                    for (let y = Math.min(start.y, end.y); y <= Math.max(start.y, end.y); y++) {
                        const cell = this.board.getCell(key(x, y));
                        copiedCells.push({ x: cell.x - start.x, y: cell.y - start.y, state: cell.state });
                    }
                }
                navigator.clipboard.writeText(JSON.stringify(copiedCells));
            }
            if (event.ctrlKey && event.key === "v") {
                event.preventDefault();

                navigator.clipboard.readText().then(text => {
                    try {
                        const copiedCells = JSON.parse(text);
                        this.pasteData = copiedCells;
                        this.pasteMode = true;
                        // Clear selection when starting paste
                        this.board.selectionCorners = null;
                        // Draw initial preview at current mouse position
                        this.board.drawBoard();
                        this.board.drawPastePreview(this.pasteData, this.currentMouseCell.x, this.currentMouseCell.y);
                    } catch (e) {
                        console.error("Invalid paste data");
                    }
                });
            }
        });

        window.addEventListener("keyup", (event) => {
            if (event.key === "v" && this.pasteMode) {
                // Finalize paste - actually place the cells
                if (this.pasteData) {
                    this.history[++this.historyDepth] = [];
                    for (let cellData of this.pasteData) {
                        const x = cellData.x + this.currentMouseCell.x;
                        const y = cellData.y + this.currentMouseCell.y;
                        const cellKey = key(x, y);
                        const cell = this.board.getCell(cellKey);
                        
                        this.history[this.historyDepth].push({
                            CellKey: cellKey,
                            PreviousState: cell.state,
                            newState: cellData.state,
                            Cell: cell
                        });
                        
                        cell.state = cellData.state;
                    }
                }
                this.pasteMode = false;
                this.pasteData = null;
                this.board.drawBoard();
            }
        });
    }

    viewportDrag(event) {
        if (!this.startViewportDrag) return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left);
        const y = (event.clientY - rect.top);

        const dx = x - this.startViewportDrag.x;
        const dy = y - this.startViewportDrag.y;

        this.board.origin.x = this.startOrigin.x - dx;
        this.board.origin.y = this.startOrigin.y - dy;

        this.board.drawBoard();
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

        // Process all cells without drawing each one
        for (let step = 0; step <= distance; step++) {
            const x = Math.round(x1 + (x2 - x1) * step / distance);
            const y = Math.round(y1 + (y2 - y1) * step / distance);
            this.clickHandler(key(x, y), mode, step < distance); // Skip draw except on last
        }

        this.previousKey = endKey;
    }


    clickHandler(cellKey, mode, skipDraw = false) {
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

        // Throttle drawing with requestAnimationFrame
        if (!skipDraw && !this.drawPending) {
            this.drawPending = true;
            requestAnimationFrame(() => {
                this.board.drawBoard();
                this.drawPending = false;
            });
        }
    }

    interactionMode(Event) {
        if (Event.shiftKey) return "select";
        if (this.startDragCell.state === 1) return "erase"
        if (this.startDragCell.state === 0) return "draw";
        return null;
    }

}

const Cells = new Map();

const board = new Board({ x: 0, y: 0 }, Cells, 10, canvas.width, canvas.height);
const controls = new Controls(board);

const stepButton = document.getElementById("stepButton");
const playButton = document.getElementById("playButton");
const stopButton = document.getElementById("stopButton");
const saveButton = document.getElementById("saveButton");
const loadButton = document.getElementById("loadButton");
const quicksaveButton = document.getElementById("quicksaveButton");
const quickloadButton = document.getElementById("quickloadButton");

quicksaveButton.addEventListener("click", () => {
    localStorage.setItem("quicksave", JSON.stringify(Array.from(Cells.entries())));
});

quickloadButton.addEventListener("click", () => {
    const savedData = localStorage.getItem("quicksave");
    if (savedData) {
        const entries = JSON.parse(savedData);
        Cells.clear();
        for (let [key, cellData] of entries) {
            new Cell(Cells, cellData.x, cellData.y, cellData.state, board);
        }
        board.drawBoard();
    }
});


stepButton.addEventListener("click", () => {
    board.step();
});


board.drawBoard();