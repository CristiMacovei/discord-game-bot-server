require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')

const utils = require('./utils')
const {gameConfig} = require('./game-config.js')
const gameLogic = require('./game-logic.js')
const imageUtils = require('./image-utils')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './.sqlite3',
})

const app = express()
app.use(cors())
app.use(express.json())

function defineModels() {
  const User = sequelize.define('User', {
    discordId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    adminPermissions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
    },
    faction: {
      type: DataTypes.INTEGER,
      defaultValue: -1,
      allowNull: false
    },
    rscMultiplier: {
      type: DataTypes.FLOAT,
      defaultValue: 1,
      allowNull: false
    },
    xpMultiplier: {
      type: DataTypes.FLOAT,
      defaultValue: 1,
      allowNull: false
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    gold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rscWheat: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rscWood: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rscStone: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    rscIron: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    lastBuildInteractionUnixTime: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false
    },
    lastFactionChangeUnixTime: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false
    },
    lastGatherUnixTime: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false
    },
  })

  const UserBuildings = sequelize.define('UserBuildings', {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    buildingId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false
    },
    mapRow: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    mapColumn: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    startTimestampUnixTime: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    durationMs: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 60 * 60 * 1000
    }
  })

  const Faction = sequelize.define('Faction', {
    name: {
      type: DataTypes.STRING
    },
    xpMultiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    },
    rscMultiplier: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1
    },
    pathToCrestImage: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: './images/default.png'
    }
  })

  const Truce = sequelize.define('Truce', {
    attackerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attackerDiscordId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    defenderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    defenderDiscordId: {
      type: DataTypes.STRING,
      allowNull: false
    }
  })
}

async function main() {
  app.listen('4848', () => {
    console.log('Server started on port 4848')
  })

  await sequelize.authenticate()
  
  defineModels()
  await sequelize.sync()
  
  console.log('Connected to database')
  console.log('Running on port 4848') 
}

app.post('/user', async (req, res) => {
  const discordId = req.body.discordId
  console.log(discordId)

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user) {
    res.json({
      'status': 'success',
      'user': user
    })
  }
  else {
    res.json({
      'status': 'error',
      'message': 'User not found'
    })
  }
})

app.post('/choose-faction', async (req, res) => {
  const discordId = req.body.discordId
  const newFaction = req.body.faction

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    await sequelize.models.User.create({
      discordId,
      faction: newFaction
    })

    res.json({
      status: 'success'
    })
  }
  else {
    const cTime = new Date().getTime()
    const lastChange = parseInt(user.lastFactionChangeUnixTime)

    const _30days = 1000 * 60 * 60 * 24 * 30

    console.log(`Current Time: ${cTime} Last Change: ${lastChange}`)

    if (cTime - lastChange < _30days) {
      res.json({
        status: 'error',
        message: `You must wait \`${utils.periodToString(_30days - (cTime - lastChange))}\` before changing factions again`
      })

      return
    }

    user.faction = newFaction
    user.lastFactionChangeUnixTime = cTime.toString()

    await user.save()

    res.json({
      status: 'success'
    })
  }
})

app.post('/gather', async (req, res) => {
  const discordId = req.body.discordId

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Account not existing'
    })

    return
  }
  
  const cTime = new Date().getTime()
  const lastGather = parseInt(user.lastGatherUnixTime)

  const _1hour = 1000 * 60 * 60

  console.log(`Current Time: ${cTime} Last Gather: ${lastGather}`)

  if (cTime - lastGather < _1hour) {
    res.json({
      status: 'error',
      message: `You must wait \`${utils.periodToString(_1hour - (cTime - lastGather))}\` before gathering again`
    })

    return
  }

  const userClass = gameLogic.getClassFromLevel(user.level)

  if (userClass === null) {
    res.json({
      status: 'error',
      message: 'Unknown issue occured when trying to parse user class. Please report this to the developers (E-253@main.js)'
    })

    return
  }

  const baseWheat = Math.random() * userClass.gatherAmount.wheat
  const baseWood = Math.random() * userClass.gatherAmount.wood
  const baseStone = Math.random() * userClass.gatherAmount.stone
  const baseIron = Math.random() * userClass.gatherAmount.iron

  //? get faction resource multiplier
  console.log(user.faction)
  const faction = await sequelize.models.Faction.findOne({
    where: {
      id: user.faction
    }
  })

  if (faction === null) {
    res.json({
      status: 'error',
      message: 'Unknown issue occured when trying to parse faction. Please report this to the developers (E-313@main.js)'
    })
  }

  console.log(faction.rscMultiplier)
  console.log(user.rscMultiplier)

  //? take into account resource multipliers
  const wheat = Math.ceil(baseWheat * faction.rscMultiplier * user.rscMultiplier)
  const wood = Math.ceil(baseWood * faction.rscMultiplier * user.rscMultiplier)
  const stone = Math.ceil(baseStone * faction.rscMultiplier * user.rscMultiplier)
  const iron = Math.ceil(baseIron * faction.rscMultiplier * user.rscMultiplier)

  user.rscWheat += wheat
  user.rscWood += wood
  user.rscStone += stone
  user.rscIron += iron
  user.lastGatherUnixTime = cTime.toString()
  await user.save()

  res.json({
    status: 'success',
    gathered: {
      wheat,
      wood,
      stone,
      iron
    },
    multipliers: {
      faction: faction.rscMultiplier,
      user: user.rscMultiplier
    }
  })
})

