/* global preloadImagesTmr $fx Blob fxpreview fxhash paper1Loaded noise */
// We may use: noise fxpreview
//
//  fxhash - HLR example
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Global values, because today I'm being an artist not an engineer!
// These are the generally common values we'll use across our projects
const ratio = 420 / 297 // Standard A3 paper size is 420mm x 297mm, this gives us that ratio
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
const features = {} //  so we can keep track of what we're doing
const nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let drawStarted = false // Flag if we have kicked off the draw loop
let thumbnailTaken = false
let forceDownloaded = false
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = 'HLR'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'
// const startTime = new Date().getTime()

let drawPaper = true

window.$fxhashFeatures = {}

const palettes = [
  ['#D2B0A3', '#FFD200', '#E51F23', '#E6007B', '#005AA7', '#5EC5EE', '#F9F0DE'],
  ['#d7312e', '#f9f0de', '#f0ac00', '#0c7e45', '#2c52a0', '#7fbab6', '#5ec5ee'],
  ['#412147', '#7b2776', '#bb2a17', '#e94e23', '#f49700', '#BD8b5f'],
  ['#f299a5', '#084698', '#1a86c8', '#74afe0', '#a0d6da'],
  ['#1c2137', '#284555', '#de4639', '#db6528', '#f5ad0d'],
  ['#ead8c4', '#bb9e40', '#7d8846', '#ce906b', '#c3c7a6'],
  ['#fdc9a4', '#f5b1a6', '#eca6a8', '#e1adb9', '#d0bfd7'],
  ['#325952', '#517369', '#91caaf', '#838c7d', '#9ca692']
]

$fx.params([
  {
    id: 'seed',
    name: 'Seed',
    type: 'string',
    options: {
      minLength: 3,
      maxLength: 32
    }
  },
  {
    id: 'maxSquares',
    name: 'Squares',
    type: 'number',
    default: 1000,
    options: {
      min: 1,
      max: 10000,
      step: 1
    }
  },
  {
    id: 'sWidth',
    name: 'Width',
    type: 'number',
    default: 1,
    options: {
      min: 0.1,
      max: 10,
      step: 0.1
    }
  },
  {
    id: 'sHeight',
    name: 'Height',
    type: 'number',
    default: 1,
    options: {
      min: 0.1,
      max: 10,
      step: 0.1
    }
  },
  {
    id: 'rotationMod',
    name: 'Rotation Noise',
    type: 'number',
    default: 1,
    options: {
      min: 0.00,
      max: 3,
      step: 0.01
    }
  },
  {
    id: 'rotationAdjust',
    name: 'Rotation Adjust',
    type: 'number',
    default: 0,
    options: {
      min: 0,
      max: 180,
      step: 1
    }
  },
  {
    id: 'sizeMod',
    name: 'Size Noise',
    type: 'number',
    default: 0.5,
    options: {
      min: 0.00,
      max: 1,
      step: 0.01
    }
  },
  {
    id: 'colourMod',
    name: 'Colour Noise',
    type: 'number',
    default: 1,
    options: {
      min: 0.00,
      max: 6,
      step: 0.01
    }
  },
  {
    id: 'marginSides',
    name: 'Side Margin',
    type: 'number',
    default: 10,
    options: {
      min: 0,
      max: 143,
      step: 1
    }
  }, {
    id: 'marginTopBottom',
    name: 'Top/Bottom Margin',
    type: 'number',
    default: 10,
    options: {
      min: 0,
      max: 193,
      step: 1
    }
  }, {
    id: 'drawMargin',
    name: 'Draw Margin',
    type: 'boolean',
    default: false
  }, {
    id: 'hollow',
    name: 'Hollow',
    type: 'boolean',
    default: false
  }, {
    id: 'debug',
    name: 'Debug view',
    type: 'boolean',
    default: false
  }
])

class Rand {
  constructor () {
    // PRNG from Piter
    const S = Uint32Array.of(9, 7, 5, 3)
    // eslint-disable-next-line no-return-assign
    this.prng = (a = 1) => a * (a = S[3], S[3] = S[2], S[2] = S[1], a ^= a << 11, S[0] ^= a ^ a >>> 8 ^ (S[1] = S[0]) >>> 19, S[0] / 2 ** 32);
    [...`${$fx.minter}${$fx.getParam('seed')}`].map(c => this.prng(S[3] ^= c.charCodeAt() * 23205))
  }

