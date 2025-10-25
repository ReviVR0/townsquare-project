<template>
  <li :style="zoom">
    <div
      ref="player"
      class="player"
      :class="[
        {
          dead: player.isDead,
          marked: session.markedPlayer === index,
          'no-vote': player.isVoteless,
          you: session.sessionId && player.id && player.id === session.playerId,
          'vote-yes': session.votes[index] && (
            !session.hiddenVote || player.id === session.playerId || !session.isSpectator
          ),
          'vote-lock': voteLocked
        },
        player.role.team
      ]"

    >
      <div
        class="shroud"
        :style="{ '--before-bg-image': getShroudImage(player) }"
        @click="toggleStatus()"
      ></div>


      
      
      <div class="life" @click="toggleStatus()"></div>

      <div
        class="night-order first"
        v-if="nightOrder.get(player).first && grimoire.isNightOrder"
      >
        <em>{{ nightOrder.get(player).first }}.</em>
        <span v-if="player.role.firstNightReminder">{{
          player.role.firstNightReminder
        }}</span>
      </div>
      <div
        class="night-order other"
        v-if="nightOrder.get(player).other && grimoire.isNightOrder"
      >
        <em>{{ nightOrder.get(player).other }}.</em>
        <span v-if="player.role.otherNightReminder">{{
          player.role.otherNightReminder
        }}</span>
      </div>

      <Token
        :role="player.role"
        @set-role="$emit('trigger', ['openRoleModal'])"
      />

      <!-- Overlay icons -->
      <div class="overlay">
        <font-awesome-icon
          icon="hand-paper"
          class="vote"
          title="Hand UP"
          @click="vote()"
        />
        <font-awesome-icon
          v-if="player.handRaised"
          :icon="player.handRaised === 'rock' ? 'hand-rock' :
                player.handRaised === 'paper' ? 'hand-paper' :
                'cut'"
          class="vote hand-up"
          :title="`Hand UP (${player.handRaised})`"
        />
        <!-- TO DO :style="{ transform: `rotate(${-pointingAngle(12, 6, 0) + 180}deg) scale(1) !important` }" -->

        <font-awesome-icon
          icon="times"
          class="vote"
          title="Hand DOWN"
          @click="vote()"
        />
        <font-awesome-icon
          icon="times-circle"
          class="cancel"
          title="Cancel"
          @click="cancel()"
        />
        <font-awesome-icon
          icon="exchange-alt"
          class="swap"
          @click="swapPlayer(player)"
          title="Swap seats with this player"
        />
        <font-awesome-icon
          icon="redo-alt"
          class="move"
          @click="movePlayer(player)"
          title="Move player to this sea`t"
        />
        <font-awesome-icon
          icon="hand-point-right"
          class="nominate"
          @click="nominatePlayer(player)"
          title="Nominate this player"
        />
        <font-awesome-icon
          v-if="showHandUp && (!session.hiddenVote || player.id === session.playerId || !session.isSpectator)"
          icon="hand-paper"
          class="vote hand-up"
          title="Hand UP (auto)"
        />


      </div>
      <!-- Claimed seat icon -->
      <font-awesome-icon
        icon="chair"
        v-if="player.id && session.sessionId"
        class="seat"
        :class="{ highlight: session.isRolesDistributed }"
      />
        <font-awesome-icon
        icon="chair"
        v-if="player.id && session.sessionId"
        class="seat"
        :class="{ highlight: session.isRolesDistributed }"
      />

      <!-- Ghost vote icon -->
      <font-awesome-icon
        icon="vote-yea"
        class="has-vote"
        v-show="canShowGhost(player)"
        @click="updatePlayer('isVoteless', true)"
        title="Ghost vote"
      />


      <!-- On block icon -->
      <div class="marked">
        <font-awesome-icon icon="skull" />
      </div>
      <div
        class="name"
        @click="isMenuOpen = !isMenuOpen"
        :class="{ active: isMenuOpen || (messageCount > 0 && grimoire.isNight) || session.wraithPeek.includes(player.id)}"
      >
        <span>{{ player.name }}<span v-if="messageCount > 0 && !session.isSpectator && grimoire.isNight">({{ messageCount }})</span></span>
        <font-awesome-icon icon="venus-mars" v-if="player.pronouns" />
        <font-awesome-icon icon="eye" v-if="session.wraithPeek.includes(player.id)"/>
        <div class="pronouns" v-if="player.pronouns">
          <span>{{ player.pronouns }}</span>
        </div>

        <div
            @click="claimSeat"
            v-if="session.isSpectator && !player.id ">
          <font-awesome-icon icon="chair" :class="{ disabled: player.id }"
          />
        </div>
      </div>

      <transition name="fold">
        <ul class="menu" v-if="isMenuOpen">
          <li
            @click="SendGrim"
            v-if="player.id && !session.isSpectator"
            >
              <font-awesome-icon icon="theater-masks" />
              Send Grimoire
          </li>
          <li
            @click="changePronouns"
            v-if="
              !session.isSpectator ||
                (session.isSpectator && player.id === session.playerId)
            "
          >
            <font-awesome-icon icon="venus-mars" />Change Pronouns
          </li>
          <template v-if="!session.isSpectator">
            <li @click="changeName">
              <font-awesome-icon icon="user-edit" />Rename
            </li>
            <li @click="movePlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="redo-alt" />
              Move player
            </li>
            <li @click="swapPlayer()" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="exchange-alt" />
              Swap seats
            </li>
            <li @click="removePlayer" :class="{ disabled: session.lockedVote }">
              <font-awesome-icon icon="times-circle" />
              Remove
            </li>
            <li
              @click="updatePlayer('id', '', true)"
              v-if="player.id && session.sessionId"
            >
              <font-awesome-icon icon="chair" />
              Empty seat
            </li>
            <template v-if="!session.nomination">
              <li @click="nominatePlayer()">
                <font-awesome-icon icon="hand-point-right" />
                Nomination
              </li>
            </template>
            <li
              @click="SendCard"
              v-if="player.id"
            >
                <font-awesome-icon icon="people-arrows" />
                Send Card
            </li>
          </template>
          <li
            @click="claimSeat"
            v-if="session.isSpectator"
            :class="{ disabled: player.id && player.id !== session.playerId }"
          >
            <font-awesome-icon icon="chair" />
            <template v-if="!player.id">
              Claim seat
            </template>

            <template v-else-if="player.id === session.playerId">
              Vacate seat
            </template>
            <template v-else> Seat occupied</template>
          </li>
          <li @click="cycleMove" v-if="player.id === session.playerId">
            <font-awesome-icon :icon="getMoveIcon(move)" />
            {{ move.charAt(0).toUpperCase() + move.slice(1) }}
          </li>
          <li
            @click="WraithLook"
            v-if="player.id && grimoire.isNight && session.wraithPeek.length > 0"
          >
              <font-awesome-icon icon="eye" />
              Look
          </li>
        </ul>
      </transition>
    </div>

    <template v-if="player.reminders">
      <div
        class="reminder"
        :key="reminder.role + ' ' + reminder.name"
        v-for="(reminder, index) in player.reminders"
        :class="[reminder.role]"
        @click="removeReminder(reminder)"

        @mouseenter="hoveredReminderGroup = 1"
        @mouseleave="hoveredReminderGroup = null"
        :style="{ marginTop: 
        hoveredReminderGroup==1?'0px':(player.reminders.length > 2 ?
        ((index==0)?0:(player.reminders.length<5?player.reminders.length * -10:-40)) + 'px' : '0px' )
        }"
      >
        <span
          class="icon"
          :style="{
            backgroundImage: `url(${
              reminder.image && grimoire.isImageOptIn
                ? reminder.image
                : require('../assets/icons/Reminder/' +
                    (reminder.imageAlt || reminder.role) +
                    '.png')
            })`
          }"
        ></span>
        <span class="text">{{ reminder.name }}</span>
      </div>
    </template>
    <div class="reminder add" @click="$emit('trigger', ['openReminderModal'])">
      <span class="icon"
        @mouseenter="hoveredReminderGroup = 1"
        @mouseleave="hoveredReminderGroup = null"
      ></span>
        <div class="reminderHoverZone"></div>
    </div>
    <div class="reminderHoverTarget"
        @mouseenter="hoveredReminderGroup = 1"
        @mouseleave="hoveredReminderGroup = null"
        :style="{height: player.reminders.length>=2?(player.reminders.length*75+5)+'px':'0px',
          zindex: hoveredReminderGroup==1?-2:-1,
          marginTop: player.reminders.length<2?'-25%-33px':(player.reminders.length*-50 - 25) +'%'
        }"
    ></div>
  </li>