app.post('/create-truce', async (req, res) => {
  const attackerDiscordId = req.body.attackerDiscordId
  const defenderDiscordId = req.body.defenderDiscordId

  const attacker = await sequelize.models.User.findOne({
    where: {
      discordId: attackerDiscordId
    }
  })

  const defender = await sequelize.models.User.findOne({
    where: {
      discordId: defenderDiscordId
    }
  })

  if (attacker === null) {
    res.json({
      status: 'error',
      message: 'You have to be part of a faction to create a truce'
    })

    return
  }

  if (defender === null) {
    res.json({
      status: 'error',
      message: 'Target has to be part of a faction to create a truce'
    })

    return
  }

  const alreadyExistingTruce = await sequelize.models.Truce.findOne({
    where: {
      attackerId: attacker.id,
      attackerDiscordId,
      defenderId: defender.id,
      defenderDiscordId
    }
  })

  if (alreadyExistingTruce !== null) {
    res.json({
      status: 'error',
      message: 'You already have a truce with this target'
    })

    return
  }


  await sequelize.models.Truce.create({
    attackerId: attacker.id,
    attackerDiscordId,
    defenderId: defender.id,
    defenderDiscordId
  })

  res.json({
    status: 'success'
  })
})

app.post('/break-truce', async (req, res) => {
  const attackerDiscordId = req.body.attackerDiscordId
  const defenderDiscordId = req.body.defenderDiscordId

  const attacker = await sequelize.models.User.findOne({
    where: {
      discordId: attackerDiscordId
    }
  })

  const defender = await sequelize.models.User.findOne({
    where: {
      discordId: defenderDiscordId
    }
  })

  if (attacker === null) {
    res.json({
      status: 'error',
      message: 'You have to be part of a faction to break a truce'
    })

    return
  }

  if (defender === null) {
    res.json({
      status: 'error',
      message: 'Target has to be part of a faction to break a truce'
    })

    return
  }

  const alreadyExistingTruce = await sequelize.models.Truce.findOne({
    where: {
      attackerId: attacker.id,
      attackerDiscordId,
      defenderId: defender.id,
      defenderDiscordId
    }
  })

  if (alreadyExistingTruce === null) {
    res.json({
      status: 'error',
      message: 'No truce found to break with this target'
    })

    return
  }


  await alreadyExistingTruce.destroy()

  res.json({
    status: 'success'
  })
})

app.post('/list-truces', async (req, res) => {
  const discordId = req.body.discordId

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'You need to be part of a faction to list your truces'
    })

    return
  }

  const truces = await sequelize.models.Truce.findAll({
    where: {
      attackerDiscordId: discordId,
      attackerId: user.id
    }
  })

  res.json({
    status: 'success',
    truces
  }) 
})

app.post('/build-list', async (req, res) => {
  //? find user 
  const discordId = req.body.discordId

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Account not existing'
    })

    return
  }

  //? call the function from game logic
  const response = await gameLogic.listAvailableBuildings(user, sequelize)

  res.json(
    response
  )
})

app.post('/build', async (req, res) => {
  const discordId = req.body.discordId
  const buildingName = req.body.buildingName
  const row = req.body.row
  const col = req.body.col

  //? find user 
  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Account not existing'
    })

    return
  }
  
  //? get available buildings for this user 
  const { status, buildings, message } = await gameLogic.listAvailableBuildings(user, sequelize)
  if (status !== 'success') {
    res.json({
      status,
      message
    })

    return
  }

  //? find the desired building by name among the available ones
  const building = buildings.find(b => b.name.toLowerCase() === buildingName.toLowerCase())

  console.log('Found', building)

  //? if nothing is found error out 
  if (typeof building === 'undefined') {
    res.json({
      status: 'error',
      message: 'No building available with the name ' + buildingName
    })

    return
  }


  //? check if the position is valid 
  const positionStatus = await gameLogic.checkPosition(user, building.id, row, col, sequelize)

  if (positionStatus.status !== 'success') {
    res.json({
      status: positionStatus.status,
      message: positionStatus.message
    })

    return
  }

  
  try {
    const newBuilding = await sequelize.models.UserBuildings.create({
      userId: user.id,
      buildingId: building.id,
      mapRow: row,
      mapColumn: col,
      startTimestampUnixTime: new Date().getTime()
    })
  
    await newBuilding.save()
  
    res.json({
      status: 'success',
      building: gameConfig.buildings[building.id]      
    })
  } catch (exc) {
    res.json({
      status: 'error',
      message: `Something went wrong: ${exc}`
    })
  }
  
})

app.post('/kingdom-image', async (req, res) => {
  const discordId = req.body.discordId

  //? find user 
  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  if (user === null) {
    res.json({
      status: 'error',
      message: 'Account not existing'
    })

    return
  }

  //? get user class
  const userClass = gameLogic.getClassFromLevel(user.level)

  //? get user's buildings
  const userBuildings = await sequelize.models.UserBuildings.findAll({
    where: {
      userId: user.id
    }
  })

  //? get image buffer 
  const imageBuffer = await imageUtils.buildKingdomImage(userClass.mapSize, userBuildings.map(building => {
    return {
      name: building.buildingId,
      row: building.mapRow,
      col: building.mapColumn
    }
  }))

  res.json({
    status: 'success',
    image: imageBuffer
  })
})

main()
