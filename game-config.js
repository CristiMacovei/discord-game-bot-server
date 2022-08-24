const config = {
  buildings: {
    serf_keep: {
      name: 'Keep',
      id: 'serf_keep',
      cost: {
        wheat: 20,
        wood: 20,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 5,
        defense: 5
      },
      requires: []
    }, // serf keep
    serf_church: {
      name: 'Church',
      id: 'serf_church',
      cost: {
        wheat: 15,
        wood: 15,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 2,
        defense: 3
      },
      requires: []
    }, // serf church
    serf_home: {
      name: 'Home',
      id: 'serf_home',
      cost: {
        wheat: 10,
        wood: 10,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 1,
        defense: 4
      },
      requires: []
    }, // serf home
    serf_barracks: {
      name: 'Barracks',
      id: 'serf_barracks',
      cost: {
        wheat: 20,
        wood: 20,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 7,
        defense: 3
      },
      requires: []
    }, // serf barracks
    serf_gatehouse: {
      name: 'Gatehouse',
      id: 'serf_gatehouse',
      cost: {
        wheat: 20,
        wood: 40,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 5,
        defense: 5
      },
      requires: ['serf_keep', 'serf_church', 'serf_home', 'serf_barracks']
    }, // serf gatehouse
    serf_wall: {
      name: 'Wall',
      id: 'serf_wall',
      cost: {
        wheat: 10,
        wood: 20,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 5,
        defense: 5
      },
      requires: ['serf_gatehouse'] // gatehouse requires for essential buildings to be built already
    }, // serf wall
    serf_tower: {
      name: 'Tower',
      id: 'serf_tower',
      cost: {
        wheat: 10,
        wood: 50,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 3,
        defense: 7
      },
      requires: ['serf_keep', 'serf_church', 'serf_home', 'serf_barracks']
    }, // serf tower
    serf_guardhouse: {
      name: 'Guardhouse',
      id: 'serf_guardhouse',
      cost: {
        wheat: 10,
        wood: 50,
        stone: 0,
        iron: 0
      },
      stats: {
        attack: 7,
        defense: 3
      },
      requires: ['serf_keep', 'serf_church', 'serf_home', 'serf_barracks']
    } // serf guardhouse
    // todo  add the other buildings here
  },

  classes: [
    {
      name: 'SERF',
      mapSize: 6,
      levels: {
        min: 0,
        max: 25,
        delta: 100
      },
      buildings: [
        {
          id: 'serf_keep',
          limit: 1
        },
        {
          id: 'serf_church',
          limit: 1
        },
        {
          id: 'serf_home',
          limit: 1
        },
        {
          id: 'serf_barracks',
          limit: 1
        },
        {
          id: 'serf_gatehouse',
          limit: 1
        },
        {
          id: 'serf_wall'
        },
        {
          id: 'serf_tower'
        },
        {
          id: 'serf_guardhouse'
        }
      ],
      gatherAmount: {
        wheat: 5,
        wood: 5,
        stone: 0,
        iron: 0
      }
    },
    {
      name: 'Knight',
      mapSize: 8,
      levels: {
        min: 26,
        max: 50,
        delta: 250
      },
      buildings: [],
      gatherAmount: {
        wheat: 10,
        wood: 10,
        stone: 10,
        iron: 10
      }
    },
    {
      name: 'Noble',
      mapSize: 10,
      levels: {
        min: 51,
        max: 75,
        delta: 625
      },
      buildings: [],
      gatherAmount: {
        wheat: 15,
        wood: 15,
        stone: 15,
        iron: 15
      }
    },
    {
      name: 'King',
      mapSize: 12,
      levels: {
        min: 76,
        max: 100,
        delta: 1500
      },
      buildings: [],
      gatherAmount: {
        wheat: 25,
        wood: 25,
        stone: 25,
        iron: 25
      }
    }
  ],

  scout: {
    levelDifference: 1
  },

  attacks: {
    cooldownMilliseconds: 6 * 60 * 60 * 1000 // 6 hours
  }
};

module.exports = {
  gameConfig: config
};
