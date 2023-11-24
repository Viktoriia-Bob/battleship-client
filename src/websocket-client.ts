import {
  io,
  Socket,
} from 'socket.io-client';
import chalk from 'chalk';
import inquirer from 'inquirer';
import {
  BoardSizeInput,
  CoordinatesInput,
  ListInput,
  MainMenuInput,
  NameInput,
  Player,
} from './models';
import {
  BoardIcons,
  BoardSize,
  ConfirmPositionEnum,
  MainMenuEnum,
  MessagesEnum,
  MessageSocketEnum,
  OrientationEnum,
  PlayerActions,
} from './constants';
import {
  Board,
} from './board';

type BoardSizeType = typeof BoardSize;

export class WebsocketClient {
  private socket: Socket;

  private player: Player;

  private currentGameTitle = '';

  private currentBoardSize = 2;

  shipSizes = [1];

  constructor() {
    this.socket = io((process.env.WEBSOCKET_ADDRESS || '').toString());
    this.setupSocketEvents();
  }

  private setupSocketEvents(): void {
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on(MessageSocketEnum.ALL_ACTIVE_GAMES, async (games: string[]) => {
      const response = await inquirer.prompt<ListInput>([{
        type: 'list',
        name: 'select',
        choices: games,
      }]);

      this.socket.emit(MessageSocketEnum.CONNECT_TO_GAME, response.select);
    });

    this.socket.on(MessageSocketEnum.START_GAME, async ({ boardSize }: { boardSize: number }) => {
      await this.createPlayer(boardSize);
    });

    this.socket.on(MessageSocketEnum.STEP, async () => {
      await this.playGame();
    });

    this.socket.on(MessageSocketEnum.MY_SHOT, ({ row, col, result }: { col: number, result: string, row: number}) => {
      this.player.opponentBoard.board[row][col] = result;

      console.clear();
      if (result === BoardIcons.HIT_CELL) {
        console.log('Hit!');
        this.player.opponentBoard.printBoard();
      } else {
        console.log('Miss');
        this.player.opponentBoard.printBoard();
      }
    });

    this.socket.on(MessageSocketEnum.OPPONENT_SHOT, ({ row, col, result }: { col: number, result: string, row: number}) => {
      this.player.board.board[row][col] = result;

      console.clear();
      if (result === BoardIcons.MISS_CELL) {
        console.log('Your opponent misses');
        this.player.opponentBoard.printBoard();
      } else {
        console.log('Your opponent hits');
        this.player.opponentBoard.printBoard();
      }
    });

    this.socket.on(MessageSocketEnum.GAME_OVER, (isWin: boolean) => {
      if (isWin) {
        console.clear();
        this.player.opponentBoard.printBoard();
        console.log(chalk.green.bold('You won!'));
      } else {
        console.clear();
        this.player.board.printBoard();
        console.log(chalk.red.bold('You lose'));
      }

      console.log('Game Over');
    });
  }

  async connectToGame() {
    console.clear();
    console.log(chalk.blue.bold(MessagesEnum.GAME_NAME));

    const response = await inquirer.prompt<MainMenuInput>([{
      type: 'list',
      name: 'mainMenu',
      message: 'Main Menu',
      choices: [MainMenuEnum.NEW_GAME, chalk.strikethrough.dim(`${MainMenuEnum.CONTINUE_GAME} (in development)`), MainMenuEnum.CONNECT_TO_GAME, MainMenuEnum.EXIT],
    }]);

    if (response.mainMenu === MainMenuEnum.NEW_GAME) {
      const name = await inquirer.prompt<NameInput>([{
        type: 'input',
        name: 'name',
        message: MessagesEnum.ENTER_GAME_TITLE,
        validate: (value) => value.length >= 2,
      }]);

      this.currentGameTitle = name.name;

      const size = await inquirer.prompt<BoardSizeInput>([{
        type: 'input',
        name: 'size',
        message: MessagesEnum.ENTER_BOARD_SIZE,
        validate: (value) => (!Number.isNaN(value) ? value >= 2 || value <= 10 : false),
      }]);

      this.currentBoardSize = size.size;

      this.socket.emit(MessageSocketEnum.CREATE_GAME, {
        name: this.currentGameTitle,
        size: this.currentBoardSize,
      });
      console.clear();
      console.log('Wait for your opponent...');
    } else if (response.mainMenu === MainMenuEnum.CONNECT_TO_GAME) {
      this.socket.emit(MessageSocketEnum.ALL_ACTIVE_GAMES);
    } else {
      process.exit();
    }
  }

