import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, SINGLE_CHARS, DOUBLE_CHAR_COMBOS, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode, QuizMode } from '../types'

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizMode = ref<QuizMode>('single')
  const quizChar = ref('')
  const selectedDotsList = ref<number[][]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    const first = selectedDotsList.value[0] || []
    return brailleToText(first)
  }

  function setQuizMode(mode: QuizMode) {
    quizMode.value = mode
    quizChar.value = ''
    selectedDotsList.value = []
  }

  function generateQuiz() {
    if (quizMode.value === 'single') {
      quizChar.value = SINGLE_CHARS[Math.floor(Math.random() * SINGLE_CHARS.length)]
    } else {
      quizChar.value = DOUBLE_CHAR_COMBOS[Math.floor(Math.random() * DOUBLE_CHAR_COMBOS.length)]
    }
    selectedDotsList.value = Array.from({ length: quizChar.value.length }, () => [])
  }

  function toggleDot(charIndex: number, dot: number) {
    if (!selectedDotsList.value[charIndex]) return
    const idx = selectedDotsList.value[charIndex].indexOf(dot)
    if (idx >= 0) selectedDotsList.value[charIndex].splice(idx, 1)
    else selectedDotsList.value[charIndex].push(dot)
  }

  function checkQuizAnswer() {
    const expectedDots = textToBraille(quizChar.value)
    let allCorrect = true
    for (let i = 0; i < expectedDots.length; i++) {
      const actual = selectedDotsList.value[i] || []
      const expected = expectedDots[i] || []
      if (JSON.stringify([...actual].sort()) !== JSON.stringify([...expected].sort())) {
        allCorrect = false
        break
      }
    }
    score.value.total++
    if (allCorrect) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct: allCorrect })
    if (navigator.vibrate) navigator.vibrate(allCorrect ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  return {
    inputText, brailleOutput, learnMode, quizMode, quizChar, selectedDotsList, score, history,
    brailleUnicode, translate, reverseTranslate, setQuizMode, generateQuiz, toggleDot,
    checkQuizAnswer, resetScore, exportPDF
  }
})
