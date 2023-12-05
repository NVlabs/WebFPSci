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