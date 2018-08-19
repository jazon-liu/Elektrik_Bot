/*jslint es6*/

// Timing statistics
console.time("Bot online");
console.time("Files loaded");

// Dependencies
const Discord = require("discord.js");
const Hypixel = require("hypixel");
const Fortnite = require("fortnite-api");
const rp = require("request-promise");
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
console.timeEnd("Files loaded");

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
  let cmd = msgArray[0].toUpperCase()

  // Define functions
  // Capitalize only first letter of a toString
  function capitalize (string) {
    string = string.toLowerCase();
    return string[0].toUpperCase() + string.slice(1);
  }

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

  // Send info for Hypixel data
  function sendHypixel (gamesPlayed, winRate, kills, kdr, finalKills, voidKills, bedsBroken, bedsLost, iron, gold, diamond, emerald, teamSize, name) {
    message.channel.send({embed: {
        color: 5119,
        title: ("Hypixel's BedWars Stats: " + teamSize),
        description: teamSize + " Stats for " + name,
        thumbnail: {
          url: "https://i.imgur.com/FS8knC6.png"
        },
        fields: [{
          name: "**General**",
          value: "=================================="
        }, {
          name: "**Games Played**",
          value: gamesPlayed + " Games",
          inline: true
        }, {
          name: "**Win Rate**",
          value: winRate + "%",
          inline: true
        }, {
          name: "**Kills**",
          value: kills + " Kills",
          inline: true
        }, {
          name: "**KDR**",
          value: kdr,
          inline: true
        }, {
          name: "**PVP**",
          value: "=================================="
        }, {
          name: "**Final Kills**",
          value: finalKills + " Kills",
          inline: true
        }, {
          name: "**Void/Fall Kills**",
          value: voidKills + " Kills",
          inline: true
        }, {
          name: "**Beds Broken**",
          value: bedsBroken + " Beds Broken",
          inline: true
        }, {
          name: "**Beds Lost**",
          value: bedsLost + " Beds Lost",
          inline: true
        }, {
          name: "**Resources**",
          value: "=================================="
        }, {
          name: "**Iron Collected**",
          value: iron + " Iron",
          inline: true
        }, {
          name: "**Gold Collected**",
          value: gold + " Gold",
          inline: true
        }, {
          name: "**Diamonds Collected**",
          value: diamond + " Diamonds",
          inline: true
        }, {
          name: "**Emeralds Collected**",
          value: emerald + " Emeralds",
          inline: true
        }],
        timestamp: new Date(),
        footer: {
          text: "Made by Jason Liu"
        }
      }
    });
  }

  function sendFortnite (wins, kdr, winRate, matches, kills, averageKills, mode, timeframe, username) {
    message.channel.send({embed: {
      color: 5119,
      title: "**" + username + "**",
      description: timeframe + " " + mode + " Stats",
      thumbnail: {
        url: "https://i.imgur.com/JB90ely.jpg"
      },
      fields: [{
        name: "**Total Wins**",
        value: wins + " Wins",
        inline: true
      }, {
        name: "**KDR**",
        value: kdr,
        inline: true
      }, {
        name: "**Win Rate**",
        value: winRate + "%",
        inline: true
      }, {
        name: "**Matches**",
        value: matches + " Matches",
        inline: true
      }, {
        name: "**Kills**",
        value: kills + " Kills",
        inline: true
      }, {
        name: "**Average Kills**",
        value: averageKills + " Kills Per Game",
        inline: true
      }],
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
                // Work on condensing all this into one command using bracket notation for the json
                let bedwStats = player.stats.Bedwars;
                let teamSize = msgArray[3];
                teamSize = teamSize.toUpperCase();
                if (bedwStats != undefined) {
                  if (teamSize === "GENERAL" || teamSize === "SOLO" || teamSize === "DOUBLES" || teamSize === "3V3" || teamSize === "4V4") {
                    //console.log(bedwStats)
                    let modeHeader
                    switch (teamSize) {
                      case ("GENERAL"):
                        modeHeader = "";
                        break;
                      case ("SOLO"):
                        modeHeader = "eight_one_";
                        break;
                      case ("DOUBLES"):
                        modeHeader = "eight_two_";
                        break;
                      case ("3V3"):
                        modeHeader = "four_three_";
                        break;
                      case ("4V4"):
                        modeHeader = "four_four_";
                        break;
                    }

                    teamSize = capitalize(teamSize)

                    // Variable definition to make embed easier
                    let deaths = bedwStats[modeHeader + "deaths_bedwars"];
                    let wins = bedwStats[modeHeader + "wins_bedwars"];
                    let vKills = bedwStats[modeHeader + "void_kills_bedwars"];
                    let fKills = bedwStats[modeHeader + "fall_kills_bedwars"];

                    let gamesPlayed = bedwStats[modeHeader + "games_played_bedwars"];

                    let kills = bedwStats[modeHeader + "kills_bedwars"];
                    let finalKills = bedwStats[modeHeader + "final_kills_bedwars"];
                    let bedsBroken = bedwStats[modeHeader + "beds_broken_bedwars"];
                    let bedsLost = bedwStats[modeHeader + "beds_lost_bedwars"];

                    let iron = bedwStats[modeHeader + "iron_resources_collected_bedwars"];
                    let gold = bedwStats[modeHeader + "gold_resources_collected_bedwars"];
                    let diamond = bedwStats[modeHeader + "diamond_resources_collected_bedwars"];
                    let emerald = bedwStats[modeHeader + "emerald_resources_collected_bedwars"];

                    let varList = [deaths, wins, vKills, fKills, gamesPlayed, kills, finalKills, bedsBroken, bedsLost, iron, gold, emerald, diamond];
                    for (i = 0; i< varList.length; i++) {
                      if (varList[i] === undefined) {
                        varList[i] = 0
                      }
                    }
                    deaths = varList[0]; wins = varList[1]; vKills = varList[2]; fKills = varList[3]; gamesPlayed = varList[4]; kills = varList[5]
                    finalKills = varList[6]; bedsBroken = varList[7]; bedsLost = varList[8]; iron = varList[9]; gold = varList[10]; diamond = varList[11]; emerald = varList[12];

                    let kdr = (kills/deaths).toFixed(2);
                    let voidKills = vKills + fKills;
                    let winRate = ((wins/gamesPlayed)*100).toFixed(0)



                    sendHypixel(gamesPlayed, winRate, kills, kdr, finalKills, voidKills, bedsBroken, bedsLost, iron, gold, diamond, emerald, teamSize, name)
                  }
                  else {
                    sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the proper mode! (General, Solo, Doubles, 3v3, 4v4)")
                  }
                }
                else {
                  sendInfo(15773006, ":grey_exclamation: Command Info", "User has not played bedwars!")
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
    /*
    getFortniteData("Twitch Big_Tater", "pc", "weekly").then(data => {
      console.log(data)
    })
    */


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
            if (stats === "Player Not Found") {
              sendInfo(15773006, ":grey_exclamation: Command Info", "This player doesn't exist! Please check your spelling!")
            }
            else if (stats === "Incorrect Platform") {
              sendInfo(15773006, ":grey_exclamation: Command Info", "Player not found on given platform!")
            }
            else {
              // Stats code here, print out combined stats only
              let wins = stats.group.solo.wins + stats.group.duo.wins + stats.group.squad.wins;
              let kdr = stats.lifetimeStats['k/d'];
              let winRate = stats.lifetimeStats['win%'];
              let matches = stats.lifetimeStats["matches"];
              let kills = stats.lifetimeStats["kills"];
              let averageKills = stats.lifetimeStats["killsPerMatch"];

              sendFortnite(wins, kdr, winRate, matches, kills, averageKills, "General", "Alltime", username)
          }
          }).catch(err => {
            console.log(err);
          });
        }
        else {
          sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the platform your username is for!")
        }
      }
      else if (msgArray.length === 4) {
        if (msgArray.includes("SOLO") || msgArray.includes("DUOS") ||  msgArray.includes("SQUADS")) {
          if (platform === "pc" || platform === "ps4" || platform === "xb1" || platform === "xbox") {
            if (platform === "xbox") {
              platform = "xb1";
            }
            let mode = msgArray[3]
            getFortniteData(username, platform.toLowerCase(), "alltime").then(stats => {
              // Stats code here, add if blocks for different modes
              if (stats === "Player Not Found") {
                sendInfo(15773006, ":grey_exclamation: Command Info", "This player doesn't exist! Please check your spelling!")
              }
              else if (stats === "Incorrect Platform") {
                sendInfo(15773006, ":grey_exclamation: Command Info", "Player not found on given platform!")
              }
              else {
                // Use a template and swap out json keys
                let statHeader;
                switch (mode) {
                  case "SOLO":
                    statHeader = stats.group.solo;
                    break;
                  case "DUOS":
                    statHeader = stats.group.duo;
                    break;
                  case "SQUADS":
                    statHeader = stats.group.squad;
                    break;
                }
                let wins = statHeader["wins"];
                let kdr = statHeader["k/d"];
                let winRate = statHeader["win%"];
                let matches = statHeader["matches"];
                let kills = statHeader["kills"];
                let averageKills = statHeader["killsPerMatch"];

                mode = capitalize(mode)

                sendFortnite(wins, kdr, winRate, matches, kills, averageKills, mode, "Alltime", username);
              }
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
              let tempTimeframe = capitalize(msgArray[3])
              getFortniteData(username, platform.toLowerCase(), timeframe).then(stats => {
                // Stats code here, no specific mode
                let wins = stats.group.solo.wins + stats.group.duo.wins + stats.group.squad.wins;
                let kdr = stats.lifetimeStats['k/d'];
                let winRate = stats.lifetimeStats['win%'];
                let matches = stats.lifetimeStats.matches;
                let kills = stats.lifetimeStats.kills;
                let averageKills = stats.lifetimeStats.killsPerMatch;

                sendFortnite(wins, kdr, winRate, matches, kills, averageKills, "General", tempTimeframe, username);
              }).catch(err => {
                console.log(err);
              });
            }
            else {
              sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter the platform your username is for!")
            }
          }
        }
        else {
          sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter either a timeframe or a gamemode!")
        }
      }
      else if (msgArray.length === 5) {
        let modeCheck = false;
        let timeCheck = false;
        let platCheck = false;

        let mode = msgArray[3].toUpperCase();
        let timeframe = msgArray[4].toUpperCase();

        if (mode === "SOLO" || mode === "DUOS" || mode === "SQUADS") {
          modeCheck = true;
        }
        if (timeframe === "ALLTIME" || timeframe === "SEASONS" || timeframe === "SEASONAL" || timeframe === "SEASON") {
          timeCheck = true;
        }
        if (platform === "pc" || platform === "ps4" || platform === "xbox" || platform === "xb1") {
          platCheck = true;
        }

        if (timeCheck === false || modeCheck === false || platCheck === false) {
          if (timeCheck === false) {
            sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter a valid timeframe!")
          }
          else if (modeCheck === false) {
            sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter a valid gamemode!")
          }
          else if (platCheck === false) {
            sendInfo(15773006, ":grey_exclamation: Command Info", "Please enter a valid platform!")
          }
        }
        else if (timeCheck === true && modeCheck === true) {
          if (msgArray[3] === "SEASONAL" || msgArray[3] === "SEASON" || msgArray[3] === 'SEASONS') {
            timeframe = "weekly";
          }
          else {
            timeframe = "alltime";
          }
          if (platform === "xbox") {
            platform = "xb1";
          }

          getFortniteData(username, platform, timeframe).then(stats => {
            if (stats === "Player Not Found") {
              sendInfo(15773006, ":grey_exclamation: Command Info", "This player doesn't exist! Please check your spelling!")
            }
            else if (stats === "Incorrect Platform") {
              sendInfo(15773006, ":grey_exclamation: Command Info", "Player not found on given platform!")
            }
            else {
              
            }
          });
        }
      }
    }
  }
});
bot.login(tokenFile.token);
