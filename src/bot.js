// Timing statistics
console.time("Bot online")
console.time("Files loaded")

// Dependencies
const Discord = require("discord.js");
const Hypixel = require("hypixel");
const Fortnite = require("fortnite-api")
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

// Settings for fortnite API
let fortniteAPI = new Fortnite(
  [
    keyFile.fn_email,
    keyFile.fn_password,
    keyFile.fn_launcher,
    keyFile.fn_client
  ],
  {
    debug: true
  }
);

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

  let mChannel = message.channel
  let cmd = msgArray[0]

  // Define functions
  // Makes embeds easier
  function sendInfo (color, title, description) {
    message.channel.send({embed: {
        color: color,
        title: title,
        description: description,
        timestamp: new Date(),
        footer: {
          text: "Made by Jason Liu"
        }
      }
    });
  }

  // Converts a MC player name to the UUID
  function convertToUUID (playerName) {
    return rp("https://api.mojang.com/users/profiles/minecraft/" + playerName).then(body => {
      let jsonData = JSON.parse(body);
      return jsonData;
    });
  };

  // Get data from Fortnite API
  function getFortniteData(username, platform, timeframe) {
    return fortniteAPI.login().then(() => {
      return fortniteAPI
        .getStatsBR(username, platform, timeframe)
        .then(stats => {
          let statsData = stats;
          return statsData
        });
    });
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
                if (teamSize === "GENERAL" && bedwStats != undefined) {
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
                        name: "PVP Stats",
                        value: ("**Final Kills**: " + bedwStats.final_kills_bedwars + " **Void/Fall Kills**: " + (bedwStats.void_kills_bedwars + bedwStats.fall_kills_bedwars)
                        + "\n **Beds Broken**: " + bedwStats.beds_broken_bedwars + " **Beds Lost**: " + bedwStats.beds_lost_bedwars)
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
                else if (teamSize === "SOLO" && bedwStats != undefined) {
                  mChannel.send({embed: {
                      color: 5119,
                      title: ("Hypixel's BedWars Stats: Solo"),
                      description: "Solo Stats for " + name,
                      fields: [{
                        name: "General",
                        value: ("**Games Played**: " + bedwStats.eight_one_games_played_bedwars + "\n **Kills**: " + bedwStats.eight_one_kills_bedwars + " **Deaths**: "
                         + bedwStats.eight_one_deaths_bedwars + " **KDR**: " + (bedwStats.eight_one_kills_bedwars/bedwStats.eight_one_deaths_bedwars).toFixed(2) + "\n **Wins**: "
                         + bedwStats.eight_one_wins_bedwars + " **Losses**: " + bedwStats.eight_one_losses_bedwars + " **Win Rate**: "
                         + ((bedwStats.eight_one_wins_bedwars/bedwStats.eight_one_games_played_bedwars) * 100).toFixed(0) + "%")
                      }, {
                        name: "PVP Stats",
                        value: ("**Final Kills**: " + bedwStats.eight_one_final_kills_bedwars + " **Void/Fall Kills**: " + (bedwStats.eight_one_void_kills_bedwars + bedwStats.eight_one_fall_kills_bedwars)
                        + "\n **Beds Broken**: " + bedwStats.eight_one_beds_broken_bedwars + " **Beds Lost**: " + bedwStats.eight_one_beds_lost_bedwars)
                      }, {
                        name: "Resources",
                        value: ("**Iron Collected**: " + bedwStats.eight_one_iron_resources_collected_bedwars + " **Gold Collected**: " + bedwStats.eight_one_gold_resources_collected_bedwars
                        + "\n **Diamonds Collected**: " + bedwStats.eight_one_diamond_resources_collected_bedwars + " **Emeralds Collected**: " + bedwStats.eight_one_emerald_resources_collected_bedwars)
                      }],
                      timestamp: new Date(),
                      footer: {
                        text: "Made by Jason Liu"
                      }
                    }
                  });
                }
                else if (teamSize === "DOUBLES" && bedwStats != undefined) {
                  mChannel.send({embed: {
                      color: 5119,
                      title: ("Hypixel's BedWars Stats: Doubles"),
                      description: "Doubles Stats for " + name,
                      fields: [{
                        name: "General",
                        value: ("**Games Played**: " + bedwStats.eight_two_games_played_bedwars + "\n **Kills**: " + bedwStats.eight_two_kills_bedwars + " **Deaths**: "
                         + bedwStats.eight_two_deaths_bedwars + " **KDR**: " + (bedwStats.eight_two_kills_bedwars/bedwStats.eight_two_deaths_bedwars).toFixed(2) + "\n **Wins**: "
                         + bedwStats.eight_two_wins_bedwars + " **Losses**: " + bedwStats.eight_two_losses_bedwars + " **Win Rate**: "
                         + ((bedwStats.eight_two_wins_bedwars/bedwStats.eight_two_games_played_bedwars) * 100).toFixed(0) + "%")
                      }, {
                        name: "PVP Stats",
                        value: ("**Final Kills**: " + bedwStats.eight_two_final_kills_bedwars + " **Void/Fall Kills**: " + (bedwStats.eight_two_void_kills_bedwars + bedwStats.eight_two_fall_kills_bedwars)
                        + "\n **Beds Broken**: " + bedwStats.eight_two_beds_broken_bedwars + " **Beds Lost**: " + bedwStats.eight_two_beds_lost_bedwars)
                      }, {
                        name: "Resources",
                        value: ("**Iron Collected**: " + bedwStats.eight_two_iron_resources_collected_bedwars + " **Gold Collected**: " + bedwStats.eight_two_gold_resources_collected_bedwars
                        + "\n **Diamonds Collected**: " + bedwStats.eight_two_diamond_resources_collected_bedwars + " **Emeralds Collected**: " + bedwStats.eight_two_emerald_resources_collected_bedwars)
                      }],
                      timestamp: new Date(),
                      footer: {
                        text: "Made by Jason Liu"
                      }
                    }
                  });
                }
                else if (teamSize === "3V3" && bedwStats != undefined) {
                  mChannel.send({embed: {
                      color: 5119,
                      title: ("Hypixel's BedWars Stats: 3v3"),
                      description: "3v3 Stats for " + name,
                      fields: [{
                        name: "General",
                        value: ("**Games Played**: " + bedwStats.four_three_games_played_bedwars + "\n **Kills**: " + bedwStats.four_three_kills_bedwars + " **Deaths**: "
                         + bedwStats.four_three_deaths_bedwars + " **KDR**: " + (bedwStats.four_three_kills_bedwars/bedwStats.four_three_deaths_bedwars).toFixed(2) + "\n **Wins**: "
                         + bedwStats.four_three_wins_bedwars + " **Losses**: " + bedwStats.four_three_losses_bedwars + " **Win Rate**: "
                         + ((bedwStats.four_three_wins_bedwars/bedwStats.four_three_games_played_bedwars) * 100).toFixed(0) + "%")
                      }, {
                        name: "PVP Stats",
                        value: ("**Final Kills**: " + bedwStats.four_three_final_kills_bedwars + " **Void/Fall Kills**: " + (bedwStats.four_three_void_kills_bedwars + bedwStats.four_three_fall_kills_bedwars)
                        + "\n **Beds Broken**: " + bedwStats.four_three_beds_broken_bedwars + " **Beds Lost**: " + bedwStats.four_three_beds_lost_bedwars)
                      }, {
                        name: "Resources",
                        value: ("**Iron Collected**: " + bedwStats.four_three_iron_resources_collected_bedwars + " **Gold Collected**: " + bedwStats.four_three_gold_resources_collected_bedwars
                        + "\n **Diamonds Collected**: " + bedwStats.four_three_diamond_resources_collected_bedwars + " **Emeralds Collected**: " + bedwStats.four_three_emerald_resources_collected_bedwars)
                      }],
                      timestamp: new Date(),
                      footer: {
                        text: "Made by Jason Liu"
                      }
                    }
                  });
                }
                else if (teamSize === "4V4" && bedwStats != undefined) {
                  mChannel.send({embed: {
                      color: 5119,
                      title: ("Hypixel's BedWars Stats: 4v4"),
                      description: "4v4 Stats for " + name,
                      fields: [{
                        name: "General",
                        value: ("**Games Played**: " + bedwStats.four_four_games_played_bedwars + "\n **Kills**: " + bedwStats.four_four_kills_bedwars + " **Deaths**: "
                         + bedwStats.four_four_deaths_bedwars + " **KDR**: " + (bedwStats.four_four_kills_bedwars/bedwStats.four_four_deaths_bedwars).toFixed(2) + "\n **Wins**: "
                         + bedwStats.four_four_wins_bedwars + " **Losses**: " + bedwStats.four_four_losses_bedwars + " **Win Rate**: "
                         + ((bedwStats.four_four_wins_bedwars/bedwStats.four_four_games_played_bedwars) * 100).toFixed(0) + "%")
                      }, {
                        name: "PVP Stats",
                        value: ("**Final Kills**: " + bedwStats.four_four_final_kills_bedwars + " **Void/Fall Kills**: " + (bedwStats.four_four_void_kills_bedwars + bedwStats.four_four_fall_kills_bedwars)
                        + "\n **Beds Broken**: " + bedwStats.four_four_beds_broken_bedwars + " **Beds Lost**: " + bedwStats.four_four_beds_lost_bedwars)
                      }, {
                        name: "Resources",
                        value: ("**Iron Collected**: " + bedwStats.four_four_iron_resources_collected_bedwars + " **Gold Collected**: " + bedwStats.four_four_gold_resources_collected_bedwars
                        + "\n **Diamonds Collected**: " + bedwStats.four_four_diamond_resources_collected_bedwars + " **Emeralds Collected**: " + bedwStats.four_four_emerald_resources_collected_bedwars)
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
        sendInfo(15773006, ":grey_exclamation: Command Info", "This player doesn't exist! Please check your spelling!")
      });
    }
  }
  else if (cmd === "FORTNITE" || cmd === "FN" || cmd === "FTN") {
    // Example command [prefix]fortnite [username] [platform] [mode] [timeframe]
    /*getFortniteData("MCG_Potato", "pc", "alltime").then(data => {
      console.log(data)
    })*/


    if (msgArray.length === 1 || msgArray.length === 2) {
      sendInfo(15773006, ":grey_exclamation: Command Info", "Make sure you have entered all parameters! See the help page for more details")
    }
    else {
      let username = msgArray[1];
      let platform = msgArray[2].toLowerCase();

      msgArray = msgArray.map(x => x.toUpperCase());

      if (msgArray.length === 3) {
        // Default action
        console.log("No other parameters given, defaulting to combined stats...".green)

        if (platform === "pc" || platform === "ps4" || platform === "xb1" || platform === "xbox") {
          if (platform === "xbox") {
            platform = "xb1";
          }
          getFortniteData(username, platform, "alltime").then(stats => {
            // Stats code here, print out combined stats only
            let kd = 'k/d'
            let win = 'win%'

            let totalWins = stats.group.solo.wins + stats.group.duo.wins + stats.group.squad.wins;
            let kdr = stats.lifetimeStats['k/d'];
            let winRate = stats.lifetimeStats['win%'];
            let matches = stats.lifetimeStats.matches;
            let kills = stats.lifetimeStats.kills;
            let averageKills = stats.lifetimeStats.killsPerMatch;

            mChannel.send({embed: {
              color: 5119,
              title: ("Fortnite Stats: Alltime General"),
              fields: [{
                name: username,
                value: ("**Total Wins**: " + totalWins + " **KDR**: " + kdr
                + "\n **Win Rate**: " + winRate + " **Matches**: " + matches
                + "\n **Kills**: " + kills + " **Average Kills**: " + averageKills)
              }],
              timestamp: new Date(),
              footer: {
                text: "Made by Jason Liu"
              }
            }
          });
          }).catch(err => {
            console.log(err);
          });
        }
        else {
          sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the platform your username is for!")
        }
      }
      else if (msgArray.length === 4) {
        if (msgArray.includes("SOLO") || msgArray.includes("DUOS") || msgArray.includes("DOUBLES") || msgArray.includes("SQUADS")) {
          if (platform === "pc" || platform === "ps4" || platform === "xb1" || platform === "xbox") {
            if (platform === "xbox") {
              platform = "xb1";
            }
            getFortniteData(username, platform.toLowerCase(), "alltime").then(stats => {
              // Stats code here, add if blocks for different modes
            }).catch(err => {
              console.log(err);
            });
          }
          else {
            sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the platform your username is for!")
          }
        }
        else if (msgArray.includes("ALLTIME") || msgArray.includes("SEASONS") || msgArray.includes("SEASONAL") || msgArray.includes("SEASON")) {
          let timeframe = msgArray[3].toLowerCase(); // Only in this case
          if (msgArray[3] === "SEASONAL" || msgArray[3] === "SEASON" || msgArray[3] === 'SEASONS') {
            timeframe = "weekly"
            if (platform === "pc" || platform === "ps4" || platform === "xb1" || platform === "xbox") {
              if (platform === "xbox") {
                platform = "xb1";
              }
              getFortniteData(username, platform.toLowerCase(), timeframe).then(stats => {
                // Stats code here, no specific mode
              }).catch(err => {
                console.log(err);
              });
            }
            else {
              sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the platform your username is for!")
            }
          }
          else {
            sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter a valid timeframe to get stats!")
          }
        }
        else {
          sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter either a timeframe or a gamemode!")
        }
      }
      else if (msgArray.length === 5) {
        let mode = msgArray[3].toUpperCase();
        let timeframe = msgArray[4].toUpperCase();
      }
    }
  }
});
bot.login(tokenFile.token);
