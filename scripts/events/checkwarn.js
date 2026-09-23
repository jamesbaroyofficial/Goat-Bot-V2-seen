module.exports = {
	config: {
		name: "checkwarn",
		version: "1.4",
		author: "Aminul Sardar",
		category: "events"
	},

	// true = enabled
	// false = disabled
	autoBan: false,

	langs: {
		vi: {
			warn: "Thành viên %1 đã bị cảnh cáo đủ 3 lần trước đó và bị ban khỏi box chat\n- Name: %1\n- Uid: %2\n- Để gỡ ban vui lòng sử dụng lệnh \"%3warn unban <uid>\"",
			needPermission: "Bot cần quyền quản trị viên để kick thành viên bị ban"
		},
		en: {
			warn: "Member %1 has been warned 3 times before and has been banned from the chat box\n- Name: %1\n- Uid: %2\n- To unban, please use the \"%3warn unban <uid>\" command",
			needPermission: "Bot needs administrator permission to kick banned members"
		}
	},

	onStart: async ({ threadsData, message, event, api, client, getLang }) => {
		if (event.logMessageType != "log:subscribe")
			return;

		// OFF ang auto-ban
		if (!module.exports.autoBan)
			return;

		return async function () {
			const { threadID } = event;
			const { data } = await threadsData.get(threadID);
			const { warn: warnList } = data || {};

			if (!warnList)
				return;

			const { addedParticipants } = event.logMessageData;

			for (const user of addedParticipants) {
				// Hanapin ang warning record ng bagong member
				const findUser = warnList.find(
					item => item.userID == user.userFbId
				);

				if (findUser && findUser.list >= 3) {
					const userName = user.fullName;
					const uid = user.userFbId;

					message.send({
						body: getLang(
							"warn",
							userName,
							uid,
							client.getPrefix(threadID)
						),
						mentions: [{
							tag: userName,
							id: uid
						}]
					}, function () {
						api.removeUserFromGroup(uid, threadID, (err) => {
							if (err)
								return message.send(
									getLang("needPermission")
								);
						});
					});
				}
			}
		};
	}
};

Para i-enable ulit

Palitan lang:

autoBan: false,

ng:

autoBan: true,

"false" = naka-off ang auto-ban/kick
"true" = naka-on ang auto-ban/kick

Note: Sa version na ito, hindi pa command-based ang ON/OFF; config switch muna siya.
