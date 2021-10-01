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

// Frame timing information
const numFrameTimes = 100;        // Number of frame times to store
var frameTimeValid = false;       // Has the frame time converged?
var frameTimes = [];              // Recent frame times

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

const GameInputEventType = Object.freeze({
  "FIRE":{},
  "FIRE_END":{},
  "JUMP":{},
  "TOGGLE_SCOPE":{},
  "DESIRED_VELOCITY":{},
  "DESIRED_CAMERA_ROTATION":{},
});

var RawInputState = function (frameDelay = config.render.frameDelay) {
  var scope = this;
  scope.enabled = false;
  scope.perFrameEventQueue = [];
  scope.frameEvents = []
  scope.playerVelocity = new THREE.Vector3();
  scope.cameraPosition = new THREE.Vector3();
  scope.cameraRotation = new THREE.Euler(0.0, 0.0, 0.0, "ZYX"); // Euler angles of the camera
  scope.frameDelay = Math.round(frameDelay);

  var moveForward = false; var moveBackward = false; var moveLeft = false; var moveRight = false;
  var run = false;

  scope.update = function ( dt ) {
    scope.perFrameEventQueue.push(scope.frameEvents)
    scope.frameEvents = [];
  };

  scope.getDelayedFrameEvents = function () {
    // Remove extras (e.g. scope.frameDelay was just reduced)
    // The +1 is to always allow one frame of events through even when the delay is zero.
    while (scope.perFrameEventQueue.length > scope.frameDelay + 1) {
      scope.perFrameEventQueue.shift();
    }

    // Return an empty array if not enough frames in the delay queue yet
    if (scope.perFrameEventQueue.length < scope.frameDelay + 1) {
      return [];
    }

    return scope.perFrameEventQueue.shift();
  };

  scope.pushVelocity = function(){
    // Update direction (in XZ plane)
    scope.playerVelocity.z = Number( moveBackward ) - Number( moveForward );
    scope.playerVelocity.y = 0;
    scope.playerVelocity.x = Number( moveLeft ) - Number( moveRight );
    scope.playerVelocity.normalize();
    scope.playerVelocity.multiplyScalar(config.player.speed);
    scope.frameEvents.push({"type": GameInputEventType.DESIRED_VELOCITY, "data": scope.playerVelocity.clone()});
  };

  scope.onMouseDown = function(event) {
    if(event.button == 0){
      if(config.render.c2p.mode == 'immediate') c2p.material.color = new THREE.Color(config.render.c2p.downColor);    // Handle "immediate" updates for click-to-photon
      scope.frameEvents.push({"type": GameInputEventType.FIRE});
    }
    if(event.button == 2) {
      scope.frameEvents.push({"type": GameInputEventType.TOGGLE_SCOPE});
    }
  }

  scope.onMouseUp = function(event) {
    if(event.button == 0){
      scope.frameEvents.push({"type": GameInputEventType.FIRE_END});
      if(config.render.c2p.mode == 'immediate') c2p.material.color = new THREE.Color(config.render.c2p.upColor);
    }
    if(event.button == 2 && !config.weapon.toggleScope) {
      scope.frameEvents.push({"type": GameInputEventType.TOGGLE_SCOPE});
    }
  }

  scope.onMouseMove = function(event){
    var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || false;
    var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || false;

    scope.cameraRotation.y -= movementX * config.player.mouseSensitivity / 100;
    if (scope.cameraRotation.y > 2*Math.PI) scope.cameraRotation.y -= 2*Math.PI;
    if (scope.cameraRotation.y < 0) scope.cameraRotation.y += 2*Math.PI;
    //if (scope.cameraRotation.y < -Math.PI) scope.cameraRotation.y += Math.PI;
    scope.cameraRotation.x -= movementY * config.player.mouseSensitivity / 100 * (config.player.invertY ? -1 : 1);
    scope.cameraRotation.x = Math.max( -Math.PI/2, Math.min( Math.PI/2, scope.cameraRotation.x ) );
    scope.frameEvents.push({"type": GameInputEventType.DESIRED_CAMERA_ROTATION, "data": scope.cameraRotation.clone()});
  };

  scope.onKeyDown = function(event){
    switch ( event.keyCode ) {
      case 38: // up
      case 87: // w
        moveForward = true;
        scope.pushVelocity();
        break;

      case 37: // left
      case 65: // a
        moveLeft = true;
        scope.pushVelocity();
        break;

      case 40: // down
      case 83: // s
        moveBackward = true;
        scope.pushVelocity();
        break;

      case 39: // right
      case 68: // d
        moveRight = true;
        scope.pushVelocity();
        break;

      case 32: // space
        scope.frameEvents.push({"type": GameInputEventType.JUMP});
        break;

      case 16: // shift
        run = true;
        scope.pushVelocity();
        break;
    }
  };

  scope.onKeyUp = function(event){
    switch (event.keyCode) {
      case 38: // up
      case 87: // w
        moveForward = false;
        scope.pushVelocity();
        break;
      case 37: // left
      case 65: // a
        moveLeft = false;
        scope.pushVelocity();
        break;

      case 40: // down
      case 83: // s
        moveBackward = false;
        scope.pushVelocity();
        break;

      case 39: // right
      case 68: // d
        moveRight = false;
        scope.pushVelocity();
        break;

      case 16: // shift
        run = false;
        scope.pushVelocity();
        break;
    }
  };
  
  scope.enable = function ( enable ) {
    console.assert(scope.enabled != enable, "RawInputState already has this enable state");
    scope.enabled = enable;
    var addOrRemoveEventListener = enable ? document.addEventListener : document.removeEventListener;
    addOrRemoveEventListener( 'mousedown', scope.onMouseDown, false );
    addOrRemoveEventListener( 'mouseup', scope.onMouseUp, false);
    addOrRemoveEventListener( 'mousemove', scope.onMouseMove, false );
    addOrRemoveEventListener( 'keydown', scope.onKeyDown, false );
    addOrRemoveEventListener( 'keyup', scope.onKeyUp, false );
  }
};

/**
 * Create a new first person controls object to handle user interaction
 * @param {The camera to associate with the controls} camera 
 * @param {The scene to use for bounds/collision} scene 
 * @param {The height the player should jump when space is pressed} jumpHeight 
 * @param {The height of the player} height 
 */

