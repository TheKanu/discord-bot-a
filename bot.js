const { Client, GatewayIntentBits } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

const db = new sqlite3.Database('./termine.db');

function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS termine (
        id INTEGER PRIMARY KEY,
        datum TEXT,
        uhrzeit TEXT,
        beschreibung TEXT,
        channelId TEXT
      )
    `);
  });
}

function startBot(client) {
  client.on('messageCreate', handleMessage);

  function handleMessage(message) {
    if (message.author.bot) return;
    if (!message.content) return;

    console.log(`Message received: "${message.content}"`);

    if (message.content.toLowerCase().startsWith(config.PREFIX)) {
      const args = message.content.split(' ');
      if (args.length < 4) {
        message.channel.send('Incorrect usage of the command. Use `!schedule dd.mm.yyyy at hh:mm Description`.');
        return;
      }

      const [_, date, time] = args;
      const description = args.slice(5).join(' ');

      // Capture the channel ID where the appointment was created
      const channelId = message.channel.id;

      db.run(
        'INSERT INTO termine (datum, uhrzeit, beschreibung, channelId) VALUES (?, ?, ?, ?)',
        [date, time, description, channelId],
        function (err) {
          if (err) {
            console.error('An error occurred: ' + err.message);
            return;
          }
          message.channel.send(`Appointment added: ${date} at ${time}`);
        }
      );
    }
  }
}

function startEventLoop(client) {
  setInterval(checkTermine, 60000); // Monitor termine every 1 minute (adjustable)

  function checkTermine() {
    const now = new Date();
    const today = now.toLocaleDateString();
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    db.all(
      'SELECT * FROM termine WHERE datum = ? AND uhrzeit = ?',
      [today, currentTime],
      (err, rows) => {
        if (err) {
          console.error('An error occurred: ' + err.message);
          return;
        }

        if (rows.length > 0) {
          // You can add code here to react to found termine
          rows.forEach((appointment) => {
            console.log(`Appointment found: "${appointment.beschreibung}"`);
            // Here, you could send a message or perform other actions
          });
        }
      }
    );
  }
}

// Function to retrieve the next appointment from the database
function getNextAppointment(callback) {
  const now = new Date();
  const today = now.toLocaleDateString();
  const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  db.all(
    'SELECT * FROM termine WHERE date = ? AND time > ? ORDER BY date, time LIMIT 1',
    [today, currentTime],
    (err, rows) => {
      if (err) {
        console.error('An error occurred: ' + err.message);
        callback(null);
        return;
      }

      if (rows.length > 0) {
        const nextAppointment = rows[0];
        callback(nextAppointment);
      } else {
        // No next appointment found
        callback(null);
      }
    }
  );
}

// Function to check the next appointment and send a reminder message
function checkNextAppointmentAndSendReminder(client) {
  getNextAppointment((nextAppointment) => {
    // Check if a next appointment was found
    if (nextAppointment) {
      // Calculate the time difference until the appointment
      const now = new Date();
      const appointmentTime = new Date(nextAppointment.date + ' ' + nextAppointment.time);
      const timeDifference = appointmentTime - now;

      // Check if the appointment is within one hour
      if (timeDifference > 0 && timeDifference <= 3600000) {
        // Set a timer to send the reminder message to @everyone in the same channel
        setTimeout(() => {
          const channel = client.channels.cache.get(nextAppointment.channelId);
          if (channel) {
            channel.send(`@everyone Reminder: The appointment "${nextAppointment.description}" is in one hour on ${nextAppointment.date} at ${nextAppointment.time}.`);
          }
        }, timeDifference);
      }
    } else {
      console.log('No next appointment found.');
    }
  });
}

function cancelAllTermine() {
  // Hier fügst du den Code ein, um alle ausstehenden Termine zu löschen.
  // Du kannst die SQLite-Datenbankabfrage verwenden, um die Termine zu löschen.
  db.run('DELETE FROM termine', (err) => {
    if (err) {
      console.error('Ein Fehler ist aufgetreten: ' + err.message);
      return;
    }
    console.log('Alle ausstehenden Termine wurden gelöscht.');
  });
}

module.exports = {
  initializeDatabase,
  startBot,
  startEventLoop,
  getNextAppointment,
  checkNextAppointmentAndSendReminder,
  cancelAllTermine,
};
