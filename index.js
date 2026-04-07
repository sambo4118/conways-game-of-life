const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");

class Cell {
    constructor(grid, x, y, value = 0) {
        this.grid = grid;
        this.x = x;
        this.y = y;
        this.value = value;
        this.grid.cells[y][x] = this; // Ensure the cell is registered in the grid
    }

    get neighbors() {
        const neighbors = [];
        // Collect values from a 5x5 area centered on this cell (includes itself).
        for (let dy = -2; dy <= 2; dy++) {
            const row = [];
            for (let dx = -2; dx <= 2; dx++) {
                const nx = this.x + dx;
                const ny = this.y + dy;
                if (nx >= 0 && nx < this.grid.cols && ny >= 0 && ny < this.grid.rows) {
                    row.push(this.grid.Cell(nx, ny).value);
                }
            }
            if (row.length > 0) neighbors.push(row);
        }
        return neighbors;
    }
}

class Grid {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.cells = Array.from({ length: rows }, (_, y) =>
            Array.from({ length: cols }, (_, x) => new Cell(this, x, y))
        );
    }

    Cell(x, y) {
        return this.cells[y][x];
    }
}

const grid = new Grid(10, 10);
grid.Cell(5, 5).value = 1;
console.log(grid.Cell(5, 5).neighbors);