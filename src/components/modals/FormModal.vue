<template>
  <Modal
      v-if="modals.form"
      class="form"
      @close="toggleModal('form')"
  >
    <div class="form-container">

    </div>
  </Modal>
</template>

<script>
import Modal from "./Modal";
import { mapMutations, mapState } from "vuex";

export default {
  components: { Modal },
  data() {
    return {
      difficulty: "", // New
      questions: [],
      answers: [],
    };
  },

  computed: {
    ...mapState(["modals"]),
  },
  methods: {
    ...mapMutations(["toggleModal"]),
    },
};
</script>

<style scoped>
</style>
