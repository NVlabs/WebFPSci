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