  r_d () { // random between 0 and 1
    return this.prng()
  }

  r_n (a, b) { // random float between a and b
    return a + (b - a) * this.r_d()
  }

  r_i (a, b) { // random int between a and b
    return ~~(this.r_n(a, b + 1))
  }

  r_b (p) { // random boolean with probability of p
    return this.r_d() < p
  }

  r_c (list) { // random choice from list
    return list[this.r_i(0, list.length - 1)]
  }
}
const R = new Rand()

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: R.prng(),
      y: R.prng()
    },
    paper2: {
      x: R.prng(),
      y: R.prng()
    }
  }

  // We are going to pretend the page is 297mm wide, and then work out the height
  // we are going to do work out everything in mm, and then convert to pixels for display later
  features.pageSize = {
    w: 297
  }
  features.pageSize.h = Math.floor(features.pageSize.w * ratio)

  // We're going to do the same for the noise value for the rotation of the square
  const noiseRotationOffset = {
    x: R.prng() * 4000 + 1000,
    y: R.prng() * 4000 + 1000
  }
  // Same again for the noise value for the size of the square
  const noiseSizeOffset = {
    x: R.prng() * 4000 + 1000,
    y: R.prng() * 4000 + 1000
  }
  // Same again for the colour of the square
  const noiseColourOffset = {
    x: R.prng() * 4000 + 1000,
    y: R.prng() * 4000 + 1000
  }

  // randly pick a palette
  const palette = palettes[Math.floor(R.prng() * palettes.length)]

  // Now we need to generate a bunch of squares
  features.squares = []
  // Use a while loop, because sometimes we may want to reject a square
  while (features.squares.length < $fx.getParam('maxSquares')) {
    // These are the points we are going to make the square out of
    const points = [{ x: -$fx.getParam('sWidth'), y: -$fx.getParam('sHeight') }, { x: $fx.getParam('sWidth'), y: -$fx.getParam('sHeight') }, { x: $fx.getParam('sWidth'), y: $fx.getParam('sHeight') }, { x: -$fx.getParam('sWidth'), y: $fx.getParam('sHeight') }, { x: -$fx.getParam('sWidth'), y: -$fx.getParam('sHeight') }]
    // Now pick a random x and y point for the square based on the page size
    const x = R.prng()
    const y = R.prng()
    // Now pick a size modifier for the square
    const noiseSize = (noise.simplex2(x * $fx.getParam('sizeMod') + noiseSizeOffset.x, y * $fx.getParam('sizeMod') + noiseSizeOffset.y) + 1) / 2
    const sizeMod = (15 * noiseSize) + 1
    // Now pick a rotation for the square, from 0 to 90 degrees
    const noiseRotation = (noise.simplex2(x * $fx.getParam('rotationMod') + noiseRotationOffset.x, y * $fx.getParam('rotationMod') + noiseRotationOffset.y) + 1) / 2
    const rotation = 180 * noiseRotation + $fx.getParam('rotationAdjust')
    // Now pick a colour for the square from the debug palette
    const noiseColour = (noise.simplex2(x * $fx.getParam('colourMod') + noiseColourOffset.x, y * $fx.getParam('colourMod') + noiseColourOffset.y) + 1) / 2
    const colour = palette[Math.floor(noiseColour * palette.length)]
    // Now add the square to the features.squares array
    features.squares.push({
      points,
      x,
      y,
      sizeMod,
      rotation,
      colour
    })
  }

  // Create the human readable features object
  const featuresObject = {
    Debug: $fx.getParam('debug'),
    Vibes: 'Good',
    'GitHub Co-pilot says': 'Hello World!'
  }
  $fx.features(featuresObject)
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawStarted = true
  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height
  const debug = $fx.getParam('debug')

  //  Lay down the paper texture
  if (drawPaper) {
    ctx.fillStyle = features.paper1Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()
  } else {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, w, h)
  }

  // Now we need to save the lines somewhere to we can convert them to SVG later
  features.savedLines = []

  // We need to set the default line width, which will be the canvas height divided my the pageSize height times two
  // This is to represent roughly a line width of 0.5mm on an A3 page
  ctx.lineWidth = h / features.pageSize.h / 2
  ctx.strokeStyle = '#000000'

  // Now we are going to draw the squares
  for (const square of features.squares) {
    // First step is to scale all the points by the sizeMod
    let newPoints = square.points.map(point => {
      return {
        x: point.x * square.sizeMod / features.pageSize.w * w,
        y: point.y * square.sizeMod / features.pageSize.w * w
      }
    })
    // Now rotate the points
    newPoints = newPoints.map(point => {
      const x = point.x
      const y = point.y
      const theta = square.rotation * Math.PI / 180
      const newX = x * Math.cos(theta) - y * Math.sin(theta)
      const newY = x * Math.sin(theta) + y * Math.cos(theta)
      return {
        x: newX,
        y: newY
      }
    })

    // Now work out the x, and y offsets
    const xOffset = w * square.x
    const yOffset = h * square.y
    // Offset the points
    newPoints = newPoints.map(point => {
      return {
        x: point.x + xOffset,
        y: point.y + yOffset
      }
    })

    //  Now draw the square, and save the square too
    const newSquare = {
      points: [],
      colour: '#ffffff',
      hollow: square.hollow
    }
    if (debug) newSquare.colour = square.colour
    ctx.beginPath()
    ctx.moveTo(newPoints[0].x, newPoints[0].y)
    newSquare.points.push({
      x: newPoints[0].x / w,
      y: newPoints[0].y / h
    })
    for (let i = 1; i < newPoints.length; i++) {
      ctx.lineTo(newPoints[i].x, newPoints[i].y)
      newSquare.points.push({
        x: newPoints[i].x / w,
        y: newPoints[i].y / h
      })
    }
    ctx.fillStyle = 'white'
    // If we are in debug mode then set the colour instead
    if (debug) ctx.fillStyle = square.colour
    if (!$fx.getParam('hollow')) ctx.fill()
    ctx.strokeStyle = 'black'
    if ($fx.getParam('hollow') && debug) ctx.strokeStyle = square.colour
    ctx.stroke()
    features.savedLines.push(newSquare)
  }

  // Now draw the margins
  let marginOutside = 20 / features.pageSize.w * w
  ctx.fillStyle = '#eeeeee'
  // First the left margin
  ctx.beginPath()
  ctx.moveTo(-marginOutside, -marginOutside)
  ctx.lineTo(-marginOutside, h + marginOutside)
  ctx.lineTo($fx.getParam('marginSides') / features.pageSize.w * w, h + marginOutside)
  ctx.lineTo($fx.getParam('marginSides') / features.pageSize.w * w, -marginOutside)
  ctx.lineTo(-marginOutside, -marginOutside)
  ctx.fill()

  // Now the right margin
  ctx.beginPath()
  ctx.moveTo(w + marginOutside, -marginOutside)
  ctx.lineTo(w + marginOutside, h + marginOutside)
  ctx.lineTo(w - $fx.getParam('marginSides') / features.pageSize.w * w, h + marginOutside)
  ctx.lineTo(w - $fx.getParam('marginSides') / features.pageSize.w * w, -marginOutside)
  ctx.lineTo(w + marginOutside, -marginOutside)
  ctx.fill()

  // Now the top margin
  ctx.beginPath()
  ctx.moveTo(-marginOutside, -marginOutside)
  ctx.lineTo(w + marginOutside, -marginOutside)
  ctx.lineTo(w + marginOutside, $fx.getParam('marginTopBottom') / features.pageSize.w * w)
  ctx.lineTo(-marginOutside, $fx.getParam('marginTopBottom') / features.pageSize.w * w)
  ctx.lineTo(-marginOutside, -marginOutside)
  ctx.fill()

  // Now the bottom margin
  ctx.beginPath()
  ctx.moveTo(-marginOutside, h + marginOutside)
  ctx.lineTo(w + marginOutside, h + marginOutside)
  ctx.lineTo(w + marginOutside, h - $fx.getParam('marginTopBottom') / features.pageSize.w * w)
  ctx.lineTo(-marginOutside, h - $fx.getParam('marginTopBottom') / features.pageSize.w * w)
  ctx.lineTo(-marginOutside, h + marginOutside)
  ctx.fill()

  // Now also save those margins
  marginOutside = 20
  features.savedMargins = []
  features.savedMargins.push({
    points: [{
      x: -marginOutside / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: $fx.getParam('marginSides') / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: $fx.getParam('marginSides') / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }, {
      x: -marginOutside / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }],
    colour: '#eeeeee',
    hollow: false
  })
  // Now do the right hand side
  features.savedMargins.push({
    points: [{
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: (features.pageSize.w - $fx.getParam('marginSides')) / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: (features.pageSize.w - $fx.getParam('marginSides')) / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }, {
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }],
    colour: '#eeeeee',
    hollow: false
  })
  // Now do the top margin
  features.savedMargins.push({
    points: [{
      x: -marginOutside / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: -marginOutside / features.pageSize.h
    }, {
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: $fx.getParam('marginTopBottom') / features.pageSize.h
    }, {
      x: -marginOutside / features.pageSize.w,
      y: $fx.getParam('marginTopBottom') / features.pageSize.h
    }],
    colour: '#eeeeee',
    hollow: false
  })
  // Now do the bottom margin
  features.savedMargins.push({
    points: [{
      x: -marginOutside / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }, {
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: (features.pageSize.h + marginOutside) / features.pageSize.h
    }, {
      x: (features.pageSize.w + marginOutside) / features.pageSize.w,
      y: (features.pageSize.h - $fx.getParam('marginTopBottom')) / features.pageSize.h
    }, {
      x: -marginOutside / features.pageSize.w,
      y: (features.pageSize.h - $fx.getParam('marginTopBottom')) / features.pageSize.h
    }],
    colour: '#eeeeee',
    hollow: false
  })

  // Now if we've been told to draw the margin, then we do a sinple outline
  features.drawMargin = []
  if ($fx.getParam('drawMargin')) {
    ctx.strokeStyle = '#000000'
    ctx.beginPath()
    ctx.moveTo($fx.getParam('marginSides') / features.pageSize.w * w, $fx.getParam('marginTopBottom') / features.pageSize.h * h)
    ctx.lineTo($fx.getParam('marginSides') / features.pageSize.w * w, h - $fx.getParam('marginTopBottom') / features.pageSize.h * h)
    ctx.lineTo(w - $fx.getParam('marginSides') / features.pageSize.w * w, h - $fx.getParam('marginTopBottom') / features.pageSize.h * h)
    ctx.lineTo(w - $fx.getParam('marginSides') / features.pageSize.w * w, $fx.getParam('marginTopBottom') / features.pageSize.h * h)
    ctx.lineTo($fx.getParam('marginSides') / features.pageSize.w * w, $fx.getParam('marginTopBottom') / features.pageSize.h * h)
    ctx.stroke()
    // And store the margin
    features.drawMargin.push({
      x: $fx.getParam('marginSides') / features.pageSize.w,
      y: $fx.getParam('marginTopBottom') / features.pageSize.h
    })
    features.drawMargin.push({
      x: (features.pageSize.w - $fx.getParam('marginSides')) / features.pageSize.w,
      y: $fx.getParam('marginTopBottom') / features.pageSize.h
    })
    features.drawMargin.push({
      x: (features.pageSize.w - $fx.getParam('marginSides')) / features.pageSize.w,
      y: (features.pageSize.h - $fx.getParam('marginTopBottom')) / features.pageSize.h
    })
    features.drawMargin.push({
      x: $fx.getParam('marginSides') / features.pageSize.w,
      y: (features.pageSize.h - $fx.getParam('marginTopBottom')) / features.pageSize.h
    })
  }

  // If the thumbnail hasn't been taken yet, then do it now
  if (!thumbnailTaken) {
    thumbnailTaken = true
    // Wrap in a try just incase it a) doesn't exist, or b) things outside our control go wrong
    try {
      fxpreview()
    } catch (e) {
      // Ignore errors
    }
  }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    // nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

