$(function () {
	const {ipcRenderer: ipc, remote: app} = require('electron');
	const USERNAME = "username";
	const MAIL = "mail";
	const PASSWORD = "password";
	const NOTIFICATION_SLIDE_DELAY = 500;
	const NOTIFICATION_STAY_DELAY = 1000;

	let dirIDToRename = -1;
	let dirIDToDelete = -1;
	let keyIDToDelete = -1;
	let deleteSubKey = false;
	let ctrl = false;

	$(document).on('keydown', function (e) {
		if (e.key === 'Control') {
			ctrl = true;
			$('#list #keys li:nth-child(2n+1)')
				.css('background-color', '#3C6DA8');
		}
	});
	$(document).on('keyup', function (e) {
		if (e.key === 'Control') {
			ctrl = false;
			$('#list #keys li:nth-child(2n+1)')
				.css('background-color', '#6E7180');
		}
	});

	ipc.on('send-data', (event, arg) => loadInterface(arg));

	ipc.on('send-dirs', (event, arg) => showDirectories(arg));

	ipc.on('select-dir', (event, arg) => selectDirectory(arg));

	ipc.on('show-keys', (event, arg) => showKeys(arg));

	ipc.on('send-key', (event, arg) => openRightPan(arg));

	ipc.on('send-subkey', (event, arg) => showSubKey(arg));

	ipc.on('close-right-pan', () => closeRightPan());

	ipc.on('key-saved', () => {
		$('#save_key')
			.slideDown(NOTIFICATION_SLIDE_DELAY)
			.delay(NOTIFICATION_STAY_DELAY)
			.slideUp(NOTIFICATION_SLIDE_DELAY);
	});

	ipc.on('no-url', () => {
		$('#no_url')
			.slideDown(NOTIFICATION_SLIDE_DELAY)
			.delay(NOTIFICATION_STAY_DELAY)
			.slideUp(NOTIFICATION_SLIDE_DELAY);
	});

	ipc.on('no-dir', () => {
		$('#no_dir')
			.slideDown(NOTIFICATION_SLIDE_DELAY)
			.delay(NOTIFICATION_STAY_DELAY)
			.slideUp(NOTIFICATION_SLIDE_DELAY);
	});

	ipc.on('changed-password', () => {
		$('#changed_password')
				.slideDown(NOTIFICATION_SLIDE_DELAY)
				.delay(NOTIFICATION_STAY_DELAY)
				.slideUp(NOTIFICATION_SLIDE_DELAY);
	});

	ipc.on('send-hash', (event, arg) => {
		$('#edittext-generated-pass').val(arg);
	});

	ipc.send('get-data');

	function loadInterface(data) {
		showDirectories(data.dirs);

		if (data.dirs.length > 0)
			showKeys(data.dirs[0].keys);

		$('#validate-change-password').on('click', () => {
			let actualPassword = $('#actual_password').val();
			let newPassword = $('#new_password').val();
			if (actualPassword === newPassword) {
				$('#alert-old-new-passwords-equal')
					.slideDown(NOTIFICATION_SLIDE_DELAY)
					.delay(NOTIFICATION_STAY_DELAY)
					.slideUp(NOTIFICATION_SLIDE_DELAY);
			} else if (newPassword !== $('#confirmation_password').val()) {
				$('#alert-confirmation-not-match')
					.slideDown(NOTIFICATION_SLIDE_DELAY)
					.delay(NOTIFICATION_STAY_DELAY)
					.slideUp(NOTIFICATION_SLIDE_DELAY);
			} else {
				ipc.send('change-password', {
					'actual': actualPassword,
					'new': newPassword
				});
				closeChangePasswordModal();
			}
		});

		$('#cancel-change-password')
			.on('click', () => closeChangePasswordModal());

		$('#add_dir').on('click', () => onAddDirectory());

		$("#editTextNewDir").on('keyup', (e) => {
			if (e.key === 'Enter')
				onAddDirectory();
		});

		$('#add_key').on('click', () => onAddKey());

		$('#editTextNewKey').on('keyup', (e) => {
			if (e.key === 'Enter')
				onAddKey();
		});

		$('#add-user').on('click', () => onAddUser());

		$('#del-user').on('click', function () {
			deleteSubKey = true;
			openDeleteKeyModal();
		});

		$('#key_save').on('click', function () {
			let title = $('#key_title').val();
			let user = $('#user').val();
			let email = $('#mail').val();
			let password = $('#password').val();
			let date = $('#date').val();
			let url = $('#url').val();
			let note = $('#note').val().replace(/(?:\r\n|\r|\n)/g, '<br/>')
				.replace(/(?:")/g, '\\"');

			if (title === "")
				setErrorOn('key_title');
			else if (user === "" && email === "")
				setErrorOn('user');
			else if (password === "")
				setErrorOn('password');
			else {
				ipc.send('save-key', {
					'name': title,
					'subkey': {
						'user': user,
						'mail': email,
						'password': password,
						'date': date,
						'url': url,
						'note': note
					},
				});
			}
		});

		$('#key_close').on('click', function () {
			ipc.send('close-right-pan');
		});

		$('#copy_username').on('click', () => _copyValue(USERNAME));

		$('#copy_mail').on('click', () => _copyValue(MAIL));

		$('#copy_password').on('click', () => _copyValue(PASSWORD));

		$('#copy_url').on('click', function () {
			ipc.send('go-to-url');
		});

		$('#generate-password').on('click', function () {
			let n = $('#nb-charac').val();
			let min = $('#check-min').is(':checked');
			let maj = $('#check-maj').is(':checked');
			let num = $('#check-num').is(':checked');
			let spa = $('#check-spa').is(':checked');
			let spe = $('#check-spe').is(':checked');

			if (n.length < 1)
				$('#fill_form').slideDown(500).delay(2000).slideUp(500);
			else if (n.length > 4)
				$('#too_long_number').slideDown(500).delay(2000).slideUp(500);
			else if (!min && !maj && !num && !spa && !spe)
				$('#check_one_at_least').slideDown(500).delay(2000)
					.slideUp(500);
			else {
				ipc.send('generate-password', {
					'n': n,
					'min': min,
					'maj': maj,
					'num': num,
					'spa': spa,
					'spe': spe
				});
			}
		});

		$('#validate-hash').on('click', () => {
			$('#password').val($('#edittext-generated-pass').val());
			closePasswordGeneratorModal();
		});

		$('#cancel-hash').on('click', () => closePasswordGeneratorModal());

		$("#keys").sortable({
			group: 'no-drop',
			handle: '.icon_drag',
			stop: () => {
				let tab = [];
				$('.key').each((i, it) => {
					tab.push(parseInt($(it).attr("class").split(' ')[1]));
				});
				ipc.send('move-key', tab);
			}
		});

		$('#confirmRename').on('click', () => {
			$('#modalRename').modal('hide');
			onRenameDir($('#editTextreNewName').val());
		});

		$('#cancelRename').on('click', () => $('#modalRename').modal('hide'));

		$('#confirmDelete').on('click', () => {
			if (dirIDToDelete !== -1) {
				ipc.send('del-dir', dirIDToDelete);
				dirIDToDelete = -1;
			} else if (keyIDToDelete !== -1) {
				ipc.send('del-key', keyIDToDelete);
				keyIDToDelete = -1;
			} else if (deleteSubKey) {
				ipc.send('del-user');
			}
		});

		$('#cancelDelete').on('click', () => {
			dirIDToDelete = -1;
			keyIDToDelete = -1;
		});

		$("#eye-toggle").on('click', () => {
			let passwordField = $("#password");
			if (passwordField.attr('type') === 'password') {
				passwordField.prop('type', 'text');
				$("#eye-icon")
					.prop('src', '../../../../assets/img/eye-off.svg');
			} else {
				passwordField.prop('type', 'password');
				$("#eye-icon").prop('src', '../../../../assets/img/eye.svg');
			}
		});
	}

	function showDirectories(dirs) {
		let directories = $('#list_dirs');
		directories.empty();
		for (let i = 0; i < dirs.length; i++) {
			directories.append(
				`<li class="dir_title ${i}">
					<div>${dirs[i].name}</div>
				</li>`
			);
		}

		let directoryTitle = $('.dir_title');
		directoryTitle.on('click', function () {
			ipc.send('select-dir', $(this).attr('class').split(' ')[1]);
		});

		directoryTitle.contextmenu(function () {
			event.preventDefault();
			const template = [
				{
					label: 'renommer',
					click: () => {
						dirIDToRename = $(this).attr('class').split(' ')[1];
						openRenameDirModal($(this).text());
					}
				},
				{
					label: 'supprimer',
					click: () => {
						dirIDToDelete = $(this).attr('class').split(' ')[1];
						openDeleteDirModal();
					}
				}
			];
			app.Menu.buildFromTemplate(template).popup();
		});
	}

	function selectDirectory(dir) {
		let n = parseInt(dir) + 1;
		$('#list_dirs li').css('background', 'none');
		$('#list_dirs li:nth-child(' + n + ')').css('background', '#3d414f');
	}

	function showKeys(keys) {
		let keysList = $('#keys');
		keysList.empty();

		for (let i = 0; i < keys.length; i++) {
			keysList.append(
				`<li class="key ${i}">
					<img class="icon_drag" src="../../../../assets/img/menu.svg" alt="handler"/>
					<div class="keys_title">${keys[i].name}</div>
					<div class="date">${keys[i].date}</div>
				</li>`
			);
		}

		let keyItem = $('.key');
		keyItem.on('click', function () {
			if (ctrl) {
				ctrl = false;
				ipc.send('go-to-url', $(this).attr('class').split(' ')[1]);
			} else
				ipc.send('get-key', $(this).attr('class').split(' ')[1]);
		});

		keyItem.contextmenu(function () {
			event.preventDefault();
			const template = [
				{
					label: 'supprimer',
					click: () => {
						keyIDToDelete = $(this).attr('class').split(' ')[1];
						openDeleteKeyModal();
					}
				}
			];
			app.Menu.buildFromTemplate(template).popup();
		});
	}

	function openRightPan(key) {
		fillRightPan(key);

		$('#key').css('display', 'block');
		$('#list_frame').css('width', '49%');
		$('#block-new_key').css('width', '95%');
	}

	function closeRightPan() {
		$('#key').css('display', 'none');
		$('#list_frame').css('width', '100%');
		$('#block-new_key').css('width', '97%');

		$('#key_title').val('');
		$('#user').val('');
		$('#mail').val('');
		$('#password').val('');
		$('#url').val('');
		$('#note').val('');
	}

	function fillRightPan(key) {
		let subkeys = key.subkeys;
		let dropdown = $('#dropdown-user');
		dropdown.empty();
		for (let i = 0; i < subkeys.length; i++) {
			dropdown.append(
				`<a class="dropdown-item ${i}" href="#">${subkeys[i].user}</a>`
			);
		}

		$('.dropdown-item').on('click', function () {
			ipc.send('get-subkey', $(this).attr('class').split(' ')[1]);
		});

		$('#key_title').val(key.name);
		showSubKey(subkeys[0]);
	}

	function showSubKey(arg) {
		$('#user').val(arg.user);
		$('#mail').val(arg.mail);
		$('#password').val(arg.password);
		$('#date').val(arg.date);
		$('#url').val(arg.url);
		$('#note').val(arg.note.replace(/(?:<br\/>)/g, '\n'));
	}

	function onAddDirectory() {
		let editText = $('#editTextNewDir');
		if (editText.val() !== "")
			ipc.send('add-dir', editText.val());

		editText.val('');
	}

	function onAddKey() {
		let newKeyField = $('#editTextNewKey');
		if (newKeyField.val() !== "")
			ipc.send('add-key', newKeyField.val());

		newKeyField.val('');
	}

	function onAddUser() {
		ipc.send('add-user');
	}

	function onRenameDir(name) {
		ipc.send('rename-dir', {"name": name, "position": dirIDToRename});
	}

	function setErrorOn(field) {
		$('#' + field + '').css('border', '2px solid #ce4540');
		setTimeout(function () {
			$('#' + field + '').css('border', '1px solid #353B45');
		}, 2000);
	}

	function closeChangePasswordModal() {
		$('#modalChangePassword').modal('hide');
		$('#actual_password').val('');
		$('#new_password').val('');
		$('#confirmation_password').val('');
	}

	function closePasswordGeneratorModal() {
		$('#modalGenerateHash').modal('hide');
		$('#nb-charac').val('');
		$('#check-min').prop('checked', false);
		$('#check-maj').prop('checked', false);
		$('#check-num').prop('checked', false);
		$('#check-spa').prop('checked', false);
		$('#check-spe').prop('checked', false);
		$('#edittext-generated-pass').val('');
	}

	function openRenameDirModal(name) {
		$('#editTextreNewName').val(name);
		$("#modalRename").modal();
	}

	function openDeleteKeyModal() {
		let modal = $("#modalConfirmDelete");
		modal.find('.modal-body p')
			.text('Voulez-vous supprimer la clé ?');
		modal.modal();
	}

	function openDeleteDirModal() {
		let modal = $("#modalConfirmDelete");
		modal.find('.modal-body p')
			.text('Voulez-vous supprimer le dossier ?');
		modal.modal();
	}

	function _copyValue(type) {
		ipc.send('copy', type);
		$('#copied')
			.slideDown(NOTIFICATION_SLIDE_DELAY)
			.delay(NOTIFICATION_STAY_DELAY)
			.slideUp(NOTIFICATION_SLIDE_DELAY);
	}
});
