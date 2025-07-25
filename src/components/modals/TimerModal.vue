<template>
  <Modal
    class="timer-menu"
    v-if="modals.timer && !session.isSpectator"
    @close="toggleModal('timer')"
  >
    <h3>Timer Menu</h3>
    <div class="content">
      <p>Set Timer:</p>
      <div class="timer-control-wrapper">
        <div class="timer-controls">
          <button class="button" @click="decreaseTimer" :disabled="timerMinutes <= 0 && timerSeconds == 5">
          <font-awesome-icon
            icon="minus-circle"
          />          
          </button>
        </div>

        <div class="timer-display">
          <!-- Display current time in minutes and seconds -->
          <span>  {{ Math.floor(timerTotalSeconds / 60) }}:{{ String(timerTotalSeconds % 60).padStart(2, '0') }} </span>
        </div>

        <div class="timer-controls">
          <button class="button" @click="increaseTimer" :disabled="timerMinutes >= 10 && timerSeconds == 0">
          <font-awesome-icon
            icon="plus-circle"
          />
          </button>
        </div>
      </div>

      <div class="timer-send">
        <button class="button" @click="SendTimer">Send Timer</button>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

export default {
  components: {
    Modal
  },
  computed: {
    ...mapState(["grimoire", "session", "edition"]),
    ...mapState(["modals"]),
    timerMinutes() {
      // Return the timer in minutes
      return Math.floor(this.timerTotalSeconds / 60);
    },
    timerSeconds() {
      // Return the remaining seconds after calculating minutes
      return this.timerTotalSeconds % 60;
    },
  },
  data() {
    return {
      timerTotalSeconds: 180, // Default start time: 3 minutes
    };
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    
    // Decrease the timer by 30 seconds
    decreaseTimer() {
      if (this.timerTotalSeconds > 60) {
        this.timerTotalSeconds -= 30;
      }
      else if(this.timerTotalSeconds > 5){
        this.timerTotalSeconds -= 5;
      }
    },
    SendTimer(){
      this.$store.commit("session/timer", this.timerTotalSeconds);
    },
    
    // Increase the timer by 30 seconds
    increaseTimer() {
      if (this.timerTotalSeconds < 600 && this.timerTotalSeconds >= 60) { // Max of 10 minutes (600 seconds)
        this.timerTotalSeconds += 30;
      } else if(this.timerTotalSeconds >= 5){
      this.timerTotalSeconds += 5;
      }
    },
  }
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";
.timer-menu {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 50px 50px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background-color: rgba(0, 0, 0, 0.5); // semi-transparent dark background
  color: white;
  font-weight: bold;
  text-align: center;
  z-index: 999; // ensure it appears above everything
  pointer-events: auto;
}

h3 {
  font-weight: bold;
  margin: 30px 0 20px 0;
  svg {
    vertical-align: middle;
  }}
.content {
  text-align: center;
  font-size: 16px;
  color: white;
}

.timer-display {
  font-size: 24px;
  font-weight: bold;
}
.timer-control-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px; /* space between buttons and timer */
}
.timer-controls {
  display: flex;
  font-size: 18px;
  justify-content: center;
  gap: 20px;
}
.button{
    font-weight: bold;
  font-size: 16px;
}

</style>
