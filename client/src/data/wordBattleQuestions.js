// Local question bank for Word Battle (sample set: Easy, Medium, Hard)
const questions = [
  // Easy
  {
    id: 'wb-e-1',
    difficulty: 'easy',
    type: 'spelling',
    question: 'Choose the correct spelling',
    prompt: 'Which is the correct spelling?',
    options: ['Recieve', 'Receive', 'Receeve', 'Receve'],
    correctAnswer: 'Receive',
    explanation: 'Receive is spelled R-E-C-E-I-V-E.'
  },
  {
    id: 'wb-e-2',
    difficulty: 'easy',
    type: 'synonym',
    question: 'Pick the synonym of "happy"',
    options: ['Joyful', 'Angry', 'Tired', 'Quiet'],
    correctAnswer: 'Joyful'
  },
  {
    id: 'wb-e-3',
    difficulty: 'easy',
    type: 'antonym',
    question: 'Pick the antonym of "hot"',
    options: ['Warm', 'Cold', 'Boiling', 'Humid'],
    correctAnswer: 'Cold'
  },
  {
    id: 'wb-e-4',
    difficulty: 'easy',
    type: 'complete',
    question: 'Complete the sentence: "She ___ to school every day."',
    options: ['go', 'goes', 'going', 'gone'],
    correctAnswer: 'goes'
  },

  // Medium
  {
    id: 'wb-m-1',
    difficulty: 'medium',
    type: 'meaning',
    question: 'What does "reluctant" mean?',
    options: ['Eager', 'Unwilling', 'Delighted', 'Energetic'],
    correctAnswer: 'Unwilling'
  },
  {
    id: 'wb-m-2',
    difficulty: 'medium',
    type: 'synonym',
    question: 'Pick the synonym of "ancient"',
    options: ['Modern', 'Old', 'Fragile', 'Tiny'],
    correctAnswer: 'Old'
  },
  {
    id: 'wb-m-3',
    difficulty: 'medium',
    type: 'odd-one-out',
    question: 'Which word does not belong?',
    options: ['Apple', 'Banana', 'Carrot', 'Grapes'],
    correctAnswer: 'Carrot'
  },

  // Hard
  {
    id: 'wb-h-1',
    difficulty: 'hard',
    type: 'meaning',
    question: 'What does "ubiquitous" mean?',
    options: ['Rare', 'Everywhere', 'Hidden', 'Ancient'],
    correctAnswer: 'Everywhere'
  },
  {
    id: 'wb-h-2',
    difficulty: 'hard',
    type: 'confused',
    question: 'Choose the correct word: "Their/There/They\'re" going to the park.',
    options: ['Their', 'There', "They're", 'Thair'],
    correctAnswer: "They're"
  },
  {
    id: 'wb-h-3',
    difficulty: 'hard',
    type: 'synonym',
    question: 'Pick the synonym of "obstinate"',
    options: ['Stubborn', 'Polite', 'Weak', 'Flexible'],
    correctAnswer: 'Stubborn'
  }
]

export default questions
