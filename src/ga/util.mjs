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

export function getRandomItemFrom(array) {
  const length = array.length;
  const pos = Math.floor(Math.random() * length);
  return length > 0 ? array[pos] : null;
}
