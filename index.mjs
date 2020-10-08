import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

import fs from 'fs';
import http from 'http';
import level from 'level';
import Primus from 'primus';
import { createServer } from 'vite';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import updateDotenv from 'update-dotenv';

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from './lib/constants.mjs';
import { MinerManager, MinerManagerEvent } from './lib/MinerManager.mjs';
import { SpiralPattern } from './lib/SpiralPattern.mjs';
import LocalStorageManager from './lib/LocalStorageManager.mjs';
import { toBoolean, toNumber, toObject } from './lib/parse-utils.mjs';

let env = dotenv.config();

if (env && env.error) {
  if (env.error.code !== 'ENOENT') {
    console.error('Problem loading your `.env` file - please delete it and run again.');
    process.exit(1);
  }

  env = {
    parsed: {}
  };
}

const {
  SHOULD_PRELOAD,
  PRELOAD_MAP,
  SHOULD_DUMP,
  WORLD_RADIUS,
  INIT_COORDS,
  CHUNK_SIZE,
  IS_CLIENT_SERVER,
  IS_WEBSOCKET_SERVER,
  PORT,
} = env.parsed;

const answers = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'shouldPreload',
    message: 'Would you like to pre-seed Sophon with a map?',
    default: false,
    when: () => SHOULD_PRELOAD == null,
  },
  {
    type: 'input',
    name: 'preloadMap',
    message: `What's the path of your map?`,
    default: PRELOAD_MAP ? path.resolve(process.cwd(), PRELOAD_MAP) : null,
    // Blah, string compare here
    when: (answers) => answers.shouldPreload || SHOULD_PRELOAD === 'true' || PRELOAD_MAP,
    filter: (mapPath) => path.resolve(process.cwd(), mapPath),
  },
  {
    type: 'confirm',
    name: 'shouldDump',
    message: `Do you want to dump the current map?`,
    default: true,
    when: () => SHOULD_DUMP == null,
  },
  {
    type: 'number',
    name: 'worldRadius',
    message: `What's your current world radius?`,
    default: 40500,
    when: () => WORLD_RADIUS == null,
  },
  {
    type: 'input',
    name: 'initCoords',
    message: `Which x,y coords do you want to start mining at? (comma-separated)`,
    default: '0,0',
    when: () => INIT_COORDS == null,
    filter: (coords) => {
      const [x = 0, y = 0] = coords.split(',').map((i) => i.trim());
      return { x, y };
    },
    transformer: (coords) => {
      if (typeof coords === 'object') {
        return `${coords.x},${coords.y}`;
      }
      return coords;
    },
  },
  {
    type: 'list',
    name: 'chunkSize',
    message: `What size chunks do you want to explore? (bigger takes longer per chunk)`,
    default: MIN_CHUNK_SIZE,
    choices: [
      MIN_CHUNK_SIZE, // 16
      32,
      64,
      128,
      MAX_CHUNK_SIZE, // 256
    ],
    when: () => CHUNK_SIZE == null,
  },
  {
    type: 'confirm',
    name: 'isClientServer',
    message: `Do you want to serve the custom game client?`,
    default: true,
    when: () => IS_CLIENT_SERVER == null,
  },
  {
    type: 'confirm',
    name: 'isWebsocketServer',
    message: `Do you want to open a websocket channel to this explorer?`,
    default: true,
    when: () => IS_WEBSOCKET_SERVER == null,
  },
  {
    type: 'number',
    name: 'port',
    message: `What port should we start the server on?`,
    default: 8082,
    when: (answers) => PORT == null && (answers.isClientServer || answers.isWebsocketServer),
  }
]);

const {
  shouldPreload = toBoolean(SHOULD_PRELOAD),
  preloadMap,
  shouldDump = toBoolean(SHOULD_DUMP),
  worldRadius = toNumber(WORLD_RADIUS),
  initCoords = toObject(INIT_COORDS),
  chunkSize = toNumber(CHUNK_SIZE),
  isClientServer = toBoolean(IS_CLIENT_SERVER),
  isWebsocketServer = toBoolean(IS_WEBSOCKET_SERVER),
  port = toNumber(PORT),
} = answers;

