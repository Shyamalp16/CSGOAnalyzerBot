// CORE JS IMPORTS
const Discord = require('discord.js');
const fetch = require("node-fetch");
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] });
const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
require('dotenv').config();

// NODE/EXPRESS JS IMPORTS
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const passportSteam = require('passport-steam');
const { resolve } = require('path');
const SteamStrategy = passportSteam.Strategy;
const app = express();
const port = 3000;

// STEAM CONSTS
let steamID;
let steamidkey;
let knowncode;
let personaName;
let profileUrl;
let avatar;

// const token = 'MTE3NTE3NDA5NjA0OTQwNjAxNg.GW8w1E.PIKa7Rkbm3aY_ZKE6iPULEj5TK0U0uZrJLzAXU';
const token = process.env.TOKEN_KEY;
const steamApiKey = process.env.STEAM_API_KEY;

// LOGIN WITH STEAM FUNCTION (USING OPENID AND PASSPORT.JS)
const steam_login = () => {
    return new Promise((resolve, reject) => {
        // Required to get data from user for sessions
        passport.serializeUser((user, done) => {
            done(null, user);
        });

        passport.deserializeUser((user, done) => {
            done(null, user);
        });

        // Initiate Strategy
        passport.use(new SteamStrategy({
            returnURL: 'http://localhost:' + port + '/api/auth/steam/return',
            realm: 'http://localhost:' + port + '/',
            apiKey: steamApiKey
        }, function (identifier, profile, done) {
            process.nextTick(function () {
                profile.identifier = identifier;
                return done(null, profile);
            });
        }));

        app.use(session({
            secret: 'booooooooo',
            saveUninitialized: true,
            resave: false,
            cookie: {
                maxAge: 3600000
            }
        }));

        app.use(passport.initialize());

        app.use(passport.session());

        // Initiate app and post it in console to confirm the server starts
        app.listen(port, () => {
            console.log('Listening, port ' + port);
        });

        app.get('/', (req, res) => {
            const userJson = JSON.stringify(req.user);
            res.send(userJson);
            resolve(req.user); // Resolve the Promise with the user information
        });

        // Routes
        app.get('/api/auth/steam', passport.authenticate('steam', { failureRedirect: '/' }), function (req, res) {
            res.redirect('/?authResult=success');
        });

        app.get('/api/auth/steam/return', passport.authenticate('steam', { failureRedirect: '/' }), function (req, res) {
            res.redirect('/?authResult=success');
        });
    });
};
    