</template>

<script>
import Token from "./Token";

import { mapGetters, mapState } from "vuex";
import { EventBus } from "../event-bus.js";

export default {
  components: {
    Token,
  },
  props: {
    player: {
      type: Object,
      required: true
    }
  },
  computed: {
      ...mapState({
    bluffs: state => state.players.bluffs,
    edition: state => state.edition,
    roles: state => state.roles,
    fabled: state => state.players.fabled,
    playerList: state => state.players.players
    }),

    ...mapState("players", ["players"]),
    ...mapState(["grimoire", "session"]),
    ...mapGetters({ nightOrder: "players/nightOrder" }),
    index: function() {
      return this.players.indexOf(this.player);
    },
    voteLocked: function() {
      const session = this.session;
      const players = this.players.length;
      if (!session.nomination) return false;
      const indexAdjusted =
        (this.index - 1 + players - session.nomination[1]) % players;
      return indexAdjusted < session.lockedVote - 1;
    },
    zoom: function() {
      const unit = window.innerWidth > window.innerHeight ? "vh" : "vw";
      if (this.players.length < 7) {
        return { width: 18 + this.grimoire.zoom + unit };
      } else if (this.players.length <= 10) {
        return { width: 16 + this.grimoire.zoom + unit };
      } else if (this.players.length <= 15) {
        return { width: 14 + this.grimoire.zoom + unit };
      } else {
        return { width: 12 + this.grimoire.zoom + unit };
      }
    },
    isSeated() {
      return this.players.some(player => player.id === this.session.playerId);
    },
    gamestate() {
      return JSON.stringify({
        bluffs: this.bluffs.map(({ id }) => id),
        edition: this.edition.isOfficial
          ? { id: this.edition.id }
          : this.edition,
        roles: this.edition.isOfficial
          ? ""
          : this.$store.getters.customRolesStripped,
        fabled: this.fabled.map(f =>
          f.isCustom ? f : { id: f.id }
        ),
        players: this.playerList.map(player => ({
          ...player,
          role: player.role.id || {}
        }))
      });
    },
    handIcon() {
      return (player) => {
        switch (player.handMove) {
          case "rock":
            return "hand-rock";
          case "paper":
            return "hand-paper";
          case "scissors":
            return "cut";  // since no free hand-scissors icon
          default:
            return "hand-paper"; // fallback
        }
      };
    }

},
  data() {
    return {
      isMenuOpen: false,
      isSwap: false,
      VoteUsed: "../assets/shroud.png",
      VoteNotUsed: "../assets/shroud.png",
      hoveredReminderGroup: null,
      showHandUp: false,
      messageCount: 0,
      revealed: {}, // { playerId: true }
      revealedShroud: {},
      move: "paper",
      moves: ["rock", "paper", "scissors"],
      banNames: ["wraith", "st", "host", "you", "storyteller", "player"],
    };
  },
  methods: {
    changePronouns() {
      if (this.session.isSpectator && this.player.id !== this.session.playerId)
        return;
      const pronouns = prompt("Player pronouns", this.player.pronouns);
      //Only update pronouns if not null (prompt was not cancelled)
      if (pronouns !== null) {
        this.updatePlayer("pronouns", pronouns, true);
      }
    },
    toggleStatus() {
      if (this.grimoire.isPublic) {
        if (!this.player.isDead) {
          this.updatePlayer("isDead", true);
          if (this.player.isMarked) {
            this.updatePlayer("isMarked", false); // Should work?
          }
        } else if (this.player.isVoteless) {
          this.updatePlayer("isVoteless", false);
          this.updatePlayer("isDead", false);
        } else {
          this.updatePlayer("isVoteless", true);
        }
      } else {
        this.updatePlayer("isDead", !this.player.isDead);
        if (this.player.isMarked) {
          this.updatePlayer("isMarked", false);
        }
        if (this.player.isVoteless) {
          this.updatePlayer("isVoteless", false);
        }
      }
    },
    changeName() {
      if (this.session.isSpectator) return;

      let name = prompt("Player name", this.player.name) || this.player.name;
      name = name.trim();
      // Basic validation
      const isValid =
        name.length > 0 &&
        name.length <= 32 &&
        /^[\p{L}0-9\s'-]+$/u.test(name);
      if (!isValid) {
        alert("Invalid name. Name must be in range of 1-32 and not contain special characters");
        return;
      }

      // Ban list check
      if (this.banNames.includes(name.toLowerCase())) {
        alert("This name is not allowed. Please choose another.");
        return;
      }

      this.updatePlayer("name", name, true);
    },

    removeReminder(reminder) {
      const reminders = [...this.player.reminders];
      reminders.splice(this.player.reminders.indexOf(reminder), 1);
      this.updatePlayer("reminders", reminders, true);
    },
    updatePlayer(property, value, closeMenu = false) {
      if (
        this.session.isSpectator &&
        property !== "reminders" &&
        property !== "pronouns" &&
        property !== "handRaised"
      )
        return;
      this.$store.commit("players/update", {
        player: this.player,
        property,
        value
      });
      if (closeMenu) {
        this.isMenuOpen = false;
      }
    },
    removePlayer() {
      this.isMenuOpen = false;
      this.$emit("trigger", ["removePlayer"]);
    },
    swapPlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["swapPlayer", player]);
    },
    movePlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["movePlayer", player]);
    },
    nominatePlayer(player) {
      this.isMenuOpen = false;
      this.$emit("trigger", ["nominatePlayer", player]);
    },
    cancel() {
      this.$emit("trigger", ["cancel"]);
    },
    claimSeat() {
      this.isMenuOpen = false;
      this.$emit("trigger", ["claimSeat"]);
    },

    InvitePlayer(){
      this.isMenuOpen = false;
      const chat = [];
      let playerChat=[];
      this.players.forEach(player => {
        if (player.id == this.session.playerId) {
          playerChat.push(player.name);
          playerChat.push(player.id);
          chat.push(playerChat);
        }
      });
      playerChat=[];
      playerChat.push(this.player.name);
      playerChat.push(this.player.id);
      chat.push(playerChat);      
      if(chat[0] == chat[1]) return;
      this.$emit("trigger", ["inviteChat", chat]);
    },

    /**
     * Allow the ST to override a locked vote.
     */
    vote() {
      if (this.session.isSpectator) return;
      if (!this.voteLocked) return;
      this.$store.commit("session/voteSync", [
        this.index,
        !this.session.votes[this.index]
      ]);
    },
    SendGrim(){
      if (confirm(`Are you sure you want to send grim to ${this.player.name}?`)) {
        this.isMenuOpen = false;
        this.$store.commit("session/sendGrim", [this.gamestate, this.player.id]);
      }
    },
    SendCard(){
      this.isMenuOpen = false;
      this.$emit('trigger', ['openSendCardModal']);
    },
    updateMessageCount() {
      try {
        const messagesKey = `messages_${this.player.id}`;
        const messages = JSON.parse(localStorage.getItem(messagesKey)) || [];
        this.messageCount = messages.length;
      } catch (e) {
        this.messageCount = 0;
      }
    },
    onSpacebarRaiseHand() {
      if (!this.session.nomination) {
        const isSelf = this.session.playerId && this.player.id === this.session.playerId;
        if (!isSelf) return;
        if(this.player.handRaised) {
          this.$store.commit("session/setHandRaised", [this.index, null]);
          this.updatePlayer('handRaised', null);
        }
        else {
          const newHand = this.move || (this.player.handRaised ? null : "paper");
          this.$store.commit("session/setHandRaised", [this.index, newHand]);
          this.updatePlayer('handRaised', newHand);
        }

      }
    },

    markRevealed(player, type) {
      if (!this.revealed[player.id]) this.revealed[player.id] = {};
      this.$set(this.revealed[player.id], type, true);
    },
    canShowGhost(player) {
      const r = this.revealed[player.id] || {};
      if (r.ghost) return true;
      return (!this.session.hiddenVote || this.grimoire.isNight) && player.isDead && !player.isVoteless;
    },
    getShroudImage(player) {
    const isSelf = this.session.playerId && player.id === this.session.playerId;
    const isHost = !this.session.isSpectator;

    const maskOthersDuringDay =
      this.session.hiddenVote &&
      !this.grimoire.isNight &&
      !isSelf &&
      !isHost &&
      !this.revealedShroud[player.id];

    const file = maskOthersDuringDay
      ? 'shroud.png'
      : (player.isVoteless ? 'shroud_used.png' : 'shroud.png');

    try {
      const img = require(`../assets/${file}`);
      const url = img.default || img;
      return `url('${url}')`;
    } catch {
      return 'none';
    }
  },
   cycleMove() {
    const currentIndex = this.moves.indexOf(this.move);
    const nextIndex = (currentIndex + 1) % this.moves.length;
    this.move = this.moves[nextIndex];
  },
  getMoveIcon(move) {
    switch (move) {
      case "rock": return "hand-rock";
      case "paper": return "hand-paper";
      case "scissors": return "cut"; // since free hand-scissors icon doesn't exist
    }
  },

  pointingAngle(total, fromIndex, toIndex) {
    if (fromIndex === toIndex) return 0; // pointing at yourself

    // angle for each player clockwise from 12 o'clock
    const angleClockwiseFrom12 = (index) => (index * 360) / total;

    // convert polar to cartesian coordinates
    const toXY = (thetaDeg) => {
      const rad = (thetaDeg * Math.PI) / 180;
      return { x: Math.sin(rad), y: -Math.cos(rad) };
    };

    const { x: x1, y: y1 } = toXY(angleClockwiseFrom12(fromIndex));
    const { x: x2, y: y2 } = toXY(angleClockwiseFrom12(toIndex));

    const dx = x2 - x1;
    const dy = y2 - y1;

    // atan2 gives angle from +X axis, CCW positive
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = (angleRad * 180) / Math.PI;

    // convert to CSS rotation: 0deg = up (12 o'clock), positive clockwise
    let cssDeg = 90 - angleDeg;
    cssDeg = ((cssDeg % 360) + 360) % 360; // normalize to 0..360

    return cssDeg;
  },
  WraithLook(){
    this.isMenuOpen = false;
    localStorage.removeItem("messages_host");
    this.$store.commit("session/wraithLook", [this.session.playerId, this.player.id]);
  },
  },
  mounted() {
    EventBus.$on("spacebar-vote", this.onSpacebarRaiseHand);
  },
  beforeDestroy() {
    EventBus.$off("spacebar-vote", this.onSpacebarRaiseHand);
  },
  created() {
    this.updateMessageCount();
    this.messageCheckInterval = setInterval(this.updateMessageCount, 1000);
  },
  watch: {
    'grimoire.isNight'(isNight) {
      if (isNight && this.session.hiddenVote) {
        this.players.forEach(p => {
          if (p.id && !this.revealedShroud[p.id]) {
            this.$set(this.revealedShroud, p.id, true);
          }
        });
      }
    },
    player: {
      handler(newPlayer) {
        if (!newPlayer.isDead && !newPlayer.isVoteless) {
          this.$set(this.revealedShroud, newPlayer.id, false);
        }
      },
      deep: true
    },
    'session.nomination'(newVal) {
      if (newVal) {
        // reset everyone’s hand when voting begins
        this.players.forEach(p => {
          if (p.handRaised) {
            this.$store.commit("players/update", {
              player: p,
              property: "handRaised",
              value: false
            });
          }
        });
      }
    }
  },
};
</script>

