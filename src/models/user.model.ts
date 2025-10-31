import { getDB } from "../config/database";
import type { InputUser, User } from "../schemas/user.schema";
import type { VOTE_TYPE } from "../schemas/vote.schema";

const collection = "users";

export const fetchUserById = async (id: number) => {
	const db = getDB();
	return await db.collection<User>(collection).findOne({ steam_user_id: id });
};

// Save the user and its session info
export const saveUserSession = async (user: InputUser) => {
	const db = getDB();
	return db.collection<User>(collection).updateOne(
		{ steam_user_id: user.steam_user_id },
		{
			$set: {
				updated_at: new Date(),
				lastSessionAt: new Date(),
			},
			$inc: {
				nSessions: 1,
			},
			$setOnInsert: {
				steam_user_id: user.steam_user_id,
				created_at: new Date(),
				votes: [],
			},
		},
		{ upsert: true },
	);
};

export const setUserVote = async (
	steamUserId: number,
	gameId: number,
	voteType: VOTE_TYPE,
) => {
	const db = getDB();
	let voteCreated = false;
	// Update existing vote if present
	const updateResult = await db.collection<User>(collection).updateOne(
		{ steam_user_id: steamUserId, "votes.game_id": gameId },
		{
			$set: {
				"votes.$.vote_type": voteType,
				updated_at: new Date(),
			},
		},
	);
	// If no vote for this game_id existed, push a new one
	if (updateResult.matchedCount === 0) {
		await db.collection<User>(collection).updateOne(
			{ steam_user_id: steamUserId },
			{
				$push: { votes: { game_id: gameId, vote_type: voteType } },
				$set: { updated_at: new Date() },
			},
		);
		voteCreated = true;
	}
	return {
		voteCreated,
		voteChanged: !voteCreated && updateResult.modifiedCount > 0,
	};
};

export const removeUserVote = async (steamUserId: number, gameId: number) => {
	const db = getDB();
	const updateResult = await db.collection<User>(collection).updateOne(
		{ steam_user_id: steamUserId },
		{
			$pull: { votes: { game_id: gameId } },
			$set: { updated_at: new Date() },
		},
	);
	return {
		voteRemoved: updateResult.modifiedCount > 0,
	};
};
