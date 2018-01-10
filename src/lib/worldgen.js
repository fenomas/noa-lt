'use strict';
/* globals BABYLON */


var SimplexNoise = require('simplex-noise')
var simplex = new SimplexNoise()
var hash = require('ndhash')
var ndarray = require('ndarray')
var Worker = require('./worldgen_worker')

module.exports = function setupFunction(game, slideData) {
  registerBlocks(game)
  initSpecials(game, slideData)
  initWorldGen(game)
}


var _blockID = 1
function getBlockID() {
  return _blockID++
}


/*
 *      Slides/slide block-related setup
*/


function initSpecials(game, slides) {
  var reg = game.registry

  // block mat for slide blocks
  reg.registerMaterial('slide', [1, 0.1, 0.05])
  reg.registerMaterial('block-face', [0, 0, 0], 'block-face.png')
  reg.registerMaterial('block-top', [0, 0, 0], 'block-top.png')
  reg.registerMaterial('block-bot', [0, 0, 0], 'block-bot.png')
  reg.registerMaterial('block-side', [0, 0, 0], 'block-side.png')

  // slides is array of data objects
  var mats = ['block-side', 'block-side', 'block-top', 'block-bot', 'block-side', 'block-face']
  var blockid = reg.registerBlock(getBlockID(), {
    material: mats,
  })

  // ad-hoc - decorate game object with block ID
  game.slideBlockID = blockid

  slides.map(function (s) {
    addOverlay(blockid, s.x, s.y, s.z)
  })

  // add player platform
  function overlayRect(id, x0, x1, y0, y1, z0, z1) {
    for (var x = x0; x < x1; x++) {
      for (var y = y0; y < y1; y++) {
        for (var z = z0; z < z1; z++) {
          addOverlay(id, x, y, z)
        }
      }
    }
  }

  overlayRect(0, -1, 42, 0, 10, -1, 4)
  overlayRect(stoneID, 0, 41, 1, 2, 0, 3)
  overlayRect(stoneID, -1, 42, -10, 1, -1, 4)

}

var special_overlays = []

function addOverlay(id, x, y, z) {
  if (!special_overlays[x]) special_overlays[x] = []
  if (!special_overlays[x][y]) special_overlays[x][y] = []
  special_overlays[x][y][z] = id
}

// used by generateWorld
function getOverlay(x, y, z) {
  if (!special_overlays[x]) return -1
  if (!special_overlays[x][y]) return -1
  return special_overlays[x][y][z]
}



// random color generation - last minute hack
var please = require('pleasejs')
function getColor() {
  var res = please.make_color()
  // returns array of one color in "#ffffff" format
  var hex = res[0].substring(1)
  var num = parseInt(hex, 16)
  var r = (num & 0xFF0000) >> 16
  var g = (num & 0xFF00) >> 8
  var b = (num & 0xFF)
  return [r / 255, g / 255, b / 255]
}




/*
 *   Block registration - register blocktypes used in world
*/



var dirtID, grassID, stoneID, block1ID, cloudID, leafID, flowerID, woodID, waterID