<style lang="scss">
@import "../vars.scss";

.fold-enter-active,
.fold-leave-active {
  transition: transform 250ms ease-in-out;
  transform-origin: left center;
  transform: perspective(200px);
}
.fold-enter,
.fold-leave-to {
  transform: perspective(200px) rotateY(90deg);
}

/***** Player token *****/
.circle .player {
  margin-bottom: 10px;

  &:before {
    content: " ";
    display: block;
    padding-top: 100%;
  }

  .shroud {
    top: 0;
    left: 0;
    position: absolute;
    width: 100%;
    height: 45%;
    cursor: pointer;
    transform: rotateX(0deg);
    transform-origin: top center;
    transition: transform 200ms ease-in-out;
    z-index: 2;
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.8));
    --before-bg-image: url('../assets/shroud.png');
    &:before {
      content: " ";
      background: var(--before-bg-image);
      background-repeat: no-repeat;
      background-size: cover;
      background-position: center -10px;
      background-size: auto 110%;
      position: absolute;
      margin-left: -50%;
      width: 100%;
      height: 100%;
      left: 50%;
      top: -30%;
      opacity: 0;
      transform: perspective(400px) scale(1.5);
      transform-origin: top center;
      transition: all 200ms;
      pointer-events: none;
    }
    #townsquare.spectator & {
      pointer-events: none;
    }

    #townsquare:not(.spectator) &:hover:before {
      opacity: 0.5;
      top: -10px;
      transform: scale(1);
    }
  }

  &.dead .shroud:before {
    opacity: 1;
    top: 0;
    transform: perspective(400px) scale(1);
  }

  #townsquare:not(.spectator) &.dead .shroud:hover:before {
    opacity: 1;
  }
}

