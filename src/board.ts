import chalk from 'chalk';
import {
  Ship,
} from './models';
import {
  BoardIcons,
} from './constants';

export class Board {
  size = 8;

  board: string[][] = [];

  constructor(size: number, board?: string[][]) {
    this.size = size;

    if (board) {
      this.board = board;
    } else {
      this.board = this.createEmptyBoard();
    }
  }

  createEmptyBoard() {
    return Array.from({
      length: +this.size,
    }, () => Array(+this.size).fill(BoardIcons.EMPTY_CELL));
  }

  printBoard() {
    const colLabels = Array.from({
      length: this.size,
    }, (_, i) => String.fromCharCode('A'.charCodeAt(0) + i));

    console.log(chalk.green.underline(` |${colLabels.join('|')}|`));
    this.board.forEach((row, i) => {
      console.log(chalk.underline(`${chalk.green(`${i}|`)}${row.join('|')}|`));
    });
  }

  placeShip(ship: Ship) {
    ship.coordinates.forEach(({ row, col }) => {
      this.board[row][col] = BoardIcons.SHIP_CELL;
    });
  }

  isValidPlacement(ship: Ship) {
    return ship.coordinates.every(({ row, col }) => this.board[row][col] === BoardIcons.EMPTY_CELL && row <= this.size && col <= this.size);
  }

  removeShip(ship: Ship) {
    ship.coordinates.forEach(({ row, col }) => {
      this.board[row][col] = BoardIcons.EMPTY_CELL;
    });
  }
}
