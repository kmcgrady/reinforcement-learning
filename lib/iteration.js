const _ = require('lodash');
const { argmax, getRandomItem } = require('./utils');

/**
 * Calculates the Expected Utility of a state, action pair using a table
 * of the U values for every state that is previously defined
 * @param s - state of an mdp
 * @param a - action of an mdp
 * @param U - dictionary of corresponding utility for each action
 * @param mdp - a Markov Decision Process with a transition model T defined
 */
const expectedUtility = (s, a, U, mdp) => {
  // console.log(a);
  // console.log(mdp.T(s, a));
  
  return mdp.T(s, a)
    .map(obj => obj.p * U[String(obj.state)])
    .reduce((x, y) => x + y, 0);
};

/**
 * Calculates the best policy of an MDP with its associated actions
 * and given a table of its expected utility values for its states
 * @param mdp - a Markov Decision Process with a transition model T defined
 * @param U - dictionary of corresponding utility for each action
 */
const bestPolicy = (mdp, U) => {
  var pi = {};
  mdp.states.forEach(s => {
    pi[String(s)] = argmax(mdp.actions(s), a => expectedUtility(s, a, U, mdp));
  });
  return pi;
};

const policyEvaluation = (pi, U, mdp) => {
  const U2 = _.clone(U);

  mdp.states.forEach(s => {
    if (pi[String(s)] === null) {
      U2[String(s)] = mdp.R(s);
      return;
    }

    U2[String(s)] = mdp.T(s, pi[String(s)])
      .map(obj => obj.p * (mdp.R(s) + mdp.gamma * U[String(obj.state)]))
      .reduce((x, y) => x + y, 0);
  });

  return U2;
};

const policyIteration = mdp => {
  let U = {};
  let pi = {};

  mdp.states.map(s => {
    U[String(s)] = 0;
    pi[String(s)] = _.sample(mdp.actions(s)) || null;
  });

  let numTimes = 0;
  while (true) {
    let unchanged = true;

    U = policyEvaluation(pi, U, mdp);
    numTimes++;

    mdp.states.map(s => {
      const action = argmax(mdp.actions(s), a => expectedUtility(s, a, U, mdp));

      if (action !== pi[String(s)]) {
        pi[String(s)] = action;
        unchanged = false;
      }
    });

    if (unchanged) {
      console.log(`Policy Iteration converged in ${numTimes} times.`);
      return pi;
    }
  }
};

const valueIteration = (mdp, epsilon = 0.0001) => {
  var U = {};

  mdp.states.forEach(s => {
    U[String(s)] = 0;
  });

  let numTimes = 0;
  while (true) {
    const U1 = _.clone(U);
    let delta = 0;
    numTimes += 1;

    mdp.states.forEach(s => {
      const expectedUtilitiesArray = mdp.actions(s).map(a => {
        return mdp.T(s, a)
          .map(obj => {
            if (U[String(obj.state)] === undefined) {
              return 0;
            }

            return obj.p * U[String(obj.state)];
          })
          .reduce((x, y) => x + y, 0);
      });

      let maxValue = 0;
      if (expectedUtilitiesArray.length > 0) {
        maxValue = Math.max(...expectedUtilitiesArray);
      }
      U1[String(s)] = mdp.R(s) + mdp.gamma * maxValue;
      delta += Math.abs(U1[String(s)] - U[String(s)]);
    });

    if (delta < epsilon) {
      console.log(`Value Iteration converged in ${numTimes} times.`);
      return U1;
    }

    U = U1;
  }
};

const qLearn = (mdp, learningRate = 0.9, maxIterations = 100000, onEvent) => {
  let Q = {};

  mdp.states.forEach(s => {
    Q[String(s)] = {};
    const actions = mdp.actions(s);
    if (actions.length > 0) {
      actions.forEach((a) => {
        Q[String(s)][a] = 0;
      });
    } else {
      Q[String(s)] = 0;
    }
  });

  let numTimes = 0;
  let changed = true;
  while (changed || numTimes < maxIterations) {
    changed = false;
    let state = _.sample(mdp.states);
    numTimes++;
    
    while (mdp.actions(state).length > 0) {
      const action = _.sample(mdp.actions(state));
      const transitions = mdp.T(state, action);
      const nextState = getRandomItem(_.map(transitions, 'state'), _.map(transitions, 'p'));
      const next = mdp.actions(nextState);
      let maxVal = 0;

      if (next.length > 0) {
        maxVal = Math.max(...next.map((a) => Q[String(nextState)][a]));
      }

      const newVal = (1 - learningRate) *  Q[String(state)][action] + 
        learningRate * (mdp.R(nextState) + mdp.gamma * maxVal);

      if (Math.abs(Q[String(state)][action] - newVal) > 0.01) {
        changed = true;
      }

      Q[String(state)][action] = newVal;
      state = nextState;
    }

    if (typeof onEvent === 'function') {
      const optimalPolicy = {};
      mdp.states.forEach((s) => {
        if (mdp.actions(s).length > 0) {
          optimalPolicy[String(s)] = argmax(mdp.actions(s), (a) => Q[String(s)][a]);
        } else {
          optimalPolicy[String(s)] = null;
        }
      });

      onEvent(numTimes, optimalPolicy);
    }
  }
  
  console.log(`Q Learning converged in ${numTimes} times.`);
  const optimalPolicy = {};
  mdp.states.forEach((s) => {
    if (mdp.actions(s).length > 0) {
      optimalPolicy[String(s)] = argmax(mdp.actions(s), (a) => Q[String(s)][a]);
    } else {
      optimalPolicy[String(s)] = null;
    }
  });

  return optimalPolicy;
};

module.exports = {
  bestPolicy,
  policyEvaluation,
  policyIteration,
  valueIteration,
  expectedUtility,
  qLearn
};
