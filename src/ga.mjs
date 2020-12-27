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

export const DEF_CONFIG = Object.freeze({
  n: 10,
  threshold: 1000,
  mutationChance: 0.25
});

const IndividualClusterType = Object.freeze({
  ELITE: 0,
  GRACED: 1,
  REMAINING: 2
});

/**
 * Defines a Genetic Algorithm Individual which represents a two dimensional
 * immutable Point.
 *
 * @author Tobias Briones
 */
export class Individual {
  #x;
  #y;

  constructor(x = 0, y = 0) {
    this.#x = x;
    this.#y = y;
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }
}

/**
 * Implements the genetic algorithm to apply to the Point2D problem.
 *
 * @author Tobias Briones
 */
export class GeneticAlgorithm {
  constructor(target) {
    this.target = target;
    this.n = DEF_CONFIG.n;
    this.population = null;
    this.threshold = DEF_CONFIG.threshold;
    this.mutationChance = DEF_CONFIG.mutationChance;
    this.bestParent = null;
    this.bestFit = -1;
  }

  start(callback) {
    this.#initPopulation();
    this.#runAlgorithm(callback);
  }

  #initPopulation() {
    this.population = [];

    for (let i = 0; i < this.n; i++) {
      this.population.push(newRandomIndividual());
    }
  }

  #runAlgorithm(callback) {
    const onNextGenerationRun = () => callback(this.bestParent, this.bestFit);
    const checkThreshold = (counter, intervalId) => {
      if (counter >= this.threshold) {
        clearInterval(intervalId);
      }
    };
    let counter = 0;

    const intervalId = setInterval(
      () => {
        this.#runNextGeneration();
        onNextGenerationRun();
        checkThreshold(counter, intervalId);
        counter++;
      },
      Algorithm.intervalDelayMs
    );
  }

  #runNextGeneration() {
    this.#select();
    this.#crossover();
    this.#mutate();

    for (let i = 3; i < this.n; i++) {
      this.population[i] = newRandomIndividual();
    }
    this.population[0] = this.bestParent;
    this.population[1] = this.secondBestParent;
    this.population[2] = this.offspring;
  }

  #select() {
    let firstScore = 0;
    let secondScore = 0;
    let first = this.population[0];
    let second = this.population[0];

    for (const individual of this.population) {
      const fitness = this.#getFitness(individual);

      if (fitness > firstScore) {
        firstScore = fitness;
        first = individual;
      }
      else if (fitness > secondScore) {
        secondScore = fitness;
        second = individual;
      }
    }
    this.bestParent = first;
    this.secondBestParent = second;
    this.bestFit = firstScore;

    // console.log(`Selection ${JSON.stringify(this.bestParent)} and ${JSON.stringify(this.secondBestParent)}`);
  }

  #crossover() {
    function getOffspringFrom(p1, p2) {
      return new Individual(p1.x, p2.y);
    }

    const offspring1 = getOffspringFrom(this.bestParent, this.secondBestParent);
    const offspring2 = getOffspringFrom(this.secondBestParent, this.bestParent);

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
      const x = this.offspring.x + mx;
      const y = this.offspring.y + my;
      this.offspring = new Individual(x, y);
    }
  }

  #getFitness(individual) {
    return computeFitness(individual, this.target);
  }
}

/**
 * Defines internal algorithm constrains.
 *
 * @author Tobias Briones
 */
class Algorithm {
  static #intervalDelayMs = 50;
  static #eliteFitnessRangeMin = 80;
  static #gracedFitnessInterval = 20;

  static get intervalDelayMs() {
    return this.#intervalDelayMs;
  }

  static get eliteFitnessRangeMin() {
    return this.#eliteFitnessRangeMin;
  }

  static get gracedFitnessInterval() {
    return this.#gracedFitnessInterval;
  }

  static get gracedFitnessRangeMin() {
    return Algorithm.eliteFitnessRangeMin - Algorithm.gracedFitnessInterval;
  }
}

