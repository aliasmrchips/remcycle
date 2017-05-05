const shallowEquals = require('shallow-equals');

export { shallowEquals };

export const throwIfMissing = () => {
  throw new Error(`Missing parameter`);
}

// alt for ramda/src/mapObjIndexed
export const mapObj = valueKeyMapper => obj =>
  Object
    .keys(obj)
    .reduce((newObj, key) => ({
      ...newObj,
      [key]: valueKeyMapper(obj[key], key, obj),
    }), {});

export const compose = (...fns) => arg => fns.reverse().reduce((val, fn) => fn(val), arg);
export const pipe = (...fns) => arg => fns.reduce((val, fn) => fn(val), arg);

export const omit = (keys, obj) =>
  Object
    .keys(obj)
    .reduce((newObj, key) => {
      if (keys.includes(key)) {
        return newObj;
      }
      return { ...newObj, [key]: obj[key] };
    }, {});

export const path = (paths, obj) => {
  let val = obj;
  let idx = 0;
  while (idx < paths.length) {
    if (val == null) { return; }
    val = val[paths[idx]];
    idx += 1;
  }
  return val;
}

export const pick = (keys, obj) =>
  keys
    .reduce((newObj, key) => ({
      ...newObj,
      [key]: path(key.split('.'), obj),
    }), {});
