import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

import level from 'level';
import Primus from 'primus';
import { createServer } from 'vite';

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from './lib/constants.mjs';
import { MinerManager, MinerManagerEvent } from './lib/MinerManager.mjs';
import { SpiralPattern } from './lib/SpiralPattern.mjs';
import LocalStorageManager from './lib/LocalStorageManager.mjs';

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

if (process.env.PRELOAD_MAP) {
  const chunks = require(process.env.PRELOAD_MAP);

  chunks.forEach((chunk) => localStorageManager.updateChunk(chunk, false));
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
