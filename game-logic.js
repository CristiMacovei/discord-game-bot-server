const { gameConfig } = require('./game-config');
const database = require('./database-connection');

function findAttackableRange(userLevel) {
  const scoutGreatestLevel = Math.min(
    100,
    (Math.floor((userLevel - 1) / 25) + 1) * 25
  );
  const scoutLowestLevel = Math.max(
    0,
    (Math.floor((userLevel - 1) / 25) - 1) * 25
  );

  return {
    max: scoutGreatestLevel,
    min: scoutLowestLevel
  };
}

function getClassFromLevel(level) {
  if (typeof level !== 'number') {
    return null;
  }

  if (level < 0 || level > 100) {
    return null;
  }

  for (let i = 0; i < gameConfig.classes.length; i++) {
    if (
      level >= gameConfig.classes[i].levels.min &&
      level <= gameConfig.classes[i].levels.max
    ) {
      return gameConfig.classes[i];
    }
  }

  //? should never be reached
  return null;
}

function checkResources(user, cost) {
  return (
    user.rscWheat >= cost.wheat &&
    user.rscWood >= cost.wood &&
    user.rscStone >= cost.stone &&
    user.rscIron >= cost.iron
  );
}

function calculateResourcesTaken(damage, defPower, wheat, wood, stone, iron) {
  const percent = 0.5 * Math.min(damage / defPower, 1);

  return {
    wheat: Math.floor(wheat * percent),
    wood: Math.floor(wood * percent),
    stone: Math.floor(stone * percent),
    iron: Math.floor(iron * percent)
  };
}

function calculateRepairCost(building) {
  const normalCost = gameConfig.buildings[building.buildingId].cost;

  return {
    wheat: Math.floor((normalCost.wheat * (100 - building.integrity)) / 100),
    wood: Math.floor((normalCost.wood * (100 - building.integrity)) / 100),
    stone: Math.floor((normalCost.stone * (100 - building.integrity)) / 100),
    iron: Math.floor((normalCost.iron * (100 - building.integrity)) / 100)
  };
}

async function listAvailableBuildings(user) {
  const userClass = getClassFromLevel(user.level);

  let possibleBuildings = userClass.buildings;

  const alreadyOwnedBuildings = await database.findBuildingsByUserId(user.id);

  //? check if there is no more space left on the map
  if (alreadyOwnedBuildings.length >= userClass.mapSize * userClass.mapSize) {
    return {
      status: 'success',
      buildings: []
    };
  }

  console.log(possibleBuildings, alreadyOwnedBuildings);

  possibleBuildings = possibleBuildings.filter(({ id, limit }) => {
    //? check if limit has already been reached
    if (typeof limit !== 'undefined') {
      let alreadyOwnedCount = 0;

      alreadyOwnedBuildings.forEach((ownedBuilding) => {
        if (ownedBuilding.buildingId === id) {
          alreadyOwnedCount++;
        }
      });

      if (alreadyOwnedCount >= limit) {
        return false;
      }
    }

    //? check if required buildings are owned
    const requiredBuildings = gameConfig.buildings[id].requires;
    if (requiredBuildings.length > 0) {
      if (alreadyOwnedBuildings.length === 0) {
        return false;
      }

      if (
        !requiredBuildings.every((building) => {
          return alreadyOwnedBuildings.some((ownedBuilding) => {
            return ownedBuilding.buildingId === building;
          });
        })
      ) {
        return false;
      }
    }

    return true;
  });

  console.log('pb', possibleBuildings);

  return {
    status: 'success',
    buildings: possibleBuildings.map(
      (building) => gameConfig.buildings[building.id]
    )
  };
}

async function listRepairableBuildings(user) {
  const userBuildings = await database.findBuildingsByUserId(user.id);

  return userBuildings
    .filter((building) => building.integrity < 100)
    .map((building) => ({
      integrity: building.integrity,
      row: building.mapRow,
      col: building.mapColumn,
      name: gameConfig.buildings[building.buildingId].name,
      buildDuration:
        (gameConfig.buildings[building.buildingId].buildDuration *
          (100 - building.integrity)) /
        100,
      cost: calculateRepairCost(building)
    }));
}

async function checkPosition(user, buildingId, row, col, sequelize) {
  console.log(row, col);

  //? check if position is inside the map
  const mapSize = getClassFromLevel(user.level).mapSize;

  if (row <= 0 || row > mapSize || col <= 0 || col > mapSize) {
    return {
      status: 'error',
      message: 'Invalid position'
    };
  }

  //? check if position is already occupied
  const alreadyExistingBuilding = await database.findBuildingAtPosition(
    user.id,
    row,
    col
  );

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
      message: `Space occupied by ${
        gameConfig.buildings[alreadyExistingBuilding.buildingId].name
      }, please remove it first`
    };
  }

  // todo allow building on top of another building
  // todo special case for the weapons

  return {
    status: 'success'
  };
}

function findBuildingStats(buildingId) {
  return gameConfig.buildings[buildingId];
}

function calculateAttackXpGains(attackerLevel, defenderLevel, damage) {
  const attackerClass = getClassFromLevel(attackerLevel).name;
  const defenderClass = getClassFromLevel(defenderLevel).name;

  const refName = `${attackerClass}-${defenderClass}`;

  return {
    attacker: gameConfig.attacks.xpEarned[refName][damage > 0 ? 'win' : 'lose'],
    defender: gameConfig.attacks.xpEarned[refName][damage < 0 ? 'win' : 'lose']
  };
}

function updateUserLevel(user) {
  const cls = getClassFromLevel(user.level);

  if (user.xp >= cls.levels.delta) {
    user.level++;
    user.xp -= cls.levels.delta;
    updateUserLevel(user);
  }
}

// 1 to limit
function rng(limit, iterations = 4) {
  let picks = [];
  for (let i = 0; i < iterations; i++) {
    picks.push(1 + Math.floor(Math.random() * limit));
  }
  return picks[Math.floor(Math.random() * picks.length)];
}

module.exports = {
  listAvailableBuildings,
  listRepairableBuildings,
  calculateRepairCost,
  getClassFromLevel,
  checkPosition,
  checkResources,
  findAttackableRange,
  findBuildingStats,
  calculateAttackXpGains,
  calculateResourcesTaken,
  updateUserLevel,
  rng
};
