// Timing statistics
console.time("Bot online")
console.time("Files loaded")

// Dependencies
const Discord = require("discord.js");
const Hypixel = require("hypixel");
const rp = require("request-promise")
const fs = require("file-system");
const path = require("path");
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

// Create hypixel object
const hyp = new Hypixel({key: keyFile.hypixel});

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

  // Define functions
  // Makes embeds easier
  function sendInfo (color, title, description) {
    message.channel.send({embed: {
        color: color,
        title: title,
        description: description
      }
    });
  }

  // Converts a MC player name to the UUID
  function convertToUUID (playerName) {
    console.time("Got UUID for " + playerName)
    return rp("https://api.mojang.com/users/profiles/minecraft/" + playerName).then(body => {
      let jsonData = JSON.parse(body);
      return jsonData;
    });
    console.timeEnd("Got UUID for " + playerName)
  };

  if (cmd === "PING") {
    let userPing = (receivedTime[1] - Date.now()) // Ping from user to the bot
    let serverPing = bot.ping
    mChannel.send({embed: {
      color: 5119,
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
      text: "Made by Jason Liu"
        }
      }
    });
  }
  else if (cmd === "HELP") {
    mChannel.send({embed: {
      color: 5119,
      title: "Commands Help",
      fields: [{
          name: prefix + "help",
          value: "Shows descriptions for commands, and how to use them"
        },
        {
          name: prefix + "ping",
          value: "Gets pings from user to bot, bot to Discord, and combined ping of both"
        }],
        timestamp: new Date(),
        footer: {
        text: "Made by Jason Liu"
        }
      }
    });
  }
  else if (cmd === "HYPIXEL") {
    if (msgArray.length === 1 || msgArray.length === 2 ) {
      sendInfo(15773006, ":grey_exclamation: Command Info", "Make sure you have entered all parameters! See the help page for more details")
    }
    else {
      let name = msgArray[1];
      let gamemode = msgArray[2];
      gamemode = gamemode.toUpperCase();
      convertToUUID(name).then(data => {
        hyp.getPlayer(data.id, (err, player) => {
          if (err) {
            console.log(err)
          }
          else {
            if (gamemode === "BEDWARS" || gamemode === "BEDW") {
              if (msgArray.length < 4) {
                sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter **General**, **Solo**, **Doubles**, **3v3** or **4v4**.")
              }
              else {
                let bedwStats = player.stats.Bedwars;
                let teamSize = msgArray[3];
                teamSize = teamSize.toUpperCase();
                if (teamSize === "GENERAL" && player.stats.Bedwars != undefined) {
                  mChannel.send({embed: {
                      color: 5119,
                      title: ("Hypixel's BedWars Stats: General"),
                      description: "General Stats for " + name,
                      fields: [{
                        name: "General",
                        value: ("**Games Played**: " + bedwStats.games_played_bedwars + "\n **Kills**: " + bedwStats.kills_bedwars + " **Deaths**: "
                         + bedwStats.deaths_bedwars + " **KDR**: " + (bedwStats.kills_bedwars/bedwStats.deaths_bedwars).toFixed(2) + "\n **Wins**: "
                         + bedwStats.wins_bedwars + " **Losses**: " + bedwStats.losses_bedwars + " **Win Rate**: "
                         + ((bedwStats.wins_bedwars/bedwStats.games_played_bedwars) * 100).toFixed(0) + "%")
                      }, {
                        name: "Resources",
                        value: ("**Iron Collected**: " + bedwStats.iron_resources_collected_bedwars + " **Gold Collected**: " + bedwStats.gold_resources_collected_bedwars
                        + "\n **Diamonds Collected**: " + bedwStats.diamond_resources_collected_bedwars + " **Emeralds Collected**: " + bedwStats.emerald_resources_collected_bedwars)
                      }],
                      timestamp: new Date(),
                      footer: {
                        text: "Made by Jason Liu"
                      }
                    }
                  });
                }
                else {
                  sendInfo(15773006, ":grey_exclamation: Command Info", "User has not played BedWars")
                }
              }
            }
            else {
              sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter a gamemode!")
            }
          }
        });
      }).catch(err => {
        sendInfo(15773006, ":grey_exclamation: Command Info", "You have entered a nonexistant player name! Please check your spelling!")
      });
    }
  }
});
bot.login(tokenFile.token);
