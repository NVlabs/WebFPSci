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

const bannerDiv = document.getElementById("banner");      // Get the banner div from the HTML document

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

var targets_destroyed = 0;            // Total targets destroyed
var target_times = [];                // Time from each targets spawn to destruction
var shots = 0;                        // Total shots taken
var hits = 0;                         // Total number of hits (misses are shots - hits)

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

function expInit(){
    bannerDiv.style.visibility = config.render.showBanner ? 'visible' : 'hidden';
}

function expFireEvent() {
    if (!referenceTarget) shots++;
    updateBanner();
}

function expHitTarget(){
    hits++;
}

function expHitReference() {
    return;
}

function expTargetDestroyed(duration){
    targets_destroyed += 1;
    target_times.push(duration);
}