const {shell} = require('electron')

module.exports = class OpenUrl {

	execute(subkeys, onFailure) {
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
			onFailure()
		}
	}
}