// Timing statistics
console.time("Bot online")
console.time("Files loaded")

// Dependencies
const Discord = require("discord.js");
const fs = require("file-system");
const path = require("path");
const request = require("request");
const moment = require("moment");
const colors = require("colors");

// Create bot object
const bot = new Discord.Client();

// Load files
let tokenFile, keyFile, configFile;
try {
  tokenFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/token.json")));
  keyFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/keys.json")));
  configFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/config.json")));
}
catch (err) {
  console.log(err.error);
}
console.timeEnd("Files loaded")

bot.on("ready", async () => {
  console.timeEnd("Bot online")
  bot.user.setActivity("v" + configFile.version + " || " + configFile.prefix + "help");
});

bot.on("message", async message => {
  let receivedTime = [moment(), Date.now()];
  console.log(("Message detected: " + receivedTime[0].format("YYYY-MM-DD kk:mm:ss:SSS")).green);



  let msg = message.content;
  let prefix = configFile.prefix;

  if (
    message.author.bot ||
    message.channel.type === "dm" ||
    !msg.startsWith(prefix)
  ) {
    return;
  }

  let msgArray = msg.substring(prefix.length).split(" ");
  msgArray = msgArray.map(element => element.toUpperCase());

  let mChannel = message.channel
  let cmd = msgArray[0]

  if (cmd === "PING") {
    let userPing = (receivedTime[1] - Date.now()) // Ping from user to the bot
    let serverPing = bot.ping
    mChannel.send({embed: {
      color: 65535,
      author: {
        name: bot.user.username,
        icon_url: bot.user.avatarURL
      },
      title: "Pong!",
      fields: [{
          name: "Ping from you to bot:",
          value: (-1 * userPing).toString() + "ms"
        },
        {
          name: "Ping from bot to Discord servers:",
          value: serverPing.toFixed(0).toString() + "ms"
        },
        {
          name: "Ping from you to Discord servers:",
          value: ((userPing * -1) + parseInt(serverPing.toFixed(0))).toString() + "ms"
      }],
      timestamp: new Date(),
      footer: {
      icon_url: bot.user.avatarURL,
      text: "Made by Jason Liu"
        }
      }
    });
  }
  else if (cmd === "HELP") {
    mChannel.send({embed: {
      color: 65535,
      author: {
        name: bot.user.username,
        icon_url: bot.user.avatarURL
      },
      title: "Commands Help",
      fields: [{
          name: prefix + "ping",
          value: "Gets pings from user to bot, bot to Discord, and combined ping of both"
        },
        {
          name: prefix + "help",
          value: "Shows descriptions for commands, and how to use them"
        }
        }]
      }
    });
  }
});
bot.login(tokenFile.token);
