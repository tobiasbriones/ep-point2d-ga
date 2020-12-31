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

import { computeDistance, Individual } from './ga/population.mjs';
import { GeneticAlgorithm } from './ga/point2d-ga.mjs';

const CANVAS = Object.freeze({ WIDTH_PX: 400, HEIGHT_PX: 400 });
const DEF_TARGET_POINT = newDefaultTargetPoint();
const TARGET_POINT_COLOR = '#FF0000';
const OFFSPRING_POINT_COLOR = '#000000';

class Main {
  constructor() {
    this.target = DEF_TARGET_POINT;
    this.ga = new GeneticAlgorithm(this.target);
    this.fitDiv = null;
    this.canvas = null;
    this.ctx = null;
  }

  getFitness(individual) {
    return computeFitness(individual, this.target);
  }

  onNextGen(strongest, fit) {
    this.updateCanvas();
    this.drawOffspringPoint(strongest);
    this.fitDiv.innerText = fit + '%';
  }

  newRandomIndividual() {
    const x = Math.random() * CANVAS.WIDTH_PX;
    const y = Math.random() * CANVAS.HEIGHT_PX;
    return new Individual(x, y);
  }

  init() {
    this.fitDiv = document.getElementById('fit');
    this.canvas = document.getElementById('grid');
    this.ctx = this.canvas.getContext('2d');

    this.ga.callback = this;
    this.start();
  }

  start() {
    this.ga.start();
  }

  updateCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTargetPoint();
  }

  drawTargetPoint() {
    this.drawPoint(this.target, TARGET_POINT_COLOR);
  }

  drawOffspringPoint(offspringPoint) {
    this.drawPoint(offspringPoint, OFFSPRING_POINT_COLOR);
  }

  drawPoint(point, color) {
    const x = point.x;
    const y = point.y + CANVAS.HEIGHT_PX - 2 * point.y;

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
    this.ctx.fill();
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
  const reductionFactor = 0.04;

  const evalModifiedSigmoid = x => {
    // Slow down the exponential grow for values near [0, 100]
    const reducedX = x * reductionFactor;
    return (-2 * Math.pow(Math.E, reducedX)) / (Math.pow(Math.E, reducedX) + 1) + 2;
  };
  const distance = computeDistance(individual, target);
  const sigmoid = evalModifiedSigmoid(distance);

  // If distance = 10, fitness is 80
  // If distance = 50, fitness is 23
  // If distance = 100, fitness is 3
  return sigmoid * 100;
}

function newDefaultTargetPoint() {
  const x = 125;
  const y = 270;
  return Object.freeze(new Individual(x, y));
}

// ------------------------------------------  SCRIPT  ------------------------------------------ //

document.addEventListener('DOMContentLoaded', () => {
  const main = new Main();

  main.init();
});
