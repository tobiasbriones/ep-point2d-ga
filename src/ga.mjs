/*
 * Copyright (c) 2019-2020 Tobias Briones. All rights reserved.
 *
 * SPDX-License-Identifier: MIT
 *
 * This file is part of Example Project: Point2D GA.
 *
 * This source code is licensed under the MIT License found in the
 * LICENSE file in the root directory of this source tree or at
 * https://opensource.org/licenses/MIT.
 */

import { CANVAS_HEIGHT_PX, CANVAS_WIDTH_PX } from './main.mjs';

const ALGORITHM = Object.freeze({
  n: 10,
  threshold: 1000,
  mutationChance: 0.25
});

/**
 * Defines a Genetic Algorithm Individual which represents a two dimensional
 * mutable Point.
 *
 * @author Tobias Briones
 */
export class Individual {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

/**
 * Defines the genetic algorithm to apply to the Point2D problem.
 *
 * @author Tobias Briones
 */
export class GeneticAlgorithm {
  constructor(target) {
    this.target = target;
    this.n = ALGORITHM.n;
    this.population = null;
    this.threshold = ALGORITHM.threshold;
    this.mutationChance = ALGORITHM.mutationChance;
    this.bestParent = null;
    this.secondBestParent = null;
    this.offspring = null;
    this.bestFit = -1;
  }

  start(callback) {
    // Init first population
    this.population = [];

    for (let i = 0; i < this.n; i++) {
      this.population.push(newRandomIndividual());
    }
    // console.log(`Target ${JSON.stringify(this.target)}`);
    // console.log(`Initial population ${JSON.stringify(this.population)}`);

    // Start the algorithm
    // Each iteration is a new generation
    let k = 0;
    const i = setInterval(() => {
      this.#select();
      this.#crossover();
      this.#mutate();

      for (let i = 3; i < this.n; i++) {
        this.population[i] = newRandomIndividual();
      }
      this.population[0] = this.bestParent;
      this.population[1] = this.secondBestParent;
      this.population[2] = this.offspring;

      // console.log(`New generation ready ${JSON.stringify(this.population)}`);
      // console.log("------------------------------------------------------------")
      callback(this.bestParent, this.bestFit);
      if (k >= this.threshold) {
        clearInterval(i);
      }
      k++;
    }, 50);
  }

  #select() {
    let firstScore = 0;
    let secondScore = 0;
    let first = this.population[0];
    let second = this.population[0];

    this.population.forEach(individual => {
      const fitness = this.#getFitness(individual);

      if (fitness > firstScore) {
        firstScore = fitness;
        first = individual;
      }
      else if (fitness > secondScore) {
        secondScore = fitness;
        second = individual;
      }
    });
    this.bestParent = first;
    this.secondBestParent = second;
    this.bestFit = firstScore;

    // console.log(`Selection ${JSON.stringify(this.bestParent)} and ${JSON.stringify(this.secondBestParent)}`);
  }

  #crossover() {
    const offspring1 = newRandomIndividual();
    offspring1.x = this.bestParent.x;
    offspring1.y = this.secondBestParent.y;

    const offspring2 = newRandomIndividual();
    offspring2.x = this.secondBestParent.x;
    offspring2.y = this.bestParent.y;

    // Kill one of them < jajaja >
    if (this.#getFitness(offspring1) < this.#getFitness(offspring2)) {
      this.offspring = offspring2;
    }
    else {
      this.offspring = offspring1;
    }
    // console.log(`Offspring ${JSON.stringify(this.offspring)}`);
  }

  #mutate() {
    if (Math.random() < this.mutationChance) {
      const mx = Math.random() / 50;
      const my = Math.random() / 50;

      this.offspring.x += mx;
      this.offspring.y += my;
    }
  }

  #getFitness(individual) {
    return computeFitness(individual, this.target);
  }
}

export function computeFitness(individual, target) {
  const evalModifiedSigmoid = x => {
    // Slow down the exponential grow for values near [0, 100]
    const reducedX = x / 25;
    return (-2 * Math.pow(Math.E, reducedX)) / (Math.pow(Math.E, reducedX) + 1) + 2;
  };
  const distance = computeDistance(individual, target);
  const sigmoid = evalModifiedSigmoid(distance);

  // 1.0 = distance zero, great
  // near 0 = distance sucks

  // If distance = 10, fitness is 80
  // If distance = 50, fitness is 23
  // If distance = 100, fitness is 3
  return sigmoid * 100;
}

export function computeDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function newRandomIndividual() {
  const x = Math.random() * CANVAS_WIDTH_PX;
  const y = Math.random() * CANVAS_HEIGHT_PX;
  return new Individual(x, y);
}
