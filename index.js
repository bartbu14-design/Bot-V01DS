// --- ZABEZPIECZENIE SIECIOWE (WKLEJ TO NA SAMYM POCZĄTKU) ---
process.on('unhandledRejection', (reason, promise) => {
    console.log('⚠️ [Ostrzeżenie sieciowe]:', reason.message || reason);
});

process.on('uncaughtException', (err, origin) => {
    console.log('⚠️ [Ostrzeżenie systemowe]:', err.message || err);
});
// ---------------------------------------------------------

// --- TUTAJ JEST CAŁY TWÓJ DOTYCHCZASOWY KOD DO BOTA I DASHBOARDU ---
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// (reszta Twojego kodu zostaje nienaruszona poniżej)
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

// Tworzymy klienta bota z odpowiednimi intencjami
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages
    ]
});

// Przygotowanie kolekcji na komendy
client.commands = new Collection();

// --- COMMAND HANDLER (Ładowanie komend ze wszystkich 6 podfolderów) ---
const mainPath = __dirname;
const commandFolders = fs.readdirSync(mainPath).filter(file => {
    const filePath = path.join(mainPath, file);
    return fs.statSync(filePath).isDirectory() && file !== 'events' && file !== 'node_modules';
});

for (const folder of commandFolders) {
    const commandsPath = path.join(mainPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// --- INTERACTION HANDLER (Wykonywanie komend Slash) ---
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: '❌ Wystąpił wewnętrzny błąd podczas wykonywania tej komendy!', ephemeral: true });
        } else {
            await interaction.reply({ content: '❌ Wystąpił wewnętrzny błąd podczas wykonywania tej komendy!', ephemeral: true });
        }
    }
});

// --- EVENT HANDLER (Ładowanie automatycznych zdarzeń z folderu events) ---
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
}

// Logowanie bota za pomocą tokenu z config.json
client.login(config.token);
// --- PROSTY SERWER WWW DLA DASHBOARDU ---
const express = require('express');
const app = express();
const PORT = 80;

// Rejestracja obsługi danych z formularzy
app.use(express.urlencoded({ extended: true }));

// Tajne hasło do panelu
const TAJNE_HASLO = "V01DS2026"; 

// Strona główna z formularzem logowania
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Logowanie - Klan V01DS</title>
            <style>
                body { font-family: 'Segoe UI', sans-serif; background: #0f0f13; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #1a1a24; padding: 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); text-align: center; border: 1px solid #2d2d3f; width: 320px; }
                h1 { color: #f1c40f; font-size: 22px; margin-bottom: 20px; }
                input[type="password"] { width: 90%; padding: 10px; border-radius: 8px; border: 1px solid #3d3d5c; background: #0f0f13; color: white; margin-bottom: 15px; text-align: center; }
                button { background: #f1c40f; color: #1a1a24; border: none; padding: 10px 20px; font-weight: bold; border-radius: 8px; cursor: pointer; width: 98%; }
                button:hover { background: #d4ac0d; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>Klan V01DS Dashboard</h1>
                <form action="/login" method="POST">
                    <input type="password" name="password" placeholder="Wpisz hasło..." required>
                    <button type="submit">Zaloguj się</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Weryfikacja hasła
app.post('/login', (req, res) => {
    const { password } = req.body;

    if (password === TAJNE_HASLO) {
        res.send(`
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <title>Dashboard - Klan V01DS</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #0f0f13; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .card { background: #1a1a24; padding: 30px; border-radius: 16px; text-align: center; border: 1px solid #2d2d3f; }
                    h1 { color: #2ed573; }
                </style>
            </head>
            <body>
                <div class="card">
                    <h1>Witaj w panelu głównym!</h1>
                    <p>Dostęp przyznany. Bot Klan V01DS działa poprawnie.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        res.send(`
            <script>
                alert('Błędne hasło!');
                window.location.href = '/';
            </script>
        `);
    }
});

// Uruchomienie serwera WWW
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Serwer WWW działa z zabezpieczeniem na porcie ${PORT}`);
});