function registerBlocks(game) {
  var reg = game.registry

  // materials used by block faces
  reg.registerMaterial('dirt', [0.45, 0.36, 0.22], 'dirt.png')
  reg.registerMaterial('grass', [0.22, 0.38, 0.01], 'grass.png')
  reg.registerMaterial('grass_side', [0.30, 0.34, 0.09], 'grass_dirt.png')
  reg.registerMaterial('stone', [0.50, 0.50, 0.50], 'cobblestone.png')
  reg.registerMaterial('leaf', [0.31, 0.45, 0.03], 'leaf.png', true)
  reg.registerMaterial('wood_face', [0.60, 0.50, 0.10], 'wood_face.png')
  reg.registerMaterial('wood_side', [0.55, 0.45, 0.05], 'wood_side.png')
  reg.registerMaterial('water', [0.20, 0.85, 0.95, 0.5], null)
  for (var i = 1; i < 30; i++) {
    var color = getColor()
    reg.registerMaterial('color' + i, color, null)
  }
  reg.registerMaterial('white', [1, 1, 1], null)
  reg.registerMaterial('flowerMat', [1, 1, 1], null)


  // block types and the faces they use

  dirtID = reg.registerBlock(getBlockID(), { material: 'dirt' })
  grassID = reg.registerBlock(getBlockID(), { material: ['grass', 'dirt', 'grass_side'] })
  stoneID = reg.registerBlock(getBlockID(), { material: 'stone' })
  leafID = reg.registerBlock(getBlockID(), { material: 'leaf', opaque: false })
  cloudID = reg.registerBlock(getBlockID(), { material: 'white' })
  woodID = reg.registerBlock(getBlockID(), { material: ['wood_face', 'wood_face', 'wood_side'] })
  var waterprop = { material: 'water', fluid: true, fluidDensity: 1.0, viscosity: 0.5 }
  waterID = reg.registerBlock(getBlockID(), waterprop)

  for (i = 1; i < 30; i++) {
    var id = getBlockID()
    if (i === 1) block1ID = id
    reg.registerBlock(id, { material: 'color' + i })
  }

  // create a custom mesh to be used for occurrences of the block
  var scene = game.rendering.getScene()
  var flowerMesh = makeFlowerSpriteMesh(scene, 'textures/flower.png', 'flower')

  // object blocks - i.e. non-terrain
  flowerID = reg.registerBlock(getBlockID(), {
    solid: false,
    opaque: false,
    blockMesh: flowerMesh,
    material: 'flowerMat',
    onCustomMeshCreate: function (mesh) {
      mesh.rotation.y = Math.random() * Math.PI * 2
    }
  })
}




/*
 *   Worldgen - simple terrain/cloud generator
*/


function initWorldGen(game) {
  // set up worldgen web worker
  var worker = new Worker()

  // send block id values to worker
  worker.postMessage({
    msg: 'init',
    ids: getBlockIDObject()
  })

  // game listener for when worldgen is requested (array is an ndarray)
  game.world.on('worldDataNeeded', function (id, array, x, y, z) {
    worker.postMessage({
      msg: 'generate',
      data: array.data,
      shape: array.shape,
      id: id,
      x: x, y: y, z: z,
    })
  })

  // worker listener for when chunk generation is finished
  worker.addEventListener('message', function (ev) {
    if (ev.data.msg == 'generated') {
      // wrap result (copied from worker) in a new ndarray before returning
      var id = ev.data.id
      var array = new ndarray(ev.data.data, ev.data.shape)
      // send result to game for processing
      game.world.setChunkData(id, array)
    }
  })

}


function getBlockIDObject() {
  return {
    dirtID: dirtID,
    grassID: grassID,
    stoneID: stoneID,
    block1ID: block1ID,
    cloudID: cloudID,
    leafID: leafID,
    flowerID: flowerID,
    woodID: woodID,
    waterID: waterID,
    overlays: special_overlays
  }
}








// helper function to make a billboard plane mesh showing a given sprite texture
function makeFlowerSpriteMesh(scene, url, name) {
  var matname = name || 'sprite-mat'
  var tex = new BABYLON.Texture(url, scene, true, true,
    BABYLON.Texture.NEAREST_SAMPLINGMODE)
  tex.hasAlpha = true
  var mesh = BABYLON.Mesh.CreatePlane('sprite-' + matname, 1, scene)
  var mat = new BABYLON.StandardMaterial('sprite-mat-' + matname, scene)
  mat.specularColor = new BABYLON.Color3(0, 0, 0)
  mat.emissiveColor = new BABYLON.Color3(1, 1, 1)
  mat.backFaceCulling = false
  mat.diffuseTexture = tex
  mesh.material = mat

  var offset = BABYLON.Matrix.Translation(0, 0.5, 0)
  mesh.bakeTransformIntoVertices(offset)
  var clone = mesh.clone()
  clone.rotation.y += 0.7

  return BABYLON.Mesh.MergeMeshes([mesh, clone], true)
}

