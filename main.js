const electron = require('electron')
const {dialog, clipboard, shell} = require('electron')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const randomstring = require("randomstring")

const app = electron.app
const BrowserWindow = electron.BrowserWindow
const ipc = electron.ipcMain
const homedir = require('os').homedir();

let window
let renderPath = `file://${__dirname}/web/html/`
let password = null
let createFile = false
let file
let json = null
let displayedDirectory = 0
let creatingKey = -1
let creatingSubKey = -1

let selectedDirectory = -1 // Dir of the selected key
let selectedKey = -1
let selectedSubKey = -1

function createWindow() {

	window = new BrowserWindow({
		width: 800,
		height: 175,
		icon: path.join(__dirname, 'res/squirrel.png'),
		backgroundColor: '#313440',
		webPreferences: {
			nodeIntegration: true
		},
		resizable: false
	})
	window.setMenu(null)
	window.loadURL(renderPath + 'login.html').then()
	window.on('closed', () => {
		if (creatingKey !== -1) {
			json.dirs[displayedDirectory].keys.splice(creatingKey, 1)
			save(file, JSON.stringify(json), password)
		}
		window = null
	})

	window.once('ready-to-show', () => {
		window.show()
	})

	loadIPC()

	randomstring.generate() // First call to initialize the randomstring lib
}

