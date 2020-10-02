import _ from 'lodash';
import {
  getChunkKey,
  toExploredChunk,
  toLSMChunk,
  addToChunkMap,
  getChunkOfSideLength,
} from './chunk-utils.mjs';
import { MAX_CHUNK_SIZE } from './constants.mjs';
import levelConcat from 'level-concat-iterator';

const DBActionType = {
  UPDATE: 'put',
  DELETE: 'del',
};

class LocalStorageManager {
  db = null;
  cached = [];
  throttledSaveChunkCacheToDisk = null;
  nUpdatesLastTwoMins = 0; // we save every 5s, unless this goes above 50
  chunkMap = null;

  constructor(db) {
    this.db = db;
    this.cached = [];
    this.throttledSaveChunkCacheToDisk = _.throttle(
      this.saveChunkCacheToDisk,
      2000 // TODO
    );
    this.chunkMap = new Map();
  }

  destroy() {
    // no-op; we don't actually destroy the instance, we leave the db connection open in case we need it in the future
  }

  static async create(db) {
    const localStorageManager = new LocalStorageManager(db);

    await localStorageManager.loadIntoMemory();

    return localStorageManager;
  }

  async bulkSetKeyInCollection(updateChunkTxs) {
    const chunks = updateChunkTxs.map((chunk) => {
      if (chunk.value) {
        return { ...chunk, value: toLSMChunk(chunk.value) }
      } else {
        return chunk;
      }
    });
    await new Promise((resolve, reject) => {
      this.db.batch(chunks, (err) => {
        if (err) {
          return reject(err);
        }

        resolve()
      });
    });
  }

  async loadIntoMemory() {
    (
      await new Promise((resolve, reject) => {
        levelConcat(this.db.iterator(), (err, data) => {
          if (err) {
            return reject(err);
          }

          resolve(data.map(({ value }) => value));
        })
      })
    ).forEach((chunk) => {
      this.updateChunk(toExploredChunk(chunk), true);
    });
  }

  async saveChunkCacheToDisk() {
    const toSave = [...this.cached]; // make a copy
    this.cached = [];
    await this.bulkSetKeyInCollection(toSave);
  }

  hasMinedChunk(chunkLoc) {
    let sideLength = chunkLoc.sideLength;
    while (sideLength <= MAX_CHUNK_SIZE) {
      const testChunkLoc = getChunkOfSideLength(
        chunkLoc.bottomLeft,
        sideLength
      );
      if (this.getChunkById(getChunkKey(testChunkLoc))) {
        return true;
      }
      sideLength *= 2;
    }
    return !!this.chunkMap.get(getChunkKey(chunkLoc));
  }

  getChunkById(chunkId) {
    return this.chunkMap.get(chunkId) || null;
  }

  // if the chunk was loaded from storage, then we don't need to recommit it
  // unless it can be promoted (which shouldn't ever happen, but we handle
  // just in case)
  updateChunk(e, loadedFromStorage = false) {
    if (this.hasMinedChunk(e.chunkFootprint)) {
      return;
    }
    const tx = [];

    // if this is a mega-chunk, delete all smaller chunks inside of it
    const minedSubChunks = this.getMinedSubChunks(e);
    for (const subChunk of minedSubChunks) {
      tx.push({
        type: DBActionType.DELETE,
        key: getChunkKey(subChunk.chunkFootprint),
      });
    }

    addToChunkMap(
      this.chunkMap,
      e,
      true,
      (chunk) => {
        tx.push({
          type: DBActionType.UPDATE,
          key: getChunkKey(chunk.chunkFootprint),
          value: chunk,
        });
      },
      (chunk) => {
        tx.push({
          type: DBActionType.DELETE,
          key: getChunkKey(chunk.chunkFootprint),
        });
      },
      MAX_CHUNK_SIZE
    );

    // modify in-memory store
    for (const action of tx) {
      if (action.type === DBActionType.UPDATE && action.value) {
        this.chunkMap.set(action.key, action.value);
      } else if (action.type === DBActionType.DELETE) {
        this.chunkMap.delete(action.key);
      }
    }

    // can stop here, if we're just loading into in-memory store from storage
    if (loadedFromStorage) {
      return;
    }

    this.cached = [...this.cached, ...tx];

    // save chunks every 5s if we're just starting up, or 30s once we're moving
    this.recomputeSaveThrottleAfterUpdate();

    this.throttledSaveChunkCacheToDisk();
  }

  getMinedSubChunks(e) {
    // returns all the mined chunks with smaller sidelength strictly contained in e
    const ret = [];
    for (
      let clearingSideLen = 16;
      clearingSideLen < e.chunkFootprint.sideLength;
      clearingSideLen *= 2
    ) {
      for (let x = 0; x < e.chunkFootprint.sideLength; x += clearingSideLen) {
        for (let y = 0; y < e.chunkFootprint.sideLength; y += clearingSideLen) {
          const queryChunk = {
            bottomLeft: {
              x: e.chunkFootprint.bottomLeft.x + x,
              y: e.chunkFootprint.bottomLeft.y + y,
            },
            sideLength: clearingSideLen,
          };
          const queryChunkKey = getChunkKey(queryChunk);
          const exploredChunk = this.getChunkById(queryChunkKey);
          if (exploredChunk) {
            ret.push(exploredChunk);
          }
        }
      }
    }
    return ret;
  }

  recomputeSaveThrottleAfterUpdate() {
    this.nUpdatesLastTwoMins += 1;
    if (this.nUpdatesLastTwoMins === 50) {
      this.throttledSaveChunkCacheToDisk.cancel();
      this.throttledSaveChunkCacheToDisk = _.throttle(
        this.saveChunkCacheToDisk,
        30000
      );
    }
    setTimeout(() => {
      this.nUpdatesLastTwoMins -= 1;
      if (this.nUpdatesLastTwoMins === 49) {
        this.throttledSaveChunkCacheToDisk.cancel();
        this.throttledSaveChunkCacheToDisk = _.throttle(
          this.saveChunkCacheToDisk,
          5000
        );
      }
    }, 120000);
  }

  allChunks() {
    return this.chunkMap.values();
  }
}

export default LocalStorageManager;
