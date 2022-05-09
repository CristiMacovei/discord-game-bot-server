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
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    isMasterAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
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
    resources: {
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

app.get('/user', async (req, res) => {
  const discordId = req.query.discordId
  console.log(discordId)

  const user = await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })

  res.send({ user })
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

main()