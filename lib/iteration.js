const _ = require('lodash');
const { argmax } = require('./utils');

/**
 * Calculates the Expected Utility of a state, action pair using a table
 * of the U values for every state that is previously defined
 * @param s - state of an mdp
 * @param a - action of an mdp
 * @param U - dictionary of corresponding utility for each action
 * @param mdp - a Markov Decision Process with a transition model T defined
 */
const expectedUtility = (s, a, U, mdp) => {
  return mdp.T(s, a).map(obj => obj.p * U[String(obj.state)]).reduce((x, y) => x + y, 0);
};

/**
 * Calculates the best policy of an MDP with its associated actions
 * and given a table of its expected utility values for its states
 * @param mdp - a Markov Decision Process with a transition model T defined
 * @param U - dictionary of corresponding utility for each action
 */
const bestPolicy = (mdp, U) => {
  var pi = {};
  mdp.states.map(s => {
    pi[String(s)] = argmax(mdp.actions(s), a => expectedUtility(s, a, U, mdp));
  });
  return pi;
};

const policyEvaluation = (pi, U, mdp, iterations = 20) => {
  for (var i = 0; i < iterations; i++) {
    mdp.states.map(s => {
      var expectedU = mdp.T(s, pi[String(s)])
                        .map(obj => obj.p * U[String(obj.state)])
                        .reduce((x, y) => x + y);
      U[s] = mdp.R(s) + mdp.gamma * expectedU;
    });
  }
  return U;
};

const policyIteration = mdp => {
  var U = {};
  var pi = {};

  mdp.states.map(s => {
    U[String(s)] = 0;
    pi[String(s)] = _.sample(mdp.actions(s));
  });
  let numTimes = 0;
  while (true) {
    U = policyEvaluation(pi, U, mdp);
    var unchanged = true;
    numTimes++;
    mdp.states.map(s => {
      var action = argmax(mdp.actions(s), a => expectedUtility(s, a, U, mdp));
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

const valueIteration = (mdp, epsilon = 0.1) => {
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
      // console.log(expectedUtilitiesArray);
      
      // console.log(`Reward: ${mdp.R(s)}`);
      // console.log(`Gamma: ${mdp.gamma}`);
      // console.log(`maxUtility: ${Math.max(...expectedUtilitiesArray)}`);
      let maxValue = 0;
      if (expectedUtilitiesArray.length > 0) {
        maxValue = Math.max(...expectedUtilitiesArray);
      }
      U1[String(s)] = mdp.R(s) + mdp.gamma * maxValue;
      delta += Math.abs(U1[s] - U[s]);
    });

    if (delta < epsilon) {
      console.log(`Value Iteration converged in ${numTimes} times.`);
      return U;
    }
    
    console.log('No convergence');
    console.log(delta);
    U = U1;
  }
};

module.exports = {
  bestPolicy,
  policyEvaluation,
  policyIteration,
  valueIteration,
  expectedUtility
};