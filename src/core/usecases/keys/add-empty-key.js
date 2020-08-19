module.exports = class AddEmptyKey {

	execute(data, directoryPosition, name) {
		let dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
		let monthNames = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Decembre"];
		let date = new Date();
		let day = date.getDay() - 1;
		if (day === -1)
			day = 6;
		let dateString = dayNames[day] + ' ' + date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
		let key = {
			"name": name,
			"date": dateString,
			"subkeys": [{"user": "", "mail": "", "password": "", "url": "", "note": ""}]
		};

		data.dirs[directoryPosition].keys.push(key);

		return key;
	}
};