THREE.FirstPersonControls = function ( camera, scene, jumpHeight = config.player.jumpHeight, height = config.player.height) {
  var scope = this;
  scope.scene = scene;
  scope.height = height;
  scope.jumpHeight = scope.height + jumpHeight;
  scope.enabled = false;

  var canJump = false;

  raycaster = new THREE.Raycaster(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3())); 

  var velocity = new THREE.Vector3();
  var desiredVelocity = new THREE.Vector3();

  var prevTime = performance.now();

  camera.rotation.set( 0, 0, 0 );

  var pitchObject = new THREE.Object3D();
  pitchObject.add( camera );

  var yawObject = new THREE.Object3D();
  yawObject.add( pitchObject );
  yawObject.position.y = height;

  scope.processGameInputEvent = function ( event )
  {
    switch (event.type) {
    case GameInputEventType.FIRE:
      clickShot = true;
      if(config.render.c2p.mode == 'delayed') c2p.material.color = new  THREE.Color(config.render.c2p.downColor);
      break;
    case GameInputEventType.FIRE_END:
      clickShot = false;
      if(config.render.c2p.mode == 'delayed') c2p.material.color = new THREE.Color(config.render.c2p.upColor);
      break;
    case GameInputEventType.JUMP:
      // TODO: match run+jump height boost
      //if ( canJump === true ) velocity.y += run === false ? scope.jumpHeight : scope.jumpHeight + 50;
      if ( canJump === true ) velocity.y += scope.jumpHeight;
      canJump = false;
      break;
    case GameInputEventType.TOGGLE_SCOPE:
      if(config.weapon.scoped){
        inScopeView = !inScopeView;
        camera.fov = (inScopeView ? config.weapon.scopeFov : config.render.hFoV) / camera.aspect;
        camera.updateProjectionMatrix();
      }
      break;
    case GameInputEventType.DESIRED_VELOCITY:
      desiredVelocity = event.data;
      break;
    case GameInputEventType.DESIRED_CAMERA_ROTATION:
      pitchObject.rotation.x = event.data.x;
      yawObject.rotation.y = event.data.y;
      break;
    }
  }

  scope.resetViewDir = function(){
    yawObject.rotation.y = 0;
    pitchObject.rotation.x = 0;
  }

  /**
   * Process (queued) events to enforce input delay
   */
  scope.processDelayedEvents = function( events ){
    events.forEach(scope.processGameInputEvent);
  };

  /**
   * Get the object that represents the position/rotation of the camera
   */
  scope.getObject = function () {
    return yawObject;
  };

  scope.getViewAzim = function() {
    return yawObject.rotation.y;
  }

  scope.getViewElev = function() {
    return pitchObject.rotation.x;
  }

  /**
   * Get the position of the player
   */
  scope.position = function() {
    return scope.getObject().position;
  };

  /**
   * Update function (called once per simulation cycle)
   */
  scope.update = function () {
    if(scope.enabled === false) {               // Don't update when player controls aren't enabled
      scope.position().y = scope.height;
      velocity.x = 0; velocity.y = 0; velocity.z = 0;
      return;
    }

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;     // Get time delta for simulation

    // Update velocity vector
    velocity.y -= 9.8 * 100.0 * delta;          // Accelerate due to gravity in 
    velocity.x -= velocity.x * 10.0 * delta;    // Decellerate in X/Y
    velocity.z -= velocity.z * 10.0 * delta;

    // Update velocity based on (camera frame relative) direction
    velocity.addScaledVector(desiredVelocity, delta);

    // Collision detection
    if(config.player.collisionDetection){
      var worldDirection = new THREE.Vector3(-desiredVelocity.x, 0, desiredVelocity.z).applyEuler(yawObject.rotation).normalize();
      raycaster.set(camera.getWorldPosition(new THREE.Vector3()), worldDirection);
      var intersects = raycaster.intersectObjects(scope.scene.children);
      // Collision test (only with non-targets at less than the collision distance)
      if(intersects.length > 0 && !targets.includes(intersects[0].object) && intersects[0].distance <= config.player.collisionDistance) {
        // Collision occurred, stop motion in this direction
        const collisionNormal = intersects[0].face.normal.applyEuler(yawObject.rotation);   // Compute the collision normal (in player space)
        velocity.sub(collisionNormal.multiplyScalar(collisionNormal.dot(velocity)));        // Subtract the component of the (player space) velocity along the collision normal
      }
    }

    // Apply translation
    scope.getObject().translateX( -velocity.x * delta );
    scope.getObject().translateZ( velocity.z * delta );
    scope.position().y += ( velocity.y * delta );

    if(config.player.collisionDetection){
      // Keep the user on the ground using a downward ray cast
      raycaster.set(camera.getWorldPosition(new THREE.Vector3()), new THREE.Vector3(0, -1, 0)); 
      var intersects = raycaster.intersectObjects(scope.scene.children);                      // Ray cast straight down
      if(intersects.length > 0 && intersects[0].distance <= config.player.height + 0.01){    // Check for intersect below us
        if(velocity.y < 0) {          // Handle case where we are "falling through" the floor (not jumping off it)
          velocity.y = 0;             // Zero the (negative) velocity for next time
          scope.position().y = intersects[0].point.y + scope.height;    // Set the height based on the collision point
        }
        canJump = true;
      }
    }

    // Keep player on the floor (fallback case)
    if ( scope.position().y < scope.height ) {  
      scope.position().y = scope.height;
      velocity.y = 0;
      canJump = true;
    }

    // Keep the user within the walls (not considered collision detection)
    const wallSpace = 2;
    if (Math.abs(scope.position().x) > config.scene.width/2 - wallSpace){
      velocity.x = 0;
      scope.position().x = Math.sign(scope.position().x) * (config.scene.width/2 - wallSpace);
    }
    if(Math.abs(scope.position().z) > config.scene.depth/2 - wallSpace){
      velocity.z = 0;
      scope.position().z = Math.sign(scope.position().z) * (config.scene.depth/2 - wallSpace);
    }

    prevTime = time;
  };

  /**
   * Dispose of the object
   */
  scope.dispose = function() {
    document.removeEventListener( 'mousemove', onMouseMove, false );
    document.removeEventListener( 'keydown', onKeyDown, false );
    document.removeEventListener( 'keyup', onKeyUp, false );
  };
};

