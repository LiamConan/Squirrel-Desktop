const {clipboard, shell} = require('electron')
const randomstring = require("randomstring")
const Controller = require('./controller')
const LocalFileDataSource = require('./gataway/local-file-data-source')

class HomeController extends Controller {

	_displayedDirectory = 0

	onLoad() {
		this.loadView('home/home.html')
		this._window.resizable = true
		this._window.maximize()

		this._data = this._args.data
		this._password = this._args.password
		this._filePath = this._args.filePath
		this.displayState = {
			directory: 0,
			isKeyBeingCreated: false,
			creatingKey: -1,
			creatingSubKey: -1,
			selectedDir: -1,
			selectedKey: -1,
			selectedSubKey: -1
		}

		randomstring.generate() // First call to initialize the randomstring lib
	}

	handleEvents() {
		super.handleEvents()

		this._ipc.on('get-data', (event, _) => {
			event.sender.send('send-data', this._data)
			event.sender.send('select-dir', this._displayedDirectory)
		})

		this._ipc.on('change-password', (event, arg) => {
			let self = this
			let actualPassword = arg.actual
			let newPassword = arg.new

			LocalFileDataSource.load(event, self._filePath, actualPassword, function (_) {
				LocalFileDataSource.save(self._filePath, JSON.stringify(self._data), newPassword, () => {
					self._password = newPassword
				})
			})
		})

		this._ipc.on('add-dir', (event, arg) => {
			this._data.dirs.push({"name": arg, "keys": []})
			event.sender.send('send-dirs', this._data.dirs)

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('del-dir', (event, arg) => {
			this._data.dirs.splice(arg, 1)

			event.sender.send('send-dirs', this._data.dirs)
			if (this.displayState.directory === arg && this._data.dirs.length > 0) {
				this.displayState.directory = 0
				event.sender.send('send-keys', this._data.dirs[arg].keys)
			}
			event.sender.send('select-dir', this.displayState.directory)

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('rename-dir', (event, arg) => {
			this._data.dirs[arg.dirID].name = arg.name

			event.sender.send('send-dirs', this._data.dirs)

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('select-dir', (event, arg) => {
			if (this.displayState.creatingKey === -1) {
				event.sender.send('select-dir', arg)
				event.sender.send('send-keys', this._data.dirs[arg].keys)
				if (this.displayState.directory !== arg) {
					event.sender.send('close-right-pan')
					this.displayState.directory = arg
				}
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('get-key', (event, arg) => {
			if (this.displayState.creatingKey === -1 && this.displayState.creatingSubKey === -1) {
				event.sender.send('send-key', this._data.dirs[this.displayState.directory].keys[arg])
				this.displayState.selectedDir = this.displayState.directory
				this.displayState.selectedKey = arg
				this.displayState.selectedSubKey = 0
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('go-to-url', (event, arg) => {
			let subkeys
			if (arg === undefined)
				subkeys = this._data.dirs[this.displayState.directory].keys[this.displayState.selectedKey].subkeys
			else
				subkeys = this._data.dirs[this.displayState.directory].keys[arg].subkeys
			let i = 0

			while (subkeys[i].url === '' && i < subkeys.length)
				i++
			let url = subkeys[i].url

			if (url != null && url !== '' && url !== "") {
				if (null == url.match(/https?:\/\/*/))
					shell.openExternal('http://' + url).then()
				else
					shell.openExternal(url).then()
			} else {
				event.sender.send('no-url')
			}
		})

		this._ipc.on('save-key', (event, arg) => {
			this._data.dirs[this.displayState.directory].keys[this.displayState.selectedKey].subkeys[this.displayState.selectedSubKey] = arg.subkey

			if (this._data.dirs[this.displayState.directory].keys[this.displayState.selectedKey].name !== arg.name)
				this._data.dirs[this.displayState.directory].keys[this.displayState.selectedKey].name = arg.name

			event.sender.send('send-keys', this._data.dirs[this.displayState.directory].keys)

			this.displayState.creatingKey = -1
			this.displayState.creatingSubKey = -1

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('get-subkey', (event, arg) => {
			if (this.displayState.creatingKey === -1 && this.displayState.creatingSubKey === -1) {
				event.sender.send('send-subkey', this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys[arg])
				this.displayState.selectedSubKey = arg
			} else
				event.sender.send('key-saved')
		})

		this._ipc.on('close-right-pan', (event) => {
			let self = this
			if (this.displayState.creatingSubKey !== -1) {
				this.deleteSubKey(self._data, self.displayState.directory, this.displayState.selectedDir, event, function () {
					self.displayState.creatingKey = -1
					self.displayState.creatingSubKey = -1
					LocalFileDataSource.save(self._filePath, JSON.stringify(self._data), self._password)
				})
			}
			event.sender.send('close-right-pan', self._data.dirs)
		})

		this._ipc.on('del-key', (event, arg) => {
			if (arg >= 0) {
				this._data.dirs[this.displayState.directory].keys.splice(arg, 1)
				event.sender.send('send-keys', this._data.dirs[this.displayState.directory].keys)

				if (this.displayState.selectedDir === this.displayState.directory && this.displayState.selectedKey === arg) {
					event.sender.send('close-right-pan')

					this.displayState.selectedKey = -1
					this.displayState.selectedSubKey = -1

					this.displayState.creatingKey = -1
					this.displayState.creatingSubKey = -1
				}

				LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
			}
		})

		this._ipc.on('add-key', (event, arg) => {
			if (this._data.dirs.length <= this.displayState.directory) {
				event.sender.send('no-dir')
				return
			}
			let dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]
			let monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"]
			let date = new Date()
			let day = date.getDay() - 1
			if (day === -1)
				day = 6
			let dateString = dayNames[day] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear()
			let key = {
				"name": arg,
				"date": dateString,
				"subkeys": [{"user": "", "mail": "", "password": "", "url": "", "note": ""}]
			}

			this._data.dirs[this.displayState.directory].keys.push(key)

			event.sender.send('send-keys', this._data.dirs[this.displayState.directory].keys)
			event.sender.send('send-key', key)

			this.displayState.selectedDir = this.displayState.directory
			this.displayState.selectedKey = this._data.dirs[this.displayState.directory].keys.length - 1
			this.displayState.selectedSubKey = 0
			this.displayState.creatingKey = this.displayState.selectedKey
			this.displayState.creatingSubKey = this.displayState.selectedSubKey

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('add-user', (event, _) => {
			let subkey = {"user": "", "mail": "", "password": "", "url": "", "note": ""}
			this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys.push(subkey)

			event.sender.send('send-key', this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey])
			event.sender.send('send-subkey', subkey)

			this.displayState.selectedSubKey = this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys.length - 1
			this.displayState.creatingSubKey = this.displayState.selectedSubKey

			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		})

		this._ipc.on('del-user', (event, _) => {
			let self = this
			this.deleteSubKey(this._data, this.displayState.directory, this.displayState.selectedDir, event, function () {
				self.displayState.creatingKey = -1
				self.displayState.creatingSubKey = -1
				LocalFileDataSource.save(self._filePath, JSON.stringify(self._data), self._password)
			})
		})

		this._ipc.on('copy', (event, arg) => {
			if (arg === 'username')
				clipboard.writeText(this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys[this.displayState.selectedSubKey].user)
			else if (arg === 'mail')
				clipboard.writeText(this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys[this.displayState.selectedSubKey].mail)
			else if (arg === 'password')
				clipboard.writeText(this._data.dirs[this.displayState.selectedDir].keys[this.displayState.selectedKey].subkeys[this.displayState.selectedSubKey].password)

			setTimeout(function () {
				clipboard.writeText("")
			}, 10000)
		})

		this._ipc.on('generate-password', (event, arg) => {
			const min = 'abcdefghijklmnopqrstuvwxyz'
			const maj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
			const num = '0123456789'
			const spa = ' '
			const spe = ',?.:/!*-+()[]{}#&'

			let chars = ''
			if (arg.min)
				chars += min
			if (arg.maj)
				chars += maj
			if (arg.num)
				chars += num
			if (arg.spa)
				chars += spa
			if (arg.spe)
				chars += spe

			let random = randomstring.generate({
				length: arg.n,
				charset: chars
			})

			event.sender.send('send-hash', random)
		})

		this._ipc.on('move-key', (event, arg) => {
			let reorderedList = []
			for (let i = 0; i < arg.length; i++)
				reorderedList.push(this._data.dirs[this.displayState.directory].keys[arg[i]])

			this._data.dirs[this.displayState.directory].keys = reorderedList
			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)

			event.sender.send('send-keys', this._data.dirs[this.displayState.directory].keys)
		})
	}

	onClose() {
		super.onClose();

		if (this.displayState.creatingKey !== -1) {
			this._data.dirs[this.displayState.directory].keys.splice(this.displayState.creatingKey, 1)
			LocalFileDataSource.save(this._filePath, JSON.stringify(this._data), this._password)
		}
	}

	deleteSubKey(data, displayedDir, selectedDir, event, callback) {
		data.dirs[selectedDir].keys[this.displayState.selectedKey].subkeys.splice(this.displayState.selectedSubKey, 1)

		if (data.dirs[selectedDir].keys[this.displayState.selectedKey].subkeys.length <= 0) {
			data.dirs[selectedDir].keys.splice(this.displayState.selectedKey, 1)

			event.sender.send('close-right-pan')
			event.sender.send('send-keys', data.dirs[displayedDir].keys)

			this.displayState.selectedKey = -1
			this.displayState.selectedSubKey = -1
		} else {
			event.sender.send('send-key', data.dirs[selectedDir].keys[this.displayState.selectedKey])
			event.sender.send('send-subkey', data.dirs[selectedDir].keys[this.displayState.selectedKey].subkeys[0])

			this.displayState.selectedSubKey = 0
		}

		callback()
	}
}

module.exports.HomeController = HomeController