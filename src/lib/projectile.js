'use strict';
/* globals BABYLON */

var vec3 = require('gl-vec3')

module.exports = function(game, partAdder) {
  return makeProjectileLauncher(game, partAdder)
}


/*
 *    example "spells" that create entities on keypress
*/


function makeProjectileLauncher(game, particleAdder) {
  var scene = game.rendering.getScene()
  var baseMesh = BABYLON.Mesh.CreateSphere('p1', 3, 1, scene)
  baseMesh.material = makeColorMat(scene, .1, .1, .1)
  // game.registry.registerMesh('projectile', mesh)


  return function(spelltype, size, gravMult, friction, restitution, option) {
    var s = size || 1    
    var mesh = game.rendering.makeMeshInstance(baseMesh)
    mesh.scaling.x = mesh.scaling.y = mesh.scaling.z = s
    var scene = game.rendering.getScene()
    var pos = game.getPlayerEyePosition()
    
    // projectile entity
    // usage: entities.add( pos, w, h, mesh, meshOffset, doPhysics, shadow )
    var id = game.entities.add( pos, s, s, mesh, [s/2,s/2,s/2], true, true )
    
    // data for the projectile
    var dat = {}

    // adjust physics properties thusly
    var body = game.ents.getPhysicsBody(id)
    body.gravityMultiplier = gravMult
    body.friction = friction
    body.restitution = restitution

		game.entities.addComponent(id, game.entities.names.collideTerrain, {
			callback: function (impulse) {
        onCollide(game, dat)
      }
    })
    var tickFn = function(dt) {
      onTick(game, dat, dt)
    }
    game.on('tick', tickFn)

    // flashy particle trail dependent on type
    var off = (spelltype===1) ? [0,0,0] : [0,s/2,0]
    var vol = (spelltype===1) ? s/2 : 0
    var partType = (spelltype===1) ? 'smoketrail' : 'sparks'
    var parts = particleAdder(partType)
    
    parts.disposeOnEmpty = true
    parts.parent = mesh
    parts.start()
    
    dat.parts = parts
    dat.particleAdder = particleAdder
    dat.counter = 0
    dat.option = option
    dat.id = id
    dat.spelltype = spelltype

    dat.remove = function() {
      game.ents.deleteEntity(id)
      parts.rate = 0
      game.removeListener('tick', tickFn)
    }

    launchAlongCameraVector(game, body, 10)
  }


}

/*
 *    Projectile tick/collide fcns
*/ 

function onCollide(game, dat) {
  if (dat.spelltype==2) return
  var pos = game.ents.getPosition(dat.id)
  dat.remove()
  // do blocks afterwards so entity doesn't collide them
  addBlocksInSphere(game, dat.option, pos, 2.3)
}

function onTick(game, dat, dt) {
  if (dat.spelltype==1) return
  dat.counter += dt
  //  var blinker = (ct/250>>0) % 2
  //  entity.mesh.material.diffuseColor.r = (blinker) ? 1 : 0.1
  if (dat.counter > 2500) { // blow up
    var pos = game.ents.getPosition(dat.id)
    addBlocksInSphere(game, 0, pos, 2.75)
    dat.parts.rate = 0
    // add smoke
    var smokeParts = dat.particleAdder('bombsmoke')
    smokeParts.mesh.position.copyFromFloats( pos[0], pos[1]+0.5, pos[2] )
    // done
    dat.remove()
  }
}




/*
 *    Helper functions
*/ 

function makeColorMat(scene, r, g, b) {
  var m = new BABYLON.StandardMaterial('m',scene)
  m.diffuseColor = new BABYLON.Color3(r,g,b)
  return m
}

function launchAlongCameraVector(game, body, impulse) {
  var vec = game.getCameraVector()
  vec3.normalize(vec, vec)
  vec3.scale(vec, vec, impulse)
  body.applyImpulse(vec)
}

function addBlocksInSphere(game, id, pos, radius) {
  var scene = game.rendering.getScene()
  var loc = pos.map(Math.floor)
  var rad = Math.ceil(radius)
  for (var i=-rad; i<=rad; ++i) {
    for (var j=-rad; j<=rad; ++j) {
      for (var k=-rad; k<=rad; ++k) {
        if (i*i + j*j + k*k <= radius*radius) {
          game.addBlock( id, i+loc[0], j+loc[1], k+loc[2] )
        }
      }
    }
  }
}
