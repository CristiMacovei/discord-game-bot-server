const sharp = require('sharp');

async function main() {
  const houseImage = await sharp('images/serf_house.png').resize(60, 60).toBuffer()

  sharp('./images/simple.jpg')
  .resize(840, 840)
  .extract({
    left: 0,
    top: 0,
    width: 720,
    height: 720
  })
  .composite([
    { input: houseImage, left: 0, top: 0 },
  ])
  .toFile('./images/nog.jpg', (err, info) => {
    console.log(err, info)
  })
}

main()