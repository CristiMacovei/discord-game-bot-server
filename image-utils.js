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
  //? build a 2d array of the buildings
  const matrix = [];
  for (let i = 0; i < size; i++) {
    matrix.push([]);

    for (let j = 0; j < size; j++) {
      matrix[i].push(undefined);
    }
  }

  for (let {name, row, col} of buildings) {
    matrix[row - 1][col - 1] = { name };
  }
  
  const buildingImages = []
  for (let {name, row, col} of buildings) {
    //? send the extra info if there's a wall
    if (name.includes('wall')) {
      let trbl = 0b0000;

      //? top ( bit 0 ) 
      if (row > 1 && typeof matrix[row - 2][col - 1] !== 'undefined') {
        trbl |= 0b0001;
      }

      //? right ( bit 1 )
      if (col < size && typeof matrix[row - 1][col] !== 'undefined') {
        trbl |= 0b0010;
      }

      //? bottom ( bit 2 )
      if (row < size && typeof matrix[row][col - 1] !== 'undefined') {
        trbl |= 0b0100;
      }

      //? left ( bit 3 )
      if (col > 1 && typeof matrix[row - 1][col - 2] !== 'undefined') {
        trbl |= 0b1000;
      }

      name += trbl.toString();
    }


    const path = buildImagePath(name)

    buildingImages.push({
      image: await loadImage(path, TILE_SIZE, TILE_SIZE),
      row,
      col
    })
  }

  console.log(matrix)

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
  buildKingdomImage,
  loadImage
}