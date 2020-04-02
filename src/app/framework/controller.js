const electron = require('electron')

module.exports = class Controller {

	_renderPath = `file://${__dirname}/../view/`
	_ipc = electron.ipcMain
	_args = {}
	onLoadController = function(path, bundle) {}

	constructor(window) {
		this._window = window
	}

	start(bundle = {}) {
		this._args = bundle
		this.load()
		this.handleEvents()
	}

	load() {
		this.onLoad()
	}

	onLoad() {}

	loadView(path) {
		this._window.loadURL(this._renderPath + path).then()
	}

	loadController(path, bundle) {
		this.onLoadController(path, bundle)
	}

	close() {
		this.onClose()
	}

	onClose() {}

	handleEvents() {}
}