const instructions = document.getElementById("instructions");   // Get instructions division (overlay when FPS controls aren't enabled)

var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;      // Check for pointer lock option
if ( havePointerLock ) {
  var element = document.body;    // Get the document body

  /**
   * Handle a change in the pointer lock state
   * @param {Pointer lock change event} event 
   */
  var pointerlockchange = function ( event ) {
    if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {
      if (!fpsControls.enabled)
        rawInputState.enable(true);
      fpsControls.enabled = true;
      instructions.style.display = 'none';
    } else {
      if (fpsControls.enabled)
        rawInputState.enable(false);
      fpsControls.enabled = false;
      instructions.style.display = '-webkit-box';
    }
    dat.GUI.toggleHide();
  };

  /**
   * Handle errors in pointer lock
   * @param {Pointer lock error event} event 
   */
  var pointerlockerror = function ( event ) {
    instructions.style.display = '';
  };

  // Add pointer lock change/error listeners
  document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
  document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

  // Click handler for pointer lock
  instructions.addEventListener( 'click', function ( event ) {
    element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
    if ( /Firefox/i.test( navigator.userAgent ) ) {   // Firefox specific features
      /**
       * Handler for full screen change event
       * @param {Fullscreen change event} event 
       */
      var fullscreenchange = function ( event ) {
        if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
          document.removeEventListener( 'fullscreenchange', fullscreenchange );
          document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
          element.requestPointerLock();
        }
      };
      document.addEventListener( 'fullscreenchange', fullscreenchange, false );
      document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
      element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
      element.requestFullscreen();
    } 
    else {                            // Non Firefox browsers here
      if(config.render.fullscreen) { element.requestFullscreen(); }   // Optionally request fullscreen
      element.requestPointerLock();   // For other browsers just request pointer lock
    }
  }, false );
} 
else {    // Let the user know their browser doesn't support pointer lock
  instructions.innerHTML = '<h1>Your browser does not suport PointerLock!</h1>';
}

/**
 * Handle keypresses from the application
 * @param {Application level keypress} event 
 */
var keyDownHandler = function (event) {
  switch ( event.keyCode ) {
    case 82:  // R key press
      resetBannerStats();
      break;
  }

}
document.addEventListener( 'keydown', keyDownHandler, false);

/**
 * Draw a random number from a range
 * @param {Lower bound} min 
 * @param {Upper bound} max 
 */
function randInRange(min, max) { return (max - min) * Math.random() + min; }

/** Random sign (±1) */
function randSign() { return Math.random() < 0.5 ? -1 : 1; }

// Target management
var targets = [];

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

// Particle Effects
/**
 * Generate a random position at a given radius (from the origin)
 * @param {Radial distance} radius 
 * @returns Random position at distance
 */
function randomPosition(radius) {
  radius = radius * Math.random();
  const theta = Math.random() * 2.0*Math.PI;
  const phi = Math.random() * Math.PI;
  return [radius * Math.sin(phi) * Math.cos(theta), radius * Math.sin(phi) * Math.sin(theta), radius * Math.cos(phi)];
}

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

// GUI Management
/**
 * Routine for disabling dat.gui elements
 * @param {The element to enable/disable} guiElement 
 * @param {Control for whether to enable/disable the element} enabled 
 */
function setGuiElementEnabled(guiElement, enabled) {
  guiElement.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
  guiElement.domElement.style.opacity = enabled ? 1 : 0.5;
}

var gui;
/**
 * Create the dat.gui user controls
 */
