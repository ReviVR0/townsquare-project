<template>
  <Modal
    class="send-cards-modal"
    v-if="modals.sendCard"
    @close="closeModal"
  >
    <div class="send-cards-wrapper">
      <h3>Send info to {{ InfoReciver }}</h3>
<!-- Response Mode -->
<div v-if="mode === 'response'" class="submenu">
  <div v-if="fullLog.length" class="message-log" style="margin-bottom: 10px; max-height: 120px; overflow-y: auto;">
    <h4>Recent Messages:</h4>
  <div
    v-for="(msg, idx) in fullLog.slice(-4)"
    :key="idx"
    style="font-size: 0.9em; margin-bottom: 2px; display: flex; flex-wrap: wrap; align-items: center;"
  >
  <span
    :style="{ color: msg.startsWith('You:') ? '#777' : '#aaa', display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center' }"
  >
  <span v-for="(part, i) in parseMessage(msg)" :key="i" style="display: inline-flex; align-items: center;">
    <img
      v-if="part.img"
      :src="part.img"
      :alt="part.text"
      :style="iconStyle"
    />
  <span :class="part.team ? part.team : ''"
    style= "margin-right: 2px;">
    {{ part.text }}
  </span>
  </span>
    </span>
</div>



</div>
  <div v-if="messageQueue.length" style="margin-bottom: 10px; text-align: center;">
<p style="display: flex; flex-wrap: wrap; align-items: center; display: 'inline-flex',
    alignItems: 'center'," v-if="this.session.isSpectator">
  <strong style="margin-right: 4px;">Current Message:</strong>
<span
  v-for="(part, i) in parseMessage(messageQueue.join(' '))"
  :key="i"
  :class="part.team ? part.team : ''"
  :style="{
    marginRight: '2px',
    color: !part.team
      ? (messageQueue.join(' ').startsWith('You:') ? '#777' : '#aaa')
      : undefined
  }"
>
  <img
    v-if="part.img"
    :src="part.img"
    :alt="part.text"
    :style="iconStyle"
  />
  <span style="margin-left: 2px;">{{ part.text }}</span> <!-- small gap after image -->
</span>


</p>

    <button @click="sendQueuedMessage" style="margin-top: 6px;" v-if="this.session.isSpectator">Send Message</button>
    <button @click="clearQueue" style="margin-top: 6px; margin-left: 8px;" v-if="this.session.isSpectator">Clear</button>
  </div>

  <h4 v-if="this.session.isSpectator">Respond with:</h4>
  <p class="subtitle" v-if="this.session.isSpectator">Click a token to send a message.</p>
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
<div v-if="fullLog.length" class="message-log" style="margin-bottom: 10px; max-height: 120px; overflow-y: auto;">
  <h4>Recent Messages:</h4>
<div
  v-for="(msg, idx) in fullLog.slice(-4)"
  :key="idx"
  style="font-size: 0.9em; margin-bottom: 2px; display: flex; flex-wrap: wrap; align-items: center;"
>
<span
  :style="{ color: msg.startsWith('You:') ? '#777' : '#aaa', display: 'inline-flex', flexWrap: 'wrap', alignItems: 'center' }"
>
<span v-for="(part, i) in parseMessage(msg)" :key="i" style="display: inline-flex; align-items: center;">
  <img
    v-if="part.img"
    :src="part.img"
    :alt="part.text"
    :style="iconStyle"
  />
<span :class="part.team ? part.team : ''" style= "margin-right: 2px;">
    {{ part.text }}</span>
</span>

  </span>
</div>



</div>
  <!-- Display queued message (same as response mode) -->
  <div v-if="messageQueue.length" style="margin-bottom: 10px; text-align: center;">
<p style="color: #ccc,
    display: 'inline-flex',
    alignItems: 'center',">
  <strong>Current Message:</strong>
<span
  v-for="(part, i) in parseMessage(messageQueue.join(' '))"
  :key="i"
  :class="part.team ? part.team : ''"
  :style="{
    color: !part.team
      ? (messageQueue.join(' ').startsWith('You:') ? '#777' : '#aaa')
      : undefined
  }"
