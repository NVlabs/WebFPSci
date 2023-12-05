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

function updateReticle(now, last_fire_time){
    // Scale reticle based on time since last shot
    if(now - last_fire_time < 1000 * config.reticle.shrinkTime){     
    const scale = config.reticle.expandedScale * (1  - (now - last_fire_time) / (1000 * config.reticle.shrinkTime)) + 1;
    reticleGroup.scale.x = scale; reticleGroup.scale.y = scale; reticleGroup.scale.z = scale;
    }
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

// Create stats widget
const statsContainer = document.getElementById('stats');
var stats = new Stats();

/**
 * Routine for disabling dat.gui elements
 * @param {The element to enable/disable} guiElement 
 * @param {Control for whether to enable/disable the element} enabled 
 */
function setGuiElementEnabled(guiElement, enabled) {
    guiElement.domElement.style.pointerEvents = enabled ? 'auto' : 'none';
    guiElement.domElement.style.opacity = enabled ? 1 : 0.5;
  }
  
  // Storage for the dat.gui element
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
    weaponControls.add(config.weapon, 'missParticles').name('Particles').listen().onChange(function(value){
      setGuiElementEnabled(missParticleControls, value);
      value ? missParticleControls.open(): missParticleControls.close();
    });
    var missParticleControls = weaponControls.addFolder('Particles');
    missParticleControls.add(config.weapon, 'missParticleSize', 0.01, 1).step(0.01).name('Size').listen();
    missParticleControls.add(config.weapon, 'missParticleCount', 1, 100).step(1).name('Count').listen();
    setGuiElementEnabled(missParticleControls, config.weapon.missParticles);
  
    var importExport = gui.addFolder('Config Import/Export');
    var configExport = {update: exportConfig};
    var configImport = {update: function() { configInput.click(); }};
    importExport.add(configImport, 'update').name('Import Config');
    importExport.add(configExport, 'update').name('Export Config');
  
    if(guiClosed) gui.close();
}
  