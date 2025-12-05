<template>
  <div class="token" @click="setRole" :class="[role.id]">
    <!-- Icon / image -->
    <span
      class="icon"
      v-if="role.id"
      :style="{ backgroundImage: `url(${getImage()})` }"
    ></span>

    <!-- Leaves -->
    <span class="leaf-left" v-if="role.firstNight || role.firstNightReminder"></span>
    <span class="leaf-right" v-if="role.otherNight || role.otherNightReminder"></span>
    <span v-if="reminderLeaves" :class="['leaf-top' + reminderLeaves]"></span>
    <span class="leaf-orange" v-if="role.setup"></span>

    <!-- Name -->
    <svg viewBox="0 0 150 150" class="name">
      <path d="M 13 75 C 13 160, 138 160, 138 75" fill="transparent" id="curve"/>
      <text width="150" x="66.6%" text-anchor="middle"
            :font-size="role.name | nameToFontSize"
            style="
            font-size: 24px;
            font-family: 'Papyrus', serif;
            font-weight: bold;
            fill: black;
            stroke: white; stroke-width: 2px;
            paint-order: stroke;
            text-shadow: 0 2px 2px rgba(0,0,0,0.2);"
      >
        <textPath xlink:href="#curve">{{ role.name }}</textPath>
      </text>
    </svg>

    <!-- Edition & Team -->
    <div class="edition" :class="[`edition-${role.edition}`, role.team]"></div>

    <!-- Ability description -->
    <div class="ability" v-if="role.ability">{{ role.ability }}</div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Token",
  props: {
    role: {
      type: Object,
      default: () => ({}),
    },
    alignmentIndex: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    reminderLeaves() {
      return (this.role.reminders || []).length + (this.role.remindersGlobal || []).length;
    },
    ...mapState(["grimoire"]),
  },
  methods: {
    getImage() {
      // Use custom images if opted-in
      if (this.role.image && this.grimoire.isImageOptIn) {
        if (Array.isArray(this.role.image)) return this.role.image[this.alignmentIndex] || this.role.image[0];
        return this.role.image;
      }
      let folder = "Reminder/";
      let suffix = "";

      if (this.alignmentIndex === 1) {
        folder = "Images_g/";
        suffix = "_g";
      } else if (this.alignmentIndex === 2) {
        folder = "Images_e/";
        suffix = "_e";
      }

      // Fallback to default image
      const filename = this.role.imageAlt || this.role.id;
      return require(`../assets/icons/${folder}${filename}${suffix}.png`);
    },
    setRole() {
      this.$emit("set-role");
    },
  },
  filters: {
    nameToFontSize: (name) => (name && name.length > 10 ? "90%" : "110%"),
  },

};
</script>

<style scoped lang="scss">
.token {
  border-radius: 50%;
  width: 100%;
  background: url("../assets/token.png") center center;
  background-size: 100%;
  text-align: center;
  border: 3px solid black;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 250ms;

  &:hover .name .label {
    stroke: black;
    fill: white;
  }

  .icon {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 4px;
    background-size: 100%;
    background-repeat: no-repeat;
    background-position: center 30%;
  }

  .ability {
    display: flex;
    position: absolute;
    padding: 5px 10px;
    left: 120%;
    width: 250px;
    z-index: 25;
    font-size: 80%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 10px;
    border: 3px solid black;
    opacity: 0;
    pointer-events: none;
    transition: opacity 200ms ease-in-out;
  }

  &:hover .ability {
    opacity: 1;
  }
}
</style>
