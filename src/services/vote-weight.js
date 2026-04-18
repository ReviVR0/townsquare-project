const VOTE_MULTIPLIER_REMINDERS = {
  "negative vote": -1,
  "3 votes": 3
};

export const getVoteMultiplierFromReminders = (reminders = []) =>
  reminders.reduce((multiplier, reminder) => {
    const reminderName = ((reminder && reminder.name) || "").trim().toLowerCase();
    return multiplier * (VOTE_MULTIPLIER_REMINDERS[reminderName] || 1);
  }, 1);

export const hasBansheeVoteAbility = player =>
  !!player.hasBansheeAbility;

export const getPlayerVoteBase = player => {
  const hasUgHat = ((player.visibleHat || "").trim().toLowerCase() === "ug hat");
  const hasBansheeAbility = hasBansheeVoteAbility(player);
  return hasUgHat || hasBansheeAbility ? 2 : 1;
};

export const getPlayerVoteMultiplier = player => {
  const multiplier = Number(player.voteMultiplier);
  return Number.isFinite(multiplier) && multiplier !== 0 ? multiplier : 1;
};

export const getPlayerVoteWeight = player =>
  getPlayerVoteBase(player) * getPlayerVoteMultiplier(player);