# Population Module

The genetic algorithm needs a tool for the selection stage, and the population module provides it.
After implementing this module, the selection stage of the algorithm is mostly based on the
functionalities provided here.

The purpose of this module is to be used by the individuals (2d points), and the way they are seen
by the algorithm.

There are some [tests](../src/ga/population-unit-test.mjs) written to specify the module, although I
did not write all of them.

## Classification

The cluster creates three kinds of individuals:

- Elite: Individuals relatively close to the problem solution; other individuals should mimic the
  behavior of the elite so, they learn from the elite characteristics and get a better fit over the
  generations.

- Graced: It may be useful if you think of those individuals as ones closed to the elite but also to
  the non-elite. Their characteristics might be followed, or they might make it to the next
  generation.

- Remaining: Non-elite individuals. They have relatively useless solutions, and they should not make
  it to the next generation or else get the characteristics of the elite. They might also be useful
  to explore non-local solutions or changing solutions space.

## PopulationCluster

Creates a cluster of a given population when the individuals are categorized into an elite and
remaining with/without grace. The elite cluster contains the best-fitted individuals of the
population. The remaining with grace might make it to the next generation. The remaining without
grace won't make it to the next generation.

Example:

```js
const n = 3; // Population size
const cluster = new PopulationCluster(n);
const population = [
  new Individual(0, 0),
  new Individual(1, 5),
  new Individual(3, 1),
]; // The population must be of length n = 3

// Setup the cluster
cluster.selector = buildSelector();

// Add (and select) all the population into the cluster
cluster.addAll(population);
```

Then provide the Selector to give the selection logic to the cluster, so it will classify the
population as follows:

```js
function buildSelector() {
  const selector = new Selector();
  selector.fitnessFn = individual => getFitness(individual);
  selector.isEliteFn = (individual, fit) => fit >= Algorithm.eliteFitnessRangeMin;
  selector.isGracedFn = (individual, fit) => fit >= Algorithm.gracedFitnessRangeMin;
  return selector;
}
```

The cluster is also able to sort the fitness value and clear the data to start again.

In order to parse the results of the selection, use the `map` function:

```js
const populationAfterCrossover = cluster.map({
  eliteFn(individual, fit) {
    return individual;
  },
  gracedFn(individual, fit) {
    return individual;
  },
  remainingFn(individual, fit) {
    return individual;
  }
});
```

The map function receives an object to call respectively with the
corresponding `IndividualClusterType` passing the individual and fitness value. The callback
functions shall return a new version of the individual or the same individual so the resulting map
is created from the crossover process. This idea gives the chance of applying several crossover
strategies (`OffspringStrategy`) depending on the type of individual.

## Individual

An immutable object or immutable 2d point consisting of the two-dimensional point coordinates. The
individuals in a genetic algorithm represent a problem solution. Notice that, the genes, in this
case, are simply the coordinates (x, y) of the point; in other cases, it might be a sequence of
binary information instead.

```js
const point2D = new Individual(0, 0);

console.log(`${ point2D.x }, ${ point2D.y }`);
```
