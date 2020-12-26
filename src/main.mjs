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

import { GeneticAlgorithm, Individual } from './ga.mjs';

export const CANVAS_WIDTH_PX = 400;
export const CANVAS_HEIGHT_PX = 400;
const TARGET_POINT_X = 125;
const TARGET_POINT_Y = 270;
const TARGET_POINT = new Individual(TARGET_POINT_X, TARGET_POINT_Y);
const TARGET_POINT_COLOR = '#FF0000';
const OFFSPRING_POINT_COLOR = '#000000';

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
      this.drawOffspringPoint(strongest);
      this.fitDiv.innerText = fit + '%';
    });
  }

  updateCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTargetPoint();
  }

  drawTargetPoint() {
    this.drawPoint(TARGET_POINT, TARGET_POINT_COLOR);
  }

  drawOffspringPoint(offspringPoint) {
    this.drawPoint(offspringPoint, OFFSPRING_POINT_COLOR);
  }

  drawPoint(point, color) {
    const x = point.x;
    const y = point.y + CANVAS_HEIGHT_PX - 2 * point.y;

    this.ctx.fillStyle = color;
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
