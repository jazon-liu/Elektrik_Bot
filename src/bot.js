// Dependencies

const logger = require("winston");
const Discord = require("discord.js");
const fs = require("file-system");
const path = require("path");
const request = require('request');

// Create bot object

const bot = new Discord.Client();

// Load files

let tokenFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/token.json")));
let keyFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/keys.json")));
let configFile = JSON.parse(fs.readFileSync(path.join(__dirname, "/../config/config.json")));

bot.on('ready', async () => {
  console.log(`MCG Bot online`)
  bot.user.setActivity("with LCC || " + configFile.prefix + "help");
});

bot.login(tokenFile.token);