function makeGUI() {
  var guiClosed = true;
  if(gui) {
    guiClosed = gui.closed;
    gui.destroy();
  }
  gui = new dat.GUI();

  // Render controls
  var renderControls = gui.addFolder('Rendering');
  renderControls.add(config.render, 'showStats').name('Show Stats').listen().onChange(function(value){
    statsContainer.style.visibility = config.render.showStats ? 'visible' : 'hidden';
  });
  renderControls.add(config.render, 'fullscreen').name('Fullscreen?').listen();
  statsContainer.style.visibility = config.render.showStats ? 'visible' : 'hidden';
  renderControls.add(config.render, 'setFPS').name('Set FPS').listen().onChange(function(value){
    setGuiElementEnabled(fpsSlider, value);
  });
  var fpsSlider = renderControls.add(config.render, 'frameRate', 1, 360, 1).name('Frame Rate').listen();
  setGuiElementEnabled(fpsSlider, config.render.setFPS);
  renderControls.add(config.render, 'frameDelay', 0, 100, 1).name('Frame Delay').listen().onChange(function(value) {
    config.render.frameDelay = Math.round(value);
    rawInputState.frameDelay = config.render.frameDelay;
  });
  renderControls.add(config.render, 'latewarp').name('Late Warp?').listen().onChange(function(value){
    drawReticle();
  });
  renderControls.add(config.render, 'hFoV', 10, 130, 1).name('Field of View').listen().onChange(function(value){
    camera.fov = value / camera.aspect;
    camera.updateProjectionMatrix();
    drawC2P();
  });
  renderControls.add(config.render, 'showBanner').name('Show Banner').listen().onChange(function(value){
    bannerDiv.style.visibility = value ? 'visible' : 'hidden';
  })
  renderControls.add(config.render.c2p, 'show').name('Click-to-photon').listen().onChange(function(value){
    value ? c2pControls.open() : c2pControls.close();
    setGuiElementEnabled(c2pControls, value);
    drawC2P();
  })

  var c2pControls = renderControls.addFolder('Click-to-Photon');
  c2pControls.add(config.render.c2p, 'mode', ['immediate', 'delayed']).name('Mode').listen().onChange(drawC2P);
  c2pControls.add(config.render.c2p, 'vertPos', 0, 1).step(0.01).name('Vert Pos').listen().onChange(drawC2P);
  c2pControls.add(config.render.c2p, 'width', 0.01, 1).step(0.01).name('Width').listen().onChange(drawC2P);
  c2pControls.add(config.render.c2p, 'height', 0.01, 1).step(0.01).name('Height').listen().onChange(drawC2P)
  c2pControls.addColor(config.render.c2p, 'upColor').name('Up Color').listen();
  c2pControls.addColor(config.render.c2p, 'downColor').name('Down Color').listen();
  setGuiElementEnabled(c2pControls, config.render.c2p.show);
  renderControls.open();

  // Audio controls
  var audioControls = gui.addFolder('Audio');
  audioControls.add(config.audio, 'fireSound').name('Fire Audio?').listen();
  audioControls.add(config.audio, 'explodeSound').name('Explode Audio?').listen();
  audioControls.add(config.audio, 'delayMs', 0, 2000).name('Audio Delay (ms)').listen();

  // Scene controls
  var sceneControls = gui.addFolder('Scene');
  sceneControls.add(config.scene, 'width', 100, 4000).step(100).name('Scene Width').listen().onChange(function(value){
    if(config.scene.boxes.distanceRange > value/2) config.scene.boxes.distanceRange = value/2;
  });
  sceneControls.add(config.scene, 'depth', 100, 4000).step(100).name('Scene Depth').listen().onChange(function(value){
    if(config.scene.boxes.distanceRange > value/2) config.scene.boxes.distanceRange = value/2;
  });
  sceneControls.addColor(config.scene, 'skyColor').name('Sky Color').listen().onChange(updateSceneBackground);
  sceneControls.add(config.scene, 'useCubeMapSkyBox').name('Cubemap Sky').listen().onChange(updateSceneBackground);
  sceneControls.addColor(config.scene, 'floorColor').name('Floor Color').listen().onChange(function(value){
    floor.material.color = new THREE.Color(value);
  });

  var fogControls = sceneControls.addFolder('Fog');
  fogControls.add(config.scene.fog, 'nearDistance', 0, 4000).step(10).name('Near Distance').listen().onChange(function(value){
    if(config.scene.fog.farDistance < value) config.scene.fog.farDistance = value;
    scene.fog = new THREE.Fog(config.scene.fog.color, config.scene.fog.nearDistance, config.scene.fog.farDistance);
  });
  fogControls.add(config.scene.fog, 'farDistance', 10, 4000).step(10).name('Fog Distance').listen().onChange(function(value){
    if(config.scene.fog.nearDistance > value) config.scene.fog.nearDistance = value;
    scene.fog = new THREE.Fog(config.scene.fog.color, config.scene.fog.nearDistance, config.scene.fog.farDistance);
  });
  fogControls.addColor(config.scene.fog, 'color').name('Color').listen().onChange(function(value){
    scene.fog = new THREE.Fog(config.scene.fog.color, config.scene.fog.nearDistance, config.scene.fog.farDistance);
  });

  var wallControls = sceneControls.addFolder('Walls');
  wallControls.add(config.scene.walls, 'height', 1, 300).step(1).name('Height').listen().onChange(makeWalls);
  wallControls.addColor(config.scene.walls, 'color').name('Color').listen().onChange(makeWalls);

  var boxControls = sceneControls.addFolder('Boxes');
  boxControls.add(config.scene.boxes, 'count', 1, 1000).name('# of Boxes').listen();
  boxControls.add(config.scene.boxes, 'width', 1, 100).step(1).name('Width').listen();
  boxControls.add(config.scene.boxes, 'depth', 1, 100).step(1).name('Depth').listen();
  boxControls.add(config.scene.boxes, 'minHeight', 1, 200).name('Min Height').listen().onChange(function(value){
    if(config.scene.boxes.maxHeight < value) config.scene.boxes.maxHeight = value;
  });
  boxControls.add(config.scene.boxes, 'maxHeight', 1, 200).name('Max Height').listen().onChange(function(value){
    if(config.scene.boxes.minHeight > value) config.scene.boxes.minHeight = value;
  });
  boxControls.add(config.scene.boxes, 'minDistanceToPlayer', 10, 1000).step(10).name('Min Distance').listen().onChange(function(value){
    if(config.scene.boxes.distanceRange < value) config.scene.boxes.distanceRange = value;
  });
  boxControls.add(config.scene.boxes, 'distanceRange', 10, 1000).step(10).name('Max Distance').listen().onChange(function(value){
    if(config.scene.boxes.minDistanceToPlayer > value) config.scene.boxes.minDistanceToPlayer = value;
    if(config.scene.width < 2*value) config.scene.width = 2*value;
    if(config.scene.depth < 2*value) config.scene.depth = 2*value;
  });
  boxControls.addColor(config.scene.boxes, 'color').name('Base Color');
  boxControls.add(config.scene.boxes, 'colorScaleRange', 0, 1).step(0.01).name('Color Scale').listen();

  var updateScene = {update: makeScene};
  sceneControls.add(updateScene, 'update').name('Create Scene');

  // Player controls
  var playerControls = gui.addFolder('Player');
  playerControls.add(config.player, 'mouseSensitivity', 0, 1).step(0.01).name('Mouse Sens.').listen();
  playerControls.add(config.player, 'invertY').name('Invert Y?').listen();
  playerControls.add(config.player, 'height', 1, 100).step(1).name('Play Height').listen().onChange(function(value) {
    fpsControls.height = value;
    camera.updateProjectionMatrix();
  });
  playerControls.add(config.player, 'speed', 0, 1000).step(1).name('Speed').listen().onChange(function(value) {
    fpsControls.speed = value;
  });
  playerControls.add(config.player, 'jumpHeight', 0, 500).step(1).name('Jump Height').listen().onChange(function(value) {
    fpsControls.jumpHeight = value;
  });
  playerControls.add(config.player, 'collisionDetection').name('Collision').listen();

  // Reticle controls
  var reticleControls = playerControls.addFolder('Reticle');
  reticleControls.addColor(config.reticle, 'color').name('Reticle Color').listen().onChange(drawReticle);
  reticleControls.add(config.reticle, 'size', 0, 0.5).step(0.01).name('Size').listen().onChange(drawReticle);
  reticleControls.add(config.reticle, 'gap', 0, 0.5).step(0.01).name('Gap').listen().onChange(drawReticle);
  reticleControls.add(config.reticle, 'thickness', 0.001, 0.5).step(0.001).name('Line width').listen().onChange(drawReticle);
  reticleControls.add(config.reticle, 'expandedScale', 1, 10).step(0.1).name('Expanded Scale').listen();
  reticleControls.add(config.reticle, 'shrinkTime', 0, 3).step(0.1).name('Shrink Time (s)').listen();
  // Not currently supported...

  // Target controls
  var targetControls = gui.addFolder('Target');
  targetControls.add(config.targets, 'count', 1, 10).step(1).name('Target Count').listen().onChange(function(value) {
    if(referenceTarget) return;     // Don't spawn new targets during reference
    if(value > targets.length){    
      while(targets.length < value) { spawnTarget(); }     // Add targets if we have to few
    }
    else if(value < targets.length){  
      while(targets.length > value){ destroyTarget(targets[targets.length-1], false); } // Remove targets if we have too many
    }
  });
  var targetColorControls = targetControls.addFolder('Color');
  targetColorControls.addColor(config.targets, 'fullHealthColor').name('Full Health').listen();
  targetColorControls.addColor(config.targets, 'minHealthColor').name('Min Health').listen();
  var targetSpawnControls = targetControls.addFolder('Spawn Location');
  targetSpawnControls.add(config.targets, 'spawnAzimMinDeg', 0, 90).name('Min Spawn Azim').listen().onChange(function(value) {
    if(value > config.targets.spawnAzimMaxDeg) config.targets.spawnAzimMaxDeg = value;
  });
  targetSpawnControls.add(config.targets, 'spawnAzimMaxDeg', 0, 90).name('Max Spawn Azim').listen().onChange(function(value){
    if(value < config.targets.spawnAzimMinDeg) config.targets.spawnAzimMinDeg = value;
  });
  targetSpawnControls.add(config.targets, 'spawnElevMinDeg', 0, 90).name('Min Spawn Elev').listen().onChange(function(value){
    if(value > config.targets.spawnElevMaxDeg) config.targets.spawnElevMaxDeg = value;
  });
  targetSpawnControls.add(config.targets, 'spawnElevMaxDeg', 0, 90).name('Max Spawn Elev').listen().onChange(function(value){
    if(value < config.targets.spawnElevMinDeg) config.targets.spawnElevMinDeg = value;
  });
  targetSpawnControls.add(config.targets, 'minSpawnDistance', 0.1, 100).name('Min Distance').listen().onChange(function(value) {
    if(value > config.targets.maxSpawnDistance) config.targets.maxSpawnDistance = value;
  });
  targetSpawnControls.add(config.targets, 'maxSpawnDistance', 0.1, 100).name('Max Distance').listen().onChange(function(value) {
    if(value < config.targets.minSpawnDistance) config.targets.minSpawnDistance = value;
  });
  var targetSizeControls = targetControls.addFolder("Size");
  targetSizeControls.add(config.targets, 'minSize', 0.1, 10).step(0.1).name('Min Size').listen().onChange(function(value) {
    if(config.targets.maxSize < value) config.targets.maxSize = value; 
  });
  targetSizeControls.add(config.targets, 'maxSize', 0.1, 10).step(0.1).name('Max Size').listen().onChange(function(value) {
    if(config.targets.minSize > value) config.targets.minSize = value; 
  });
  var targetMoveControls = targetControls.addFolder("Movement");
  targetMoveControls.add(config.targets, 'minSpeed', 0, 100).step(0.1).name('Min Speed').listen().onChange(function(value){
    if(config.targets.maxSpeed < value) config.targets.maxSpeed = value; 
  });
  targetMoveControls.add(config.targets, 'maxSpeed', 0, 100).step(0.1).name('Max Speed').listen().onChange(function(value){
    if(config.targets.minSpeed > value) config.targets.minSpeed = value; 
  });
  targetMoveControls.add(config.targets, 'minChangeTime', 0.1, 10).step(0.1).name('Min Change Time').listen().onChange(function(value){
    if(config.targets.maxChangeTime < value) config.targets.maxChangeTime = value;
  });
  targetMoveControls.add(config.targets, 'maxChangeTime', 0.1, 10).step(0.1).name('Max Change Time').listen().onChange(function(value){
    if(config.targets.minChangeTime > value) config.targets.minChangeTime = value;
  });
  targetMoveControls.add(config.targets, 'keepInSceneMinDistance').name('Keep in clearing').listen();

  var targetParticleControls = targetControls.addFolder('Particles');
  targetParticleControls.add(config.targets.particles, 'size', 0.01, 1).step(0.01).name('Size').listen();
  targetParticleControls.add(config.targets.particles, 'hitCount', 1, 1000).step(1).name('Hit Count').listen();
  targetParticleControls.add(config.targets.particles, 'destroyCount', 1, 4000).step(1).name('Destroy Count').listen();
  
  var referenceTargetControls = targetControls.addFolder('Reference');
  referenceTargetControls.add(config.targets.reference, 'size', 0.1, 10, 0.1).name('Size').listen();
  referenceTargetControls.add(config.targets.reference, 'distance', 0.1, 100, 0.1).name('Distance').listen();

  // Weapon controls
  var weaponControls = gui.addFolder('Weapon');
  weaponControls.add(config.weapon, 'auto').name('Automatic');
  weaponControls.add(config.weapon, 'firePeriod', 0, 2).step(0.01).name('Fire Period (s)').listen();
  weaponControls.add(config.weapon, 'damagePerSecond', 0, 100).step(0.01).name('Damagge/s').listen();
  weaponControls.add(config.weapon, 'fireSpread', 0, 45).step(0.1).name('Fire Spread (deg)').listen();
  weaponControls.add(config.weapon, 'scoped').name('Has Scope').listen().onChange(function(value){
    setGuiElementEnabled(scopeControls, value);
    value ? scopeControls.open() : scopeControls.close();
  });
  var scopeControls = weaponControls.addFolder('Scope');
  scopeControls.add(config.weapon, 'toggleScope').name('Toggle Scope').listen();
  scopeControls.add(config.weapon, 'scopeFov', 10, config.render.hFoV).step(1).name('Scope FoV').listen();
  setGuiElementEnabled(scopeControls, config.weapon.scoped);
  
  var importExport = gui.addFolder('Config Import/Export');
  var configExport = {update: exportConfig};
  var configImport = {update: function() { configInput.click(); }};
  importExport.add(configImport, 'update').name('Import Config');
  importExport.add(configExport, 'update').name('Export Config');

  if(guiClosed) gui.close();
}

