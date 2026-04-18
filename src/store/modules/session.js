import { getPlayerVoteWeight } from "../../services/vote-weight";

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
  isStoryteller: false,
  coStorytellers: [],
  hiddenVote: false,
  wraithPeek: [],
  isLilMonstaVote: false,
  botId: null,
  hostDiscordId: "",
  hostDiscordName: "",
  discordChats: [],
  discordST: null,
  availableDiscordSTs: [],
  coStDiscordLinks: {},
  coStInviteCodes: {},
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

const autoLinkCoStorytellers = state => {
  const available = (state.availableDiscordSTs || []).map(st => st.discordId);
  if (!available.length) return;

  const links = { ...(state.coStDiscordLinks || {}) };
  const used = new Set(Object.values(links));

  state.coStorytellers.forEach(webId => {
    if (links[webId]) return;
    const nextDiscordId = available.find(id => !used.has(id));
    if (nextDiscordId) {
      links[webId] = nextDiscordId;
      used.add(nextDiscordId);
    }
  });

  state.coStDiscordLinks = links;
};

const ensureInviteCodes = state => {
  const next = {};
  const old = state.coStInviteCodes || {};
  (state.availableDiscordSTs || []).forEach(st => {
    if (!st?.discordId) return;
    next[st.discordId] =
      old[st.discordId] || String(Math.floor(100000 + Math.random() * 900000));
  });
  state.coStInviteCodes = next;
};

const generateLegacyCoStCode = () =>
  String(Math.floor(1000 + Math.random() * 9000));

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
  timerSync: set("timer"),
  timerPause: set("timerPause"),
  timerPauseSync: set("timerPause"),
  winningTeam: set("winningTeam"),
  setHiddenVote: set("hiddenVote"),
  setStoryteller: set("isStoryteller"),
  setCoStorytellers(state, ids = []) {
    state.coStorytellers = Array.isArray(ids) ? [...new Set(ids)] : [];
    const alive = new Set(state.coStorytellers);
    const nextLinks = {};
    Object.entries(state.coStDiscordLinks || {}).forEach(([webId, discordId]) => {
      if (alive.has(webId)) nextLinks[webId] = discordId;
    });
    state.coStDiscordLinks = nextLinks;
    autoLinkCoStorytellers(state);
  },
  addCoStoryteller(state, id) {
    if (!id || state.coStorytellers.includes(id)) return;
    state.coStorytellers.push(id);
    autoLinkCoStorytellers(state);
  },
  removeCoStoryteller(state, id) {
    const linkedDiscordId = state.coStDiscordLinks?.[id] || "";
    state.coStorytellers = state.coStorytellers.filter(x => x !== id);
    if (state.coStDiscordLinks && state.coStDiscordLinks[id]) {
      const links = { ...state.coStDiscordLinks };
      delete links[id];
      state.coStDiscordLinks = links;
    }

    if (linkedDiscordId) {
      const exists = (state.availableDiscordSTs || []).some(
        st => st.discordId === linkedDiscordId
      );
      if (exists) {
        state.coStInviteCodes = {
          ...(state.coStInviteCodes || {}),
          [linkedDiscordId]: String(Math.floor(100000 + Math.random() * 900000))
        };
      }
    } else {
      state.StorytellerCode = generateLegacyCoStCode();
    }
  },
  linkCoStorytellerDiscord(state, { webPlayerId, discordId }) {
    if (!webPlayerId || !discordId) return;
    const links = { ...(state.coStDiscordLinks || {}) };

    // Keep one-to-one mapping between web co-ST and Discord ST identities.
    Object.keys(links).forEach(key => {
      if (links[key] === discordId && key !== webPlayerId) {
        delete links[key];
      }
    });

    links[webPlayerId] = discordId;
    state.coStDiscordLinks = links;
  },
  unlinkCoStorytellerDiscord(state, webPlayerId) {
    if (!webPlayerId || !state.coStDiscordLinks?.[webPlayerId]) return;
    const links = { ...state.coStDiscordLinks };
    delete links[webPlayerId];
    state.coStDiscordLinks = links;
  },
  setLilMonstaVote: set("isLilMonstaVote"),
  setDiscordChats: set("discordChats"),
  setLockRooms: set("lockedRooms"),
  setSessionId(state, sessionId) {
    state.sessionId = sessionId
      .toLocaleLowerCase()
      .replace(/[^0-9a-z]/g, "")
      .substr(0, 10);
    if (!state.sessionId) {
      state.isStoryteller = false;
      state.coStorytellers = [];
      state.hostDiscordId = "";
      state.hostDiscordName = "";
      state.availableDiscordSTs = [];
      state.coStDiscordLinks = {};
      state.coStInviteCodes = {};
    }
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
    if (!state.isVoteHistoryAllowed && state.isSpectator && !state.isStoryteller)
      return;
    if (!state.nomination || state.lockedVote <= players.length) return;
    const isExile = players[state.nomination[1]].role.team === "traveler";
    const yesVoters = players
      .map((player, index) => ({ player, index }))
      .filter(({ index }) => state.votes[index]);

    state.voteHistory.push({
      timestamp: new Date(),
      nominator: players[state.nomination[0]].name,
      nominee: players[state.nomination[1]].name,
      type: isExile ? "Exile" : "Execution",
      majority: Math.ceil(
        players.filter(player => !player.isDead || isExile).length / 2
      ),
      votes: yesVoters.map(({ player }) => player.name),
      weightedVotes: yesVoters.reduce(
        (sum, { player }) => sum + getPlayerVoteWeight(player),
        0
      )
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
    if (!state.isSpectator) {
      state.isStoryteller = false;
    }
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
    if (!state.botId) {
      state.hostDiscordId = "";
      state.hostDiscordName = "";
      state.availableDiscordSTs = [];
      state.coStDiscordLinks = {};
      state.coStInviteCodes = {};
    } else {
      state.hostDiscordId = payload.hostDiscordId || state.hostDiscordId || "";
      state.hostDiscordName = payload.hostDiscordName || state.hostDiscordName || "";
    }

    // Determine ST Discord IDs
    const stDiscordIds = Array.isArray(payload.members)
      ? payload.members.filter(m => m[2]).map(m => m[1])
      : [];
    state.discordST = stDiscordIds || [];
    state.availableDiscordSTs = (Array.isArray(payload.members)
      ? payload.members
          .filter(m => m[2] && m[1] !== state.hostDiscordId)
          .map(m => ({ displayName: m[0], discordId: m[1] }))
      : []);
    if (!state.isSpectator) {
      ensureInviteCodes(state);
    }
    autoLinkCoStorytellers(state);
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

  },

  MoveToChat(){},
  setCoStDiscordLinks(state, links = {}) {
    state.coStDiscordLinks = { ...(links || {}) };
    autoLinkCoStorytellers(state);
  },
  setAvailableDiscordSTs(state, list = []) {
    state.availableDiscordSTs = Array.isArray(list) ? list : [];
    if (!state.isSpectator) {
      ensureInviteCodes(state);
    }
    autoLinkCoStorytellers(state);
  },
  regenerateCoStInviteCode(state, discordId) {
    if (!discordId) return;
    const exists = (state.availableDiscordSTs || []).some(
      st => st.discordId === discordId
    );
    if (!exists) return;
    state.coStInviteCodes = {
      ...(state.coStInviteCodes || {}),
      [discordId]: String(Math.floor(100000 + Math.random() * 900000))
    };
  },
  setHostDiscordId(state, discordId = "") {
    state.hostDiscordId = discordId || "";
  },
  setHostDiscordName(state, name = "") {
    state.hostDiscordName = name || "";
  },
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
