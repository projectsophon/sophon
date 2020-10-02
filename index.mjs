import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

import level from 'level';
import Primus from 'primus';

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from './lib/constants.mjs';
import { MinerManager, MinerManagerEvent } from './lib/MinerManager.mjs';
import { SpiralPattern } from './lib/SpiralPattern.mjs';
import LocalStorageManager from './lib/LocalStorageManager.mjs';
import perlin from './lib/perlin.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const require = createRequire(import.meta.url);

const db = level(path.join(__dirname, `known_board_perlin`), { valueEncoding: 'json' });

function updatePerlin(exploredChunk) {
  const chunkCenter = {
    x: exploredChunk.chunkFootprint.bottomLeft.x + exploredChunk.chunkFootprint.sideLength / 2,
    y: exploredChunk.chunkFootprint.bottomLeft.y + exploredChunk.chunkFootprint.sideLength / 2,
  };
  exploredChunk.perlin = perlin(chunkCenter, false);
  for (const planetLoc of exploredChunk.planetLocations) {
    planetLoc.perlin = perlin({ x: planetLoc.coords.x, y: planetLoc.coords.y });
  }
  return exploredChunk;
}

const initCoords = {
  x: 0,
  y: 0,
};

const worldRadius = 66763;
const planetRarity = 16384;

const chunkSize = MAX_CHUNK_SIZE;

const initPattern = new SpiralPattern(initCoords, chunkSize);

const localStorageManager = await LocalStorageManager.create(db);

if (process.env.PRELOAD_MAP) {
  const chunks = require(process.env.PRELOAD_MAP);

  chunks.map(updatePerlin).forEach((chunk) => localStorageManager.updateChunk(chunk, false));
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