/****** Life token *******/
.player {
  z-index: 2;
  .life {
    border-radius: 50%;
    width: 100%;
    background: url("../assets/life.png") center center;
    background-size: 100%;
    border: 3px solid black;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    cursor: pointer;
    transition: transform 200ms ease-in-out;
    transform: perspective(400px) rotateY(180deg);
    backface-visibility: hidden;
    position: absolute;
    left: 0;
    top: 0;

    &:before {
      content: " ";
      display: block;
      padding-top: 100%;
    }
  }

  &.dead {
    &.no-vote .life:after {
      display: none;
    }

    .life {
      background-image: url("../assets/death.png");

      &:after {
        content: " ";
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        background: url("../assets/vote.png") center center no-repeat;
        background-size: 50%;
        height: 100%;
        pointer-events: none;
      }
    }
  }

  &.traveler .life {
    filter: grayscale(100%);
  }
}

#townsquare.public .player {
  .shroud {
    transform: perspective(400px) rotateX(90deg);
    pointer-events: none;
  }

  .life {
    transform: perspective(400px) rotateY(0deg);
  }

  &.traveler:not(.dead) .token {
    transform: perspective(400px) scale(0.8);
    pointer-events: none;
    transition-delay: 0s;
  }

  &.traveler.dead .token {
    transition-delay: 0s;
  }
}

