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