const bannerDiv = document.getElementById("banner");      // Get the banner div from the HTML document

/**
 * Compute the average over an array
 */
Array.prototype.avg = function() {
  return this.reduce((sum,el) => sum + el, 0) / this.length;
}

/**
 * Update the score banner
 */
function updateBanner() {
  if (referenceTarget) {bannerDiv.innerHTML =  '<h1>Click to destroy the target!</h1>'; }
  else if(targets_destroyed == 0) { bannerDiv.innerHTML = '<h1>Destroyed: 0</h1><h1>Avg Time: N/A</h1><h1>Accuracy: N/A</h1>'; }
  else { 
    const time_per_target = target_times.avg();
    const accuracy = 100*hits / shots;
    bannerDiv.innerHTML = `<h1>Destroyed: ${targets_destroyed}</h1><h1>Avg Time: ${time_per_target.toFixed(3)}s</h1><h1>Accuracy: ${accuracy.toFixed(1)}%</h1>`; 
  }
}

/**
 * Reset the statistics stored for the score banner
 */
function resetBannerStats() {
  targets_destroyed = 0;
  target_times = [];
  shots = 0; hits = 0;
  updateBanner();
}

/**
 * Make the GUI and setup banner visibiility on window load
 */
window.onload = function() {
 makeGUI();
 bannerDiv.style.visibility = config.render.showBanner ? 'visible' : 'hidden';
};

