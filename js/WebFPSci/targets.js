/*
The MIT License (MIT)

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

// Target management
var targets = [];
var referenceTarget = true;     // Status tracking for whether a reference target is displayed

/**
 * Spawn a new (randomized/reference) target within the scene
 * @param {Is this a reference target?} reference 
 */
function spawnTarget(reference = false){
  if(reference){
    // Spawn a reference target (in front of current player view direction)
    const position = new THREE.Vector3();
    position.copy(fpsControls.position());
    position.add(new THREE.Vector3().setFromSphericalCoords(config.targets.reference.distance, -Math.PI/2, fpsControls.getViewAzim()));
    makeTarget(position, config.targets.reference.size, new THREE.Vector3(0,0,0), new THREE.Color(1,0,0));
  }
  else{
    var cameraDir = camera.getWorldDirection(new THREE.Vector3());
    var sign = cameraDir.y > 0.5 ? -1 : randSign();                   // Bias the sign of the random angle when camera elevation is high
    // Spawn a "real" target
    const spawnAzimRad = Math.PI / 180 * sign * randInRange(config.targets.spawnAzimMinDeg, config.targets.spawnAzimMaxDeg);
    const spawnElevRad = Math.PI / 180 * sign * randInRange(config.targets.spawnElevMinDeg, config.targets.spawnElevMaxDeg);
    const spawnDir = cameraDir.applyAxisAngle(new THREE.Vector3(0,1,0), spawnAzimRad).applyAxisAngle(new THREE.Vector3(0,0,1), spawnElevRad);
    const distance = config.targets.minSpawnDistance + Math.random() * (config.targets.maxSpawnDistance - config.targets.minSpawnDistance);
    var position = new THREE.Vector3().addVectors(fpsControls.position(), new THREE.Vector3(distance*spawnDir.x, distance*spawnDir.y, distance*spawnDir.z));
    const size = randInRange(config.targets.minSize, config.targets.maxSize);
    if(position.y - size < 0) position.y = 1.1 * size;                       // Keep target spawn position above the floor
    const velocity = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize().multiplyScalar(randInRange(config.targets.minSpeed, config.targets.maxSpeed));
    const changeTime = randInRange(config.targets.minChangeTime, config.targets.maxChangeTime);
    makeTarget(position, size, velocity, config.targets.fullHealthColor, changeTime);
  }
  referenceTarget = reference;
}

/**
 * Create a new random parametrized target and add it to the scene
 * @param {The position for the target to spawn at} spawnPosition 
 * @param {The radial size of the (spherical) target} targetRadius 
 * @param {The (initial) velocity for the target} velocity 
 * @param {The (initial) color of the target} targetColor 
 * @param {The time between target motion randomizations} timeToChange 
 */
function makeTarget(spawnPosition, targetRadius = 1, velocity = new THREE.Vector3(0,0,0), targetColor = new THREE.Color(0,1,0), timeToChange = Infinity) {
  var targetMat = new THREE.MeshPhongMaterial({color:targetColor});
  var target = new THREE.Mesh(new THREE.SphereGeometry(targetRadius, 10, 10), targetMat);
  target.castShadow = true;

  // Extra fields
  target.radius = targetRadius;    
  target.position.set(spawnPosition.x, spawnPosition.y, spawnPosition.z);
  target.velocity = velocity;
  target.timeToNextChange = timeToChange;
  target.health = 1.0;
  target.duration = 0;

  // Add to management and return
  targets.push(target);
  world.add(target);
  return target;
}

/**
 * Apply damage to a target based on a hit, and add particles
 * @param {The target to apply damage to} target 
 * @param {The world-space coordinate at which the target was hit} hitPoint 
 */
function damageTarget(target, hitPoint){
  target.health -= config.weapon.damagePerSecond * config.weapon.firePeriod;
  if(target.health <= 0 || referenceTarget) {
    destroyTarget(target);
    return true;
  }
  else {
    makeParticles(hitPoint, target.material.color, config.targets.particles.size, config.targets.particles.hitCount);
    target.material.color = new THREE.Color(config.targets.fullHealthColor).lerp(new THREE.Color(config.targets.minHealthColor), 1-target.health);
    return false;
  }
}

/**
 * Destroy a target, and add particles
 * @param {The target to destroy} target 
 * @param {Show particles when this target is destroyed?} showParticles 
 */
function destroyTarget(target, showParticles=true){
  if(!targets.includes(target)) return false;
  if(showParticles) { makeParticles(target.position, target.material.color, config.targets.particles.size, config.targets.particles.destroyCount, 0.3); }
  world.remove(target);
  targets.splice(targets.indexOf(target), 1);
}

// Target dir visualization
//var targetDirs = []
//const lineMat = new THREE.LineBasicMaterial({color:'#ff0000'})

/**
 * Update the targets based on a simulation time step
 * @param {The simulation time step/change} dt 
 */
function updateTargets(dt) {
  var raycaster = new THREE.Raycaster();

  for(var i = 0; i < targets.length; i++){
    var target = targets[i];
    var canChangeVelocity = true;

    const widthBound = config.targets.keepInSceneMinDistance ? config.scene.boxes.minDistanceToPlayer : config.scene.width/2;
    const depthBound = config.targets.keepInSceneMinDistance ? config.scene.boxes.minDistanceToPlayer : config.scene.depth/2;

    // Keep target "in" the scene bounds
    if(Math.abs(target.position.x) > widthBound){ 
      target.velocity.x = -target.velocity.x; 
      canChangeVelocity = false; 
    }
    if(target.position.y < target.radius || target.position.y > config.player.height * 5) {     // Don't let targets get to higher than 5x the player height
      target.velocity.y = -target.velocity.y;
      canChangeVelocity = false;
    }
    if(Math.abs(target.position.z) > depthBound){ 
      target.velocity.z = -target.velocity.z; 
      canChangeVelocity = false;
    }

    if(config.targets.collisionDetection && canChangeVelocity){        // Perform target collision detection (optionally)
      // Target direction visualization
      //scene.remove(targetDirs[i]);
      //const velVec = new THREE.Vector3().copy(target.velocity).multiplyScalar(100);
      //dirGeom = new THREE.Geometry(); dirGeom.vertices.push(target.position); dirGeom.vertices.push(new THREE.Vector3().addVectors(target.position, velVec));
      //targetDirs[i] = new THREE.Line(dirGeom, lineMat); scene.add(targetDirs[i])
      
      // Ray cast for collision
      const velNorm = new THREE.Vector3().copy(target.velocity).normalize();
      raycaster.set(target.position, velNorm);
      var intersects = raycaster.intersectObjects(world.children);
      // Check if we are within a simulation step of the intersection
      if(intersects.length > 0 && intersects[0].distance <= (target.radius + dt * target.velocity.length())){  
        var beforeVel = new THREE.Vector3();
        beforeVel.copy(target.velocity); 
        target.velocity.reflect(intersects[0].face.normal);
        canChangeVelocity = false;
      }
    }

    // Check for time to change velocity
    target.timeToNextChange -= dt;
    if(target.timeToNextChange <= 0 && canChangeVelocity){
      target.velocity = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize().multiplyScalar(randInRange(config.targets.minSpeed, config.targets.maxSpeed));
      target.timeToNextChange = randInRange(config.targets.minChangeTime, config.targets.maxChangeTime);
    }

    target.duration += dt;

    // Update position based on velocity
    target.position.add(new THREE.Vector3(target.velocity.x * dt, target.velocity.y * dt, target.velocity.z * dt));
  }
}