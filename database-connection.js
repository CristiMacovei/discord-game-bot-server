const { Sequelize, DataTypes } = require('sequelize')

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './.sqlite3',
})

//? initialize database
async function init() {
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

  await sequelize.authenticate()

  await sequelize.sync()
  
  console.log('Connected to database')
}

//? user functions 
async function findUserByDiscordId(discordId) {
  return await sequelize.models.User.findOne({
    where: {
      discordId
    }
  })
}

async function createUser(params) {
  return await sequelize.models.User.create(params)
}

//? faction functions
async function findFactionById(id) {
  return await sequelize.models.Faction.findOne({
    where: {
      id
    }
  })
}

async function createFaction(params) {
  return await sequelize.models.Faction.create(params)
}

//? truce functions
async function findTruce(params) {
  return await sequelize.models.Truce.findOne({
    where: params
  })
}

async function findTrucesByUserId(userId) {
  await sequelize.models.Truce.findAll({
    where: {
      attackerId: userId
    }
  })
}

async function createTruce(params) {
  return await sequelize.models.Truce.create(params)
}

//? building functions
async function findBuildingsByUserId(userId) {
  return await sequelize.models.UserBuildings.findAll({
    where: {
      userId
    }
  })
}

async function findBuildingAtPosition(userId, row, col) {
  return await sequelize.models.UserBuildings.findOne({
    where: {
      userId: userId,
      mapRow: row,
      mapColumn: col
    }
  })
}

async function createBuilding(params) {
  return await sequelize.models.UserBuildings.create(params)
}

module.exports = {
  init,
  findUserByDiscordId,
  createUser,
  findFactionById,
  createFaction,
  findTruce,
  findTrucesByUserId,
  createTruce,
  findBuildingsByUserId,
  findBuildingAtPosition,
  createBuilding
}