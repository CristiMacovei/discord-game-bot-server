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

async function loadImage(path, width, height, orientation = 0) {
  return await sharp(path).resize(width, height).rotate(orientation).toBuffer()
}

async function buildKingdomImage(size, buildings) {
  const underUpgrade = await loadImage('assets/other/under-construction.png', TILE_SIZE * .6, TILE_SIZE * .6);

  const buildingImages = []
  for (let building of buildings) {
    const path = buildImagePath(building.buildingId)

    console.log(building)

    building.orientation = 90 * Math.floor((building.orientation % 360) / 90);

    buildingImages.push({
      image: await loadImage(path, TILE_SIZE, TILE_SIZE, building.orientation),
      row: building.mapRow,
      col: building.mapColumn
    });

    if (building.startTimestampUnixTime + building.durationMs > new Date().getTime()) {
      buildingImages.push({
        image: underUpgrade,
        row: building.mapRow,
        col: building.mapColumn,
        isIcon: true
      })
    }
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
    buildingImages.map( ({image, row, col, isIcon}) => ({
      input: image,
      left: TILE_SIZE * (col - 1) + (isIcon === true ? TILE_SIZE * .2 : 0),
      top: TILE_SIZE * (row - 1) + (isIcon === true ? TILE_SIZE * .2 : 0)
    }))
  )
  .toBuffer()

  return image
}

module.exports = {
  buildKingdomImage,
  loadImage
}