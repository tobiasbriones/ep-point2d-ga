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

import { assert, it } from '../tools/test.mjs';
import { computeDistance, Individual } from './population.mjs';

const ZERO_DISTANCE = 0;

export const populationTest = { run };

function run() {
  testPopulationCluster();
  testFunctions();
}

function testPopulationCluster() {

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
