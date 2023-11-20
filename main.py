import discord
import os
import requests
import json
from pysteamsignin.steamsignin import SteamSignIn

intents = discord.Intents.default()
intents.message_content = True
client = discord.Client(intents=intents)

token = "MTE3NTE3NDA5NjA0OTQwNjAxNg.GLO9-9.BsEXAnXv34FtYPEHVfDifLSxNiJ0fXnu4C9mbc"

@client.event
async def on_ready():
    print("We have logged in as {0.user}".format(client))


@client.event
async def on_message(message):
    if message.author == client.user:
        return
    
    username = str(message.author)
    u_message = str(message.content)
    channel = str(message.channel)

    if u_message == "!HELP":
        msg = "THIS BOT WILL TRACK YOUR CS2 STATS, KEEP YOU INFORMED OF NEW CS2 UPDATES! GET STARTED BELOW\n\n\n"
        msg += "1)Steam Authentication: If you wish to have your every new MM game analyzed, you must login to steam. Type !login to get started.\n"

        await message.channel.send("`"+msg+"`")

    
    if u_message == "!login":
        await message.channel.send("TEST")
    
client.run(token)