const {app, BrowserWindow} = require('electron');
const path = require('path');
const randomstring = require("randomstring");

const LoginController = require('./controller/login/login-controller');

let window;

function createWindow() {

	window = new BrowserWindow({
		width: 800,
		height: 175,
		icon: path.join(__dirname, 'assets/squirrel.png'),
		backgroundColor: '#313440',
		webPreferences: {
			nodeIntegration: true
		},
		resizable: true
	});
	window.setMenu(null);
	window.on('closed', () => {
		window = null;
	});

	window.once('ready-to-show', () => {
		window.show();
	});

	randomstring.generate(); // First call to initialize the randomstring lib

	new LoginController(window).start();
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit();
});

app.on('activate', () => {
	if (window === null) {
		createWindow();
	}
});

app.allowRendererProcessReuse = true;
