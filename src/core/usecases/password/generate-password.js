const randomstring = require("randomstring")

module.exports = class GeneratePassword {

	execute(specs) {
		const min = 'abcdefghijklmnopqrstuvwxyz'
		const maj = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
		const num = '0123456789'
		const spa = ' '
		const spe = ',?.:/!*-+()[]{}#&'

		let chars = ''
		if (specs.min)
			chars += min
		if (specs.maj)
			chars += maj
		if (specs.num)
			chars += num
		if (specs.spa)
			chars += spa
		if (specs.spe)
			chars += spe

		return randomstring.generate({
			length: specs.n,
			charset: chars
		})
	}
}