await updateDotenv({
  SHOULD_PRELOAD: `${shouldPreload}`,
  SHOULD_DUMP: `${shouldDump}`,
  WORLD_RADIUS: `${worldRadius}`,
  INIT_COORDS: `${JSON.stringify(initCoords)}`,
  CHUNK_SIZE: `${chunkSize}`,
  IS_CLIENT_SERVER: `${isClientServer}`,
  IS_WEBSOCKET_SERVER: `${isWebsocketServer}`,
  PORT: `${port}`,
});
console.log('Config written to `.env` file - edit/delete this file to change settings');

const db = level(path.join(__dirname, `known_board_perlin`), { valueEncoding: 'json' });

const planetRarity = 16384;

const initPattern = new SpiralPattern(initCoords, chunkSize);

const localStorageManager = await LocalStorageManager.create(db);

if (shouldPreload && preloadMap) {
  try {
    const chunks = JSON.parse(fs.readFileSync(preloadMap, 'utf8'));

    chunks.forEach((chunk) => localStorageManager.updateChunk(chunk, false));
  } catch (err) {
    console.error(`Error importing map: ${preloadMap}`);
    process.exit(1);
  }
}

if (shouldDump) {
  const now = new Date();
  const mapPath = path.resolve(process.cwd(), `./map-export-${now.toISOString()}.json`);
  const chunks = Array.from(localStorageManager.allChunks());
  fs.writeFileSync(mapPath, JSON.stringify(chunks), 'utf8');
  console.log(`Map exported to ${mapPath}`);
}

const minerManager = MinerManager.create(
  localStorageManager,
  initPattern,
  worldRadius,
  planetRarity,
);

let server;

import VitePluginReact from 'vite-plugin-react';

if (isClientServer) {
  server = createServer({
    root: path.join(__dirname, 'client'),
    alias: {
      'react': '@pika/react',
      'react-dom': '@pika/react-dom',
      'auto-bind': 'auto-bind/index',
      'crypto': 'crypto-browserify',
      'http': 'http-browserify',
      'https': 'https-browserify',
      'stream': 'stream-browserify',
    },
    jsx: 'react',
    optimizeDeps: {
      include: ['auto-bind/index', 'stylis-rule-sheet'],
    },
    env: {
      PORT: port,
    },
    // Explictly don't add the plugin resolvers because
    // we want prod React to make warnings go away
    configureServer: [VitePluginReact.configureServer],
    transforms: [...VitePluginReact.transforms],
  });
} else if (isWebsocketServer) {
  server = http.createServer();
}

let primus;
if (isWebsocketServer) {
  primus = new Primus(server, {
    iknowhttpsisbetter: true,
    plugin: {
      emit: require('primus-emit'),
    }
  });

  primus.on('connection', (spark) => {
    spark.on('set-pattern', (worldCoords) => {
      const newPattern = new SpiralPattern(worldCoords, chunkSize);
      minerManager.setMiningPattern(newPattern);
      const coords = `${worldCoords.x},${worldCoords.y}`;
      updateDotenv({ INIT_COORDS: `${JSON.stringify(worldCoords)}` })
        .then(() => console.log(`Updated INIT_COORDS to ${coords} in .env`))
        .catch(() => console.log(`Failed to update INIT_COORDS to ${coords} in .env`));
    });

    spark.on('set-radius', (radius) => {
      minerManager.setRadius(radius);
      updateDotenv({ WORLD_RADIUS: `${radius}` })
        .then(() => console.log(`Updated WORLD_RADIUS to ${radius} in .env`))
        .catch(() => console.log(`Failed to update WORLD_RADIUS to ${radius} in .env`));
    });

    // Only send sync chunks with 200 objects in them
    let chunks = [];
    for (let chunk of localStorageManager.allChunks()) {
      if (chunks.length < 200) {
        chunks.push(chunk);
      } else {
        spark.emit('sync-chunks', chunks);
        chunks = [];
      }
    }
    chunks = null;
  });
}

if (server && port) {
  server.listen(port);
}

minerManager.on(MinerManagerEvent.DiscoveredNewChunk, (chunk, miningTimeMillis) => {
  const hashRate = chunk.chunkFootprint.sideLength ** 2 / (miningTimeMillis / 1000);
  if (isWebsocketServer) {
    primus.forEach((spark) => {
      spark.emit('new-chunk', chunk);
      spark.emit('hash-rate', hashRate);
    });
  }
  localStorageManager.updateChunk(chunk, false);
});

minerManager.startExplore();
