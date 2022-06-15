const sharp = require('sharp')

const TILE_SIZE = 60
const NUM_TILES = 14
const MAP_SIZE = NUM_TILES * TILE_SIZE


function buildImagePath(buildingId) {
  if (buildingId.startsWith('serf_')) {
    return `assets/buildings/serf/${buildingId}.png`
  }
  
  if (buildingId.startsWith('knight_')) {
    return `assets/buildings/knight/${buildingId}.png`
  }

  if (buildingId.startsWith('noble_')) {
    return `assets/buildings/noble/${buildingId}.png`
  }

  if (buildingId.startsWith('king_')) {
    return `assets/buildings/king/${buildingId}.png`
  }

  return null
}

async function loadImage(path, width, height) {
  return await sharp(path).resize(width, height).toBuffer()
}

async function buildKingdomImage(size, buildings) {
  const buildingImages = []
  for (let {name, row, col} of buildings) {
    const path = buildImagePath(name)

    buildingImages.push({
      image: await loadImage(path, TILE_SIZE, TILE_SIZE),
      row,
      col
    })
  }

  console.log(buildingImages)

  const image = await sharp('assets/maps/simple.jpg')
  .resize(MAP_SIZE, MAP_SIZE)
  .extract({
    left: 0,
    top: 0,
    width: MAP_SIZE / NUM_TILES * size,
    height: MAP_SIZE / NUM_TILES * size
  })
  .composite(
    buildingImages.map( ({image, row, col}) => ({
      input: image,
      left: TILE_SIZE * (col - 1),
      top: TILE_SIZE * (row - 1)
    }))
  )
  .toBuffer()

  return image
}

module.exports = {
  buildKingdomImage
}