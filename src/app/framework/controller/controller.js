const electron = require('electron');
const path = require('path');
const BrowserWindow = electron.BrowserWindow;

module.exports = class Controller {

	constructor(window) {
		this._window = window;
		this._renderPath = `file://${__dirname}/../../view/`;
		this._ipc = electron.ipcMain;
		this._args = {};
	}

	start(bundle = {}) {
		this._args = bundle;
		this.load();
		this.handleEvents();
	}

	load() {
		this.onLoad();
	}

	onLoad() {
	}

	async loadView(path) {
		await this._window.loadURL(this._renderPath + path);
	}

	loadController(controller, bundle) {
		controller.start(bundle);
	}

	async openWindow({controller, bundle, width, height}) {
		controller._window = new BrowserWindow({
			width: width,
			height: height,
			icon: path.join(__dirname, 'assets/squirrel.png'),
			backgroundColor: '#313440',
			webPreferences: {nodeIntegration: true}
		});
		controller.start(bundle);
	}

	close() {
		this.onClose();
	}

	onClose() {
	}

	handleEvents() {
	}
};
