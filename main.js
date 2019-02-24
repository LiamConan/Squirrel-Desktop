const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;
const {dialog} = require('electron');
const {clipboard} = require('electron');
const {shell} = require('electron');

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var dateTime = require('node-datetime');
var randomstring = require("randomstring");
var keypress = require('keypress');


app.on('ready', function ()
{
	let window;
	var renderPath			= `file://${__dirname}/web/html/`;
	var password			= null;
	var createFile			= false;
	var file;
	var json				= null;
	var displayedDirectory	= 0;
	var creatingKey			= -1;
	var creatingSubKey		= -1;

	var selectedDirectory	= -1; // Dir of the selected key
	var selectedKey			= -1;
	var selectedSubKey		= -1;
	var squirrelHome = app.getPath('documents').split('\\');
	squirrelHome.pop();
	squirrelHome = squirrelHome.join('/') + '/AppData/Local/Squirrel';

	window = new BrowserWindow({width: 800, height: 175, icon: path.join(__dirname, 'res/squirrel.png')});
	window.setMenu(null);

	window.loadURL(renderPath + 'login.html');

	window.on('closed', () => {
		if(creatingKey != -1)
		{
			json.dirs[displayedDirectory].keys.splice(creatingKey, 1);
			save(file, JSON.stringify(json), password);
		}
		window = null;
	});

	app.on('window-all-closed', () => {
		if (process.platform !== 'darwin')
			app.quit();
	});


	ipc.on('choose-file', (event, arg) => {
		dialog.showOpenDialog(window, function (filename)
		{
			if (filename === undefined)
				return;

			file = filename;
			event.sender.send('filename', filename.toString());
		});
	});

	ipc.on('new-file', (event, arg) => {
		dialog.showSaveDialog(window, {
			title: 'Nouveau registre de clés',
			filters: [{name: 'Fichiers squirrel', extensions: ['sq']}]
		},
		(filename) => {
			if (filename === undefined)
				return;
			createFile = true;
			file = filename;
			event.sender.send('filename', filename.toString());
		});
	});

	ipc.on('login', (event, arg) => {
		password = arg;

		if (createFile)
		{
			createFile = false;
			save(file, JSON.stringify({"dirs":[]}), password, function() {
				login(event);
			});
		}
		else
			login(event);
	});

	ipc.on('get-data', (event, arg) => {
		event.sender.send('send-data', json);
		event.sender.send('select-dir', displayedDirectory);
	});

	ipc.on('add-dir', (event, arg) => {
		json.dirs.push({"name": arg, "keys": []});
		event.sender.send('send-dirs', json.dirs);

		save(file, JSON.stringify(json), password);
	});

	ipc.on('del-dir', (event, arg) => {
		json.dirs.splice(arg, 1);

		event.sender.send('send-dirs', json.dirs);
		if (displayedDirectory == arg && json.dirs.length > 0)
		{
			displayedDirectory = 0
			event.sender.send('send-keys', json.dirs[arg].keys);
		}
		event.sender.send('select-dir', displayedDirectory);

		save(file, JSON.stringify(json), password);
	});

	ipc.on('rename-dir', (event, arg) => {
		json.dirs[arg.dirID].name = arg.name;

		event.sender.send('send-dirs', json.dirs);

		save(file, JSON.stringify(json), password);
	});

	ipc.on('select-dir', (event, arg) => {
		if (creatingKey == -1)
		{
			event.sender.send('select-dir', arg);
			event.sender.send('send-keys', json.dirs[arg].keys);
			if(displayedDirectory != arg)
			{
				event.sender.send('close-right-pan');
				displayedDirectory = arg;
			}
		}
		else
			event.sender.send('key-saved');
	});

	ipc.on('get-key', (event, arg) => {
		if (creatingKey == -1 && creatingSubKey == -1)
		{
			event.sender.send('send-key', json.dirs[displayedDirectory].keys[arg]);
			selectedDirectory = displayedDirectory;
			selectedKey = arg;
			selectedSubKey = 0;
		}
		else
			event.sender.send('key-saved');
	});

	ipc.on('go-to-url', (event, arg) => {
		var subkeys = json.dirs[displayedDirectory].keys[arg].subkeys;
		var url = null;
		var i=0;

		while (url == '' && i < subkeys.lenght)
			i++;
		url = subkeys[i].url;

		if (url != null && url != '' && url != "")
		{
			if (null == url.match(/https?:\/\/*/))
				shell.openExternal('http://' + url);
			else
				shell.openExternal(url);
		}
		else
		{
			event.sender.send('no-url');
		}
	});

	ipc.on('save-key', (event, arg) => {
		var key = arg
		var subkey = key.subkey;

		json.dirs[displayedDirectory].keys[selectedKey].subkeys[selectedSubKey] = subkey;

		if (json.dirs[displayedDirectory].keys[selectedKey].name != key.name)
			json.dirs[displayedDirectory].keys[selectedKey].name = key.name;

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys);

		creatingKey = -1;
		creatingSubKey = -1;

		save(file, JSON.stringify(json), password);
	});

	ipc.on('get-subkey', (event, arg) => {
		if (creatingKey == -1 && creatingSubKey == -1)
		{
			event.sender.send('send-subkey', json.dirs[selectedDirectory].keys[selectedKey].subkeys[arg]);
			selectedSubKey = arg;
		}
		else
			event.sender.send('key-saved');
	});

	ipc.on('close-right-pan', (event) => {
		if (creatingSubKey != -1)
		{
			deleteSubKey(json, displayedDirectory, selectedDirectory, selectedKey, selectedSubKey, event, function() {
				creatingKey = -1;
				creatingSubKey = -1;
				save(file, JSON.stringify(json), password);
			});
		}
		event.sender.send('close-right-pan', json.dirs);
	});

	ipc.on('del-key', (event, arg) => {
		if (arg >= 0)
		{
			json.dirs[displayedDirectory].keys.splice(arg, 1);
			event.sender.send('send-keys', json.dirs[displayedDirectory].keys);

			if (selectedDirectory == displayedDirectory && selectedKey == arg)
			{
				event.sender.send('close-right-pan');

				selectedKey = -1;
				selectedSubKey = -1;

				creatingKey = -1;
				creatingSubKey = -1;
			}

			save(file, JSON.stringify(json), password);
		}
	});

	ipc.on('add-key', (event, arg) => {
		if (json.dirs.length <= displayedDirectory)
		{
			event.sender.send('no-dir');
			return
		}
		var dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
		var monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"];
		var date = new Date();
		var day = date.getDay()-1;
		if (day == -1)
			day = 6
		var dateString = dayNames[day] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
		var key = {"name": arg, "date": dateString, "subkeys": [{"user": "", "mail": "", "password": "", "url": "", "note": ""}]};

		json.dirs[displayedDirectory].keys.push(key);

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys);
		event.sender.send('send-key', key);

		selectedDirectory = displayedDirectory;
		selectedKey = json.dirs[displayedDirectory].keys.length-1;
		selectedSubKey = 0;
		creatingKey = selectedKey;
		creatingSubKey = selectedSubKey;

		save(file, JSON.stringify(json), password);
	});

	ipc.on('add-user', (event, arg) => {
		var subkey = {"user": "", "mail": "", "password": "", "url": "", "note": ""};
		json.dirs[selectedDirectory].keys[selectedKey].subkeys.push(subkey);

		event.sender.send('send-key', json.dirs[selectedDirectory].keys[selectedKey]);
		event.sender.send('send-subkey', subkey);

		selectedSubKey = json.dirs[selectedDirectory].keys[selectedKey].subkeys.length - 1;
		creatingSubKey = selectedSubKey;

		save(file, JSON.stringify(json), password);
	});

	ipc.on('del-user', (event, arg) => {
		deleteSubKey(json, displayedDirectory, selectedDirectory, selectedKey, selectedSubKey, event, function() {
			creatingKey = -1;
			creatingSubKey = -1;
			save(file, JSON.stringify(json), password);
		});
	});

	ipc.on('copy', (event, arg) => {
		if (arg == 'username')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].user);
		else if (arg == 'mail')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].mail);
		else if (arg == 'password')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].password);
		else if (arg == 'url')
			clipboard.writeText(json.dirs[selectedDirectory].keys[selectedKey].subkeys[selectedSubKey].url);

		setTimeout(function() {
			clipboard.writeText("");
			}, 10000);
	});

	ipc.on('generate-password', (event, arg) => {
		const min = 'abcdefghijklmnopqrstuvwxyz';
		const maj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
		const num = '0123456789';
		const spa = ' ';
		const spe = ',?;.:/!*-+()[]{}#&';

		var json = JSON.parse(arg);
		var chars = '';
		if (json.min)
			chars += min;
		if (json.maj)
			chars += maj;
		if (json.num)
			chars += num;
		if (json.spa)
			chars += spa;
		if (json.spe)
			chars += spe;

		var random = randomstring.generate({
			length: json.n,
			charset: chars
		});

		event.sender.send('send-hash', random);
	});

	ipc.on('move-key', (event, arg) => {
		var reorderedList = [];
		for (var i=0 ; i<arg.length ; i++)
			reorderedList.push(json.dirs[displayedDirectory].keys[arg[i]]);

		json.dirs[displayedDirectory].keys = reorderedList;
		save(file, JSON.stringify(json), password);

		event.sender.send('send-keys', json.dirs[displayedDirectory].keys);
	});

	ipc.on('get-filename', (event, arg) => {
		fs.readFile(squirrelHome + '/path', 'utf8', function (err, data) {
			if (err)
				return;

			file = data;
			event.sender.send('filename', file.toString());
		});
	});

	randomstring.generate(); // First call to initialize the randomstring lib

	function login(event)
	{
		if (file != null)
		{
			if (!fs.existsSync(squirrelHome))
				fs.mkdirSync(squirrelHome);

			fs.writeFile(squirrelHome + '/path', file.toString(), function(err) {
				if (err)
					return console.log(err);
			});
			load(event, file, password, function(content) {
				json = content;

				window.loadURL(renderPath + 'home.html');
				window.setResizable(true);
				window.maximize();
			});
		}
	}
});

function deleteSubKey(data, displayedDir, selectedDir, selectedKey, selectedSubKey, event, callback)
{
	data.dirs[selectedDir].keys[selectedKey].subkeys.splice(selectedSubKey, 1);

	if (data.dirs[selectedDir].keys[selectedKey].subkeys.length <= 0)
	{
		data.dirs[selectedDir].keys.splice(selectedKey, 1);

		event.sender.send('close-right-pan');
		event.sender.send('send-keys', data.dirs[displayedDir].keys);

		selectedKey = -1;
		selectedSubKey = -1;
	}
	else
	{
			event.sender.send('send-key', data.dirs[selectedDir].keys[selectedKey]);
			event.sender.send('send-subkey', data.dirs[selectedDir].keys[selectedKey].subkeys[0]);

			selectedSubKey = 0;
	}

	callback();
}

function save(file, data, password, callback = null)
{
	data = encrypt(data, password);
	fs.writeFile(file.toString(), data, function(err) {
		if (err)
			return console.log(err);

		if (callback != null)
			callback();
	});
}

function load(event, file, password, callback)
{
	fs.readFile(file.toString(), 'utf8', function (err, data) {
		if (err)
			return console.log(err);

		try
		{
            data = decrypt(data, password);
			json = JSON.parse(data);
			callback(json);
		}
		catch(e)
		{
			event.sender.send('error', 'password');
		}
	});
}

function decrypt(data, password)
{
    var hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16)
    var iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16)

    var decipher = crypto.createDecipheriv('aes-128-cbc', hashedPassword, iv);
    var decrypted = decipher.update(data, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function encrypt(data, password)
{
    var hashedPassword = crypto.createHash('md5').update(new Buffer(password)).digest("hex").substring(0, 16)
    var iv = crypto.createHash('sha1').update(hashedPassword).digest("hex").substring(0, 16)

    var cipher = crypto.createCipheriv('aes-128-cbc', hashedPassword, iv);
    var crypted = cipher.update(data, 'utf8', 'base64');
    crypted += cipher.final('base64');
    return crypted;
}
