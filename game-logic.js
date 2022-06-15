const { gameConfig } = require('./game-config')
const database = require('./database-connection')

function getClassFromLevel(level) {
  if (typeof level !== 'number') {
    return null
  }
  
  if (level < 0 || level > 100) {
    return null
  }
  
  for (let i = 0; i < gameConfig.classes.length; i++) {
    if (level >= gameConfig.classes[i].levels.min && level <= gameConfig.classes[i].levels.max) {
      return gameConfig.classes[i];
    }
  }

  //? should never be reached 
  return null
}

async function listAvailableBuildings(user) {
  const userClass = getClassFromLevel(user.level)

  let possibleBuildings = userClass.buildings

  const alreadyOwnedBuildings = await database.findBuildingsByUserId(user.id)

  //? check if there is no more space left on the map 
  if (alreadyOwnedBuildings.length >= userClass.mapSize * userClass.mapSize) {
    return {
      status: 'success',
      buildings: []
    } 
  }

  console.log(possibleBuildings, alreadyOwnedBuildings)

  possibleBuildings = possibleBuildings.filter( ({ id, limit }) => {
    //? check if limit has already been reached 
    if (typeof limit !== 'undefined') {
      let alreadyOwnedCount = 0

      alreadyOwnedBuildings.forEach( ownedBuilding => {
        if (ownedBuilding.buildingId === id) {
          alreadyOwnedCount++
        }
      })

      if (alreadyOwnedCount >= limit) {
        return false
      }
    }

    //? check if required buildings are owned
    const requiredBuildings = gameConfig.buildings[id].requires
    if (requiredBuildings.length > 0) {
      if (alreadyOwnedBuildings.length === 0) {
        return false
      }

      if (!requiredBuildings.every(building => {
        return alreadyOwnedBuildings.some(ownedBuilding => {
          return ownedBuilding.buildingId === building
        })
      })) {
        return false
      }
    }

    return true
  })
  
  return {
    status: 'success',
    buildings: possibleBuildings.map(building => {
      return gameConfig.buildings[building.id]
    })
  }
}

async function checkPosition(user, buildingId, row, col, sequelize) {
  console.log(row, col)

  //? check if position is inside the map 
  const mapSize = getClassFromLevel(user.level).mapSize

  if (row <= 0 || row > mapSize || col <= 0 || col > mapSize) {
    return {
      status: 'error',
      message: 'Invalid position'
    }
  }

  //? check if position is already occupied
  const alreadyExistingBuilding = await database.findBuildingAtPosition(user.id, row, col)

  // // if the building existing there is required for the current building, error out
  // if (alreadyExistingBuilding && gameConfig.buildings[buildingId].requires.some(b => b.id.toLowerCase() === alreadyExistingBuilding.id.toLowerCase())) {
  //   return {
  //     status: 'error',
  //     message: `Space occupied by ${gameConfig.buildings[alreadyExistingBuilding.id].name}, please remove it first`
  //   }
  // } 

  if (alreadyExistingBuilding) {
    return {
      status: 'error',
      message: `Space occupied by ${gameConfig.buildings[alreadyExistingBuilding.buildingId].name}, please remove it first`
    }
  }

  // todo allow building on top of another building 
  // todo special case for the weapons

  return {
    status: 'success'
  }
}

module.exports = {
  listAvailableBuildings,
  getClassFromLevel,
  checkPosition
}