/**
 * Handle window resize events (update the renderer/camera and click-to-photon region)
 */
function onWindowResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;

  renderer.setSize(w, h);
  
  camera.aspect = aspect; 
  camera.updateProjectionMatrix();

  warpCamera.left = -aspect/2; warpCamera.right = aspect/2;
  warpCamera.updateProjectionMatrix();

  drawReticle();
  drawC2P();
}

// Event listeners for mouse click
var clickShot = false;                            // Did a click occur?
var inScopeView = false;                          // Are we in a scoped view?

// Create the reticle
var reticleGroup = new THREE.Group();   // Group for storing reticle elements

/**
 * Draw the reticle (based on config parameters)
 */
function drawReticle(){
  camera.remove(reticleGroup); warpCamera.remove(reticleGroup);     // Remove any old recticle group (if one exists)
  reticleGroup = new THREE.Group();                                 // Create a new reticle group

  // Create material for the reticle (set color and thickness)
  const reticleMat = new MeshLineMaterial({color: config.reticle.color, lineWidth: config.reticle.thickness * config.reticle.size});

  // Vertical lines
  var line = new MeshLine();
  line.setPoints([new THREE.Vector3(0, config.reticle.size, 0), new THREE.Vector3(0, config.reticle.gap, 0)]);
  reticleGroup.add(new THREE.Mesh(line, reticleMat));

  line = new MeshLine();
  line.setPoints([new THREE.Vector3(0, -config.reticle.size, 0), new THREE.Vector3(0, -config.reticle.gap, 0)]);
  reticleGroup.add(new THREE.Mesh(line, reticleMat));

  // Horizontal lines
  line = new MeshLine();
  line.setPoints([new THREE.Vector3(config.reticle.size, 0, 0), new THREE.Vector3(config.reticle.gap, 0, 0)]);
  reticleGroup.add(new THREE.Mesh(line, reticleMat));

  line = new MeshLine();
  line.setPoints([new THREE.Vector3(-config.reticle.size, 0, 0), new THREE.Vector3(-config.reticle.gap, 0, 0)]);
  reticleGroup.add(new THREE.Mesh(line, reticleMat));

  config.render.latewarp ? warpCamera.add(reticleGroup) : camera.add(reticleGroup);                 // Add the group to the (right) camera
  reticleGroup.position.set(0, 0, -1);      // Set the distance to the group
}

var c2p = new THREE.Mesh();             // Mesh for storing click-to-photon region

/**
 * Draw the click-to-photon region (based on config parameters)
 */
var drawC2P = function(){
  camera.remove(c2p);
  if(config.render.c2p.show === false) return;
  var c2pMaterial = new THREE.MeshBasicMaterial({color:config.render.c2p.upColor, flatShading:true});  
  var c2pGeom = new THREE.BoxGeometry(config.render.c2p.width, config.render.c2p.height, 0.001);
  c2p = new THREE.Mesh(c2pGeom, c2pMaterial);

  camera.add(c2p);
  // Set position for left edge of the screen
  const distance = 2;
  const x = -distance * Math.tan(camera.fov/2 * Math.PI/180 * camera.aspect) + config.render.c2p.width/2;
  const y = distance * Math.tan(camera.fov * Math.PI/180 * (config.render.c2p.vertPos-0.5)) * (1-config.render.c2p.height/2);
  c2p.position.set(x, y, -distance);
}

/**
 * Produce a random sign (with equal probability)
 * @returns {-1 or +1}
 */
var randSign = function() {return Math.random() < 0.5 ? -1 : 1};

// Scene storage
var scene, floor, world;      
var leftWall, rightWall, frontWall, backWall;   // Add these directly to the "world" group so they have collision with shots

/**
 * Add walls (scene edge bounds) to the scene based on the config
 */
var makeWalls = function(){
  const wallThickness = 10;
  world.remove(leftWall); world.remove(rightWall); world.remove(frontWall); world.remove(backWall);

  // Create the "walls"
  var wallGeometry = new THREE.BoxBufferGeometry(wallThickness, config.scene.walls.height, config.scene.depth);
  var wallMaterial = new THREE.MeshStandardMaterial({color: config.scene.walls.color});
  
  leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
  leftWall.position.x = -config.scene.width/2 - wallThickness/2;
  world.add(leftWall);
  
  rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
  rightWall.position.x = config.scene.width/2 + wallThickness/2;
  world.add(rightWall);

  wallGeometry = new THREE.BoxBufferGeometry(config.scene.width, config.scene.walls.height, wallThickness);
  frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
  frontWall.position.z = config.scene.depth/2 + wallThickness/2;
  world.add(frontWall);

  backWall = new THREE.Mesh(wallGeometry, wallMaterial);
  backWall.position.z = -config.scene.depth/2 - wallThickness/2;
  world.add(backWall);
}

