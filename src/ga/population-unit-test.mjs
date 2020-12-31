/*
 * Copyright (c) 2020 Tobias Briones. All rights reserved.
 *
 * SPDX-License-Identifier: MIT
 *
 * This file is part of Example Project: Point2D GA.
 *
 * This source code is licensed under the MIT License found in the
 * LICENSE file in the root directory of this source tree or at
 * https://opensource.org/licenses/MIT.
 */

import { assert, expectToThrowError, it } from '../tools/test.mjs';
import {
  computeDistance,
  Individual,
  IndividualClusterType,
  PopulationCluster,
  Selector
} from './population.mjs';

export const populationTest = { run };
const ZERO_DISTANCE = 0;
const MIN_FIT_TO_BE_ELITE_MOCK = 80;
const GOOD_ELITE_FIT_MOCK = 90;
const MIN_FIT_TO_BE_GRACE_MOCK = 50;
const GOOD_GRACED_FIT_MOCK = 60;
const POPULATION = Object.freeze([
  new Individual(0, 0),
  new Individual(-2, -2),
  new Individual(2, 2)
]);

function run() {
  testPopulationCluster();
  testSelector();
  testFunctions();
}

function testPopulationCluster() {
  return (() => {
    const cluster = new PopulationCluster(POPULATION.length);
    const handler = getHandler();

    cluster.selector = buildSelector();

    it('adds the population', () => {
      cluster.addAll(POPULATION);
      assert(JSON.stringify(cluster.map(handler)) === JSON.stringify(POPULATION));
    });

    it('clears', () => {
      cluster.clear();
      assert(cluster.length === 0);
    });

    it('does not allow unfinished map', () => {
      cluster.clear();
      cluster.addAll([POPULATION[0]]);
      expectToThrowError(() => cluster.map(handler));
    });

    it('selects', () => {
      cluster.clear();
      cluster.addAll(POPULATION);
      cluster.map({
        eliteFn(individual) {
          assert(individual === POPULATION[0]);
          return individual;
        },
        gracedFn(individual) {
          assert(individual === POPULATION[1]);
          return individual;
        },
        remainingFn(individual) {
          assert(individual === POPULATION[2]);
          return individual;
        }
      });
    });
  })();

  function getHandler() {
    return {
      eliteFn(individual) {
        return individual;
      },
      gracedFn(individual) {
        return individual;
      },
      remainingFn(individual) {
        return individual;
      }
    };
  }

  function buildSelector() {
    const selector = new Selector();

    selector.fitnessFn = individual => {
      let fit = 0;

      if (individual === POPULATION[0]) {
        fit = GOOD_ELITE_FIT_MOCK;
      }
      else if (individual === POPULATION[1]) {
        fit = GOOD_GRACED_FIT_MOCK;
      }
      return fit;
    };

    selector.isEliteFn = (individual, fit) => {
      return fit >= MIN_FIT_TO_BE_ELITE_MOCK;
    };

    selector.isGracedFn = (individual, fit) => {
      return fit >= MIN_FIT_TO_BE_GRACE_MOCK;
    };

    return selector;
  }
}

