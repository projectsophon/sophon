import path from 'path';

export function toFullPath(val) {
  if (val && typeof val === 'string') {
    return path.resolve(process.cwd(), val);
  }
}

export function toBoolean(val) {
  if (typeof val === 'string') {
    return val.toLowerCase() === 'true';
  }
}

export function toNumber(val) {
  if (typeof val === 'string') {
    const i = parseInt(val, 10);
    return Number.isNaN(i) ? null : i;
  }

  if (typeof val === 'number') {
    return val;
  }
}

export function toObject(val) {
  if (typeof val === 'string') {
    return JSON.parse(val);
  }
}

export function isUnset(val) {
  return val == null || val === '';
}

export function toEnv(val) {
  if (val == null) {
    return '';
  }

  if (typeof val === 'object') {
    return JSON.stringify(val);
  }

  return `${val}`;
}
