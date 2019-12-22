/*
 * This file is part of example.cs.optimization.algorithm.web.point2d_ga = Point2D GA.
 *
 * Point2D GA is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Point2D GA is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Point2D GA.  If not, see <https://www.gnu.org/licenses/>.
 */

/*
 * Copyright (c) 2019 Tobias Briones
 */

/**
 * Defines the genetic algorithm to apply to the Point2D problem.
 * @author Tobias Briones
 */
class GeneticAlgorithm {
    
    constructor(target) {
        this.target = target;
        this.n = 10;
        this.population = null;
        this.threshold = 1000;
        this.mutationChance = 0.25;
        this.bestParent = null;
        this.secondBestParent = null;
        this.offspring = null;
        this.bestFit = -1;
    }
    
    newIndividual = () => {
        const x = Math.random() * 400;
        const y = Math.random() * 400;
        return { x : x, y : y};
    }
    
    fitness = (individual) => {
        const getDistance = (p1, p2) => {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        }
        const evalModifiedSigmoid = (x) => {
            // Slow dowm the exponential grow for values near [0, 100]
            x /= 25;
            return -2 * Math.pow(Math.E, x) / (Math.pow(Math.E, x) + 1) + 2;
        }
        const distance = getDistance(individual, this.target);
        
        // Eval sigmoid function
        const sigmoid = evalModifiedSigmoid(distance);
        
        // 1.0 = distance cero, great
        // near 0 = distance sucks
        
        // If distance = 10, fitness is 80
        // If distance = 50, fitness is 23
        // If distance = 100, fitness is 3
        return sigmoid * 100;
    }
    
    select = () => {
        var firstScore = 0;
        var secondScore = 0;
        var first = this.population[0];
        var second = this.population[0];
        
        this.population.forEach(individual => {
            const fitness = this.fitness(individual);
            
            if(fitness > firstScore) {
                firstScore = fitness;
                first = individual;
            }
            else if(fitness > secondScore) {
                secondScore = fitness;
                second = individual;
            }
        });
        this.bestParent = first;
        this.secondBestParent = second;
        this.bestFit = firstScore;
        
        // console.log(`Selection ${JSON.stringify(this.bestParent)} and ${JSON.stringify(this.secondBestParent)}`);
    }
    
    crossover = () => {
        const offspring1 = this.newIndividual();
        
        offspring1.x = this.bestParent.x;
        offspring1.y = this.secondBestParent.y;
        
        const offspring2 = this.newIndividual();
        
        offspring2.x = this.secondBestParent.x;
        offspring2.y = this.bestParent.y;
        
        // Kill one of them < jajaja >
        if(this.fitness(offspring1) < this.fitness(offspring2)) {
            this.offspring = offspring2;
        }
        else {
            this.offspring = offspring1;
        }
        // console.log(`Offspring ${JSON.stringify(this.offspring)}`);
    }
    
    mutate = () => {
        if(Math.random() < this.mutationChance) {
            const mx = Math.random() / 50;
            const my = Math.random() / 50;
            
            this.offspring.x += mx;
            this.offspring.y += my;
        }
    }
    
    start = (callback) => {
        // Init first population
        this.population = [];
        
        for(let i = 0; i < this.n; i++) {
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
             
            for(let i = 3; i < this.n; i++) {
                this.population[i] = this.newIndividual();
            }
            this.population[0] = this.bestParent;
            this.population[1] = this.secondBestParent;
            this.population[2] = this.offspring;
            
            // console.log(`New generation ready ${JSON.stringify(this.population)}`);
            // console.log("------------------------------------------------------------")
            callback(this.bestParent, this.bestFit);
            if(k >= this.threshold) {
                clearInterval(i);
            }
            k++;
            
        }, 50);
    }
}

const target = { x: 125, y: 270 };
const ga = new GeneticAlgorithm(target);
const gridEl = document.getElementById('grid');
const fitDiv = document.getElementById('fit');

// I did't implement the worker yet
/*const worker = new Worker('worker.js');

worker.postMessage();
worker.onmessage = e => {
    console.log(e.data);
    
}
*/
const canvas = document.getElementById("grid");
const ctx = canvas.getContext("2d");

const drawPoint = (x, y, red) => {
    y += 400 - 2 * y;
    
    if(red) {
        ctx.fillStyle = "#FF0000";
    }
    else {
        ctx.fillStyle = "#000000";
    }
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, 2 * Math.PI);
    ctx.fill();
}

const updateCanvas = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPoint(target.x, target.y, true);
}

ga.start((strongest, fit) => {
    updateCanvas();
    drawPoint(strongest.x, strongest.y);
    fitDiv.innerHTML = fit + '%';
        
    // console.log(`Fit ${fit}`);
    // console.log(strongest);
});