function loadIPC() {

	ipc.on('choose-file', (event, _) => {
		dialog.showOpenDialog(window).then((filename) => {
			if (filename === undefined)
				return

			file = filename.filePaths[0]
			event.sender.send('filename', filename.filePaths[0])
		})
	})

	ipc.on('new-file', (event, _) => {
		dialog.showSaveDialog(window, {
			title: 'Nouveau registre de clés',
			filters: [{name: 'Fichiers squirrel', extensions: ['sq']}]
		}).then((filename) => {
			if (filename === undefined)
				return
			createFile = true
			file = filename.filePath
			event.sender.send('filename', filename.filePath)
		})
	})

	ipc.on('login', (event, arg) => {
		password = arg

		if (createFile) {
			createFile = false
			save(file, JSON.stringify({"dirs": []}), password, function () {
				login(event, file, homedir, password, function (content) {
					json = content
					window.loadURL(renderPath + 'home.html').then()
					window.resizable = true
					window.maximize()
				})
			})
		} else
			login(event, file, homedir, password, function (content) {
				json = content
				window.loadURL(renderPath + 'home.html').then()
				window.resizable = true
				window.maximize()
			})
	})

	ipc.on('get-data', (event, _) => {
		event.sender.send('send-data', json)
		event.sender.send('select-dir', displayedDirectory)
	})

	ipc.on('change-password', (event, arg) => {
		let actualPassword = arg.actual
		let newPassword = arg.new

		load(event, file, actualPassword, function (content) {
			save(file, JSON.stringify(json), newPassword, () => {
				password = newPassword
			})
		})
	})

	ipc.on('add-dir', (event, arg) => {
		json.dirs.push({"name": arg, "keys": []})
		event.sender.send('send-dirs', json.dirs)

		save(file, JSON.stringify(json), password)
	})

	ipc.on('del-dir', (event, arg) => {
		json.dirs.splice(arg, 1)

		event.sender.send('send-dirs', json.dirs)
		if (displayedDirectory === arg && json.dirs.length > 0) {
			displayedDirectory = 0
			event.sender.send('send-keys', json.dirs[arg].keys)
		}
		event.sender.send('select-dir', displayedDirectory)

		save(file, JSON.stringify(json), password)
	})

	ipc.on('rename-dir', (event, arg) => {
		json.dirs[arg.dirID].name = arg.name

		event.sender.send('send-dirs', json.dirs)

		save(file, JSON.stringify(json), password)
	})

	ipc.on('select-dir', (event, arg) => {
		if (creatingKey === -1) {
			event.sender.send('select-dir', arg)
			event.sender.send('send-keys', json.dirs[arg].keys)
			if (displayedDirectory !== arg) {
				event.sender.send('close-right-pan')
				displayedDirectory = arg
			}
		} else
			event.sender.send('key-saved')
	})

	ipc.on('get-key', (event, arg) => {
		if (creatingKey === -1 && creatingSubKey === -1) {
			event.sender.send('send-key', json.dirs[displayedDirectory].keys[arg])
			selectedDirectory = displayedDirectory
			selectedKey = arg
			selectedSubKey = 0
		} else
			event.sender.send('key-saved')
	})

	ipc.on('go-to-url', (event, arg) => {
		let subkeys
		if (arg === undefined)
			subkeys = json.dirs[displayedDirectory].keys[selectedKey].subkeys
		else
			subkeys = json.dirs[displayedDirectory].keys[arg].subkeys
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

	ipc.on('save-key', (event, arg) => {
		json.dirs[displayedDirectory].keys[selectedKey].subkeys[selectedSubKey] = arg.subkey

		if (json.dirs[displayedDirectory].keys[selectedKey].name !== arg.name)
			json.dirs[displayedDirectory].keys[selectedKey].name = arg.name

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys)

		creatingKey = -1
		creatingSubKey = -1

		save(file, JSON.stringify(json), password)
	})

	ipc.on('get-subkey', (event, arg) => {
		if (creatingKey === -1 && creatingSubKey === -1) {
			event.sender.send('send-subkey', json.dirs[selectedDirectory].keys[selectedKey].subkeys[arg])
			selectedSubKey = arg
		} else
			event.sender.send('key-saved')
	})

	ipc.on('close-right-pan', (event) => {
		if (creatingSubKey !== -1) {
			deleteSubKey(json, displayedDirectory, selectedDirectory, event, function () {
				creatingKey = -1
				creatingSubKey = -1
				save(file, JSON.stringify(json), password)
			})
		}
		event.sender.send('close-right-pan', json.dirs)
	})

	ipc.on('del-key', (event, arg) => {
		if (arg >= 0) {
			json.dirs[displayedDirectory].keys.splice(arg, 1)
			event.sender.send('send-keys', json.dirs[displayedDirectory].keys)

			if (selectedDirectory === displayedDirectory && selectedKey === arg) {
				event.sender.send('close-right-pan')

				selectedKey = -1
				selectedSubKey = -1

				creatingKey = -1
				creatingSubKey = -1
			}

			save(file, JSON.stringify(json), password)
		}
	})

	ipc.on('add-key', (event, arg) => {
		if (json.dirs.length <= displayedDirectory) {
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

		json.dirs[displayedDirectory].keys.push(key)

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys)
		event.sender.send('send-key', key)

		selectedDirectory = displayedDirectory
		selectedKey = json.dirs[displayedDirectory].keys.length - 1
		selectedSubKey = 0
		creatingKey = selectedKey
		creatingSubKey = selectedSubKey

		save(file, JSON.stringify(json), password)
	})

	ipc.on('add-user', (event, _) => {
		let subkey = {"user": "", "mail": "", "password": "", "url": "", "note": ""}
		json.dirs[selectedDirectory].keys[selectedKey].subkeys.push(subkey)

		event.sender.send('send-key', json.dirs[selectedDirectory].keys[selectedKey])
		event.sender.send('send-subkey', subkey)

		selectedSubKey = json.dirs[selectedDirectory].keys[selectedKey].subkeys.length - 1
		creatingSubKey = selectedSubKey

		save(file, JSON.stringify(json), password)
	})

	ipc.on('del-user', (event, _) => {
		deleteSubKey(json, displayedDirectory, selectedDirectory, event, function () {
			creatingKey = -1
			creatingSubKey = -1
			save(file, JSON.stringify(json), password)
		})
	})

	ipc.on('copy', (event, arg) => {
		if (arg === 'username')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].user)
		else if (arg === 'mail')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].mail)
		else if (arg === 'password')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].password)

		setTimeout(function () {
			clipboard.writeText("")
		}, 10000)
	})

	ipc.on('generate-password', (event, arg) => {
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

	ipc.on('move-key', (event, arg) => {
		let reorderedList = []
		for (let i = 0; i < arg.length; i++)
			reorderedList.push(json.dirs[displayedDirectory].keys[arg[i]])

		json.dirs[displayedDirectory].keys = reorderedList
		save(file, JSON.stringify(json), password)

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys)
	})

	ipc.on('get-filename', (event, _) => {
		fs.readFile(homedir + '/path', 'utf8', function (err, data) {
			if (err)
				return

			file = data
			event.sender.send('filename', file.toString())
		})
	})
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


function login(event, file, homedir, password, callback) {
	if (file != null) {
		if (!fs.existsSync(homedir))
			fs.mkdirSync(homedir)

		fs.writeFile(homedir + '/path', file.toString(), function (err) {
			if (err)
				return console.log(err)
		})
		load(event, file, password, function (content) {
			if (callback != null)
				callback(content)
		})
	}
}

function deleteSubKey(data, displayedDir, selectedDir, event, callback) {
	data.dirs[selectedDir].keys[selectedKey].subkeys.splice(selectedSubKey, 1)

	if (data.dirs[selectedDir].keys[selectedKey].subkeys.length <= 0) {
		data.dirs[selectedDir].keys.splice(selectedKey, 1)

		event.sender.send('close-right-pan')
		event.sender.send('send-keys', data.dirs[displayedDir].keys)

		selectedKey = -1
		selectedSubKey = -1
	} else {
		event.sender.send('send-key', data.dirs[selectedDir].keys[selectedKey])
		event.sender.send('send-subkey', data.dirs[selectedDir].keys[selectedKey].subkeys[0])

		selectedSubKey = 0
	}

	callback()
}

function save(file, data, password, callback = null) {
	data = encrypt(data, password)
	fs.writeFile(file.toString(), data, function (err) {
		if (err)
			return console.log(err)

		if (callback != null)
			callback()
	})
}

function load(event, file, password, callback) {
	fs.readFile(file.toString(), 'utf8', function (err, data) {
		if (err)
			return console.log(err)

		try {
			data = decrypt(data, password)
			json = JSON.parse(data)
			callback(json)
		} catch (e) {
			event.sender.send('error', 'password')
		}
	})
}

function decrypt(data, password) {
	let hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16)
	let iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16)

	let decipher = crypto.createDecipheriv('aes-128-cbc', hashedPassword, iv)
	let decrypted = decipher.update(data, 'base64', 'utf8')
	decrypted += decipher.final('utf8')
	return decrypted
}

function encrypt(data, password) {
	let hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16)
	let iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16)

	let cipher = crypto.createCipheriv('aes-128-cbc', hashedPassword, iv)
	let crypted = cipher.update(data, 'utf8', 'base64')
	crypted += cipher.final('base64')
	return crypted
}
