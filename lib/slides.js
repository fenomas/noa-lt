'use strict';

var slides = {}
module.exports = slides
slides.slideData = []


/*
 *  Define the 'slides' and where they go, what they do, etc.
*/

var baseX = 1
var baseY = 3
var baseZ = 8


add( 'intro1',   0,  0,  0  )
add( 'intro2',   2,  0,  0  )
add( 'intro3',   2,  0,  0,     openlink.bind(null, 'twit') )
add( 'voxel1',   2,  0,  0  )
add( 'voxel2',   1,  1,  0  )
add( 'voxel3',   1,  1,  0,     openlink.bind(null, 'webgl') )
add( 'voxel4',   1,  1,  0  )
add( 'game1',    1, -3,  0,     openlink.bind(null, 'wiki') )
add( 'game2',    1,  1,  0  )
add( 'game3',    1,  1,  0  )
add( 'game4',    1,  1,  0  )
add( 'game5',    1,  1,  0,     openlink.bind(null, 'life') )
add( 'game6',    1,  1,  0  )
add( 'render1',  0, -5,  0  )
add( 'render2',  1,  1,  0,     openlink.bind(null, 'doob') )
add( 'render3',  1,  1,  0  )
add( 'render4',  1,  1,  0,     openlink.bind(null, 'greedy'))
add( 'render5',  1,  1,  0  )
add( 'render6',  1,  1,  0,     toggleAO )
add( 'render7',  1,  1,  0,     openlink.bind(null, 'vq')   )
add( 'render8',  1, -1,  0  )
add( 'world1',   0, -6,  0,     openlink.bind(null, 'hash') )
add( 'world2',   1,  1,  0  )
add( 'noa1',     2, -1,  0  )
add( 'noa2',     1,  1,  0  )
add( 'noa3',     1,  1,  0,     openlink.bind(null, 'vjs') )
add( 'noa4',     1,  1,  0,     openlink.bind(null, 'bjs') )
add( 'noa5',     1,  1,  0,     openlink.bind(null, 'test') )
add( 'thanks1',  2, -3,  0  )
add( 'thanks2',  2,  1,  0,     openlink.bind(null, 'gh') )




function openlink(name) {
  var urls = {
    twit:   'https://twitter.com/fenomas',
    webgl:  'http://acko.net/files/fullfrontal/fullfrontal/webglmath/online.html',
    wiki:   'http://en.wikipedia.org/wiki/Voxel#Computer_games',
    life:   'http://en.wikipedia.org/wiki/Conway%27s_Game_of_Life',
    doob:   'http://mrdoob.com/projects/voxels/',
    greedy: 'http://0fps.net/2012/07/07/meshing-minecraft-part-2/',
    vq:     'http://www.voxelquest.com/',
    hash:   'https://github.com/andyhall/ndhash',
    vjs:    'http://voxeljs.com/',
    bjs:    'http://babylonjs.com/',
    test:   'https://github.com/andyhall/noa-testbed',
    gh:     'https://github.com/andyhall',
  }
  if (urls[name]) {
    window.open(urls[name], '_blank')
  } else {
    console.log(name,'???')
  }
}


var mutey = 5
function muteWorld(x, z) {
  for (var y=-5; y<mutey; ++y) {
    noa.setBlock(1,x,y,z+5)
  }
  mutey+=2
}

function toggleAO() {
  noa.rendering.doAO = !noa.rendering.doAO
}




/*
 *  Logic below
*/

// add a slide to the exported array
function add(id, x, y, z, onclick) {
  baseX += x
  baseY += y
  baseZ += z
  slides.slideData.push({
    id: id,
    // coords are offset by base location matched to worldgen
    x: baseX, 
    y: baseY, 
    z: baseZ,
    onclick:onclick || null,
  })
}


                        
                        
// All slides start out hidden

// accessor functions to show/hide them:

var currslide = null
slides.showSlide = function(id) {
  if (currslide===id) return
  slides.hideSlide()
  var el = document.getElementById(id)
  if (el) {
    setElementVisibility(el, true)
    currslide = id
  }
}


slides.hideSlide = function() {
  if (!currslide) return
  setElementVisibility(document.getElementById(currslide), false)
  currslide = null
}



function setElementVisibility(el, vis) {
  if (vis) el.style.display = "flex"
  else el.style.display = "none";
}


