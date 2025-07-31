<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard"
    @close="closeModal"
  >
    <div class="send-cards-wrapper">
      <h3>Send info to {{ InfoReciver }}</h3>
      <p class="subtitle">Click a token to send a message.</p>
<!-- Response Mode -->
<div v-if="mode === 'response'" class="submenu">
  <h4>Message Received:</h4>
  <p class="subtitle">{{ incomingMessage }}</p>

  <div v-if="messageQueue.length" style="margin-bottom: 10px; text-align: center;">
    <p style="color: #ccc;">
      <strong>Current Message:</strong> {{ messageQueue.join(" ") }}
    </p>
    <button @click="sendQueuedMessage" style="margin-top: 6px;">Send Message</button>
    <button @click="clearQueue" style="margin-top: 6px; margin-left: 8px;">Clear</button>
  </div>

  <p>Respond with:</p>

<div class="option-b-container" v-if="this.session.isSpectator">
  <div class="card-small" @click="selectOption({ label: 'Player' })">
    <img :src="iconSrc" alt="token" />
    <span class="label">Choose Player</span>
  </div>
  <div class="card-small" @click="selectOption({ label: 'Character' })">
    <img :src="iconSrc" alt="token" />
    <span class="label">Choose Character</span>
  </div>
  <div class="card-small" @click="messageQueue.push('Got it ')">
    <img :src="iconSrc" alt="token" />
    <span class="label">Got it</span>
  </div>
  <div class="card-small" @click="messageQueue.push('Yes ')">
    <img :src="iconSrc" alt="token" />
    <span class="label">Yes</span>
  </div>
  <div class="card-small" @click="messageQueue.push('No ')">
    <img :src="iconSrc" alt="token" />
    <span class="label">No</span>
  </div>
  <div class="card-small" @click="selectOption({ label: 'Custom' })">
    <img :src="iconSrc" alt="token" />
    <span class="label">Custom Message</span>
  </div>
</div>


  <button @click="closeModal">Close</button>
</div>

      <!-- Default mode with message queue and options -->
<div v-if="mode === 'default'">
  <!-- Display queued message (same as response mode) -->
  <div v-if="messageQueue.length" style="margin-bottom: 10px; text-align: center;">
    <p style="color: #ccc;">
      <strong>Current Message:</strong> {{ messageQueue.join(" ") }}
    </p>
    <button @click="sendQueuedMessage" style="margin-top: 6px;">Send Message</button>
    <button @click="clearQueue" style="margin-top: 6px; margin-left: 8px;">Clear</button>
  </div>

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

      <!-- Player Selection -->
      <div v-else-if="mode === 'player'" class="submenu">
        <h4>Select a Player:</h4>
        <div class="option-b-container">
          <div
            v-for="(p, idx) in $store.state.players.players"
            :key="'p-' + idx"
            class="card-small"
            @click="selectSubOption('Player', p.name)"
          >
            <img :src="iconSrc" />
            <span class="label">{{ p.name }}</span>
          </div>
        </div>
        <button @click="mode = previousMode || 'default'">Back</button>
      </div>

      <!-- Character Selection -->
      <div v-else-if="mode === 'character'" class="submenu">
        <h4>Select a Character:</h4>
        <div class="option-b-container">
      <div
        v-for="roleEntry in rolesArray"
        :key="roleEntry.key"
        class="card-small token-wrapper"
        @click="selectSubOption('Character', roleEntry.value.name)"
      >
        <img class="token-bg" :src="iconSrc" alt="token" />
        <img
          class="role-icon"
          :src="getRoleImage(roleEntry.value.id)"
          :alt="roleEntry.value.name"
        />
        <span class="label">{{ roleEntry.value.name }}</span>
      </div>
        </div>
      <button @click="mode = previousMode || 'default'">Back</button>
      </div>





      <!-- Custom Message Input -->
      <div v-else-if="mode === 'custom'" class="submenu">
        <h4>Custom Message:</h4>
        <textarea
          v-model="customMessage"
          rows="4"
          style="width: 100%; margin-bottom: 12px;"
        ></textarea>
        <button @click="submitCustomMessage">Send</button>
