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

import { CANVAS_HEIGHT_PX, CANVAS_WIDTH_PX, computeFitness } from '../main.mjs';
import { computeDistance, Individual, PopulationCluster, Selector } from './population.mjs';

export const DEF_CONFIG = Object.freeze({
  n: 15,
  threshold: 10000,
  mutationChance: 0.05
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
        if (fit <= Algorithm.maxFitToSubstituteRemaining) {
          return newRandomIndividual();
        }
        if (Math.random() <= Algorithm.remainingLuckChance) {
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
    const hasMutationChance = () => Math.random() <= this.mutationChance;
    const getRandomMutation = () => (Math.random() * Algorithm.maxAbsMutation) * getRandomSign();
    const hasToMutate = individual => individual !== this.bestParent && hasMutationChance();
    const applyMutation = individual => {
      const mx = getRandomMutation();
      const my = getRandomMutation();
      const x = individual.x + mx;
      const y = individual.y + my;
      return new Individual(x, y);
    };

    this.population = this.population.map(
      individual => hasToMutate(individual) ? applyMutation(individual) : individual
    );
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
  static #maxAbsMutation = 0.02;
  static #maxFitToSubstituteRemaining = 1;
  static #remainingLuckChance = 0.2;

  static get intervalDelayMs() {
    return Algorithm.#intervalDelayMs;
  }

  static get eliteFitnessRangeMin() {
    return Algorithm.#eliteFitnessRangeMin;
  }

  static get gracedFitnessInterval() {
    return Algorithm.#gracedFitnessInterval;
  }

  static get gracedFitnessRangeMin() {
    return Algorithm.eliteFitnessRangeMin - Algorithm.gracedFitnessInterval;
  }

  static get maxAbsMutation() {
    return Algorithm.#maxAbsMutation;
  }

  static get maxFitToSubstituteRemaining() {
    return Algorithm.#maxFitToSubstituteRemaining;
  }

  static get remainingLuckChance() {
    return Algorithm.#remainingLuckChance;
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
    const dz = distance - dr + (Math.random() * dr * getRandomSign());
    const dy = (previousBest.y - individual.y) * dz / distance;
    const dx = (previousBest.x - individual.x) * dz / distance;
    const res = new Individual(individual.x + dx, individual.y + dy);
    const angle = Math.random() * (Math.PI / 4) * getRandomSign();
    return OffspringStrategy.#rotate(res, angle);
  }

  static createAndApproachElite(p1, p2, elite) {
    const mid = OffspringStrategy.#computeMiddlePoint(p1, p2);
    return OffspringStrategy.#computeMiddlePoint(mid, elite);
  }

  static createByMiddlePointFrom(p1, p2) {
    return OffspringStrategy.#computeMiddlePoint(p1, p2);
  }

  static createFromOverfittedElite(elite, mate) {
    return OffspringStrategy.createByMiddlePointFrom(elite, mate);
  }

  static #computeMiddlePoint(p1, p2) {
    return new Individual(
      (p1.x + p2.x) / 2,
      (p1.y + p2.y) / 2
    );
  }

  static #rotate(point, angle) {
    return new Individual(
      point.x * Math.cos(angle) - point.y * Math.sin(angle),
      point.y * Math.cos(angle) + point.x * Math.sin(angle)
    );
  }
}

function newRandomIndividual() {
  const x = Math.random() * CANVAS_WIDTH_PX;
  const y = Math.random() * CANVAS_HEIGHT_PX;
  return new Individual(x, y);
}

function getRandomSign() {
  return Math.random() - (1 / 2) < 0;
}
