import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

import http from 'http';
import level from 'level';
import Primus from 'primus';
import { createServer } from 'vite';
import inquirer from 'inquirer';

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from './lib/constants.mjs';
import { MinerManager, MinerManagerEvent } from './lib/MinerManager.mjs';
import { SpiralPattern } from './lib/SpiralPattern.mjs';
import LocalStorageManager from './lib/LocalStorageManager.mjs';

const { PRELOAD_MAP } = process.env;

const answers = await inquirer.prompt([
  {
    type: 'confirm',
    name: 'shouldPreload',
    message: 'Would you like to pre-seed Sophon with a map?',
    default: false,
  },
  {
    type: 'input',
    name: 'preloadMap',
    message: `What's the path of your map?`,
    default: PRELOAD_MAP ? path.resolve(process.cwd(), PRELOAD_MAP) : null,
    when: (answers) => answers.shouldPreload || PRELOAD_MAP,
    filter: (mapPath) => path.resolve(process.cwd(), mapPath),
  },
  {
    type: 'number',
    name: 'worldRadius',
    message: `What's your current world radius?`,
    default: 40500,
  },
  {
    type: 'input',
    name: 'initCoords',
    message: `Which x,y coords do you want to start mining at? (comma-separated)`,
    default: '0,0',
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
  },
  {
    type: 'confirm',
    name: 'isClientServer',
    message: `Do you want to serve the custom game client?`,
    default: true,
  },
  {
    type: 'confirm',
    name: 'isWebsocketServer',
    message: `Do you want to open a websocket channel to this explorer?`,
    default: true,
  },
  {
    type: 'number',
    name: 'port',
    message: `What port should we start the server on?`,
    default: 8082,
    when: (answers) => answers.isClientServer || answers.isWebsocketServer,
  }
]);

const {
  shouldPreload,
  preloadMap,
  worldRadius,
  initCoords,
  chunkSize,
  isClientServer,
  isWebsocketServer,
  port,
} = answers;

const db = level(path.join(__dirname, `known_board_perlin`), { valueEncoding: 'json' });

const planetRarity = 16384;

const initPattern = new SpiralPattern(initCoords, chunkSize);

const localStorageManager = await LocalStorageManager.create(db);

if (shouldPreload && preloadMap) {
  try {
    const chunks = require(preloadMap);

    chunks.forEach((chunk) => localStorageManager.updateChunk(chunk, false));
  } catch (err) {
    console.error(`Error importing map: ${preloadMap}`);
    process.exit(1);
  }
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
    });

    spark.on('set-radius', (radius) => {
      minerManager.setRadius(radius);
    });
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
