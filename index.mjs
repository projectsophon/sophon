import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

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
    name: 'preload',
    message: 'Would you like to pre-seed Sophon with a map?',
    default: false,
  },
  {
    type: 'input',
    name: 'preloadMap',
    message: `What's the path of your map?`,
    default: PRELOAD_MAP ? path.resolve(process.cwd(), PRELOAD_MAP) : null,
    when: (answers) => answers.preload || PRELOAD_MAP,
    filter: (mapPath) => path.resolve(process.cwd(), mapPath),
  }
]);

const {
  preloadMap,
} = answers;

const db = level(path.join(__dirname, `known_board_perlin`), { valueEncoding: 'json' });

const initCoords = {
  x: 0,
  y: 0,
};

const worldRadius = 10613;
const planetRarity = 16384;

const chunkSize = MAX_CHUNK_SIZE;

const initPattern = new SpiralPattern(initCoords, chunkSize);

const localStorageManager = await LocalStorageManager.create(db);

if (preloadMap) {
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


const primus = Primus.createServer({
  port: 9000,
  iknowhttpsisbetter: true,
  plugin: {
    emit: require('primus-emit'),
  }
});

const server = createServer({
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
  plugins: [
    require('vite-plugin-react')
  ],
  optimizeDeps: {
    include: ['auto-bind/index'],
  },
}).listen(8082);

primus.on('connection', (spark) => {
  spark.emit('sync-map', Array.from(localStorageManager.allChunks()));

  spark.on('set-pattern', (worldCoords) => {
    const newPattern = new SpiralPattern(worldCoords, chunkSize);
    minerManager.setMiningPattern(newPattern);
  });

  spark.on('set-radius', (radius) => {
    minerManager.setRadius(radius);
  });
});

minerManager.on(MinerManagerEvent.DiscoveredNewChunk, (chunk, miningTimeMillis) => {
  const hashRate = chunk.chunkFootprint.sideLength ** 2 / (miningTimeMillis / 1000);
  primus.forEach((spark) => {
    spark.emit('new-chunk', chunk);
    spark.emit('hash-rate', hashRate);
  });
  localStorageManager.updateChunk(chunk, false);
});

minerManager.startExplore();
