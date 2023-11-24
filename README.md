# Battleship-client

## Description

The battleship-client project is a client-side application for the Battleship game. It is designed to 
connect to the [server](https://github.com/Viktoriia-Bob/battleship-server) and facilitate multiplayer
gameplay. Players can create a game or join an existing one, place their ships, and take turns making 
moves using a console interface.

## Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Gameplay](#gameplay)
- [Dependencies](#dependencies)
- [Collaboration](#collaboration)


## Installation

1. **Install Dependencies:**

```bash
npm install
```

2. **Environment variables**

Add the address for the websocket server:

```dotenv
WEBSOCKET_ADDRESS=your_websocket_address
```

2. **Start the Client:**

```bash
npm start
```

## Usage

When prompted, enter the server's address and port to establish a WebSocket connection. Choose to 
create a new game or join an existing one. Follow the instructions to input your name, place ships, 
and make moves.

## Gameplay

1. **Game Initialization:**

- When the user starts the project, he is prompted to enter the project name and the size of the game board or connect to existed game.
- User inputs this information in the console using the Inquirer library.

2. **Player Setup:**

- In the console, player takes turns entering his name and providing data for placing his ships.
- For each board size, there is a specific number and size of ships that need to be placed.
- Player inputs ship placement data in the format A:0, where 'A' is the column and '0' is the row where the ship should start.
- If the ship size is greater than 1, player is prompted to specify the orientation: vertical or horizontal.
- The console is used to read and display these inputs.

3. **Game Start:**

- After ship placement, the game begins. Players take turns making moves.
- Each player inputs their move in the format A:0, indicating the column and row to attack.

4**Winning the Game:**

- The game continues until all the opponent's ships are sunk.
- Once all the opponent's ships are destroyed, the game declares the current player as the winner.
- The game concludes with a result message for both players.

## Dependencies

- [Node.js](https://nodejs.org/en)
- [Socket.io](https://socket.io/)

## Collaboration

Feel free to contribute to the development of this Battleship client. Fork the repository, make your 
changes, and submit a pull request.
