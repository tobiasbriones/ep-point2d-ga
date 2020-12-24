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

const ALGORITHM = Object.freeze({
  n: 10,
  threshold: 1000,
  mutationChance: 0.25
});
const TARGET_POINT = Object.freeze({ x: 125, y: 270 });

const CANVAS_WIDTH_PX = 400;
const CANVAS_HEIGHT_PX = 400;

/**
 * Defines the genetic algorithm to apply to the Point2D problem.
 * @author Tobias Briones
 */
class GeneticAlgorithm {
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

  newIndividual = () => {
    const x = Math.random() * CANVAS_WIDTH_PX;
    const y = Math.random() * CANVAS_HEIGHT_PX;
    return { x: x, y: y };
  };

  fitness = individual => {
    const getDistance = (p1, p2) => {
      return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    };
    const evalModifiedSigmoid = x => {
      // Slow down the exponential grow for values near [0, 100]
      x /= 25;
      return (-2 * Math.pow(Math.E, x)) / (Math.pow(Math.E, x) + 1) + 2;
    };
    const distance = getDistance(individual, this.target);

    // Eval sigmoid function
    const sigmoid = evalModifiedSigmoid(distance);

    // 1.0 = distance zero, great
    // near 0 = distance sucks

    // If distance = 10, fitness is 80
    // If distance = 50, fitness is 23
    // If distance = 100, fitness is 3
    return sigmoid * 100;
  };

  select = () => {
    let firstScore = 0;
    let secondScore = 0;
    let first = this.population[0];
    let second = this.population[0];

    this.population.forEach(individual => {
      const fitness = this.fitness(individual);

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
  };

  crossover = () => {
    const offspring1 = this.newIndividual();
    offspring1.x = this.bestParent.x;
    offspring1.y = this.secondBestParent.y;

    const offspring2 = this.newIndividual();
    offspring2.x = this.secondBestParent.x;
    offspring2.y = this.bestParent.y;

    // Kill one of them < jajaja >
    if (this.fitness(offspring1) < this.fitness(offspring2)) {
      this.offspring = offspring2;
    }
    else {
      this.offspring = offspring1;
    }
    // console.log(`Offspring ${JSON.stringify(this.offspring)}`);
  };

  mutate = () => {
    if (Math.random() < this.mutationChance) {
      const mx = Math.random() / 50;
      const my = Math.random() / 50;

      this.offspring.x += mx;
      this.offspring.y += my;
    }
  };

  start = callback => {
    // Init first population
    this.population = [];

    for (let i = 0; i < this.n; i++) {
      this.population.push(this.newIndividual());
    }
    // console.log(`Target ${JSON.stringify(this.target)}`);
    // console.log(`Initial population ${JSON.stringify(this.population)}`);

    // Start the algorithm
    // Each iteration is a new generation
    let k = 0;
    const i = setInterval(() => {
      this.select();
      this.crossover();
      this.mutate();

      for (let i = 3; i < this.n; i++) {
        this.population[i] = this.newIndividual();
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
  };
}

class Main {
  constructor() {
    this.ga = new GeneticAlgorithm(TARGET_POINT);
    this.fitDiv = null;
    this.canvas = null;
    this.ctx = null;
  }

  init() {
    this.fitDiv = document.getElementById('fit');
    this.canvas = document.getElementById('grid');
    this.ctx = this.canvas.getContext('2d');

    this.start();
  }

  start() {
    this.ga.start((strongest, fit) => {
      this.updateCanvas();
      this.drawPoint(strongest.x, strongest.y);
      this.fitDiv.innerHTML = fit + '%';

      // console.log(`Fit ${fit}`);
      // console.log(strongest);
    });
  }

  updateCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawPoint(TARGET_POINT.x, TARGET_POINT.y, true);
  }

  drawPoint(x, y, red) {
    y += 400 - 2 * y;

    if (red) {
      this.ctx.fillStyle = '#FF0000';
    }
    else {
      this.ctx.fillStyle = '#000000';
    }
    this.ctx.beginPath();
    this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
    this.ctx.fill();
  }
}

// ------------------------------------------  SCRIPT  ------------------------------------------ //

document.addEventListener('DOMContentLoaded', () => {
  const main = new Main();

  main.init();
});