/***** Role token ******/
.player .token {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  transition: transform 200ms ease-in-out;
  transform: perspective(400px) rotateY(0deg);
  backface-visibility: hidden;
}

#townsquare.public .circle .token {
  transform: perspective(400px) rotateY(-180deg);
}

/****** Player choice icons *******/
.player .overlay {
  width: 100%;
  position: absolute;
  pointer-events: none;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  &:after {
    content: " ";
    display: block;
    padding-top: 100%;
  }
}
.player .overlay svg {
  position: absolute;
  filter: drop-shadow(0 0 3px black);
  z-index: 2;
  cursor: pointer;
  &.swap,
  &.move,
  &.nominate,
  &.vote,
  &.cancel {
    width: 50%;
    height: 60%;
    opacity: 0;
    pointer-events: none;
    transition: all 250ms;
    transform: scale(0.2);
    * {
      stroke-width: 10px;
      stroke: white;
      fill: url(#default);
    }
    &:hover *,
    &.fa-hand-paper * {
      fill: url(#townsfolk);
    }
    &.fa-cut * {
      fill: url(#townsfolk);
    }
    &.fa-hand-rock * {
      fill: url(#townsfolk);
    }
    &.fa-times * {
      fill: url(#townsfolk);
    }
  }
}
.player .overlay svg.vote.hand-up {
  pointer-events: auto;         /* can hover if needed */
  transition: all 250ms ease-in-out;
  color: yellow;                /* highlight color */
  filter: drop-shadow(0 0 6px black);
  z-index: 1;  
  transform-origin: center center; /* important for rotation */
}


// other player voted yes, but is not locked yet
#townsquare.vote .player.vote-yes .overlay svg.vote.fa-hand-paper {
  opacity: 0.5;
  transform: scale(1);
}

// you voted yes | a locked vote yes | a locked vote no
#townsquare.vote .player.you.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock.vote-yes .overlay svg.vote.fa-hand-paper,
#townsquare.vote .player.vote-lock:not(.vote-yes) .overlay svg.vote.fa-times {
  opacity: 1;
  transform: scale(1);
}

// a locked vote can be clicked on by the ST
#townsquare.vote:not(.spectator) .player.vote-lock .overlay svg.vote {
  pointer-events: all;
}

li.from:not(.nominate) .player .overlay svg.cancel {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

li.swap:not(.from) .player .overlay svg.swap,
li.nominate .player .overlay svg.nominate,
li.move:not(.from) .player .overlay svg.move {
  opacity: 1;
  transform: scale(1);
  pointer-events: all;
}

/****** Vote icon  To change********/
.player .has-vote {
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  transition: opacity 250ms;
  z-index: 2;

  #townsquare.public & {
    opacity: 0;
    pointer-events: none;
  }
}

.has-vote {
  position: absolute;
  margin-top: -15%;
  right: 0px;
}

/****** Session seat glow *****/
@mixin glow($name, $color) {
  @keyframes #{$name}-glow {
    0% {
      box-shadow: 0 0 rgba($color, 1);
      border-color: $color;
    }
    50% {
      border-color: black;
    }
    100% {
      box-shadow: 0 0 20px 16px transparent;
      border-color: $color;
    }
  }

  .player.you.#{$name} .token {
    animation: #{$name}-glow 5s ease-in-out infinite;
  }
}

