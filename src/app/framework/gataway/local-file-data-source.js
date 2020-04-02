const fs = require('fs')
const CryptUtil = require('../crypt-util')

module.exports = class LocalFileDataSource {

	static save(file, data, password, callback = null) {
		data = CryptUtil.encrypt(data, password)
		fs.writeFile(file.toString(), data, function (err) {
			if (err)
				return console.log(err)

			if (callback != null)
				callback()
		})
	}

	static load(event, file, password, callback) {
		fs.readFile(file.toString(), 'utf8', function (err, content) {
			if (err)
				return console.log(err)

			try {
				let data = CryptUtil.decrypt(content, password)
				let json = JSON.parse(data)
				callback(json)
			} catch (e) {
				event.sender.send('error', 'password')
			}
		})
	}
}