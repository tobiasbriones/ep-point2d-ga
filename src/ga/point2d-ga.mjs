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

import { CANVAS_HEIGHT_PX, CANVAS_WIDTH_PX } from '../main.mjs';
import { computeDistance, Individual, PopulationCluster, Selector } from './population.mjs';

export const DEF_CONFIG = Object.freeze({
  n: 10,
  threshold: 10000,
  mutationChance: 0.25
});

/**
 * Implements the genetic algorithm to apply to the Point2D problem.
 *
 * @author Tobias Briones
 */
export class GeneticAlgorithm {
  #cluster;

  constructor(target) {
    this.target = target;
    this.n = DEF_CONFIG.n;
    this.population = null;
    this.threshold = DEF_CONFIG.threshold;
    this.mutationChance = DEF_CONFIG.mutationChance;
    this.bestParent = null;
    this.bestFit = -1;
    this.#cluster = new PopulationCluster(this.n);
    this.#cluster.selector = this.#buildSelector();
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
        console.log('FINISH');
        clearInterval(intervalId);
      }
    };
    let counter = 0;

    const intervalId = setInterval(
      () => {
        this.#runNextGeneration();
        this.#setBestIndividual();
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
  }

  #select() {
    const cluster = this.#cluster;

    cluster.clear();
    cluster.addAll(this.population);
  }

  #crossover() {
    const cluster = this.#cluster;
    const previousBest = this.bestParent;
    const previousBestFit = this.bestFit;

    const randomIndividualAsc = cluster => {
      const value = cluster.randomRemainingIndividual ||
        cluster.randomGracedIndividual ||
        cluster.randomEliteIndividual;
      return value.individual;
    };

    const randomIndividualDes = cluster => {
      const value = cluster.randomEliteIndividual ||
        cluster.randomGracedIndividual ||
        cluster.randomRemainingIndividual;
      return value.individual;
    };

    const randomEliteIndividual = (cluster, def = null) => {
      const value = cluster.randomEliteIndividual;
      return value !== null ? value.individual : def;
    };

    this.population = cluster.map({
      eliteFn(individual, fit) {
        if (individual === previousBest) {
          return individual;
        }
        const distance = computeDistance(individual, previousBest);

        if (distance > 0) {
          return OffspringStrategy.createFromElite(
            { individual, fit },
            { previousBest, previousBestFit },
            distance
          );
        }
        const mate = randomIndividualAsc(cluster, individual);
        return OffspringStrategy.createFromOverfittedElite(individual, mate);
      },

      gracedFn(individual) {
        const mate = randomIndividualDes(cluster);
        const elite = randomEliteIndividual(cluster, newRandomIndividual());
        return OffspringStrategy.createAndApproachElite(individual, mate, elite);
      },
      remainingFn(individual, fit) {
        if (fit < 1) {
          return newRandomIndividual();
        }
        if (Math.random() < 0.2) {
          const mate = randomIndividualAsc(cluster);
          return OffspringStrategy.createByMiddlePointFrom(individual, mate);
        }
        const mate1 = randomIndividualAsc(cluster);
        const mate2 = randomIndividualAsc(cluster);
        const elite = randomEliteIndividual(cluster, randomIndividualDes(cluster));

        return OffspringStrategy.createAndApproachElite(mate1, mate2, elite);
      }
    });
  }

  #mutate() {
    this.population.map(individual => {
      if (Math.random() <= this.mutationChance) {
        const sign1 = Math.random() < 0.5 ? -1 : 1;
        const sign2 = Math.random() < 0.5 ? -1 : 1;
        const mx = (Math.random() / 50) * sign1;
        const my = (Math.random() / 50) * sign2;
        const x = individual.x + mx;
        const y = individual.y + my;
        return new Individual(x, y);
      }
      return individual;
    });
  }

  #setBestIndividual() {
    let selected = this.population[0];
    let score = this.#getFitness(selected);

    for (const individual of this.population) {
      const fitness = this.#getFitness(individual);

      if (fitness > score) {
        selected = individual;
        score = fitness;
      }
    }
    this.bestParent = selected;
    this.bestFit = score;
  }

  #buildSelector() {
    const selector = new Selector();
    selector.fitnessFn = individual => this.#getFitness(individual);
    selector.isEliteFn = (individual, fit) => fit >= Algorithm.eliteFitnessRangeMin;
    selector.isGracedFn = (individual, fit) => fit >= Algorithm.gracedFitnessRangeMin;
    return selector;
  }

  #getFitness(individual) {
    return computeFitness(individual, this.target);
  }
}

/**
 * Defines internal GA constrains.
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
 * Defines functions used to create the offspring according to its parents.
 *
 * @author Tobias Briones
 */
class OffspringStrategy {
  static createFromElite(current, top, distance) {
    const { individual, fit } = current;
    const { previousBest, previousBestFit } = top;
    const radius = 100 - previousBestFit;
    const diff = previousBestFit - fit;
    const dr = radius * (distance / diff);
    const dz = distance - dr + (Math.random() * dr * randomSign());
    const dy = (previousBest.y - individual.y) * dz / distance;
    const dx = (previousBest.x - individual.x) * dz / distance;
    const res = new Individual(individual.x + dx, individual.y + dy);
    const angle = Math.random() * Math.PI / 4 * randomSign();
    return rotate(res, angle);
  }

  static createAndApproachElite(p1, p2, elite) {
    const mid = computeMiddlePoint(p1, p2, (Math.random() + 0.5) * 1.5);

    return computeMiddlePoint(mid, elite);
  }

  static createByMiddlePointFrom(p1, p2) {
    return computeMiddlePoint(p1, p2);
  }

  static createFromOverfittedElite(elite, mate) {
    return OffspringStrategy.createByMiddlePointFrom(elite, mate);
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

function newRandomIndividual() {
  const x = Math.random() * CANVAS_WIDTH_PX;
  const y = Math.random() * CANVAS_HEIGHT_PX;
  return new Individual(x, y);
}

function computeMiddlePoint(p1, p2, factor = 2) {
  return new Individual(
    (p1.x + p2.x) / factor,
    (p1.y + p2.y) / factor
  );
}

function rotate(point, angle) {
  return new Individual(
    point.x * Math.cos(angle) - point.y * Math.sin(angle),
    point.y * Math.cos(angle) + point.x * Math.sin(angle)
  );
}

function randomSign() {
  return Math.random() - 0.5 < 0;
}