<button @click="mode = previousMode || 'default'">Back</button>
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
      mode: "default",
      previousMode: null,
      customMessage: "",
      messageQueue: [],
      isResponse: false,
      incomingMessage: "",
    };
  },
  computed: {
    ...mapState(["modals", "session"]),
    player() {
      return this.$store.state.players.players[this.playerIndex];
    },
      rolesArray() {
    return Array.from(this.$store.state.roles.entries()).map(([key, value]) => ({ key, value }));
    },
    InfoReciver(){
      if(this.isResponse) return "Storyteller";
      return this.player.name;
    }
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    selectOption(option) {
      switch (option.label) {
        case "Player":
          this.previousMode = this.mode;
          this.mode = "player";
          break;
        case "Character":
          this.previousMode = this.mode;
          this.mode = "character";
          break;
        case "Custom":
          this.previousMode = this.mode;
          this.mode = "custom";
          break;
        default:
          this.messageQueue.push(option.label);

      }
    },
    selectSubOption(type, value) {
      this.messageQueue.push(`${type}: ${value}`);
      this.mode = this.previousMode || "default";
    },
    submitCustomMessage() {
      if (this.customMessage.trim()) {
        this.messageQueue.push(this.customMessage.trim());
        this.customMessage = "";
        this.mode = this.previousMode || "default";
      }
    },
    getRoleImage(id) {
      try {
        return require(`@/assets/icons/Reminder/${id}.png`);
      } catch {
        return require("@/assets/token.png"); // fallback icon
      }
    },
    sendQueuedMessage() {
      const fullMessage = this.messageQueue.join(" ");
      if (fullMessage) {
        if(this.isResponse)
        {
          this.$store.commit("session/sendCard", ["host", fullMessage]);
        }        
        else
          this.$store.commit("session/sendCard", [this.player.id, fullMessage]);

        this.messageQueue = [];
        this.incomingMessage = "";
        this.isResponse = false;
        this.mode = "default";
        this.toggleModal("sendCard");
      }
    },
    clearQueue() {
      this.messageQueue = [];
    },
    closeModal() {
      this.toggleModal("sendCard");
      this.messageQueue = [];
      this.incomingMessage = "";
      this.isResponse = false;
      this.mode = "default";
    },
  },
  watch: {
  'session.recivedMessage'(Message) {
    if (Message) {
      this.incomingMessage = Message;
      this.$store.commit("session/clearRecievedMessage");
      this.isResponse = true;
      this.mode = 'response';
      this.toggleModal('sendCard');
    }
  }
},
};
</script>

<style lang="scss" scoped>
@import "../../vars.scss";

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
      color: $townsfolk;
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

  .submenu {
    width: 100%;
    max-width: 700px;
    display: flex;
    flex-direction: column;
    align-items: center;

    h4 {
      color: white;
      margin-bottom: 10px;
    }

    textarea {
      font-size: 14px;
      padding: 8px;
      border-radius: 6px;
      resize: none;
    }
  }

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

  .option-b-container {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 10px;
    justify-items: center;
    width: 100%;

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
      grid-template-columns: repeat(6, 1fr);
    }
    @media (max-width: 600px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }
}
.token-wrapper {
  position: relative;
  width: 80px;  
  height: 80px;

  .token-bg {
    width: 100%;
    height: 100%;
    display: block;
  }

  .role-icon {
    position: absolute;
    top: 29%;
    left: 50%;
    width: 50px; 
    height: 50px;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }
}
    button {
      margin-top: 10px;
      padding: 6px 14px;
      background-color: #333;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;

      &:hover {
        background-color: #555;
      }
    }

</style>
