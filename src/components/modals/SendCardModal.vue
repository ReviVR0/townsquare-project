<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard && !session.isSpectator"
    @close="toggleModal('sendCard')"
  >
    <div class="send-cards-wrapper">
      <h3>Send Info to Player {{ playerIndex }}</h3>
      <p class="subtitle">Click a token to send a message.</p>

      <!-- Option A: Primary Cards -->
      <div class="option-a-container">
        <div
          v-for="(option, index) in optionsA"
          :key="'a-' + index"
          class="card-large"
          @click="selectOption(option)"
        >
          <img :src="iconSrc" alt="icon" />
          <span class="label">{{ option.label }}</span>
        </div>
      </div>

      <!-- Option B: Secondary Cards -->
      <div class="option-b-container">
        <div
          v-for="(option, index) in optionsB"
          :key="'b-' + index"
          class="card-small"
          @click="selectOption(option)"
        >
          <img :src="iconSrc" alt="icon" />
          <span class="label">{{ option.label }}</span>
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
  props: ["playerIndex"],
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
    playerIndex() {
      return this.modals.sendCardPlayerIndex;
    }
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    selectOption(option) {
      console.log("Selected:", option.label);
      this.$emit("card-selected", option.label);
    }
  },
};
</script>

<style lang="scss" scoped>
.send-cards-modal {
  ::v-deep(.modal) {
    background-color: rgba(0, 0, 0, 0.9);
    padding: 30px;
    border-radius: 12px;
    max-height: 85vh;
    max-width: 110vw;
    overflow: hidden;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .send-cards-wrapper {
    width: 100%;
    max-width: 850px;
    display: flex;
    flex-direction: column;
    align-items: center;

    h3 {
      font-size: 24px;
      margin-bottom: 5px;
      color: #ffd700;
    }

    .subtitle {
      font-size: 14px;
      color: #ccc;
      margin-bottom: 20px;
    }
    @media (max-width: 600px) {
    h3 {
      font-size: 20px;
    }

    .subtitle {
      font-size: 12px;
      margin-bottom: 16px;
    }
  }
  }

  // === Option A ===
  .option-a-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 16px;
  margin-bottom: 24px;

  .card-large {
    background-color: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    padding: 8px;
    width: 90px;
    text-align: center;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.05);
      background-color: rgba(255, 255, 255, 0.12);
    }

    img {
      width: 50px;
      height: 50px;
      margin-bottom: 6px;
    }

    .label {
      font-size: 12px;
    }
  }

  @media (max-width: 800px) {
    .card-large {
      width: 80px;

      img {
        width: 44px;
        height: 44px;
      }

      .label {
        font-size: 11px;
      }
    }
  }
}

  // === Option B ===
  
.option-b-container {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  justify-items: center;
  width: 100%;
  max-width: 100%;

  .card-small {
  background-color: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 6px;
  width: 60px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.15s ease;

  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    transform: scale(1.06);
    background-color: rgba(255, 255, 255, 0.08);
  }

  img {
    width: 30px;
    height: 30px;
    margin-bottom: 4px;
  }

  .label {
    font-size: 8px;
    word-break: break-word;
  }
}


  @media (max-width: 800px) {
    grid-template-columns: repeat(4, 1fr);
  }
}



}
</style>
