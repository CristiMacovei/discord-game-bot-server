//? this is run when database is reset

const database = require('./database-connection');

async function main() {
  await database.init();

  const f1 = await database.createFaction({
    name: 'Faction #1'
  });
  await f1.save();

  const f2 = await database.createFaction({
    name: 'Faction #2'
  });
  await f2.save();

  const f3 = await database.createFaction({
    name: 'Faction #3'
  });
  await f3.save();

  const f4 = await database.createFaction({
    name: 'Faction #4'
  });
  await f4.save();

  const f5 = await database.createFaction({
    name: 'Faction #5'
  });
  await f5.save();

  const f6 = await database.createFaction({
    name: 'Faction #6'
  });
  await f6.save();
}

main();
