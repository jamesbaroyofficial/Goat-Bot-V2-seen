const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "1.5",
		author: "Aminul Sardar",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "tự rời",
			leaveType2: "bị kick",
			defaultLeaveMessage: "{userName} đã {type} khỏi nhóm"
		},

		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			leaveType1: "left",
			leaveType2: "was kicked from",
			defaultLeaveMessage: "{userName} {type} the group"
		}
	},

	onStart: async ({
		threadsData,
		message,
		event,
		api,
		usersData,
		getLang
	}) => {

		// Only handle member leaving/kicked
		if (event.logMessageType !== "log:unsubscribe")
			return async function () {

				const { threadID } = event;

				const threadData = await threadsData.get(threadID);

				/*
				 * Leave message switch
				 *
				 * true  = ON
				 * false = OFF
				 *
				 * If the setting doesn't exist yet,
				 * it will default to true.
				 */
				const sendLeaveMessage =
					threadData.settings.sendLeaveMessage !== false;

				if (!sendLeaveMessage)
					return;

				const { leftParticipantFbId } = event.logMessageData;

				// Don't send message when the bot itself leaves
				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				const hours = getTime("HH");

				const threadName = threadData.threadName;

				const userName = await usersData.getName(
					leftParticipantFbId
				);

				/*
				 * Available variables:
				 *
				 * {userName}
				 * {userNameTag}
				 * {type}
				 * {threadName}
				 * {boxName}
				 * {time}
				 * {session}
				 */

				let {
					leaveMessage = getLang("defaultLeaveMessage")
				} = threadData.data;

				const form = {
					mentions: null
				};

				// Check if userNameTag is used
				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						tag: userName,
						id: leftParticipantFbId
					}];
				}

				// Replace username
				leaveMessage = leaveMessage
					.replace(
						/\{userName\}|\{userNameTag\}/g,
						userName
					)

					// Replace leave type
					.replace(
						/\{type\}/g,
						leftParticipantFbId == event.author
							? getLang("leaveType1")
							: getLang("leaveType2")
					)

					// Replace thread name
					.replace(
						/\{threadName\}|\{boxName\}/g,
						threadName
					)

					// Replace time
					.replace(
						/\{time\}/g,
						hours
					)

					// Replace session
					.replace(
						/\{session\}/g,
						hours <= 10
							? getLang("session1")
							: hours <= 12
								? getLang("session2")
								: hours <= 18
									? getLang("session3")
									: getLang("session4")
					);

				form.body = leaveMessage;

				// Add mention again for safety
				if (leaveMessage.includes("{userNameTag}")) {
					form.mentions = [{
						id: leftParticipantFbId,
						tag: userName
					}];
				}

				// Leave attachment
				if (threadData.data.leaveAttachment) {

					const files = threadData.data.leaveAttachment;

					const attachments = files.reduce(
						(acc, file) => {
							acc.push(
								drive.getFile(file, "stream")
							);
							return acc;
						},
						[]
					);

					form.attachment = (await Promise.allSettled(
						attachments
					))
						.filter(
							({ status }) =>
								status === "fulfilled"
						)
						.map(
							({ value }) => value
						);
				}

				await message.send(form);
			};
	}
};