function testSelector() {
  const selector = new Selector();
  const individualMock = new Individual();
  const minFitToBeEliteMock = 80;
  const maxFitToBeEliteMock = 100;
  const minFitToBeGracedMock = 50;
  const eliteFn = fit => fit >= minFitToBeEliteMock;
  const graceFn = fit => !eliteFn(fit) && fit >= minFitToBeGracedMock;
  const check = (selection, type, fit) => selection.type === type && selection.fitnessValue === fit;

  selector.isEliteFn = (individual, fitnessValue) => eliteFn(fitnessValue);
  selector.isGracedFn = (individual, fitnessValue) => graceFn(fitnessValue);

  it('checks is selected as elite', () => {
    selector.fitnessFn = () => minFitToBeEliteMock;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.ELITE,
      minFitToBeEliteMock
    ));

    selector.fitnessFn = () => maxFitToBeEliteMock;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.ELITE,
      maxFitToBeEliteMock
    ));

    selector.fitnessFn = () => (maxFitToBeEliteMock + minFitToBeEliteMock) / 2;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.ELITE,
      (maxFitToBeEliteMock + minFitToBeEliteMock) / 2
    ));
  });

  it('checks is selected as graced', () => {
    selector.fitnessFn = () => minFitToBeGracedMock;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.GRACED,
      minFitToBeGracedMock
    ));

    selector.fitnessFn = () => (minFitToBeGracedMock + minFitToBeEliteMock) / 2;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.GRACED,
      (minFitToBeGracedMock + minFitToBeEliteMock) / 2
    ));
  });

  it('checks is selected as remaining', () => {
    selector.fitnessFn = () => 0;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.REMAINING,
      0
    ));

    selector.fitnessFn = () => minFitToBeGracedMock / 2;

    assert(check(
      selector.select(individualMock),
      IndividualClusterType.REMAINING,
      minFitToBeGracedMock / 2
    ));
  });
}

function testFunctions() {
  return (() => {
    testComputeDistanceFunction();
  })();

  function testComputeDistanceFunction() {
    const origin = new Individual(0, 0);

    it('checks distance is zero provided the points are the same', () => {
      const p1 = new Individual(-1, -5);
      const p2 = new Individual(1, 5);
      const p3 = new Individual(3, -5);

      assert(computeDistance(origin, origin) === ZERO_DISTANCE);
      assert(computeDistance(p1, p1) === ZERO_DISTANCE);
      assert(computeDistance(p2, p2) === ZERO_DISTANCE);
      assert(computeDistance(p3, p3) === ZERO_DISTANCE);
    });

    it('checks distance is commutative', () => {
      const p1 = new Individual(-1, -5);
      const p2 = new Individual(1, 5);
      const p3 = new Individual(3, -5);
      const p4 = new Individual(-1, 5);

      assert(computeDistance(p1, p2) === computeDistance(p2, p1));
      assert(computeDistance(p1, p3) === computeDistance(p3, p1));
      assert(computeDistance(p1, p4) === computeDistance(p4, p1));

      assert(computeDistance(p2, p3) === computeDistance(p3, p2));
      assert(computeDistance(p2, p4) === computeDistance(p4, p2));

      assert(computeDistance(p3, p4) === computeDistance(p4, p3));
    });

    it('checks distance is greater than or equals to zero', () => {
      const p1 = new Individual(-1, -5);
      const p2 = new Individual(1, 5);
      const p3 = new Individual(3, -5);
      const p4 = new Individual(-1, 5);

      assert(computeDistance(origin, origin) === ZERO_DISTANCE);

      assert(computeDistance(p1, p2) > ZERO_DISTANCE);
      assert(computeDistance(p1, p3) > ZERO_DISTANCE);
      assert(computeDistance(p1, p4) > ZERO_DISTANCE);

      assert(computeDistance(p2, p3) > ZERO_DISTANCE);
      assert(computeDistance(p2, p4) > ZERO_DISTANCE);

      assert(computeDistance(p3, p4) > ZERO_DISTANCE);
    });

    it('checks distance against sample', () => {
      const p1 = new Individual(-1, -5);
      const p2 = new Individual(1, 5);
      const p3 = new Individual(3, -5);
      const p4 = new Individual(-1, 5);
      const samples = [
        {
          point1: p1,
          point2: p2,
          expected: 10.198039027185569
        },
        {
          point1: p1,
          point2: p3,
          expected: 4
        },
        {
          point1: p1,
          point2: p4,
          expected: 10
        },
        {
          point1: p2,
          point2: p3,
          expected: 10.198039027185569
        },
        {
          point1: p2,
          point2: p4,
          expected: 2
        },
        {
          point1: p3,
          point2: p4,
          expected: 10.770329614269007
        }
      ];

      const test = sample => assert(
        computeDistance(sample.point1, sample.point2) === sample.expected
      );

      samples.forEach(it => test(it));
    });
  }
}
