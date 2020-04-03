module.exports = class MoveKey {

	execute(data, directoryPosition, tabs) {
		let reorderedList = []
		for (let i = 0; i < tabs.length; i++)
			reorderedList.push(data.dirs[directoryPosition].keys[tabs[i]])

		data.dirs[directoryPosition].keys = reorderedList
	}
}