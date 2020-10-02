import bigInt from 'big-integer';
import { LOCATION_ID_UB } from './constants.mjs';

export const locationIdFromBigInt = (location) => {
  const locationBI = bigInt(location);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret;
};

export const locationIdFromDecStr = (location) => {
  const locationBI = bigInt(location);
  if (locationBI.geq(LOCATION_ID_UB)) throw new Error('not a valid location');
  let ret = locationBI.toString(16);
  while (ret.length < 64) ret = '0' + ret;
  return ret;
};
