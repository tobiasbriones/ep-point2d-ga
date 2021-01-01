# Point2D Genetic Algorithm Module

Provides a genetic algorithm implementation for solving the Point2D problem. The algorithm is
delivered in the GeneticAlgorithm class consisting of the usual GA steps:

- Select

- Crossover

- Mutate

For selection, the approach is taken by the `PopulationCluster` class from the population module.
The population is classified into the `IndividualClusterType` categories, say: Elite, Graced and
Remaining.

For the crossover, a technique is selected from the `OffspringStrategy` class depending on whether
the individual to reproduce is Elite or Non-Elite.

The mutation is applied when required simply by applying a move `x, y` transformation with a
relatively small difference.

The algorithm is run each `intervalDelayMs` and updates the user by calling the provided callback
when a generation is ready.

The `Algorithm` utility class contains constants for adjusting values for the actual algorithm
class:`GeneticAlgorithm`.

## OffspringStrategy

Defines functions used to create the offspring according to its parents. What matters the most is
how elite and non-elite individuals are treated. Non-Elite (Remaining) individuals are mostly
looking for other solutions to avoid getting stuck in a local optima for instance. Some of them are
left alive in the generations, and most of them will follow the behaviour of the elite individuals.
That's because weaklings must follow the strongest ***behaviors*** in order to survive. Now, when it
comes to the elite, some things are to be noticed. For the elite, the strategy changes to optimize
for ***convergence*** instead of following others paths. What needs special attention is that, the
population must not converge to the best-fitted elite but to the problem solution. Individuals will
get stuck if the only follow the elite. The answer to this is that you have to check what makes a
well-fitted individual a good individual, what behaviour, genes, etc. Thus, the elite individuals
are known to be those who are relatively closer to the solution which is also the reason why I
decided to change the strategy for the elite and optimize for ***searching***, let's say those
non-elite are lost, and the elite are already searching, so the non-elite should approach the elite
way to improve their fitness, and the elite should search around themselves because the problem
solution is ***near the elite*** so elite individuals shall search for it near the best-fitted elite
individual rather than blindly following it as non-elites do.

### By Middle Point

This strategy is useful when two points are going to mate, and the characteristics of both want to
be preserved. The resulting offspring is like both parents in terms of characteristics (genes), by
taking the middle point of both parents.

### Approach Elite

Simply mates the two individuals, that is, applies the Middle Point strategy, and then applies it
again with an elite individual, so the resulting offspring "learns" from the elite mate by getting
closer to it and improved its fit for the next generation.

Shortly, it takes the middle point of both parents `p1, p2`, and with the resulting point takes
again the middle point between it and an `elite` point, so the resulting offspring has the
characteristics of the parents `p1, p2` and learns how an `elite` behaves by getting closer to that
cluster.

### Overfitted Elite

A local overfitting can be produced when individuals in the elite cluster are too close to the one
another or to the best-fitted one. That is, the distance between one and other is near zero or zero.
Then separate them away, so the point is going to be mated with another point by using the middle
point approach. This will likely send the point out of the elite cluster, but it will eventually
fall again into the elite because of the Approach Elite strategy.

### Elite

This strategy is applied to elite individuals and consists of searching near the best-fitted elite
for a better solution. This is so because the characteristic that makes an elite individual is that
the problem solution is near that radius (some relatively small radius from the best-fitted point)
so instead of just following the best-fitted point and produce overfitting, you have to search
around it. The best-fitted point genetic properties tell you that the solution is not in it, but
near it!