>
  <img
    v-if="part.img"
    :src="part.img"
    :alt="part.text"
    :style="iconStyle"
  />
  <span style="margin-left: 2px;">{{ part.text }}</span> <!-- small gap after image -->
</span>

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
        @click="selectSubOption('Character', roleEntry.value.id)"
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
        { label: "This is the Demon", action: "showDemon" },
        { label: "Your Minions", action: "showMinion" },
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
      incomingMessage: "",
      fullLog: [], // stores full messages from localStorage
      isResponse: false,
      iconStyle: {
        width: '1.7em',
        height: '1.7em',
        display: 'inline-block',
        objectFit: 'cover',
        clipPath: 'inset(5% 10% 20% 10%)',
        borderRadius: '2px',
        verticalAlign: 'text-bottom',
        marginBottom: '-0.2em',
        marginRight: '-0.2em',
        marginLeft: '-0.1em'

      },
    };
  },
  computed: {
    ...mapState("players", ["players"]),
    ...mapState(["modals", "session"]),
    ...mapState(["roles", "modals"]),
    player() {
      return this.players[this.playerIndex];
    },
    rolesArray() {
      return Array.from(this.$store.state.roles.entries()).map(([key, value]) => ({ key, value }));
    },
    InfoReciver() {
      return this.isResponse ? "Storyteller" : this.player.name;
    },
    storageKey() {
      // Key to use for storing messages in localStorage
      return !this.session.isSpectator
        ? `messages_${this.player.id}`
        : "messages_host";
    },
  },
  methods: {
    ...mapMutations(["toggleModal"]),

    loadMessages(playerId = null) {
      const key = this.session.isSpectator
        ? "host"
        : playerId || this.player.id; // use passed ID if available
      const saved = localStorage.getItem(`messages_${key}`);
      this.fullLog = saved ? JSON.parse(saved) : [];
    },


      saveMessage(message, storageId = null) {
        if(this.session.isSpectator) storageId = "host";
        const key = storageId || this.player.id;
        const saved = localStorage.getItem(`messages_${key}`);
        const fullLog = saved ? JSON.parse(saved) : [];

        fullLog.push(message);
        if (fullLog.length > 20) {
          fullLog.splice(0, fullLog.length - 10); // keep last 10
        }

        localStorage.setItem(`messages_${key}`, JSON.stringify(fullLog));
    },


    selectOption(option) {
      if (option.action && typeof this[option.action] === "function") {
        this[option.action](option);
        return;
      }
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
      const role = this.roles.get(id);
      if (role) {
        if (role.image) return role.image; // use URL if present
        try {
          return require(`@/assets/icons/Reminder/${id}.png`); // fallback to local file
        } catch {
          console.warn(`Local image not found for role: ${id}`);
        }
      }
      return require("@/assets/token.png"); // ultimate fallback
    },


    sendQueuedMessage() {
      const fullMessage = this.messageQueue.join(" ");
      if (!fullMessage) return;

      this.saveMessage(`You: ${fullMessage}`);

      if (this.isResponse) {
        this.$store.commit("session/sendCard", ["host", [fullMessage, this.session.playerId]]);
      } else {
        this.$store.commit("session/sendCard", [this.player.id, [fullMessage, "host"]]);
      }

      this.messageQueue = [];
      this.incomingMessage = "";
      this.isResponse = false;
      this.mode = "default";
      this.toggleModal("sendCard");
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
      // Reload messages for next time
    },
    parseMessage(msg) {
      const regex = /(Character|Player): ([\p{L}\p{N}_]+)/gu;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(msg)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ text: msg.slice(lastIndex, match.index) });
        }

        const type = match[1]; // "Character" or "Player"
        const id = match[2];   // lowercase id for lookup
        let name = id;         
        let img = null;
        let team = null;

        try {
          if (type === "Character") {
            const role = this.roles.get(id);
            if (role) {
              name = role.name;      // display name
              team = role.team;      // team color
              img = role.image || require(`@/assets/icons/Reminder/${id}.png`);
            } else {
              img = require(`@/assets/icons/Reminder/${id}.png`);
            }
          } else if (type === "Player") {
            name = id;
            team = "player";
            img = require(`@/assets/icons/Reminder/user.png`);
          }
        } catch (err) {
          console.warn(`Image not found for ${type}: ${id}`);
          img = null; // fallback to null if image fails
        }

        parts.push({ text: name, img, type, team });
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < msg.length) {
        parts.push({ text: msg.slice(lastIndex) });
      }

      return parts;
    },

    showDemon() {
      const isCurrentMinion = this.player.role?.team === "minion";
      let demons = this.players.filter(player => player.role?.team === "demon");

      if (isCurrentMinion) {
        const magician = this.players.find(player => player.role?.id === "magician");
        if (magician && !demons.includes(magician)) {
          demons.push(magician);
        }
      }

      if (demons.length === 0) {
        this.messageQueue.push("No demons found");
        return;
      }

      if (demons.length === 1) {
        this.messageQueue.push("This is the Demon");
        this.messageQueue.push(`Player: ${demons[0].name}`);
      } else {
        this.messageQueue.push("These are the Demons");
        demons.forEach(demon => {
          this.messageQueue.push(`Player: ${demon.name}`);
        });
      }
    },
    showMinion() {
      this.players.forEach(player => {
        player.reminders.forEach(reminderToken => {
          if(reminderToken.name == "Is the Marionette")
            console.log(reminderToken.name)
        })
      })
      const isCurrentDemon = this.player.role?.team === "demon";
      let minions = this.players.filter(player =>
        player.role?.team === "minion" && player.role?.id !== "marionette"
      );

      if (isCurrentDemon) {
        const magician = this.players.find(player => player.role?.id === "magician");
        if (magician && !minions.includes(magician)) {
          minions.push(magician);
        }
      }

      if (minions.length === 0) {
        this.messageQueue.push("No minions found");
        return;
      }

      if (minions.length === 1) {
        this.messageQueue.push("This is the Minion");
        this.messageQueue.push(`Player: ${minions[0].name}`);
      } else {
        this.messageQueue.push("These are the Minions");
        minions.forEach(minion => {
          this.messageQueue.push(`Player: ${minion.name}`);
        });
      }
      
      if (isCurrentDemon) {
        this.players.forEach(player => {
          const hasMarionetteReminder = player.reminders?.some(
            reminder => reminder.name === "Is the Marionette"
          );
          if (hasMarionetteReminder) {
            this.messageQueue.push("This is Marionette");
            this.messageQueue.push(`Player: ${player.name}`);
          }
        });
      }
    },




  },