var referenceTarget = true;     // Status tracking for whether a reference target is displayed

/**
 * Update the background/skybox for the scene (can be solid color or cubemap skybox)
 */
var updateSceneBackground = function() {
  if(config.scene.useCubeMapSkyBox) {
    scene.background = new THREE.CubeTextureLoader().setPath('./assets/materials/').load(
      [ 'sh_rt.png',
        'sh_lf.png',
        'sh_up.png',
        'sh_dn.png',
        'sh_bk.png',
        'sh_ft.png'
      ]);
  }
  else { scene.background = new THREE.Color( config.scene.skyColor ); }
}

/**
 * Generate a new (randomized) scene based on the config
 */
var makeScene = function(){
  scene = new THREE.Scene();

  updateSceneBackground();
  
  scene.fog = new THREE.Fog( config.scene.fog.color, config.scene.fog.nearDistance, config.scene.fog.farDistance );
  scene.add(camera);

  rawInputState = new RawInputState();
  fpsControls = new THREE.FirstPersonControls( camera );
  scene.add( fpsControls.getObject() );

  var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
  light.position.set( 0, 100, 0.4 );
  scene.add( light );

  var dirLight = new THREE.SpotLight( 0xffffff, .5, 0.0, 180.0);
  dirLight.color.setHSL( 0.1, 1, 0.95 );
  dirLight.position.set(0, 300, 100);
  dirLight.castShadow = true;
  dirLight.lookAt(new THREE.Vector3());
  scene.add( dirLight );
  
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  dirLight.shadow.camera.far = 1000;

  //var dirLightHeper = new THREE.SpotLightHelper( dirLight, 10 );
  //scene.add( dirLightHeper );

  world = new THREE.Group();
  fpsControls.scene = world;    // Update reference for fps controls (used for collision)

  // Create the floor
  var floorGeometry = new THREE.PlaneBufferGeometry( config.scene.width, config.scene.depth, 100, 100 );
  var floorMaterial = new THREE.MeshLambertMaterial({color:config.scene.floorColor});
  floor = new THREE.Mesh( floorGeometry, floorMaterial );
  floor.rotation.x = - Math.PI / 2;
  floor.receiveShadow = true;
  world.add(floor);

  makeWalls();    // Make the bounding walls

  // Create boxes for the "world" geometry
  var boxGeometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
  boxGeometry.translate( 0, 0.5, 0 );
  for ( var i = 0; i < config.scene.boxes.count; i ++ ) {
    
    const cscale = (1 - config.scene.boxes.colorScaleRange/2) - Math.random() * config.scene.boxes.colorScaleRange;
    var boxColor = new THREE.Color(config.scene.boxes.color).multiplyScalar(cscale);

    var boxMaterial = new THREE.MeshStandardMaterial( { color: boxColor, flatShading: false, vertexColors: false } );
    var mesh = new THREE.Mesh( boxGeometry, boxMaterial );

    mesh.position.x = 2 * config.scene.boxes.distanceRange * Math.random() - config.scene.boxes.distanceRange;
    mesh.position.y = 0;
    mesh.position.z = 2 * config.scene.boxes.distanceRange * Math.random() - config.scene.boxes.distanceRange;

    // Make sure boxes respect minimum distance to player
    if(mesh.position.length() < config.scene.boxes.minDistanceToPlayer){
      mesh.position.setLength((Math.random() * 10 + Math.sqrt(config.scene.boxes.width**2 + config.scene.boxes.depth**2) + config.scene.boxes.minDistanceToPlayer));
    }

    mesh.scale.x = config.scene.boxes.width;
    mesh.scale.y = Math.random() * (config.scene.boxes.maxHeight - config.scene.boxes.minHeight) + config.scene.boxes.minHeight;
    mesh.scale.z = config.scene.boxes.depth;
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;
    world.add(mesh);
  }
  scene.add(world);

  targets = [];
  spawnTarget(true);            // Create a reference target

  resetBannerStats();           // Reset the banner tracking
  updateBanner();               // Update the banner
}

// Audio variables (elements and queues)
const fireAudio = document.getElementById("fireSound");           // HTML audio to play for fire sound (instanced)
const explodeAudio = document.getElementById("explodeSound");     // HTML audio to play for explosion sound (instanced)
var fireSounds = [];  var explodeSounds = [];                     // Queues for fire and explode sound copies

/**
 * Create an explosion sound, add it to the queue, and schedule it to play
 */
function makeExplodeSound(){
  if(!config.audio.explodeSound) return;
  explodeSounds.push(explodeAudio.cloneNode());
  setTimeout(playAndRemoveExplosion, config.audio.delayMs);
}

/**
 * Play the oldest (previously scheduled) explosion sound and remove it from the queue
 */
function playAndRemoveExplosion() {
  const sound = explodeSounds.shift();
  sound.play();
}

/**
 * Create a weapon fire sound, add it to the queue, and schedule it to play
 */
function makeFireSound(){
  if(!config.audio.fireSound) return;
  fireSounds.push(fireAudio.cloneNode());
  setTimeout(playAndRemoveFire, config.audio.delayMs);
}

/**
 * Play the oldest (previously scheduled) fire sound and remove it from the queue
 */
function playAndRemoveFire(){
  const sound = fireSounds.shift();
  sound.volume = 0.1;
  sound.play();
}

// Create stats widget
const statsContainer = document.getElementById('stats');
var stats = new Stats();

// Setup storage for high-level primitives
var camera, warpCamera;                   // Cameras
var renderer, raycaster, fpsControls;     // Renderer, (fire) ray caster, and FPS controls
var rawInputState;                        // The inupt delay queue is between this and processGameInputEvent
var particles = new Array();              // Empty particles array

var renderedImage = new THREE.WebGLMultisampleRenderTarget(window.innerWidth, window.innerHeight, {
  format: THREE.RGBFormat,
    stencilBuffer: false,
    depthBuffer: true,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.NearestFilter
  });

