const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./termine.db');

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
  cancelAllTermine,
};
