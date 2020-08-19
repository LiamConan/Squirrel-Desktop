const {shell} = require('electron');

module.exports = class OpenUrl {

	execute(subkeys, onFailure) {
		let url = null;
		const consistents = subkeys.filter(subkey => subkey.url !== "");
		if (consistents.length > 0)
			url = consistents[0];

		if (url !== null && url !== undefined) {
			if (null == url.match(/https?:\/\/*/))
				shell.openExternal('http://' + url).then();
			else
				shell.openExternal(url).then();
		} else {
			onFailure();
		}
	}
};
