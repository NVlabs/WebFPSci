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

// Configuration

// Method to get from URL params (if present)
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

function getURLParamIfPresent(name, defaultValue){
  var value = defaultValue;
  if(urlParams.has(name)) {
    // Special case for handling boolean strings
    if (typeof defaultValue == "boolean"){     
        value = (urlParams.get(name).toLowerCase() == 'true');
        // Warning message for other strings as booleans
        if(!value && urlParams.get(name).toLowerCase() != 'false') {
          console.warn('Value "%s" (specified for boolean URL parameter "%s") is not "true" or "false" but should be, interpreting as "false"!', urlParams.get(name), name);
        }
    }
    else { // Default case for type conversion from default value
      value = defaultValue.constructor(urlParams.get(name));
    }
    console.log(name, value);   // Log settings to the console
  }
  return value;
}

// Base config
var config = {

  render : { // Render configuration
    setFPS : getURLParamIfPresent('setFPS', false),               // Allow in application FPS setting (changes animation approach!)
    frameRate : getURLParamIfPresent('frameRate', 60),            // Frame rate to use (if setFPS is true only)
    frameDelay: getURLParamIfPresent('frameDelay', 0),            // Frame delay to apply to incoming user events
    hFoV : getURLParamIfPresent('hFoV', 103),                     // Horizontal camera field of view
    showStats : getURLParamIfPresent('showStats', false),         // Show rendering statistics (frame rate/time and memory widget)
    showBanner : getURLParamIfPresent('showBanner', true),        // Show the score banner
    fullscreen: getURLParamIfPresent('fullscreen', true),         // Show in fullscreen mode (if available)
    latewarp: getURLParamIfPresent('latewarp', false),            // Enable late warp

    c2p : { // Click-to-photon configuration
      show : getURLParamIfPresent('showC2P', false),               // Show the click to photon area
      vertPos : getURLParamIfPresent('c2pVertPos', 0.5),           // Set the vertical postiion along the left edge of the screen
      mode: getURLParamIfPresent('c2pMode', 'immediate'),          // Mode (either minimal system latency = "immediate" or including frame delay = "delayed")
      width: getURLParamIfPresent('c2pWidth', 0.2),                // Width of the click to photon area
      height: getURLParamIfPresent('c2pHeight', 0.2),              // Height of the click to photon area
      upColor : getURLParamIfPresent('c2pUpColor', '#222222'),     // Click to photon mouse down color
      downColor: getURLParamIfPresent('c2pDownColor', '#AAAAAA'),  // Click to photon mouse up color
    }
  },

  audio : { // Audio parameters
    fireSound : getURLParamIfPresent('playFireSound', true),       // Play shot sound?
    explodeSound : getURLParamIfPresent('playExplodeSound', true), // Play explode sound?
    delayMs: getURLParamIfPresent('audioDelayMs', 0),              // Audio delay in milliseconds
  },

  scene : { // Scene parameters
    skyColor : getURLParamIfPresent('skyColor', '#c6defa'),         // Skybox color
    useCubeMapSkyBox : getURLParamIfPresent('cubemapSky', false),   // Skybox use cube map?
    width : getURLParamIfPresent('sceneWidth', 1000),               // Width of the scene
    depth : getURLParamIfPresent('sceneDepth', 1000),               // Depth of the scene
    floorColor: getURLParamIfPresent('floorColor', '#756b5a'),      // Color of the floor

    fog : { // Fog parameters
      color: getURLParamIfPresent('fogColor', '#ffffff'),           // Fog color
      nearDistance: getURLParamIfPresent('fogNear', 0),             // Near distance for fog (no fog here) for linear interpolation
      farDistance: getURLParamIfPresent('fogFar', 1000),            // Far distance for fog (max fog here) for linear interpolation
    },
    
    walls : { // Map bounds (walls) configuration
      color: getURLParamIfPresent('wallColor', '#2a2713'),          // Color of the walls
      height: getURLParamIfPresent('wallHeight', 80),               // Height of the walls
    },
    
    boxes : { // Boxes (map geometry) configuration
      count: getURLParamIfPresent('boxCount', 200),                       // Number of boxes to create per scene
      minHeight: getURLParamIfPresent('boxMinHeight', 20),                // Minimum box height
      maxHeight: getURLParamIfPresent('boxMaxHeight', 100),               // Maximum box height
      width : getURLParamIfPresent('boxWidth', 20),                       // Box width (same for all)
      depth : getURLParamIfPresent('boxDepth', 20),                       // Box depth (same for all)
      distanceRange : getURLParamIfPresent('boxRange', 500),              // Range of distances over which to spawn boxes
      minDistanceToPlayer: getURLParamIfPresent('boxMinDistance', 80),    // Minimum distance from any box center to player spawn position (origin)
      color: getURLParamIfPresent('boxColor', '#ffffff'),                 // Base color for boxes
      colorScaleRange: getURLParamIfPresent('boxColorScale', 0.5),        // Amount to allow randomized scaling of color for each box
    },
  },

  player : { // Player configuration
    speed : getURLParamIfPresent('playerSpeed', 500),                       // Speed of player motion
    mouseSensitivity : getURLParamIfPresent('mouseSensitivity', 0.2),       // Mouse sensitivty for view direction
    invertY: getURLParamIfPresent('invertY', false),                        // Y inversion
    height : getURLParamIfPresent('playerHeight', 5),                       // Player view height
    jumpHeight : getURLParamIfPresent('playerJumpHeight', 250),             // Player jump height
    collisionDetection : getURLParamIfPresent('playerCollision', true),     // Perform collision detection within the scene? 
    collisionDistance : getURLParamIfPresent('playerCollisionDistance', 3), // Player collision distance (set to 0 for no collision)
  },

  reticle : { // Reticle configuration
    color : getURLParamIfPresent('reticleColor', '#000000'),                // Reticle color
    size : getURLParamIfPresent('reticleSize', 0.03),                       // Reticle base size
    gap : getURLParamIfPresent('reticleGap', 0.01),                         // Reticle base gap size
    thickness : getURLParamIfPresent('reticleThickness', 0.15),             // Reticle thickness (ratio of size)
    expandedScale : getURLParamIfPresent('reticleExpandScale', 2),          // Reticle expanded scale
    shrinkTime : getURLParamIfPresent('reticleShrinkTime', 0.3),           // Reticle shrink time after fire event
  },

  targets : { // Task target configuration
    count: getURLParamIfPresent('targetCount', 1),                              // Number of simultaneous targets         
    minSize : getURLParamIfPresent('targetMinSize', 0.5),                       // Minimum target size (uniform random in range)
    maxSize : getURLParamIfPresent('targetMaxSize', 3),                         // Maxmium target size (uniform random in range)
    minSpeed: getURLParamIfPresent('targetMinSpeed', 5),                        // Minimum target speed (uniform random in range)
    maxSpeed : getURLParamIfPresent('targetMaxSpeed', 15),                      // Maximum target speed (uniform random in range)
    minChangeTime : getURLParamIfPresent('targetMinChangeTime', 1),             // Minimum target direction change time (uniform random in range)
    maxChangeTime : getURLParamIfPresent('targetMaxChangeTime' , 3),            // Maximum target direction change tiem (uniform random in range)
    fullHealthColor : getURLParamIfPresent('targetMaxHealthColor', '#00ff00'),  // Color for full health target
    minHealthColor : getURLParamIfPresent('targetMinHealthColor', '#ff0000'),   // Color for min health 
    
    minSpawnDistance: getURLParamIfPresent('targetMinSpawnDistance', 20),   // Minimum target spawn distance
    maxSpawnDistance: getURLParamIfPresent('targetMaxSpawnDistance', 30),   // Maximum target spawn distance
    spawnAzimMinDeg : getURLParamIfPresent('targetSpawnMinAzim', 20),       // The minimum target spawn azimuth angle (symmetric, relative to current view direction)
    spawnAzimMaxDeg : getURLParamIfPresent('targetSpawnMaxAzim', 35),       // The maximum target spawn azimuth angle (symmetric, relative to current view direction)
    spawnElevMinDeg : getURLParamIfPresent('targetSpawnMinElev', 3),        // The minimum target spawn elevation angle (symmetric, relative to current view direction)
    spawnElevMaxDeg : getURLParamIfPresent('targetSpawnMaxElev', 10),       // The minimum target spawn elevation angle (symmetric, relative to current view direction)

    collisionDetection : getURLParamIfPresent('targetCollision', true),           // Target collision detection (bounce)
    collisionDistance : getURLParamIfPresent('targetCollisionDistance', 3),       // Target collision distance
    keepInSceneMinDistance: getURLParamIfPresent('keepTargetInClearning', true),  // Keep the target within the scene.boxes.minDistanceToPlayer

    reference : { // Reference target configuration
      size: getURLParamIfPresent('refTargetSize', 1),             // Reference target size
      distance: getURLParamIfPresent('refTargetDistance', 30),    // Reference target distance
    },

    particles : { // Particle effect configuration
      size: getURLParamIfPresent('particleSize', 0.4),                      // Particle size for hitting/destroying the target
      hitCount: getURLParamIfPresent('hitParticleCount', 25),               // Particle count for hitting the target
      destroyCount: getURLParamIfPresent('destroyParticleCount', 1000),     // Particle count for destroying the target
    }
  },

  weapon : { // Weapon configuration
    auto : getURLParamIfPresent('weaponAuto', false),               // Automatic firing (hold mouse to fire?)
    firePeriod : getURLParamIfPresent('weaponFirePeriod', 0.1),     // Fire period limit (minimum time between shots)
    damagePerSecond : getURLParamIfPresent('weaponDPS', 10),        // Damage per second (per shot = damagePerSecond * fireRate)
    scoped : getURLParamIfPresent('weaponScope', false),            // Allow "scoped" or zoomed view?
    toggleScope : getURLParamIfPresent('weaponScopeToggle', true),  // Toggle scope with left mouse? (false means hold left mouse for scope)
    scopeFov : getURLParamIfPresent('weaponScopeFoV', 50),          // Field of view when scoped
    fireSpread: getURLParamIfPresent('weaponFireSpread', 0.5),      // Fire spread (symmetric in degrees)
    missParticles: getURLParamIfPresent('weaponMissParticles', true), // Does weapon draw miss particles
    missParticleSize: getURLParamIfPresent('weaponMissParticleSize', 0.2), // Size of miss particles
    missParticleCount: getURLParamIfPresent('weaponMissParticleCount', 50), // Count of miss particles                  
  }
};

function exportConfig(){
  var a = document.createElement('a');
  a.download = "config.json";
  a.href = "data: text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, '\t'));
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

const configInput = document.getElementById('configInput');
configInput.addEventListener("change", importConfig);

function importConfig(e){
  var fr = new FileReader();
  fr.onload = function(e){
    config = JSON.parse(e.target.result);
    makeGUI();
  }
  fr.readAsText(e.target.files[0]);
}