watch: {
  'session.recivedMessage'(messageData) {
    if (!messageData) return;

    const [text, playerId] = messageData;

    // Determine sender
    let senderName;
    if (this.session.isSpectator) {
      senderName = "Host";
    } else {
      senderName = "Unknown";
      this.players.forEach(player => {
        if (player.id === playerId) {
          senderName = player.name;
        }
      });
    }

    // Save message using playerId as storage key
    this.incomingMessage = text;
    this.saveMessage(`${senderName}: ${text}`, playerId);
    this.isResponse = true;
    this.mode = 'response';
    if(!this.modals.sendCard)
      this.toggleModal('sendCard');
    this.loadMessages(playerId);


  },
  'modals.sendCard'(isOpen) {
    if (isOpen && this.session.isSpectator) {
      this.mode = 'response';
      this.isResponse = true;
      if (this.fullLog.length > 0) {
        this.incomingMessage = this.fullLog[this.fullLog.length - 1].split(': ').slice(1).join(': ');
      }
    }
    if(!this.isResponse)
      this.loadMessages(this.player.id);
  }

},

  mounted() {
    this.loadMessages(this.player.id);
  }
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
      font-size: 10px;
      color: #ccc;
      margin-bottom: 10px;
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
.townsfolk { color: $townsfolk; }
.outsider { color: $outsider; }
.minion { color: $minion; }
.demon { color: $demon; }
.traveler { color: $traveler; }
.player {color: #ffffffff}

</style>
