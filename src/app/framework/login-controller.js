const {dialog} = require('electron')
const fs = require('fs')
const homedir = require('os').homedir()
const Controller = require('./controller')
const KeysUseCases = require('./interactor/keys-interactor')
const PreferencesInteractor = require('./interactor/preferences-interactor')

class LoginController extends Controller {

	static DEFAULT_DATA = JSON.stringify({"dirs": []})

	_keysInteractor = new KeysUseCases()
	_preferencesInteractor = new PreferencesInteractor()
	_filePath
	_isNewFile = false
	_password = ""

	onLoad() {
		super.onLoad()
		this.loadView('login/login.html')
	}

	handleEvents() {
		super.handleEvents()

		this._ipc.on('get-filename', (event, _) => {
			this._preferencesInteractor.getPreferences((data) => {
				this._filePath = data.filePath
				event.sender.send('filename', this._filePath.toString())
			})
		})

		this._ipc.on('choose-file', (event, _) => {
			dialog.showOpenDialog(this._window).then((filename) => {
				if (filename === undefined)
					return

				this._filePath = filename.filePaths[0]
				event.sender.send('filename', filename.filePaths[0])
			})
		})

		this._ipc.on('new-file', (event, _d) => {
			dialog.showSaveDialog(this._window, {
				title: 'Nouveau registre de clés',
				filters: [{name: 'Fichiers squirrel', extensions: ['sq']}]
			}).then((filename) => {
				if (filename === undefined)
					return

				this._isNewFile = true
				this._filePath = filename.filePath
				event.sender.send('filename', filename.filePath)
			})
		})

		this._ipc.on('login', (event, arg) => {
			let self = this
			this._password = arg
			if (this._isNewFile) {
				this._isNewFile = false
				this._keysInteractor.save(this._filePath, LoginController.DEFAULT_DATA, this._password, function () {
					self.login(event, self._filePath, self._password, function (content) {
						this.loadController('home/home.html', {
							data: content,
							password: self._password,
							filePath: self._filePath
						})
					})
				})
			} else {
				this.login(event, this._filePath, this._password, function (content) {
					self.loadController('home/home.html', {
						data: content,
						password: self._password,
						filePath: self._filePath
					})
				})
			}
		})
	}

	login(event, file, password, callback) {
		if (file != null) {
			if (!fs.existsSync(homedir))
				fs.mkdirSync(homedir)

			this._preferencesInteractor.savePreferences({
				'filePath': file.toString()
			})
			this._keysInteractor.load(file, password, function (content) {
				if (callback != null && content != null) {
					event.sender.send('error', 'null');
					callback(content);
				} else
					event.sender.send('error', 'password');
			})
		}
	}
}

module.exports.LoginController = LoginController