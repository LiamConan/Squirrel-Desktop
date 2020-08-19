module.exports = class RenameDirectory {

	execute(data, position, name) {
		data.dirs[position].name = name;
	}
};
