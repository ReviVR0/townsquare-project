<template>
  <Modal
    class="info-menu"
    v-if="modals.sendCard && !session.isSpectator"
    @close="toggleModal('sendCard')"
  >
    <div class="menu-content">
      <h3>{{ title }}</h3>
      <p class="subtitle">{{ subtitle }}</p>

      <div class="grid-scroll-container">
        <div class="grid">
          <div
            v-for="(option, index) in allOptions"
            :key="index"
            class="grid-item"
            @click="selectOption(option)"
          >
            <img :src="iconSrc" alt="icon" />
            <span class="label">{{ option.label }}</span>
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapState, mapMutations } from "vuex";

export default {
  components: { Modal },
  data() {
    return {
      iconSrc: require("@/assets/token.png"),
      optionsA: [
        { label: "Use Ability" },
        { label: "Make a Choice" },
        { label: "Not in Play" },
        { label: "This is the Demon" },
        { label: "Your Minions" },
        { label: "You Are" },
        { label: "This Player Is" },
        { label: "Selected You" },
      ],
      optionsB: [
        { label: "Got it" },
        { label: "Yes" },
        { label: "No" },
        { label: "Good" },
        { label: "Evil" },
        { label: "Clockwise" },
        { label: "Anticlockwise" },
        { label: "Zero" },
        { label: "One" },
        { label: "Two" },
        { label: "Three" },
        { label: "Four" },
        { label: "Five" },
        { label: "Player" },
        { label: "Character" },
        { label: "Custom" },
      ],
    };
  },
  computed: {
    ...mapState(["modals", "session"]),
    allOptions() {
      return [...this.optionsA, ...this.optionsB];
    },
    title() {
      return "Send Info to Players";
    },
    subtitle() {
      return "Click a token to send a message.";
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    selectOption(option) {
      console.log("Selected:", option.label);
      // You can commit to Vuex or emit here if needed:
      // this.$store.commit("session/sendCardToPlayers", option);
      this.$emit("card-selected", option.label);
    },
  },
};
</script>

<style lang="scss">
@import "../../vars.scss";

.info-menu {
  padding: 30px;
  background-color: rgba(0, 0, 0, 0.85);
  text-align: center;
  color: white;

  .menu-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
    width: 100%;
  }

  h3 {
    font-size: 24px;
    margin-bottom: 5px;
  }

  .subtitle {
    font-size: 14px;
    margin-bottom: 10px;
    color: #ffd700;
  }

  .grid-scroll-container {
    max-height: 70vh;
    overflow-y: auto;
    padding-right: 8px;
    width: 100%;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
    gap: 12px;
    justify-items: center;
    padding: 10px 0;
  }

  .grid-item {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 10px;
    cursor: pointer;
    transition: transform 0.2s ease;
    width: 90px;

    &:hover {
      transform: scale(1.05);
      background-color: rgba(255, 255, 255, 0.1);
    }

    img {
      width: 50px;
      height: 50px;
      object-fit: contain;
      margin-bottom: 5px;
    }

    .label {
      font-size: 12px;
      text-align: center;
      word-break: break-word;
    }
  }
}
</style>
