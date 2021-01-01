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

import { getRandomItemFrom } from './util.mjs';

export const IndividualClusterType = Object.freeze({
  ELITE: 0,
  GRACED: 1,
  REMAINING: 2
});

/**
 * Creates a cluster of a given population when the individuals are categorized
 * into elite and remaining with/without grace. The elite cluster contains the
 * best fitted individuals of the population. The remaining with grace might
 * make it to the next generation. The remaining without grace won't make it to
 * the next generation.
 *
 * @author Tobias Briones
 */
export class PopulationCluster {
  #n;
  #selector;
  #elite;
  #graced;
  #remaining;
  #hasToSort;

  constructor(n) {
    this.#n = n;
    this.#selector = new Selector();
    this.#hasToSort = true;

    this.#init();
  }

  set selector(value) {
    this.#selector = value;
  }

  set hasToSort(value) {
    this.#hasToSort = value;
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

  addAll(population) {
    const pushRecord = (record, type) => {
      switch (type) {
        case IndividualClusterType.ELITE:
          this.#elite.push(record);
          break;

        case IndividualClusterType.GRACED:
          this.#graced.push(record);
          break;

        case IndividualClusterType.REMAINING:
          this.#remaining.push(record);
          break;
      }
    };
    const consume = individual => {
      const selection = this.#selector.select(individual);
      const { fitnessValue, type } = selection;
      const record = {
        individual: individual,
        fitnessValue: fitnessValue
      };

      pushRecord(record, type);
    };

    population.forEach(it => consume(it));
    this.#sort();
  }

  map(callback) {
    this.#validate();

    const eliteMap = this.#elite.map(record => callback.eliteFn(
      record.individual,
      record.fitnessValue
    ));
    const gracedMap = this.#graced.map(record => callback.gracedFn(
      record.individual,
      record.fitnessValue
    ));
    const remainingMap = this.#remaining.map(record => callback.remainingFn(
      record.individual,
      record.fitnessValue
    ));
    return [...eliteMap, ...gracedMap, ...remainingMap];
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

  #sort() {
    const comparator = (a, b) => {
      let value;

      if (a < b) {
        value = -1;
      }
      else if (b > a) {
        value = 1;
      }
      else {
        value = 0;
      }
      return value;
    };

    this.#elite.sort(comparator);
    this.#graced.sort(comparator);
    this.#remaining.sort(comparator);
  }
}

/**
 * Defines a Genetic Algorithm's Individual which represents a two dimensional
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
 * Creates rules for selecting individuals into the IndividualClusterType
 * categories.
 *
 * @author Tobias Briones
 */
export class Selector {
  constructor() {
    this.fitnessFn = _individual => 0;
    this.isEliteFn = (_individual, _fitnessValue) => false;
    this.isGracedFn = (_individual, _fitnessValue) => false;
  }

  select(individual) {
    const fitnessValue = this.fitnessFn(individual);
    let type;

    if (this.isEliteFn(individual, fitnessValue)) {
      type = IndividualClusterType.ELITE;
    }
    else if (this.isGracedFn(individual, fitnessValue)) {
      type = IndividualClusterType.GRACED;
    }
    else {
      type = IndividualClusterType.REMAINING;
    }
    return { type: type, fitnessValue: fitnessValue };
  }
}

/**
 * Computes the Euclidean distance between the two 2d points.
 *
 * @param p1 point 1
 * @param p2 point 2
 *
 * @returns {number} the Euclidean distance between the two 2d points
 */
export function computeDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}
