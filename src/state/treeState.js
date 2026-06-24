const isPlainObject = (value) => {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
};

export const getIn = (tree, path) => {
  return path.reduce((current, key) => {
    if (current == null) {
      return undefined;
    }

    return current[key];
  }, tree);
};

export const setIn = (tree, path, nextValue) => {
  if (!path.length) {
    return nextValue;
  }

  const [key, ...rest] = path;
  const currentBranch = isPlainObject(tree) || Array.isArray(tree) ? tree : {};
  const currentValue = currentBranch[key];

  return {
    ...currentBranch,
    [key]: rest.length ? setIn(currentValue, rest, nextValue) : nextValue,
  };
};

export const updateIn = (tree, path, updater) => {
  const currentValue = getIn(tree, path);
  return setIn(tree, path, updater(currentValue));
};
