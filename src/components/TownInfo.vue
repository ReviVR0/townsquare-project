<template>
<div class="wrapper">
  <ul class="info">
    <li
      class="edition"
      :class="['edition-' + edition.id]"
      :style="{
        backgroundImage: `url(${
          edition.logo && grimoire.isImageOptIn
            ? edition.logo
            : require('../assets/editions/' + edition.id + '.png')
        })`
      }"
    ></li>
    <li v-if="players.length - teams.traveler < 5">
      Please add more players!
    </li>
    <li>
      <span class="meta" v-if="!edition.isOfficial">
        {{ edition.name }}
        {{ edition.author ? "by " + edition.author : "" }}
      </span>
      <span>
        {{ players.length }} <font-awesome-icon class="players" icon="users" />
      </span>
      <span>
        {{ teams.alive }}
        <font-awesome-icon class="alive" icon="heartbeat" />
      </span>
      <span>
        {{ teams.votes }} <font-awesome-icon class="votes" icon="vote-yea" />
      </span>
    </li>
    <li v-if="players.length - teams.traveler >= 5">
      <span>
        {{ teams.townsfolk }}
        <font-awesome-icon class="townsfolk" icon="user-friends" />
      </span>
      <span>
        {{ teams.outsider }}
        <font-awesome-icon
          class="outsider"
          :icon="teams.outsider > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span>
        {{ teams.minion }}
        <font-awesome-icon
          class="minion"
          :icon="teams.minion > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span>
        {{ teams.demon }}
        <font-awesome-icon
          class="demon"
          :icon="teams.demon > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span v-if="teams.traveler">
        {{ teams.traveler }}
        <font-awesome-icon
          class="traveler"
          :icon="teams.traveler > 1 ? 'user-friends' : 'user'"
        />
      </span>
      <span v-if="grimoire.isNight">
        Night phase
        <font-awesome-icon :icon="['fas', 'cloud-moon']" />
      </span>
    </li>
  </ul>
    <div  class="timer" v-if="session.timer!=0"  :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @mousedown="startDrag"
    :class="{ blinking: session.timer > 0 && session.timer < 10 }">
  {{ Math.floor(session.timer / 60) }}:{{ String(session.timer % 60).padStart(2, '0') }}
  </div>
<audio ref="countdownSound" src="../assets/sounds/countdown.mp3"></audio>

</div>
  
</template>

<script>
import gameJSON from "./../game";
import { mapState } from "vuex";

