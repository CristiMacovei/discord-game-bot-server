require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')

const utils = require('./utils')

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
  await sequelize.sync({ force: false })
  
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

  const gatheredAmount = (Math.random() * 100).toFixed(0)

  user.resources += gatheredAmount
  user.lastGatherUnixTime = cTime.toString()
  await user.save()

  res.json({
    status: 'success',
    amount: gatheredAmount
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

main()