const electron = require('electron')
const path = require('path')
const randomstring = require("randomstring")

const app = electron.app
const BrowserWindow = electron.BrowserWindow

const LoginController = require('./login-controller').LoginController
const HomeController = require('./home-controller').HomeController

let window

function createWindow() {

	window = new BrowserWindow({
		width: 800,
		height: 175,
		icon: path.join(__dirname, 'assets/squirrel.png'),
		backgroundColor: '#313440',
		webPreferences: {
			nodeIntegration: true
		},
		resizable: false
	})
	window.setMenu(null)
	window.on('closed', () => {
		homeController.close()
		window = null
	})

	window.once('ready-to-show', () => {
		window.show()
	})

	randomstring.generate() // First call to initialize the randomstring lib

	let loginController = new LoginController(window)
	let homeController = new HomeController(window)

	loginController.onLoadController = function (path, bundle) {
		homeController.start(bundle)
	}
	loginController.start()
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('activate', () => {
	if (window === null) {
		createWindow()
	}
})