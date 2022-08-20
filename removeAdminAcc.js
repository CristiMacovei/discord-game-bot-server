const database = require('./database-connection');

async function wrapper() {
  await database.init();

  const target = process.argv[2].toString();
  console.log(target);

  if (!target) {
    console.log('No target specified.');
    process.exit(1);
  }

  const user = await database.findUserByDiscordId(target);

  if (!user) {
    console.log('No user found.');
    process.exit(1);
  }

  user.adminPermissions = 0;
  await user.save();

  console.log(`${user.discordId} is no longer an admin.`);
}

wrapper();
