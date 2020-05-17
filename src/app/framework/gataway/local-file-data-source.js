const fs = require('fs')
const CryptUtil = require('../crypt-util')
const KeysDataSource = require('../../../core/data/keys-data-source')

module.exports = class LocalFileDataSource extends KeysDataSource{

	save(file, data, password, callback = null) {
		data = CryptUtil.encrypt(data, password)
		fs.writeFile(file.toString(), data, function (err) {
			if (err)
				return console.log(err)

			if (callback != null)
				callback()
		})
	}

	load(file, password, callback) {
		fs.readFile(file.toString(), 'utf8', function (err, content) {
			if (err)
				return console.log(err)

			try {
				let data = CryptUtil.decrypt(content, password)
				let json = JSON.parse(data)
				callback(json)
			} catch (e) {
				console.log("load error" + e)
				callback(null);
			}
		})
	}
}