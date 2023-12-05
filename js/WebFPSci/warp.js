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

var warpTransform = new THREE.Matrix4();
var warpScene = new THREE.Scene();
var warpCamera;

var renderedImage = new THREE.WebGLMultisampleRenderTarget(window.innerWidth, window.innerHeight, {
    format: THREE.RGBFormat,
      stencilBuffer: false,
      depthBuffer: true,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter
});
  

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

function initWarp(aspect, near, far) {
    warpCamera = new THREE.OrthographicCamera(-aspect/2, aspect/2, 1/2, -1/2, near, far);
    warpScene.add(warpQuad);
    warpScene.add(warpCamera);
}

function applyWarp() {
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

function updateWarpCamera(aspect){
    warpCamera.left = -aspect/2; warpCamera.right = aspect/2;
    warpCamera.updateProjectionMatrix();
}