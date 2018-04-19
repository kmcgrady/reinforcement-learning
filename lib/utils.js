const _ = require('underscore');

const contains = (xs, item) => {
  return _.contains(xs, item);
};

const argmax = (items, lambda) => {
  var best = items[0];
  var bestScore = lambda(best);
  items.map(item => {
    var itemScore = lambda(item);
    if (itemScore > bestScore) {
      [best, bestScore] = [item, itemScore];
    }
  });
  return best;
};

const argmin = (items, lambda) => {
  return argmax(items, item => -1 * lambda(item));
};

const vectorAdd = (x, y) => {

  if (!_.isEmpty(y)) {
    x.map((element, i) => {
      y[i] = y[i] + x[i];
    });
    return y;
  }
  else {
    return x;
  }
};

const arraysEqual = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;

  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

module.exports = {
  contains,
  argmax,
  argmin,
  vectorAdd,
  arraysEqual  
};