// MAKING SURE BOT STRATS
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// WHEN A MESSAGE IS SENT
client.on('message', async (message) => {
    // IF THE SENDER IS BOT, DO NOTHING
    if (message.author.bot) return;

    // EXTRACTING USEFUL STUFF FROM THE MESSAGE SENT
    const username = message.author.username;
    const u_message = message.content;
    const channel = message.channel.name;

    // IF USER ASKES OF COMMANDS
    if (u_message === '!help') {
        let msg = "THIS BOT WILL TRACK YOUR CS2 STATS, KEEP YOU INFORMED OF NEW CS2 UPDATES! GET STARTED BELOW\n\n";
        msg += "1)Steam Authentication: If you wish to have your every new MM game analyzed, you must log in to steam. Type !login to get started.\n\n";
        msg += "1(A) Submitting last known code: You must enter your last known code in order to automatize MM games analysis. Type !setKnownCode <Your Code>\n\n";
        msg += "1(B) Submitting Steam AuthId Key: You must enter your last known code in order to automatize MM games analysis. Type !setIdKeyCode <Your Key>\n\n";
        msg += "2)Profile: If you wish to see your accound details. TYpe !profile.\n\n";
        msg += "3)Logout: If you wish to see your accound details. TYpe !logout.\n\n";

        await message.channel.send("```"+msg+"```");
    }

    // IF USER WANTS TO LOGIN, in try block wait till promise is resolved and store the response and send confirmation message else show error
    if (u_message === '!login') {
        steamID = null;
        // IF ALREADY HAVE THE VALUE, DONT LOGIN AND REPLY
        if(steamID === null){
            try{
                // SEND THE MESSAGE LINK
                await message.channel.send({
                    embed:{
                        title:"Please login to your steam account",
                        url:'http://localhost:3000/api/auth/steam',
                    }
                });
                // WAIT FOR RESPONSE
                response = await Promise.resolve(steam_login());
                // await message.channel.send(`# Logged in as ${response._json.personaname} SteamID: ${response._json.steamid}`)
                const loggedInEmbed = new Discord.MessageEmbed()
                    .setTitle(`Logged in as ${response._json.personaname}`)
                    .setDescription(`SteamID: ${response._json.steamid}`)
                    .setThumbnail(`${response._json.avatar}`)
                await message.channel.send(loggedInEmbed)

                // SETTING PROFILE VARIABLES
                steamID = response._json.steamid;
                personaName = response._json.personaname;
                profileUrl = response._json.profileurl;
                avatar = response._json.avatar;
    
                // NOW ASKING USER TO GIVE US LAST GAMECODE AND GAME AUTH IF NOT ALREADY GIVEN
                if(steamidkey === null || knowncode === null) {
                    msg="";
                    msg+="To Automate game analysis, I must be provided with Most Recently Completed Match Token and Authentication Code\n";
                    msg+="Use the link below to find it!\n Type !Help for more information!\n``` "
                    await message.channel.send("```"+msg);
                    message.channel.send({
                        embed:{
                            title: "Here",
                            url: 'https://help.steampowered.com/en/wizard/HelpWithGameIssue/?appid=730&issueid=128'
                        },
                    });
                }
            }catch(error){
                console.error("Error during login:", error);
            }
        }else{
            message.channel.send("```You are already logged in as ${response._json.personaname}```");
        }
    }

    if(u_message.startsWith('!setKnownCode ')){
        if(!steamID){
            message.channel.send("```You must login before you can enter your known code, Type !login to begin\n```");
            return;
        }else{
            code = message.content.trim().split(' ')[1];
            let regex = /[A-Za-z]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/i;

            if(regex.test(code)){
                knowncode = code;
                message.channel.send("```Last known code is set!```");
            }

            if(steamID && knowncode && steamidkey){ 
                await message.channel.send("```You are all set and will automatically be notified after every MM game!!```");
            }
        }
    }

    if(u_message.startsWith('!setIdKeyCode ')){
        if(!steamID){
            message.channel.send("```You must login before you can enter your AuthIDKey, Type !login to begin\n```");
            return;
        }else{
            code = message.content.trim().split(' ')[1];
            let regex = /[A-Za-z0-9]+-[A-Za-z0-9]+-[A-Za-z0-9]+/i;

            if(regex.test(code)){
                steamidkey = code;
                await message.channel.send("```Steam auth key is set!```");
            }

            if(steamID && knowncode && steamidkey){ 
                await message.channel.send("```You are all set and will automatically be notified after every MM game!!```");
            }
        }
    }

    if(u_message === '!logout'){
        if(steamID){
            steamID = null;
            knowncode = null;
            steamidkey = null;
            await message.channel.send("```Logged out successfully!\n NOTE: This means you will not be able to see your MM games from now on!```");
        }else{
            await message.channel.send("```You are already logged out!\n```");
        } 
    }

    if(u_message === '!profile'){
        let field1 = knowncode ? `${knowncode}` : `Not Submitted`;
        let field2 = steamidkey ? `${steamidkey}` : `Not Submitted`;
        if(steamID){
            const ProfileEmbed = new Discord.MessageEmbed()
                    .setTitle(personaName)
                    .setURL(profileUrl)
                    .setThumbnail(avatar)
                    .addFields(
                        {name: 'Last Known Code', value: field1, inline: true},
                        {name: 'Steam Id Key', value: field2, inline: true},
                    )
                    .setTimestamp();

                await message.channel.send(ProfileEmbed)


        }else{
            await message.channel.send("```You Must be logged in to view your profile!\n```");
        } 
    }
});


// RUN THE BOT
client.login(token);