@include glow("townsfolk", $townsfolk);
@include glow("outsider", $outsider);
@include glow("demon", $demon);
@include glow("minion", $minion);
@include glow("traveler", $traveler);

.player.you .token {
  animation: townsfolk-glow 5s ease-in-out infinite;
}

/****** Marked icon  Maybe change?******/
.player .marked {
  position: absolute;
  width: 100%;
  top: 0;
  filter: drop-shadow(0px 0px 6px black);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 250ms;
  opacity: 0;
  &:before {
    content: " ";
    padding-top: 100%;
    display: block;
  }
  svg {
    height: 60%;
    width: 60%;
    position: absolute;
    stroke: white;
    stroke-width: 15px;
    path {
      fill: white;
    }
  }
}
.player.marked .marked {
  opacity: 0.5;
}

/****** Seat icon ********/
.player .seat {
  position: absolute;
  left: 2px;
  margin-top: -15%;
  color: #fff;
  filter: drop-shadow(0 0 3px black);
  cursor: default;
  z-index: 2;
  &.highlight {
    animation-iteration-count: 1;
    animation: redToWhite 1s normal forwards;
  }
}

// highlight animation
@keyframes redToWhite {
  from {
    color: $demon;
  }
  to {
    color: white;
  }
}

.player.you .seat {
  color: $townsfolk;
}

