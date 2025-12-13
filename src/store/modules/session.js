/**
 * Handle a vote request.
 * If the vote is from a seat that is already locked, ignore it.
 * @param state session state
 * @param index seat of the player in the circle
 * @param vote true or false
 */
const handleVote = (state, [index, vote]) => {
  if (!state.nomination) return;
  state.votes = [...state.votes];
  state.votes[index] = vote === undefined ? !state.votes[index] : vote;
};

const state = () => ({
  sessionId: "",
  isSpectator: false,
  isReconnecting: false,
  playerCount: 0,
  ping: 0,
  playerId: "",
  claimedSeat: -1,
  nomination: false,
  votes: [],
  lockedVote: 0,
  votingSpeed: 3000,
  isVoteInProgress: false,
  voteHistory: [],
  markedPlayer: -1,
  isVoteHistoryAllowed: true,
  isRolesDistributed: false,
  timer: 0,
  timerPause: false,
  receivedGrim: null,
  recivedMessage: null,
  winningTeam: null,
  StorytellerCode: null,
  hiddenVote: false,
  wraithPeek: [],
  isLilMonstaVote: false,
  botId: null,
  discordChats: [],
  discordST: null,
  lockedRooms: {
  1: false,
  2: false,
  3: false,
  4: false,
  5: false,
  6: false,
  7: false,
  8: false,
  9: false,
  10: false,
  11: false,
  12: false,
  13: false,
  14: false,
  15: false,
  16: false,
  17: false,
  18: false,
  19: false,
  20: false,
  21: false,
  22: false
  }
});

const getters = {};

const actions = {};

// mutations helper functions
const set = key => (state, val) => {
  state[key] = val;
};

const mutations = {
  setPlayerId: set("playerId"),
  setSpectator: set("isSpectator"),
  setReconnecting: set("isReconnecting"),
  setPlayerCount: set("playerCount"),
  setPing: set("ping"),
  setVotingSpeed: set("votingSpeed"),
  setVoteInProgress: set("isVoteInProgress"),
  setMarkedPlayer: set("markedPlayer"),
  setNomination: set("nomination"),
  setVoteHistoryAllowed: set("isVoteHistoryAllowed"),
  claimSeat: set("claimedSeat"),
  distributeRoles: set("isRolesDistributed"),
  timer: set("timer"),
  timerPause: set("timerPause"),
  winningTeam: set("winningTeam"),
  setHiddenVote: set("hiddenVote"),
  setLilMonstaVote: set("isLilMonstaVote"),
  setDiscordChats: set("discordChats"),
  setLockRooms: set("lockedRooms"),
  setSessionId(state, sessionId) {
    state.sessionId = sessionId
      .toLocaleLowerCase()
      .replace(/[^0-9a-z]/g, "")
      .substr(0, 10);
  },
  nomination(
    state,
    { nomination, votes, votingSpeed, lockedVote, isVoteInProgress } = {}
  ) {
    state.nomination = nomination || false;
    state.votes = votes || [];
    state.votingSpeed = votingSpeed || state.votingSpeed;
    state.lockedVote = lockedVote || 0;
    state.isVoteInProgress = isVoteInProgress || false;
  },
  /**
   * Create an entry in the vote history log. Requires current player array because it might change later in the game.
   * Only stores votes that were completed.
   * @param state
   * @param players
   */
  addHistory(state, players) {
    if (!state.isVoteHistoryAllowed && state.isSpectator) return;
    if (!state.nomination || state.lockedVote <= players.length) return;
    const isExile = players[state.nomination[1]].role.team === "traveler";
    state.voteHistory.push({
      timestamp: new Date(),
      nominator: players[state.nomination[0]].name,
      nominee: players[state.nomination[1]].name,
      type: isExile ? "Exile" : "Execution",
      majority: Math.ceil(
        players.filter(player => !player.isDead || isExile).length / 2
      ),
      votes: players
        .filter((player, index) => state.votes[index])
        .map(({ name }) => name)
    });
  },
  clearVoteHistory(state) {
    state.voteHistory = [];
  },
  /**
   * Store a vote with and without syncing it to the live session.
   * This is necessary in order to prevent infinite voting loops.
   * @param state
   * @param vote
   */
  vote: handleVote,
  voteSync: handleVote,
  lockVote(state, lock) {
    state.lockedVote = lock !== undefined ? lock : state.lockedVote + 1;
  },
  inviteChat(){},
  sendGrim (state, grim){
    state.receivedGrim = grim;
  },
  sendCard(state, message){
    if(!message[2]) return;
    state.recivedMessage = message[1];
  },
  clearRecievedMessage(state) {
    state.recivedMessage = null;
  },
  StorytellerCode(state, Code){
    state.StorytellerCode = Code;
  },
  StorytellerCodeGrim(){},
  SetSpectator(state, param){
    state.isSpectator = param[1];
  },
  setHandRaised(){},
  wraithPeek(state, person){
    if (!state.wraithPeek.includes(person) && state.isSpectator) {
      state.wraithPeek.push(person);
    }  
  },
  wraithLook(){},
  setBotId(state, payload) {
    state.botId = payload.botId;

    // Determine ST Discord IDs
    const stDiscordIds = Array.isArray(payload.members)
      ? payload.members.filter(m => m[2]).map(m => m[1])
      : [];
    state.discordST = stDiscordIds || [];
    console.log(payload)
    // Put all members into chat number 21
    if (Array.isArray(payload.members)) {
      payload.members.forEach(member => {
        const discordID = member[1]; // second item is DiscordID
        const existing = state.discordChats.find(c => c.discordID === discordID);
        if (existing) {
          existing.chatNumber = 21;
        } else {
          state.discordChats.push({
            discordID,
            chatNumber: 21
          });
        }
      });
    }
    console.log(state.discordST)
    console.log(state.discordChats)

  },

  MoveToChat(){},
  ConfirmMoveChat(state, [chatNumber, discordID]) {
    const existing = state.discordChats.find(c => c.discordID === discordID);
    if (existing) {
      existing.chatNumber = chatNumber;
    } else {
      state.discordChats.push({
        discordID,
        chatNumber
      });
    }
  },
  setLockRoom(state, [roomNumber, value]) {
    state.lockedRooms[roomNumber] = value;
  },


};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