var warpTransform = new THREE.Matrix4();
var warpScene = new THREE.Scene();

var warpQuad = new THREE.Mesh(          // Use a single textured quad for warp
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    vertexShader: `
    uniform mat4 uTransform;
    varying vec2 texCoord;
    void main() {
      texCoord = uv;
      gl_Position = uTransform * vec4(position.xy, 0.0, 1.0);
    }
    `,
    fragmentShader:`
    uniform sampler2D uScene;
    varying vec2 texCoord;
    void main() {
      gl_FragColor = texture(uScene, texCoord);
    }
    `,
    //depthWrite: false,
    //depthTest: false,
    uniforms: {
      uTransform: { value: warpTransform },
      uScene: { value: renderedImage.texture },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
  })
);

// Run from here (animate schedules itself)
init();
animate();

/**
 * One time initiazliation routine
 */
function init() {
  // Create the camera, raycaster for shots, and reticle
  const aspect =  window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 10000;
  rawInputState = new RawInputState();
  camera = new THREE.PerspectiveCamera(103/aspect, aspect, near, far);
  raycaster = new THREE.Raycaster(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3())); 
  fpsControls = new THREE.FirstPersonControls( camera, scene );
  
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.enabled = true;
  document.body.appendChild( renderer.domElement );
  //renderer.outputEncoding = THREE.sRGBEncoding;

  warpCamera = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, near, far);

  window.addEventListener( 'resize', onWindowResize, false );
  statsContainer.appendChild(stats.dom);

  makeScene();
  fpsControls.scene = world;

  drawReticle();
  drawC2P();

  warpScene.add(warpQuad);
  warpScene.add(warpCamera);
}

var last_fire_time = 0;               // Last weapon fire time
var last_particle_update = 0;         // Last particle update time
var last_render_time = 0;             // Last render time, used for frame rate management
var last_update_time = Date.now();    // Last simulation update time

var targets_destroyed = 0;            // Total targets destroyed
var target_times = [];                // Time from each targets spawn to destruction

var shots = 0;                        // Total shots taken
var hits = 0;                         // Total number of hits (misses are shots - hits)

/**
 * Periodic/self scheduling animation
 */
function animate() {

  if (config.render.setFPS) setTimeout(animate, 1);
  else requestAnimationFrame( animate );                // "Modern" way of animating, but produces some issues

  const now  = Date.now();
  frameTimes.push(now - last_update_time);
  if(frameTimes.length > numFrameTimes) {
    frameTimes.shift();
    frameTimeValid = true;
  }

  rawInputState.update();
  fpsControls.processDelayedEvents(rawInputState.getDelayedFrameEvents());
  fpsControls.update();

  // Game processing that only occurs when the mouse is captured
  if ( fpsControls.enabled ) {
    raycaster.set(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
  
    // Handle request for weapon fire
    if (clickShot) {
      const rot = randInRange(0, 2*Math.PI); 
      const mag = randInRange(0, config.weapon.fireSpread * Math.PI / 180);
      const randomRot = new THREE.Vector3(mag * Math.cos(rot), mag * Math.sin(rot), 0);
  
      raycaster.ray.direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), randomRot.x);
      raycaster.ray.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomRot.y);

      if((now - last_fire_time) >= (1000 * config.weapon.firePeriod)){         // Check for whether the weapon can fire\
        // We can fire, do so here
        last_fire_time = now;
        if(!referenceTarget) shots++;
        makeFireSound();
        var intersects = raycaster.intersectObjects(world.children);          // Handle intersection of shot with world
        // Check for hit
        if ( intersects.length > 0 ) {
          var intersect = intersects[ 0 ];                    // Get first hit
          if (targets.includes(intersect.object)){            // See if we hit a target first
            if(!referenceTarget) hits++;
            var destroyed = damageTarget(intersect.object, intersect.point);   // Damage the target
            if(destroyed){
              makeExplodeSound();
              if(referenceTarget) {     // Reference target destroyed, spawn first target(s)
                while(targets.length < config.targets.count) { spawnTarget(); }
              }
              else {
                targets_destroyed += 1;
                target_times.push(intersect.object.duration);
                spawnTarget();     // Replace this target with another like it
              }
            }
          }
          else{                                               // Missed the target
            makeParticles(intersect.point);
          }
          updateBanner();
        }
        if(config.weapon.auto === false) clickShot = false;    // Reset the click shot semaphore if not automatic
      }
    }

    // Move targets after fire (if first person controls are enabled)
    updateTargets((now - last_update_time)/1000);

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

  // Handle rendering here
  if (!config.render.setFPS || (now - last_render_time >= 0.95 * (1000 / config.render.frameRate))) {

     // Scale reticle based on time since last shot
     if(now - last_fire_time < 1000 * config.reticle.shrinkTime){     
      const scale = config.reticle.expandedScale * (1  - (now - last_fire_time) / (1000 * config.reticle.shrinkTime)) + 1;
      reticleGroup.scale.x = scale; reticleGroup.scale.y = scale; reticleGroup.scale.z = scale;
    }

    if(config.render.latewarp){
      renderer.setRenderTarget( renderedImage );  // Change render target for latewarp
    }

    last_render_time = now;                       // Update the last render time
    renderer.render( scene, camera );             // Render the scene

    if(config.render.latewarp) {
      // Latewarp here
      const recentCameraToWorld = new THREE.Matrix4().makeRotationFromEuler(rawInputState.cameraRotation);
      const recentWorldToCamera = new THREE.Matrix4().getInverse(recentCameraToWorld);
      var oldWorldToCamera = camera.matrixWorld.clone();
      oldWorldToCamera.setPosition(0.0, 0.0, 0.0);
      warpTransform.copy(camera.projectionMatrix);
      warpTransform.multiply(recentWorldToCamera);
      warpTransform.multiply(oldWorldToCamera);
      warpTransform.multiply(camera.projectionMatrixInverse);
      renderer.setRenderTarget( null );                           // Render to the frame buffer
      renderer.shadowMap.enabled = false;
      renderer.render( warpScene, warpCamera );                   // Render the scene
      renderer.shadowMap.enabled = true;
    }
    stats.update();
  }

  last_update_time = now;
}