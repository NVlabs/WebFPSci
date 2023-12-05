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

var last_fire_time = 0;               // Last weapon fire time

/*
* Method to handle weapon fire events
*/
function fire(now) {
  const rot = randInRange(0, 2*Math.PI); 
  const mag = randInRange(0, config.weapon.fireSpread * Math.PI / 180);
  const randomRot = new THREE.Vector3(mag * Math.cos(rot), mag * Math.sin(rot), 0);

  raycaster.ray.direction.applyAxisAngle(new THREE.Vector3(1, 0, 0), randomRot.x);
  raycaster.ray.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), randomRot.y);

  if((now - last_fire_time) >= (1000 * config.weapon.firePeriod)){         // Check for whether the weapon can fire\
    // We can fire, do so here
    last_fire_time = now;
    makeFireSound();
    expFireEvent();
    var intersects = raycaster.intersectObjects(world.children);          // Handle intersection of shot with world
    // Check for hit
    if ( intersects.length > 0 ) {
      var intersect = intersects[ 0 ];                    // Get first hit
      if (targets.includes(intersect.object)){            // See if we hit a target first
        if(!referenceTarget) expHitTarget();
        else expHitReference();
        var destroyed = damageTarget(intersect.object, intersect.point);   // Damage the target
        if(destroyed){
          makeExplodeSound();
          if(referenceTarget) {     // Reference target destroyed, spawn first target(s)
            while(targets.length < config.targets.count) { spawnTarget(); }
          }
          else {
            expTargetDestroyed(intersect.object.duration);
            spawnTarget();     // Replace this target with another like it
          }
        }
      }
      else{                                               // Missed the target
        if(config.weapon.missParticles) {
          makeParticles(intersect.point, new THREE.Color(0,0,0), config.weapon.missParticleSize, config.weapon.missParticleCount);
        }
      }
    }
    if(config.weapon.auto === false) clickShot = false;    // Reset the click shot semaphore if not automatic
  }
}

/**
 * Make the GUI and setup experiment on window load
 */
window.onload = function() {
 makeGUI();
 expInit();
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
  updateWarpCamera(aspect);

  drawReticle();
  drawC2P();
}

// Event listeners for mouse click
var clickShot = false;                            // Did a click occur?
var inScopeView = false;                          // Are we in a scoped view?

// Setup storage for high-level primitives
var camera;                               // Cameras
var renderer, raycaster, fpsControls;     // Renderer, (fire) ray caster, and FPS controls
var rawInputState;                        // The inupt delay queue is between this and processGameInputEvent

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

  window.addEventListener( 'resize', onWindowResize, false );
  statsContainer.appendChild(stats.dom);

  makeScene();
  fpsControls.scene = world;

  initWarp(aspect, near, far);
  drawReticle();
  drawC2P();
}

var last_render_time = 0;             // Last render time, used for frame rate management
var last_update_time = Date.now();    // Last simulation update time

/**
 * Periodic/self scheduling animation
 */
function animate() {

  if (config.render.setFPS) setTimeout(animate, 1);
  else requestAnimationFrame( animate );                // "Modern" way of animating, but produces some issues

  const now  = Date.now();
  const dt_ms = now - last_update_time;
  const dt = dt_ms / 1e3;
  
  updateFrameTimes(dt_ms);

  rawInputState.update();
  fpsControls.processDelayedEvents(rawInputState.getDelayedFrameEvents());
  fpsControls.update();

  // Game processing that only occurs when the mouse is captured
  if ( fpsControls.enabled ) {
    raycaster.set(camera.getWorldPosition(new THREE.Vector3()), camera.getWorldDirection(new THREE.Vector3()));
  
    // Handle request for weapon fire
    if (clickShot) fire(now);

    // Move targets after fire (if first person controls are enabled)
    updateTargets(dt);
    updateParticles(now);
  }

  // Handle rendering here
  if (!config.render.setFPS || dt >= 0.95 * (1 / config.render.frameRate)) {
    updateReticle(now, last_fire_time);
    if(config.render.latewarp) renderer.setRenderTarget( renderedImage );  // Change render target for latewarp

    last_render_time = now;                       // Update the last render time
    renderer.render( scene, camera );             // Render the scene

    if(config.render.latewarp) applyWarp();       // Apply warp if requested
    stats.update();                               // Update rendering statistics
  }

  last_update_time = now;
}