  async createPlayer(boardSize: number) {
    this.currentBoardSize = boardSize;
    const key = boardSize as keyof BoardSizeType;
    if (key in BoardSize) {
      this.shipSizes = BoardSize[key].ships;
    }

    const player = await inquirer.prompt<NameInput>([{
      type: 'input',
      name: 'name',
      message: MessagesEnum.ENTER_PLAYER_NAME,
    }]);

    this.player = {
      name: player.name,
      board: new Board(this.currentBoardSize),
      opponentBoard: new Board(this.currentBoardSize),
      ships: this.shipSizes.map((size) => ({
        size,
        coordinates: [],
      })),
    };

    await this.placeShips();

    this.socket.emit(MessageSocketEnum.CREATE_PLAYER, this.player);

    console.clear();
    console.log('Wait your opponent...');
  }

  async placeShips() {
    console.log(`${this.player.name}, place your ships on the board:`);

    // eslint-disable-next-line no-restricted-syntax,no-unreachable-loop
    for (const ship of this.player.ships) {
      while (true) {
        this.player.board.printBoard();
        const start = await this.getPlayerFirstInput(ship.size);

        const coordinates = Array.from({
          length: ship.size,
        }, (_, index) => (start.orientation === OrientationEnum.HORIZONTAL ? {
          row: start.row,
          col: start.col + index,
        } : {
          row: start.row + index,
          col: start.col,
        }));

        if (this.player.board.isValidPlacement({
          size: ship.size,
          coordinates,
        })) {
          ship.coordinates = coordinates;
          this.player.board.placeShip(ship);

          console.clear();
          console.log(MessagesEnum.QUESTION_AFTER_PLACE_SHIP);
          this.player.board.printBoard();
          const response = await inquirer.prompt<ListInput>({
            type: 'list',
            name: 'select',
            choices: [ConfirmPositionEnum.CONFIRM_POSITION, ConfirmPositionEnum.CANCEL_POSITION],
          });

          if (response.select === ConfirmPositionEnum.CANCEL_POSITION) {
            this.player.board.removeShip(ship);
            continue;
          }

          break;
        } else {
          console.log(MessagesEnum.INVALID_PLACEMENT);
        }
      }
    }
  }

  async getPlayerFirstInput(size: number) {
    const response = await inquirer.prompt<CoordinatesInput>([
      {
        type: 'input',
        name: 'coordinates',
        message: `${this.player.name}, enter the coordinates for ship with size ${size} (e.g., A:1 or B:2):`,
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : MessagesEnum.ERROR_VALID_COORDINATES),
      },
    ]);

    const [col, row] = response.coordinates.toUpperCase().split(':');
    let orientation = '';
    if (size > 1) orientation = await this.askForShipOrientation();

    return {
      row: parseInt(row, 10),
      col: col.charCodeAt(0) - 'A'.charCodeAt(0),
      orientation,
    };
  }

  async askForShipOrientation() {
    const response = await inquirer.prompt<ListInput>([
      {
        type: 'list',
        name: 'select',
        message: 'Select orientation:',
        choices: [OrientationEnum.HORIZONTAL, OrientationEnum.VERTICAL],
      },
    ]);

    return response.select;
  }

  async playGame() {
    console.log(`${this.player.name}, what do you want to do?`);
    const response1 = await inquirer.prompt<ListInput>([{
      type: 'list',
      name: 'select',
      choices: [PlayerActions.SHOW_BOARD, chalk.red(PlayerActions.DESTROY_ENEMY)],
    }]);

    if (response1.select === PlayerActions.SHOW_BOARD) {
      console.clear();
      console.log(MessagesEnum.SHOW_YOUR_BOARD);
      this.player.board.printBoard();

      await inquirer.prompt({
        type: 'input',
        name: 'enter',
        message: MessagesEnum.PRESS_ENTER,
      });
    }

    await this.gameStep();
  }

  async gameStep() {
    console.clear();
    console.log(`${this.player.name}'s turn:`);
    this.player.opponentBoard.printBoard();

    const shot = await this.getPlayerInput();

    this.socket.emit(MessageSocketEnum.PUNCH, shot);
    console.clear();
  }

  async getPlayerInput() {
    const response = await inquirer.prompt<CoordinatesInput>([
      {
        type: 'input',
        name: 'coordinates',
        message: `${this.player.name}, enter the coordinates for your hit (e.g., A:1 or B:2):`,
        validate: (value) => (/^[A-Ja-j]:[0-9]$/.test(value) ? true : MessagesEnum.ERROR_VALID_COORDINATES),
      },
    ]);

    const [col, row] = response.coordinates.toUpperCase().split(':');

    return {
      row: parseInt(row, 10),
      col: col.charCodeAt(0) - 'A'.charCodeAt(0),
    };
  }
}
