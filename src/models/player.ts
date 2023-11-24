import {
  Ship,
} from './ship';
import {
  Board,
} from '../board';

export interface Player {
  board: Board;
  name: string;
  opponentBoard: Board;
  ships: Ship[];
}
