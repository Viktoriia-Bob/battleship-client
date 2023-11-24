import {
  WebsocketClient,
} from './websocket-client';

(async () => {
  const client = new WebsocketClient();
  await client.connectToGame();
})();
