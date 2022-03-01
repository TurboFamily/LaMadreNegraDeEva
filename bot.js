/**************************************************************************
 * 
 *  DLMP3 Bot: A Discord bot that plays local mp3 audio tracks.
 *  (C) Copyright 2020
 *  Programmed by Andrew Lee 
 *  
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 * 
 ***************************************************************************/
const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const config = require('./config.json');
let dispatcher;
let audio;
let voiceChannel;
let fileData;

bot.login(config.token);

function playAudio() {
  voiceChannel = bot.channels.cache.get(config.voiceChannel);
  if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
  
  voiceChannel.join().then(connection => {
    let files = fs.readdirSync('./music');

    while (true) {
      audio = files[Math.floor(Math.random() * files.length)];
      console.log('Searching .mp3 file...');
      if (audio.endsWith('.mp3')) {
        break;
      }
    }

    dispatcher = connection.play('./music/' + audio);
    
    dispatcher.on('start', () => {

    });
    
    dispatcher.on('error', console.error);

    dispatcher.on('finish', () => {
      voiceChannel = bot.channels.cache.get(config.voiceChannel);
      dispatcher.destroy();
      voiceChannel.leave();
    });
    
  }).catch(e => {
    console.error(e);
  });
  
}

bot.on('ready', () => {
  console.log('Bot is ready!');
  console.log(`Logged in as ${bot.user.tag}!`);
  console.log(`Prefix: ${config.prefix}`);
  console.log(`Owner ID: ${config.botOwner}`);
  console.log(`Voice Channel: ${config.voiceChannel}`);
  console.log(`Status Channel: ${config.statusChannel}\n`);

  bot.user.setPresence({
    activity: {
      name: `SEVENTEEN (세븐틴) 'Left & Right'`,
      type: 'LISTENING'
    },
    status: 'online',
  }).then(presence => console.log(`Activity set to "${presence.activities[0].name}"`)).catch(console.error);

  const readyEmbed = new Discord.MessageEmbed()
  .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
  .setDescription('La madre negra de Eva ha despertado...')
  .setColor('#0066ff')

  let statusChannel = bot.channels.cache.get(config.statusChannel);
  if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
  statusChannel.send(readyEmbed);
  console.log('Connected to the voice channel.');
  //playAudio();
});

bot.on('voiceStateUpdate', (oldMember, newMember) => {
  let newUserChannel = newMember.channelID;
  let oldUserChannel = oldMember.channelID;

  if(newUserChannel === "156502105379700740" && newMember.id === "146323942934708225") //don't remove ""
  {
    if(newMember.serverDeaf === oldMember.serverDeaf &&
        newMember.serverMute === oldMember.serverMute &&
        newMember.selfDeaf === oldMember.selfDeaf &&
        newMember.selfMute === oldMember.selfMute &&
        newMember.selfVideo === oldMember.selfVideo &&
        newMember.streaming === oldMember.streaming
    ){
    playAudio();
    }
  }
  else{
    // User leaves a voice channel
  }
});

bot.on('message', async msg => {
  if (msg.author.bot) return;
  if (!msg.guild) return;
  if (!msg.content.startsWith(config.prefix)) return;
  let command = msg.content.split(' ')[0];
  command = command.slice(config.prefix.length);

  // Public allowed commands

  if (command == '') {
    playAudio();
  }

  if (![config.botOwner].includes(msg.author.id)) return;

  // Bot owner exclusive

  if (command == 'join') {
    msg.reply('Joining voice channel.');
    console.log('Connected to the voice channel.');
    playAudio();
  }

  if (command == 'resume') {
    msg.reply('Resuming music.');
    dispatcher.resume();
  }

  if (command == 'pause') {
    msg.reply('Pausing music.');
    dispatcher.pause();
  }

  if (command == 'skip') {
    msg.reply('Skipping `' + audio + '`...');
    dispatcher.pause();
    dispatcher = null;
    playAudio();
  }

  if (command == 'leave') {
    voiceChannel = bot.channels.cache.get(config.voiceChannel);
    if (!voiceChannel) return console.error('The voice channel does not exist!\n(Have you looked at your configuration?)');
    msg.reply('Leaving voice channel.');
    console.log('Leaving voice channel.');
    fileData = "Now Playing: Nothing";
    fs.writeFile("now-playing.txt", fileData, (err) => { 
    if (err) 
    console.log(err); 
    }); 
    audio = "Not Playing";
    dispatcher.destroy();
    voiceChannel.leave();
  }

  if (command == 'stop') {
    await msg.reply('Ya me voy ya...');
    fileData = "Now Playing: Nothing";
    await fs.writeFile("now-playing.txt", fileData, (err) => { 
    if (err) 
    console.log(err); 
    }); 
    const statusEmbed = new Discord.MessageEmbed()
    .setAuthor(`${bot.user.username}`, bot.user.avatarURL())
    .setDescription(`${bot.user.username} se va A LA CAMA!`)
    .setColor('#0066ff')
    let statusChannel = bot.channels.cache.get(config.statusChannel);
    if (!statusChannel) return console.error('The status channel does not exist! Skipping.');
    await statusChannel.send(statusEmbed);
    console.log('Ya me voy ya...');
    dispatcher.destroy();
    bot.destroy();
    process.exit(0);
  }

});
