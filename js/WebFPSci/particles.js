/*
The MIT License (MIT)

Copyright (c) 2021 by Joao vinicius (https://codepen.io/viniciusSouza/pen/gOPVmKV)
Copyright (c) 2021 NVIDIA CORPORATION & AFFILIATES

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

"use strict"                      // Execute this code in "strict mode"

// Particle Effects
var particles = new Array();              // Empty particles array
var last_particle_update = 0;         // Last particle update time

/**
 * Create a set of particles emanating from a point
 * @param {The position at which to create the particles} position 
 * @param {The color of the particles (randomized if (0,0,0))} particleColor 
 * @param {The size of the particles} particleSize 
 * @param {The number of particles to create} particleCount 
 * @param {The duration for which to display particles} duration 
 */
function makeParticles(position, particleColor = new THREE.Color(0,0,0), particleSize = 0.2, particleCount = 50, duration = Infinity){
    var pointsGeometry = new THREE.Geometry();
    pointsGeometry.oldvertices = [];
    var colors = [];
  
    // Create and assign vertex colors
    for (var i = 0; i < particleCount; i++) {
      var offset = randomPosition(Math.random());
      var vertex = new THREE.Vector3(offset[0], offset[1] , offset[2]);
      pointsGeometry.oldvertices.push([0,0,0]);
      pointsGeometry.vertices.push(vertex);
    
      var color;
      if (particleColor.r === 0 && particleColor.g === 0 && particleColor.b === 0) { 
        color = new THREE.Color(Math.random()*0.5+0.5, Math.random()*0.3, 0);
      }
      else color = particleColor;
      colors.push(color);
    }
    pointsGeometry.colors = colors;
  
    // Make material from vertex colors
    var pointsMaterial = new THREE.PointsMaterial({
      size: particleSize,
      sizeAttenuation: true,
      depthWrite: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      vertexColors: THREE.VertexColors
    });
  
    // Create points geometry
    var points = new THREE.Points(pointsGeometry, pointsMaterial);
    points.prototype = Object.create(THREE.Points.prototype);
    points.position.x = position.x;
    points.position.y = position.y;
    points.position.z = position.z;
    points.updateMatrix();
    points.matrixAutoUpdate = false;
    points.prototype.constructor = points;
    points.createTime = Date.now();
    points.duration = duration;
  
    // Geometry update function
    points.prototype.update = function(index) {
      var pCount = this.constructor.geometry.vertices.length;
      var positionYSum = 0;
      
      // For each vertex
      while(pCount--) {
        var position = this.constructor.geometry.vertices[pCount];
        var oldPosition = this.constructor.geometry.oldvertices[pCount];
  
        var velocity = {
          x: (position.x - oldPosition[0] ),
          y: (position.y - oldPosition[1] ),
          z: (position.z - oldPosition[2] )				
        }
  
        var oldPositionX = position.x;
        var oldPositionY = position.y;
        var oldPositionZ = position.z;
  
        position.y -= .03; // gravity
  
        position.x += velocity.x;
        position.y += velocity.y;
        position.z += velocity.z;
        
        var worldPosition = this.constructor.position.y + position.y;
  
        if (worldPosition <= 0){
          oldPositionY = position.y;
          position.y = oldPositionY - velocity.y * .5;
          positionYSum += 1;
        }
  
        this.constructor.geometry.oldvertices[pCount] = [oldPositionX, oldPositionY, oldPositionZ];
      }
      
      pointsGeometry.verticesNeedUpdate = true;
      
      // Look for most points on the ground
      if (positionYSum >=  0.7 * particleCount || (Date.now() - this.constructor.createTime)/1000 > this.constructor.duration) {
        particles.splice(index, 1);
        scene.remove(this.constructor);
      }
  
    };
    particles.push( points );
    scene.add(points);
  }

  function updateParticles(now) {
    // Simulate particles
    if(now - last_particle_update > 16.66){    // Always update particles at 60Hz (temporary?)
        last_particle_update = now;
        if (particles.length > 0) {
            var pLength = particles.length;
            while (pLength--) {
            particles[pLength].prototype.update(pLength);
            }
        }
    }
}