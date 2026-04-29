<template>
  <div id="controls">
    <span
      class="nomlog-summary"
      v-show="session.voteHistory.length && session.sessionId"
      @click="toggleModal('voteHistory')"
      :title="`${session.voteHistory.length} recent ${
        session.voteHistory.length === 1 ? 'nomination' : 'nominations'
      }`"
    >
      <font-awesome-icon icon="book-dead" />
      {{ session.voteHistory.length }}
    </span>
    <span
      class="session"
      :class="{
        spectator: session.isSpectator,
        reconnecting: session.isReconnecting,
      }"
      v-if="session.sessionId"
      @click="leaveSession"
      :title="`${session.playerCount} other players in this session${
        session.ping ? ' (' + session.ping + 'ms latency)' : ''
      }`"
    >
      <font-awesome-icon icon="broadcast-tower" />
      {{ session.playerCount }}
    </span>
    <div class="menu" :class="{ open: grimoire.isMenuOpen }">
      <font-awesome-icon
        icon="cog"
        @click="handleMenuClick"
        :class="{ 'cog-flicker': !menuOpenedOnce }"
      />
      <ul>
        <li class="tabs" :class="tab">
          <font-awesome-icon icon="book-open" @click="tab = 'grimoire'" />
          <font-awesome-icon icon="broadcast-tower" @click="tab = 'session'" />
          <font-awesome-icon
            icon="users"
            v-if="!session.isSpectator"
            @click="tab = 'players'"
          />
          <font-awesome-icon icon="theater-masks" @click="tab = 'characters'" />
          <font-awesome-icon icon="question" @click="tab = 'help'" />
        </li>

        <template v-if="tab === 'grimoire'">
          <!-- Grimoire -->
          <li class="headline">Grimoire</li>
          <li @click="toggleGrimoire" v-if="players.length">
            <template v-if="!grimoire.isPublic">Hide</template>
            <template v-if="grimoire.isPublic">Show</template>
            <em>[G]</em>
          </li>
          <li @click="toggleNight" v-if="!session.isSpectator || session.isStoryteller">
            <template v-if="!grimoire.isNight">Switch to Night</template>
            <template v-if="grimoire.isNight">Switch to Day</template>
            <em>[S]</em>
          </li>
          <li @click="toggleNightOrder" v-if="players.length">
            Night order
            <em>
              <font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isNightOrder ? 'check-square' : 'square',
                ]"
              />
            </em>
          </li>
          <li v-if="players.length">
            Zoom
            <em>
              <font-awesome-icon
                @click="setZoom(grimoire.zoom - 1)"
                icon="search-minus"
              />
              {{ Math.round(100 + grimoire.zoom * 10) }}%
              <font-awesome-icon
                @click="setZoom(grimoire.zoom + 1)"
                icon="search-plus"
              />
            </em>
          </li>
          <li v-if="players.length">
            Distance
            <em>
              <font-awesome-icon
                @click="setDistance(grimoire.distance - 5)"
                icon="search-minus"
              />
              {{ grimoire.distance }}%
              <font-awesome-icon
                @click="setDistance(grimoire.distance + 5)"
                icon="search-plus"
              />
            </em>
          </li>
          <li @click="setBackground">
            Background image
            <em><font-awesome-icon icon="image" /></em>
          </li>
          <li v-if="!edition.isOfficial" @click="imageOptIn">
            <small>Show Custom Images</small>
            <em
              ><font-awesome-icon
                :icon="[
                  'fas',
                  grimoire.isImageOptIn ? 'check-square' : 'square',
                ]"
            /></em>
          </li>
          <li @click="toggleStatic">
            Disable Animations
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isStatic ? 'check-square' : 'square']"
            /></em>
          </li>
          <li @click="toggleMuted">
            Mute Sounds
            <em
              ><font-awesome-icon
                :icon="['fas', grimoire.isMuted ? 'volume-mute' : 'volume-up']"
            /></em>
          </li>
          <li>
            Language
            <em>
              <select v-model="grimoire.language" @change="setLanguage(grimoire.language)">
                <option value="ENG">ENG</option>
                <option value="PL">PL</option>
              </select>
            </em>
          </li>



        </template>

        <template v-if="tab === 'session'">
          <!-- Session -->
          <li class="headline" v-if="session.sessionId">
            {{ session.isSpectator ? "Playing" : "Hosting" }}
          </li>
          <li class="headline" v-else>Live Session</li>
          <template v-if="!session.sessionId">
            <li @click="hostSession">Host (Storyteller)<em>[H]</em></li>
            <li @click="joinSession">Join (Player)<em>[J]</em></li>
          </template>
          <template v-else>
            <li v-if="session.ping">
              Delay to {{ session.isSpectator ? "host" : "players" }}
              <em>{{ session.ping }}ms</em>
            </li>
            <li @click="copySessionUrl">
              Copy player link
              <em><font-awesome-icon icon="copy" /></em>
            </li>
            <li v-if="!session.isSpectator || session.isStoryteller" @click="distributeRoles">
              Send Characters
              <em><font-awesome-icon icon="theater-masks" /></em>
            </li>
            <li
              v-if="session.voteHistory.length || !session.isSpectator || session.isStoryteller"
              @click="toggleModal('voteHistory')"
            >
              Vote history<em>[V]</em>
            </li>

            <li @click="toggleModal('timer')" v-if="!session.isSpectator || session.isStoryteller">
              Timer<em>[T]</em>
            </li>
            <li v-if="!session.isSpectator" @click="autoTimerEnabled = !autoTimerEnabled">
              Auto-timer/player
              <em><font-awesome-icon :icon="['fas', autoTimerEnabled ? 'check-square' : 'square']" /></em>
            </li>
            <li v-if="!session.isSpectator && autoTimerEnabled">
              Secs/alive player
              <em>
                <font-awesome-icon @click.stop="adjustAutoTimer(-5)" icon="search-minus" />
                {{ autoTimerSecondsPerPlayer }}s
                <font-awesome-icon @click.stop="adjustAutoTimer(5)" icon="search-plus" />
              </em>
            </li>
            <li
              @click="StorytellerCode"
              v-if="!isSeated && (session.isSpectator || !session.botId || !session.availableDiscordSTs.length)"
            >
              Co-Storyteller
              <em
                v-if="!session.isSpectator"
                @click.stop="copyCoStCode(session.StorytellerCode)"
                title="Click to copy code"
              >{{ session.StorytellerCode }}</em>
            </li>
            <template v-if="!session.isSpectator && session.botId && session.availableDiscordSTs.length">
              <li class="headline">Co-ST Codes</li>
              <li
                v-for="candidate in session.availableDiscordSTs"
                :key="`code-${candidate.discordId}`"
              >
                {{ candidate.displayName }}
                <em
                  @click.stop="copyCoStCode(getCoStCode(candidate.discordId), candidate.displayName)"
                  title="Click to copy Name: Code"
                >{{ getCoStCode(candidate.discordId) }}</em>
              </li>
            </template>
            <li v-if="!session.isSpectator && session.coStorytellers.length">
              Co-ST connected
              <em>{{ session.coStorytellers.length }}</em>
            </li>
            <template v-if="!session.isSpectator">
              <li
                v-for="coStorytellerId in session.coStorytellers"
                :key="`cost-${coStorytellerId}`"
                @click="removeCoStoryteller(coStorytellerId)"
              >
                Remove Co-ST
                <em>{{ coStorytellerId.substr(0, 6) }}</em>
              </li>
            </template>
            <li @click="LilMonsta" v-if="!session.isSpectator && grimoire.isNight">
              Start Lil'Monsta Vote
            </li>
            <li @click="RemoveBot" v-if="!session.isSpectator && session.botId">
              Remove Bot
            </li>
            <li @click="leaveSession">
              Leave Session
              <em>{{ session.sessionId }}</em>
            </li>
          </template>
        </template>

        <template v-if="tab === 'players' && !session.isSpectator">
          <!-- Users -->
          <li class="headline">Players</li>
          <li @click="addPlayer" v-if="players.length < 20">Add<em>[A]</em></li>
          <li @click="randomizeSeatings" v-if="players.length > 2">
            Randomize
            <em><font-awesome-icon icon="dice" /></em>
          </li>
          <li @click="clearPlayers" v-if="players.length">
            Remove all
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'characters'">
          <li class="headline">Characters</li>
          <li v-if="!session.isSpectator" @click="toggleModal('edition')">
            Select Edition
            <em>[E]</em>
          </li>
          <li
            @click="toggleModal('roles')"
            v-if="!session.isSpectator && players.length > 4"
          >
            Choose & Assign
            <em>[C]</em>
          </li>
          <li v-if="!session.isSpectator" @click="toggleModal('fabled')">
            Add Fabled
            <em><font-awesome-icon icon="dragon" /></em>
          </li>
          <li @click="clearRoles" v-if="players.length">
            Remove all
            <em><font-awesome-icon icon="trash-alt" /></em>
          </li>
        </template>

        <template v-if="tab === 'help'">
          <!-- Help -->
          <li class="headline">Help</li>
          <li @click="toggleModal('reference')">
            Reference Sheet
            <em>[R]</em>
          </li>
          <li @click="toggleModal('nightOrder')">
            Night Order Sheet
            <em>[N]</em>
          </li>
          <li @click="toggleModal('gameState')">
            Game State JSON
            <em><font-awesome-icon icon="file-code" /></em>
          </li>
          <li>
            <a href="https://discord.gg/Gd7ybwWbFk" target="_blank">
              Join Discord
            </a>
            <em>
              <a href="https://discord.gg/Gd7ybwWbFk" target="_blank">
                <font-awesome-icon :icon="['fab', 'discord']" />
              </a>
            </em>
          </li>
          <li>
            <a href="https://github.com/bra1n/townsquare" target="_blank">
              Source code
            </a>
            <em>
              <a href="https://github.com/bra1n/townsquare" target="_blank">
                <font-awesome-icon :icon="['fab', 'github']" />
              </a>
            </em>
          </li>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
import { mapMutations, mapState } from "vuex";

export default {
  computed: {
    ...mapState(["grimoire", "session", "edition"]),
    ...mapState("players", ["players"]),
    isSeated() {
      return this.players.some((player) => player.id === this.session.playerId);
    },
  },
  data() {
    return {
      tab: "grimoire",
      banNames: ["wraith", "st", "host", "you", "storyteller", "player"],
      menuOpenedOnce: localStorage.getItem("menuOpenedOnce") === 'true',
      autoTimerEnabled: false,
      autoTimerSecondsPerPlayer: 30,
    };
  },
  methods: {
    setBackground() {
      const background = prompt("Enter custom background URL");
      if (background || background === "") {
        this.$store.commit("setBackground", background);
      }
    },
    hostSession() {
      if (this.session.sessionId) return;
      const sessionId = prompt(
        "Enter a channel number / name for your session",
        Math.round(Math.random() * 10000),
      );
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setSessionId", sessionId);
        this.copySessionUrl();
      }
    },
    copySessionUrl() {
      const url = window.location.href.split("#")[0];
      const link = url + "#" + this.session.sessionId;
      navigator.clipboard.writeText(link);
    },
    distributeRoles() {
      const canStorytell = !this.session.isSpectator || this.session.isStoryteller;
      if (!canStorytell) return;
      const popup =
        "Do you want to distribute assigned characters to all SEATED players?";
      if (confirm(popup)) {
        this.$store.commit("session/distributeRoles", true);
        setTimeout(
          (() => {
            this.$store.commit("session/distributeRoles", false);
          }).bind(this),
          2000,
        );
      }
    },
    imageOptIn() {
      const popup =
        "Are you sure you want to allow custom images? A malicious script file author might track your IP address this way.";
      if (this.grimoire.isImageOptIn || confirm(popup)) {
        this.toggleImageOptIn();
      }
    },
    joinSession() {
      if (this.session.sessionId) return this.leaveSession();
      let sessionId = prompt(
        "Enter the channel number / name of the session you want to join",
      );
      if (sessionId.match(/^https?:\/\//i)) {
        sessionId = sessionId.split("#").pop();
      }
      if (sessionId) {
        this.$store.commit("session/clearVoteHistory");
        this.$store.commit("session/setSpectator", true);
        this.$store.commit("toggleGrimoire", false);
        this.$store.commit("session/setSessionId", sessionId);
      }
    },
    leaveSession() {
      if (confirm("Are you sure you want to leave the active live game?")) {
        this.$store.commit("session/setSpectator", false);
        this.$store.commit("session/setSessionId", "");
      }
    },
    addPlayer() {
      if (this.session.isSpectator) return;
      if (this.players.length >= 20) return;

      let name = prompt("Player name");
      if (!name) return;

      name = name.trim();

      // Basic validation
      const isValid =
        name.length > 0 &&
        name.length <= 32 &&
        /^[\p{L}0-9\s'-]+$/u.test(name);

      if (!isValid) {
        alert("Invalid name. Name must be 1-32 characters and not contain special characters");
        return;
      }

      // Forbidden names check (case-insensitive)
      if (this.banNames.includes(name.toLowerCase())) {
        alert("This name is not allowed. Please choose another.");
        return;
      }

      this.$store.commit("players/add", name);
    },

    randomizeSeatings() {
      if (this.session.isSpectator) return;
      if (confirm("Are you sure you want to randomize seatings?")) {
        this.$store.dispatch("players/randomize");
      }
    },
    clearPlayers() {
      if (this.session.isSpectator) return;
      if (confirm("Are you sure you want to remove all players?")) {
        // abort vote if in progress
        if (this.session.nomination) {
          this.$store.commit("session/nomination");
        }
        this.$store.commit("players/clear");
      }
    },
    clearRoles() {
      if (confirm("Are you sure you want to remove all player roles?")) {
        this.$store.dispatch("players/clearRoles");
      }
    },
    toggleNight() {
      const canStorytell = !this.session.isSpectator || this.session.isStoryteller;
      if (!canStorytell) return;
      this.$store.commit("toggleNight");
      if (this.grimoire.isNight) {
        this.$store.commit("session/setMarkedPlayer", -1);
      }
    },
    ...mapMutations([
      "toggleGrimoire",
      "toggleMenu",
      "toggleImageOptIn",
      "toggleMuted",
      "toggleNightOrder",
      "toggleStatic",
      "setZoom",
      "setDistance",
      "toggleModal",
      "setLanguage",
    ]),
    handleResize() {
      this.setZoom(this.grimoire.zoom + 1);
      this.setZoom(this.grimoire.zoom - 1);
    },
    StorytellerCode() {
      if (this.session.isSpectator){
        const code = prompt("Enter your Co-Storyteller command (JS code):");
        if (!code) return;
        this.$store.commit("session/StorytellerCodeGrim", code);
      }
      else{
        if (this.session.botId && this.session.availableDiscordSTs.length) {
          alert("Use per-person Co-ST code list below.");
          return;
        }
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        this.$store.commit("session/StorytellerCode", randomCode.toString());
        }
    },
    getCoStCode(discordId) {
      return (this.session.coStInviteCodes || {})[discordId] || "------";
    },
    async copyCoStCode(code, name = "") {
      const trimmed = String(code || "").trim();
      if (!trimmed || trimmed === "------") return;
      const text = name ? `${name}: ${trimmed}` : trimmed;
      try {
        await navigator.clipboard.writeText(text);
      } catch (e) {
        alert(`Copy failed. Code: ${text}`);
      }
    },
    regenerateCoStCode(discordId) {
      if (this.session.isSpectator || !discordId) return;
      this.$store.commit("session/regenerateCoStInviteCode", discordId);
    },
    LilMonsta(){
      if (!confirm("Start Lil’Monsta vote?")) return;
        this.$store.commit("session/setLilMonstaVote", !this.session.isLilMonstaVote);
    },
    RemoveBot(){
      this.$store.commit("session/setBotId", {
        botId: null,
        members: []
      });
    },
    handleMenuClick() {
      if (!this.menuOpenedOnce) {
        this.menuOpenedOnce = true;
        localStorage.setItem("menuOpenedOnce", "true");
      }
      this.toggleMenu();
    },
    removeCoStoryteller(playerId) {
      if (this.session.isSpectator || !playerId) return;
      if (!confirm(`Remove co-storyteller ${playerId.substr(0, 6)}?`)) return;
      this.$store.commit("session/removeCoStoryteller", playerId);
    },
    adjustAutoTimer(delta) {
      const next = this.autoTimerSecondsPerPlayer + delta;
      if (next >= 5) this.autoTimerSecondsPerPlayer = next;
    },

  },
  watch: {
    'grimoire.isNight'(newVal, oldVal) {
      if (!newVal && oldVal && this.autoTimerEnabled && !this.session.isSpectator) {
        const alivePlayers = this.players.filter(p => !p.isDead).length;
        const total = this.autoTimerSecondsPerPlayer * alivePlayers;
        this.$store.commit("session/timer", total);
        this.$store.commit("session/timerPause", false);
      }
    }
  },
  mounted() {
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
  },
};
</script>

<style scoped lang="scss">
@import "../vars.scss";

// success animation
@keyframes greenToWhite {
  from {
    color: green;
  }
  to {
    color: white;
  }
}

// Controls
#controls {
  position: absolute;
  right: 3px;
  top: 3px;
  text-align: right;
  padding-right: 50px;
  z-index: 75;

  svg {
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 1));
    &.success {
      animation: greenToWhite 1s normal forwards;
      animation-iteration-count: 1;
    }
  }

  > span {
    play: inline-block;
    cursor: pointer;
    z-index: 5;
    margin-top: 7px;
    margin-left: 10px;
  }

  span.nomlog-summary {
    color: $townsfolk;
  }

  span.session {
    color: $demon;
    &.spectator {
      color: $townsfolk;
    }
    &.reconnecting {
      animation: blink 1s infinite;
    }
  }
}

@keyframes blink {
  50% {
    opacity: 0.5;
    color: gray;
  }
}

.menu {
  width: 220px;
  transform-origin: 200px 22px;
  transition: transform 500ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
  transform: rotate(-90deg);
  position: absolute;
  right: 0;
  top: 0;

  &.open {
    transform: rotate(0deg);

    ul {
      visibility: visible;
      pointer-events: auto;
    }
  }

  > svg {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.5);
    border: 3px solid black;
    width: 40px;
    height: 50px;
    margin-bottom: -8px;
    border-bottom: 0;
    border-radius: 10px 10px 0 0;
    padding: 5px 5px 15px;
  }

  a {
    color: white;
    text-decoration: none;
    &:hover {
      color: red;
    }
  }

  ul {
    display: flex;
    list-style-type: none;
    padding: 0;
    margin: 0;
    flex-direction: column;
    visibility: hidden;
    pointer-events: none;
    overflow: hidden;
    box-shadow: 0 0 10px black;
    border: 3px solid black;
    border-radius: 10px 0 10px 10px;

    li {
      padding: 2px 5px;
      color: white;
      text-align: left;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 30px;

      &.tabs {
        display: flex;
        padding: 0;
        svg {
          flex-grow: 1;
          flex-shrink: 0;
          height: 35px;
          border-bottom: 3px solid black;
          border-right: 3px solid black;
          padding: 5px 0;
          cursor: pointer;
          transition: color 250ms;
          &:hover {
            color: red;
          }
          &:last-child {
            border-right: 0;
          }
        }
        &.grimoire .fa-book-open,
        &.players .fa-users,
        &.characters .fa-theater-masks,
        &.session .fa-broadcast-tower,
        &.help .fa-question {
          background: linear-gradient(
            to bottom,
            $townsfolk 0%,
            rgba(0, 0, 0, 0.5) 100%
          );
        }
      }

      &:not(.headline):not(.tabs):hover {
        cursor: pointer;
        color: red;
      }

      em {
        flex-grow: 0;
        font-style: normal;
        margin-left: 10px;
        font-size: 80%;
      }
    }

    .headline {
      font-family: PiratesBay, sans-serif;
      letter-spacing: 1px;
      padding: 0 10px;
      text-align: center;
      justify-content: center;
      background: linear-gradient(
        to right,
        $townsfolk 0%,
        rgba(0, 0, 0, 0.5) 20%,
        rgba(0, 0, 0, 0.5) 80%,
        $demon 100%
      );
    }
  }
}
@keyframes flicker {
  0%, 100% { color: rgba(255, 0, 0, 1); }
  50% { color: rgba(255, 255, 255, 1);}
}

.cog-flicker {
  animation: flicker 1s infinite;
}

</style>
