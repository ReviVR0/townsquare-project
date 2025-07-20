<template>
  <Modal
<<<<<<< Updated upstream
      v-if="modals.trivia"
      class="trivia-quiz"
      @close="toggleModal('trivia')"
=======
    v-if="modals.trivia"
    class="trivia-quiz"
    @close="toggleModal('trivia')"
>>>>>>> Stashed changes
  >
    <div class="trivia-container">
      <h2>Trivia Quiz</h2>
      <div v-if="questions.length === 0">
        <label for="difficulty">Select difficulty:</label>
        <select v-model="difficulty" id="difficulty">
          <option disabled value="">Choose...</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <button @click="fetchQuestions" :disabled="!difficulty">
          Start Quiz
        </button>
      </div>
      <div v-if="questions.length === 0">Loading questions...</div>
      <div v-else class="scroll-area">
        <div
<<<<<<< Updated upstream
            v-for="(q, index) in questions"
            :key="index"
            class="question-block"
=======
          v-for="(q, index) in questions"
          :key="index"
          class="question-block"
>>>>>>> Stashed changes
        >
          <p v-html="index + 1 + '. ' + decode(q.question)"></p>
          <ul>
            <li
<<<<<<< Updated upstream
                v-for="(option, i) in q.shuffledAnswers"
                :key="i"
                @click="selectAnswer(index, option)"
                :class="{ selected: answers[index] === option }"
                v-html="decode(option)"
=======
              v-for="(option, i) in q.shuffledAnswers"
              :key="i"
              @click="selectAnswer(index, option)"
              :class="{ selected: answers[index] === option }"
              v-html="decode(option)"
>>>>>>> Stashed changes
            ></li>
          </ul>
        </div>
        <button @click="checkAnswers">Check Answers</button>
      </div>
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
    async fetchQuestions() {
      const res = await fetch(
<<<<<<< Updated upstream
          `https://opentdb.com/api.php?amount=10&difficulty=${this.difficulty}`
=======
        `https://opentdb.com/api.php?amount=10&difficulty=${this.difficulty}`,
>>>>>>> Stashed changes
      );
      const data = await res.json();

      this.questions = data.results.map((q) => {
        const options = [...q.incorrect_answers, q.correct_answer];
        const shuffled = options.sort(() => Math.random() - 0.5);
        return {
          ...q,
          shuffledAnswers: shuffled,
        };
      });

      this.answers = Array(this.questions.length).fill(null);
    },

    decode(str) {
      const txt = document.createElement("textarea");
      txt.innerHTML = str;
      return txt.value;
    },
    selectAnswer(index, answer) {
      this.$set(this.answers, index, answer);
    },
    checkAnswers() {
<<<<<<< Updated upstream
      const score = this.answers.filter(
          (a, i) => a === this.questions[i].correct_answer
=======
      //console.log(this.questions);
      const score = this.answers.filter(
        (a, i) => a === this.questions[i].correct_answer,
>>>>>>> Stashed changes
      ).length;
      alert(`You got ${score} out of ${this.questions.length} correct!`);
    },
  },
  watch: {
    "modals.trivia"(newVal) {
      if (newVal) {
<<<<<<< Updated upstream
        this.difficulty = ""; // reset
        this.questions = [];  // reset
=======
        this.difficulty = "";
        this.questions = [];
>>>>>>> Stashed changes
        this.answers = [];
      }
    },
  },
};
</script>

<style scoped>
.trivia-quiz {
  color: white;
  padding: 2rem;
  max-height: 90vh;
  overflow: hidden;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

.trivia-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.scroll-area {
  overflow-y: auto;
  max-height: 65vh;
  padding-right: 8px;
}

.question-block {
  margin-bottom: 1.5rem;
  text-align: left;
  word-break: break-word;
}

.question-block p {
  line-height: 1.4;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

ul {
  padding-left: 0;
  list-style: none;
}

li {
  cursor: pointer;
  padding: 0.4rem;
  margin: 0.3rem 0;
  background: #2e2e2e;
  border-radius: 5px;
  white-space: normal;
  word-wrap: break-word;
}

li.selected {
  background-color: #4444aa;
  color: white;
}

button {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #007acc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #005fa3;
}
</style>
