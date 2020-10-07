import { createRequire } from 'module';
import { locationIdFromDecStr } from './utils.mjs';
import perlin from './perlin.mjs';

const require = createRequire(import.meta.url);
const addon = require('../native');

function makeRequest(msg) {
  return new Promise((resolve, reject) => {
    addon.explore_async(msg, (err, chunk) => {
      if (err) {
        return reject(err);
      }

      resolve(chunk);
    });
  });
}

export class AlexMiner {
  async postMessage({ chunkFootprint, planetRarity, jobId }) {
    const exploredChunk = await makeRequest({ chunkFootprint, planetRarity });

    const chunkCenter = {
      x: chunkFootprint.bottomLeft.x + chunkFootprint.sideLength / 2,
      y: chunkFootprint.bottomLeft.y + chunkFootprint.sideLength / 2,
    };
    //todo remove
    exploredChunk.perlin = perlin(chunkCenter, false);
    for (const planetLoc of exploredChunk.planetLocations) {
      planetLoc.hash = locationIdFromDecStr(planetLoc.hash);
      planetLoc.perlin = perlin({ x: planetLoc.coords.x, y: planetLoc.coords.y });
    }
    this.onmessage({ data: [exploredChunk, jobId] });
  }

  onmessage = () => { };

  terminate = () => { };
}
