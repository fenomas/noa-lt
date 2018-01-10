'use strict'


module.exports = function (game) {
    var state = game.inputs.state


    // settings
    var max = 12 // this should be an option somewhere, surely?
    var min = 0
    game.rendering._cameraZoomSpeed = 0.15

    // state
    var zoom = 0
    var lastZoomSet = max


    // bind F to swap 1s/3rd person cameras
    game.inputs.bind('swapCamera', 'F')
    game.inputs.down.on('swapCamera', function () {
        zoom = (zoom > min) ? min : lastZoomSet
        game.rendering.zoomDistance = zoom
    })


    // scroll camera zoom on shift+mousewheel
    game.on('tick', function (dt) {
        if (state.scrolly !== 0) {
            // zoom camera
            zoom += (state.scrolly > 0) ? 1 : -1
            if (zoom < min) zoom = min
            if (zoom > max) zoom = max
            game.rendering.zoomDistance = zoom
            // remember for 1p/3p swaps
            lastZoomSet = (zoom > min) ? zoom : Math.round(max / 2)
        }
    })


}