/***** Player name *****/
.player > .name {
  right: 10%;
  display: flex;
  justify-content: center;
  font-size: 120%;
  line-height: 120%;
  cursor: pointer;
  white-space: nowrap;
  width: 120%;
  background: rgba(0, 0, 0, 0.5);
  border: 3px solid black;
  border-radius: 10px;
  top: 5px;
  box-shadow: 0 0 5px black;
  padding: 0 4px;

  svg {
    top: 3px;
    margin-right: 2px;
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
    flex-grow: 1;
  }

  #townsquare:not(.spectator) &:hover,
  &.active {
    color: red;
  }

  &:hover .pronouns {
    opacity: 1;
    color: white;
  }

  .pronouns {
    display: flex;
    position: absolute;
    right: 110%;
    max-width: 250px;
    z-index: 25;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5));
    align-items: center;
    pointer-events: none;
    opacity: 0;
    transition: opacity 200ms ease-in-out;
    padding: 0 4px;
    bottom: -3px;

    &:before {
      content: " ";
      border: 10px solid transparent;
      width: 0;
      height: 0;
      border-left-color: black;
      position: absolute;
      margin-left: 2px;
      left: 100%;
    }
  }
}

.player.dead > .name {
  opacity: 0.5;
}

/***** Player menu *****/
.player > .menu {
  font-size: 0.8em;
  position: absolute;
  left: 110%;
  bottom: -5px;
  text-align: left;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 10px;
  border: 3px solid #000;
  margin-left: 15px;
  cursor: pointer;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);

  &:before {
    content: " ";
    width: 0;
    height: 0;
    position: absolute;
    border: 10px solid transparent;
    border-right-color: black;
    right: 100%;
    bottom: 5px;
    margin-right: 2px;
  }

  li:hover {
    color: red;
  }

  li.disabled {
    cursor: not-allowed;
    opacity: 0.5;
    &:hover {
      color: white;
    }
  }

  svg {
    margin-right: 2px;
  }
}