/**
 * Creates a cluster of a given population when the individuals are categorized
 * into elite and remaining with/without grace. The elite cluster contains the
 * best fitted individuals of the population. The remaining with grace might
 * make it to the next generation. The remaining without grace won't make it to
 * the next generation.
 *
 * @author Tobias Briones
 */
class PopulationCluster {
  static #getIndividualTypeByFitnessValue(fitnessValue) {
    let type;

    const isElite = () => fitnessValue >= Algorithm.ELITE_FITNESS_RANGE_MIN;
    const hasGrace = () => fitnessValue >= Algorithm.GRACED_FITNESS_RANGE_MIN;

    if (isElite()) {
      type = IndividualClusterType.ELITE;
    }
    else if (hasGrace()) {
      type = IndividualClusterType.GRACED;
    }
    else {
      type = IndividualClusterType.REMAINING;
    }
    return type;
  }

  #n;
  #elite;
  #graced;
  #remaining;

  constructor(n) {
    this.#n = n;
    this.#init();
  }

  get length() {
    return this.#elite.length + this.#graced.length + this.#remaining.length;
  }

  get randomEliteIndividual() {
    return getRandomItemFrom(this.#elite);
  }

  get randomGracedIndividual() {
    return getRandomItemFrom(this.#graced);
  }

  get randomRemainingIndividual() {
    return getRandomItemFrom(this.#remaining);
  }

  map(fn) {
    this.#validate();
    const eliteMap = this.#elite.map(record => fn.eliteFn(
      record.individual,
      record.fitnessValue
    ));
    const gracedMap = this.#graced.map(record => fn.gracedFn(
      record.individual,
      record.fitnessValue
    ));
    const remainingMap = this.#remaining.map(record => fn.remainingFn(
      record.individual,
      record.fitnessValue
    ));
    return [...eliteMap, ...gracedMap, ...remainingMap];
  }

  addAll(population, fitnessFn) {
    const newRecord = (individual, fitnessValue) => {
      return {
        individual: individual,
        fitnessValue: fitnessValue
      };
    };

    population.forEach(individual => {
      const fitnessValue = fitnessFn.getFitnessOf(individual);
      const type = PopulationCluster.#getIndividualTypeByFitnessValue(fitnessValue);

      switch (type) {
        case IndividualClusterType.ELITE:
          this.#elite.push(newRecord(individual));
          break;

        case IndividualClusterType.GRACED:
          this.#graced.push(newRecord(individual));
          break;

        case IndividualClusterType.REMAINING:
          this.#remaining.push(newRecord(individual));
          break;
      }
    });
  }

  clear() {
    this.#init();
  }

  #init() {
    this.#elite = [];
    this.#graced = [];
    this.#remaining = [];
  }

  #validate() {
    if (!this.#isFinished()) {
      const msg = `Cluster not finished. n = ${ this.#n } but actual size = ${ this.length }`;
      throw new Error(msg);
    }
  }

  #isFinished() {
    return this.length === this.#n;
  }
}

/**
 * Computes the fitness value for the given individual with respect to the given
 * target point. The fitness value belongs to (0, 100) where the individual
 * fitness is better as it approaches 100.
 *
 * For example:
 *
 * - fit 100: distance zero, great
 *
 * - fit near 0: distance sucks
 *
 * @param individual point to calculate the fitness value
 * @param target reference point where the individual should get close to
 *
 * @returns {number} the fitness value in (0, 100)
 */
export function computeFitness(individual, target) {
  const evalModifiedSigmoid = x => {
    // Slow down the exponential grow for values near [0, 100]
    const reducedX = x / 25;
    return (-2 * Math.pow(Math.E, reducedX)) / (Math.pow(Math.E, reducedX) + 1) + 2;
  };
  const distance = computeDistance(individual, target);
  const sigmoid = evalModifiedSigmoid(distance);

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

function createOffspringFrom(p1, p2) {
  return new Individual(p1.x, p2.y);
}

function getRandomItemFrom(array) {
  const length = array.length;
  const pos = Math.floor(Math.random() * length);
  return length > 0 ? array[pos] : null;
}