export default {
  data() {
    return {
      position: { x: 100, y: 100 },
      isDragging: false,
      offset: { x: 0, y: 0 },
    };
  },
  computed: {
    teams: function() {
      const { players } = this.$store.state.players;
      const nonTravelers = this.$store.getters["players/nonTravelers"];
      const alive = players.filter(player => player.isDead !== true).length;
      return {
        ...gameJSON[nonTravelers - 5],
        traveler: players.length - nonTravelers,
        alive,
        votes:
          alive +
          players.filter(
            player => player.isDead === true && player.isVoteless !== true
          ).length
      };
    },
    ...mapState(["edition", "grimoire"]),
    ...mapState("players", ["players"]),
    ...mapState(["grimoire", "session", "edition"]),
  },
  methods: {
    startDrag(event) {
      this.isDragging = true;
      this.offset = {
        x: event.clientX - this.position.x,
        y: event.clientY - this.position.y,
      };
      document.addEventListener("mousemove", this.onDrag);
      document.addEventListener("mouseup", this.stopDrag);
    },
onDrag(event) {
  if (this.isDragging) {
    const buffer = 25; // minimum distance from screen edge in px

    const x = event.clientX - this.offset.x;
    const y = event.clientY - this.offset.y;

    const maxX = window.innerWidth*0.5 - buffer*4;
    const maxY = window.innerHeight*0.5 - buffer*1.7;
    const minX = buffer*4-window.innerWidth*0.5;
    const minY = -window.innerHeight*0.5;

    this.position.x = Math.min(Math.max(x, minX), maxX);
    this.position.y = Math.min(Math.max(y, minY), maxY);
  }
},

    stopDrag() {
      this.isDragging = false;
      document.removeEventListener("mousemove", this.onDrag);
      document.removeEventListener("mouseup", this.stopDrag);
    },


    startTimer() {
  this.timerInterval = setInterval(() => {
    if (this.session.timer > 0) {
      this.session.timer--;
    } else {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      if (!this.grimoire.isMuted && this.$refs.countdownSound) {
        this.$refs.countdownSound.play().catch(err => {
          console.warn("Sound failed to play:", err);
        });
      }
    }
  }, 1000);
},

    handleResize() {
  if(this.position.x>window.innerWidth/2 || -this.position.x>window.innerWidth/2 || this.position.y>window.innerHeight/2 || -this.position.y>window.innerHeight/2){
    this.position.x=0;
    this.position.y=0;
  }
  },
  },
mounted() {
  window.addEventListener('resize', this.handleResize);
  this.handleResize(); // ensure correct position on mount
  const unlock = () => {
    const audio = this.$refs.countdownSound;
    if (audio) {
      // Try to play and immediately pause just to unlock it
      audio.play().then(() => audio.pause()).catch(() => {});
    }
    document.removeEventListener("click", unlock);
  };
  document.addEventListener("click", unlock);
},
  beforeDestroy() {
    // Clear the interval when the component is destroyed (cleanup)
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
          this.timerInterval = null; 
    }
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
  'session.timer'(newVal) {
    if (newVal > 0 && !this.timerInterval) {
      this.startTimer();
    }
  }
}
};


</script>

<style lang="scss" scoped>
@import "../vars.scss";

.wrapper {
  position: absolute;
  display: flex;
  width: 100%;
  height: 100%;
  padding: 50px 0 15px;
  align-items: center;
  align-content: center;
  justify-content: center;

}
.info {
  position: absolute;
  display: flex;
  width: 20%;
  height: 20%;
  padding: 50px 0 0;
  align-items: center;
  align-content: center;
  justify-content: center;
  flex-wrap: wrap;
  background: url("../assets/demon-head.png") center center no-repeat;
  background-size: auto 100%;

  li {

    font-weight: bold;
    width: 100%;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.7));
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    text-shadow: 0 2px 1px black, 0 -2px 1px black, 2px 0 1px black,
      -2px 0 1px black;

    span {
      white-space: nowrap;
    }

    .meta {
      text-align: center;
      flex-basis: 100%;
      font-family: PiratesBay, sans-serif;
      font-weight: normal;
    }

    svg {
      margin-right: 10px;
    }

    .players {
      color: #00f700;
    }
    .alive {
      color: #ff4a50;
    }
    .votes {
      color: #fff;
    }
    .townsfolk {
      color: $townsfolk;
    }
    .outsider {
      color: $outsider;
    }
    .minion {
      color: $minion;
    }
    .demon {
      color: $demon;
    }
    .traveler {
      color: $traveler;
    }
  }

  li.edition {
    width: 220px;
    height: 200px;
    max-width: 100%;
    max-height: 100%;
    background-position: 0 center;
    background-repeat: no-repeat;
    background-size: 100% auto;
    position: absolute;
    top: -25%;
  }
}
div.timer {
    font-weight: bold;
  cursor: grab;
  display: flex;
  justify-content: center;
  padding: 4px 10px;
  width: 150px;
  bottom: 20px;
  right: 20px;

  background-color: rgba(0, 0, 0, 0.75);
  border-radius: 12px;
  border: 3px solid $townsfolk;

  white-space: nowrap;
  z-index: 10;
  user-select: none;

}


.blinking {
  animation: blink-red-white 1s infinite;
}
@keyframes blink-red-white {
  0% { color: red; border-color: red}
  50% { color: white; border-color: $townsfolk}
  100% { color: red; border-color: red}
}
</style>