/***** Ability text *****/
#townsquare.public .circle .ability {
  display: none;
}
.circle .player .shroud:hover ~ .token .ability,
.circle .player .token:hover .ability {
  opacity: 1;
}

/**** Night reminders ****/
.player .night-order {
  z-index: 3;
}

.player.dead .night-order em {
  color: #ddd;
  background: linear-gradient(180deg, rgba(0, 0, 0, 1) 0%, gray 100%);
}

/***** Reminder token *****/
.circle .reminder {
  background: url("../assets/reminder.png") center center;
  background-size: 100%;
  width: 50%;
  height: 0;
  padding-bottom: 50%;
  box-sizing: content-box;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 5px 0 0 -25%;
  transition: margin 0.2s ease;
  border-radius: 50%;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  transition: all 200ms;
  cursor: pointer;
  .text {
    line-height: 90%;
    color: black;
    font-size: 50%;
    font-weight: bold;
    text-align: center;
    margin-top: 50%;
    height: 100%;
    width: 100%;
    position: absolute;
    top: 15%;
    text-shadow: 0 1px 1px #f6dfbd, 0 -1px 1px #f6dfbd, 1px 0 1px #f6dfbd,
      -1px 0 1px #f6dfbd;
  }
  .icon,
  &:after {
    content: " ";
    position: absolute;
    top: 0;
    width: 90%;
    height: 90%;
    background-size: 100%;
    background-position: center 0;
    background-repeat: no-repeat;
    background-image: url("../assets/icons/plus.png");
    transition: opacity 200ms;
  }

  &:after {
    background-image: url("../assets/icons/x.png");
    opacity: 0;
    top: 5%;
  }

  &.add {
    opacity: 0;
    top: 30px;
    &:after {
      display: none;
    }
    .icon {
      top: 5%;
    }
  }

  &.custom {
    .icon {
      display: none;
    }
    .text {
      font-size: 70%;
      word-break: break-word;
      margin-top: 0;
      display: flex;
      align-items: center;
      align-content: center;
      justify-content: center;
      border-radius: 50%;
      top: 0;
    }
  }

  &:hover:before {
    opacity: 0;
  }
  &:hover:after {
    opacity: 1;
  }
}
.circle {
  &:hover .reminder {
    margin-top: 10px;
  }

  .reminder {
    margin-top: 0;
    transition: margin 0.4s ease;
  }
}

.circle .reminderHoverTarget {
  opacity: 0;
  width: calc(50% + 8px);
  padding-top: calc(50% + 38px);
  margin-top: calc(-25% - 33px);
  margin-left: calc(-25% - 1px);
  border-radius: 300px 300px 999px 999px;
  pointer-events: auto;
  transform: none !important;
  z-index: -1;
  background: white;

}
.circle li:hover .reminder.add {
  opacity: 1;
  top: 0;
}
.circle li:hover .reminder.add:before {
  opacity: 1;
}

#townsquare.public .reminder {
  opacity: 0;
  pointer-events: none;
}

#townsquare .player .overlay svg.vote.hand-up {
  opacity: 0.5 !important;
  animation: pulse 1s infinite;
  transform: scale(1.15);
  z-index: 5;
}



@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}


</style>
