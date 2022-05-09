require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Sequelize, DataTypes } = require('sequelize')

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
    lastBuildInteractionUnixTime: {
      type: DataTypes.STRING,
      defaultValue: '0',
      allowNull: false
    },
    gold: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
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
  }
  else {
    user.faction = newFaction
    await user.save()
  }

  res.json({
    'success': true
  })
})

main()