//  This is where we layout the canvas, and redraw the textures
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  drawCanvas()
}

// This converts the save lines into a set of paths for the SVG
const downloadSVG = async (size) => {
  // Paper sizes 1-6
  const PAPER = {
    A1: {
      w: 594,
      h: 841
    },
    A2: {
      w: 420,
      h: 594
    },
    A3: {
      w: 297,
      h: 420
    },
    A4: {
      w: 210,
      h: 297
    },
    A5: {
      w: 148,
      h: 210
    },
    A6: {
      w: 105,
      h: 148
    }
  }
  // Make the SVG, also pretend we are inkscape a little bit
  const strokeWidth = PAPER[size].w / 500
  let output = `<?xml version="1.0" standalone="no" ?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg version="1.1" id="square-example" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
      x="0" y="0"
      viewBox="0 0 ${PAPER[size].w} ${PAPER[size].h}"
      width="${PAPER[size].w}mm"
      height="${PAPER[size].h}mm" 
      xml:space="preserve">
    <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" >
`
  // Now loop through the saved squares and add the paths for them
  features.savedLines.forEach((square) => {
    if (square.hollow) {
      output += `<path style="fill:none;stroke:#000000;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
    } else {
      output += `<path style="fill:${square.colour};stroke:#000000;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
    }
    // Do the first point
    output += `M ${square.points[0].x * PAPER[size].w} ${square.points[0].y * PAPER[size].h} `
    // Now loop through the rest
    for (let i = 1; i < square.points.length; i++) {
      output += `L ${square.points[i].x * PAPER[size].w} ${square.points[i].y * PAPER[size].h} `
    }
    output += `" />
    `
  })
  // Now loop through the saved margins and add the paths for them, there will be no stroke on them
  features.savedMargins.forEach((square) => {
    output += `<path style="fill:${square.colour};stroke:none;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
    // Do the first point
    output += `M ${square.points[0].x * PAPER[size].w} ${square.points[0].y * PAPER[size].h} `
    // Now loop through the rest
    for (let i = 1; i < square.points.length; i++) {
      output += `L ${square.points[i].x * PAPER[size].w} ${square.points[i].y * PAPER[size].h} `
    }
    output += `" />
    `
  })
  // If we have a margin, draw it
  if (features.drawMargin.length > 0) {
    output += `<path style="fill:none;stroke:#000000;stroke-width:${strokeWidth}px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" d="`
    // Do the first point
    output += `M ${features.drawMargin[0].x * PAPER[size].w} ${features.drawMargin[0].y * PAPER[size].h} `
    // Now loop through the rest
    for (let i = 1; i < features.drawMargin.length; i++) {
      output += `L ${features.drawMargin[i].x * PAPER[size].w} ${features.drawMargin[i].y * PAPER[size].h} `
    }
    // Back to the start
    output += `L ${features.drawMargin[0].x * PAPER[size].w} ${features.drawMargin[0].y * PAPER[size].h} `
    output += `" />
    `
  }

  // Wrap the g and the svg
  output += ` </g>
  </svg>`

  // Now download the file
  const element = document.createElement('a')
  element.setAttribute('download', `HLR_${fxhash}_A${size}.svg`)
  element.style.display = 'none'
  document.body.appendChild(element)
  //  Blob code via gec @3Dgec https://twitter.com/3Dgec/status/1226018489862967297
  element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
    type: 'text/plain;charset=utf-8'
  })))

  element.click()
  document.body.removeChild(element)
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // Custom controls
  // Toggle the paper texture
  if (e.key === 't') {
    drawPaper = !drawPaper
    await layoutCanvas()
  }

  if (e.key === '1') downloadSVG('A1')
  if (e.key === '2') downloadSVG('A2')
  if (e.key === '3') downloadSVG('A3')
  if (e.key === '4') downloadSVG('A4')
  if (e.key === '5') downloadSVG('A5')
  if (e.key === '6') downloadSVG('A6')
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  Normally we would have a test
  // if (true === true) {
  if (paper1Loaded && !drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }
}

console.table(window.$fxhashFeatures)
