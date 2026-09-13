import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';

/* =========================================================
   CONFIG
========================================================= */

const API_URL =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? 'https://ai-interview-bhta.onrender.com'
    : 'http://localhost:5000';

/* =========================================================
   CLEAN AI TEXT
========================================================= */

function cleanMarkdown(text) {
  if (!text) {
    return '';
  }

  return String(text)
    .replace(/```[\w-]*\s*/g, '')
    .replace(/```/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\|/g, ' ')
    .replace(/^\s*[-*+]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* =========================================================
   BROWSER VOICE SUPPORT
========================================================= */

function getBrowserSpeechRecognition() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  const browser = window;

  return browser.SpeechRecognition || browser.webkitSpeechRecognition || null;
}

/* =========================================================
   INTERVIEW SCREEN
========================================================= */

export default function InterviewScreen({ route, navigation }) {
  const params = route?.params || {};

  const category =
    typeof params.category === 'string' ? params.category : 'General';

  const difficulty =
    typeof params.difficulty === 'string' ? params.difficulty : 'Medium';

  const customTopic =
    typeof params.customTopic === 'string' ? params.customTopic : '';

  /* =======================================================
     STATE
  ======================================================= */

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [loadingQuestion, setLoadingQuestion] = useState(true);
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  /* =======================================================
     REFS
  ======================================================= */

  const recognitionRef = useRef(null);
  const answerBeforeSpeechRef = useRef('');

  /* =======================================================
     CHECK VOICE SUPPORT
  ======================================================= */

  useEffect(() => {
    const recognition = getBrowserSpeechRecognition();

    setSpeechSupported(!!recognition);

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Nothing to do.
        }

        recognitionRef.current = null;
      }

      if (
        Platform.OS === 'web' &&
        typeof window !== 'undefined' &&
        window.speechSynthesis
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  /* =======================================================
     GENERATE QUESTION
  ======================================================= */

  const generateQuestion = useCallback(async () => {
    setLoadingQuestion(true);
    setError('');
    setQuestion('');
    setCorrectAnswer('');
    setAnswer('');

    try {
      const response = await fetch(`${API_URL}/generate-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          difficulty,
          customTopic,
        }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Backend returned invalid JSON.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server error ${response.status}`);
      }

      if (!data?.question) {
        throw new Error('AI did not return a question.');
      }

      setQuestion(cleanMarkdown(data.question));
    } catch (err) {
      console.error('QUESTION GENERATION ERROR:', err);

      setError(err?.message || 'Failed to generate question.');
    } finally {
      setLoadingQuestion(false);
    }
  }, [category, difficulty, customTopic]);

  /* =======================================================
     GENERATE QUESTION ON SCREEN LOAD
  ======================================================= */

  useEffect(() => {
    generateQuestion();
  }, [generateQuestion]);

  /* =======================================================
     STOP SPEAKING
  ======================================================= */

  const stopSpeaking = useCallback(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.speechSynthesis
    ) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  }, []);

  /* =======================================================
     STOP LISTENING
  ======================================================= */

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Already stopped.
      }

      recognitionRef.current = null;
    }

    setIsListening(false);
  }, []);

  /* =======================================================
     READ QUESTION
  ======================================================= */

  const readQuestion = () => {
    if (Platform.OS !== 'web') {
      setError('Voice reading is available in the web version.');
      return;
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setError('Voice reading is not supported by this browser.');
      return;
    }

    if (!question.trim()) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const Utterance = window.SpeechSynthesisUtterance;

      if (!Utterance) {
        setError('Voice reading is not supported.');
        return;
      }

      const speech = new Utterance(question);

      speech.lang = 'en-IN';
      speech.rate = 0.9;
      speech.pitch = 1;
      speech.volume = 1;

      speech.onstart = () => {
        setIsSpeaking(true);
        setError('');
      };

      speech.onend = () => {
        setIsSpeaking(false);
      };

      speech.onerror = () => {
        setIsSpeaking(false);
        setError('Unable to read the question.');
      };

      window.speechSynthesis.speak(speech);
    } catch (err) {
      console.error('QUESTION VOICE ERROR:', err);

      setIsSpeaking(false);
      setError('Unable to start voice reading.');
    }
  };

  /* =======================================================
     START VOICE ANSWER
  ======================================================= */

  const startListening = () => {
    if (Platform.OS !== 'web') {
      setError('Voice input is available in the web version.');
      return;
    }

    const SpeechRecognition = getBrowserSpeechRecognition();

    if (!SpeechRecognition) {
      setError('Voice input is not supported. Please use Chrome or Edge.');
      return;
    }

    if (recognitionRef.current) {
      stopListening();
    }

    setError('');

    answerBeforeSpeechRef.current = answer.trim();

    let recognition;

    try {
      recognition = new SpeechRecognition();
    } catch (err) {
      console.error('RECOGNITION ERROR:', err);

      setError('Could not create voice recognition.');

      return;
    }

    recognition.lang = 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');

      console.log('Microphone listening started.');
    };

    recognition.onresult = event => {
      let spokenText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          spokenText += event.results[i][0].transcript;
        }
      }

      spokenText = spokenText.trim();

      if (!spokenText) {
        return;
      }

      const previous = answerBeforeSpeechRef.current.trim();

      const newAnswer = previous ? `${previous} ${spokenText}` : spokenText;

      setAnswer(newAnswer);

      answerBeforeSpeechRef.current = newAnswer;
    };

    recognition.onerror = event => {
      console.error('MICROPHONE ERROR:', event);

      setIsListening(false);

      if (event.error === 'not-allowed') {
        setError(
          'Microphone permission was denied. Please allow microphone access.',
        );
      } else if (event.error === 'no-speech') {
        setError('No speech detected. Please try again.');
      } else if (event.error === 'audio-capture') {
        setError('Microphone was not found. Check your microphone.');
      } else {
        setError(`Voice input error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      recognitionRef.current = null;

      console.log('Microphone listening stopped.');
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.error('START MICROPHONE ERROR:', err);

      recognitionRef.current = null;

      setIsListening(false);

      setError('Could not start microphone.');
    }
  };

  /* =======================================================
     SHOW CORRECT ANSWER
  ======================================================= */

  const showCorrectAnswer = async () => {
    if (!answer.trim()) {
      setError('Please type or speak your answer first.');
      return;
    }

    stopListening();

    setLoadingAnswer(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/generate-correct-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          difficulty,
          customTopic,
          question,
        }),
      });

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Backend returned invalid JSON.');
      }

      if (!response.ok) {
        throw new Error(data?.error || `Server error ${response.status}`);
      }

      const idealAnswer = data?.answer || data?.correctAnswer || '';

      if (!idealAnswer) {
        throw new Error('AI did not return the correct answer.');
      }

      setCorrectAnswer(cleanMarkdown(idealAnswer));
    } catch (err) {
      console.error('CORRECT ANSWER ERROR:', err);

      setError(err?.message || 'Failed to generate correct answer.');
    } finally {
      setLoadingAnswer(false);
    }
  };

  /* =======================================================
     READ CORRECT ANSWER
  ======================================================= */

  const readCorrectAnswer = () => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !window.speechSynthesis ||
      !correctAnswer.trim()
    ) {
      return;
    }

    try {
      window.speechSynthesis.cancel();

      const Utterance = window.SpeechSynthesisUtterance;

      if (!Utterance) {
        return;
      }

      const speech = new Utterance(correctAnswer);

      speech.lang = 'en-IN';
      speech.rate = 0.9;
      speech.pitch = 1;
      speech.volume = 1;

      speech.onstart = () => {
        setIsSpeaking(true);
      };

      speech.onend = () => {
        setIsSpeaking(false);
      };

      speech.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(speech);
    } catch (err) {
      console.error('CORRECT ANSWER VOICE ERROR:', err);
    }
  };

  /* =======================================================
     SHOW RESULT
  ======================================================= */

  const showResult = () => {
    stopSpeaking();
    stopListening();

    navigation.navigate('Result', {
      category,
      difficulty,
      customTopic,
      question,
      candidateAnswer: answer,
      correctAnswer,
    });
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          {/* TITLE */}

          <Text style={styles.title}>{category} Interview</Text>

          {/* BADGES */}

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{difficulty}</Text>
            </View>

            {customTopic.trim() ? (
              <View style={styles.topicBadge}>
                <Text style={styles.topicText}>Topic: {customTopic}</Text>
              </View>
            ) : null}
          </View>

          {/* QUESTION CARD */}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interview Question</Text>

            {loadingQuestion ? (
              <Text style={styles.loadingText}>
                Generating your {difficulty.toLowerCase()} {category}{' '}
                question...
              </Text>
            ) : question ? (
              <View>
                <Text style={styles.questionText}>{question}</Text>

                {/* READ QUESTION */}

                {Platform.OS === 'web' ? (
                  <TouchableOpacity
                    style={
                      isSpeaking ? styles.stopVoiceButton : styles.readButton
                    }
                    onPress={isSpeaking ? stopSpeaking : readQuestion}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={
                        isSpeaking
                          ? styles.stopVoiceText
                          : styles.readButtonText
                      }
                    >
                      {isSpeaking
                        ? '\u23F9\uFE0F Stop Reading'
                        : '\uD83D\uDD0A Read Question'}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View>
                <Text style={styles.errorText}>
                  {error || 'Question could not be generated.'}
                </Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={generateQuestion}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ANSWER CARD */}

          {!loadingQuestion && question ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Your Answer</Text>

              <Text style={styles.answerHint}>
                Type your answer or use the microphone.
              </Text>

              {/* TEXT INPUT */}

              <TextInput
                value={answer}
                onChangeText={text => {
                  setAnswer(text);

                  if (!isListening) {
                    answerBeforeSpeechRef.current = text;
                  }
                }}
                placeholder="Type your interview answer here..."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
                style={styles.answerInput}
              />

              {/* MICROPHONE */}

              {Platform.OS === 'web' ? (
                <View>
                  <TouchableOpacity
                    style={
                      isListening ? styles.listeningButton : styles.speakButton
                    }
                    onPress={isListening ? stopListening : startListening}
                    disabled={!speechSupported && !isListening}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voiceIcon}>
                      {isListening ? '\u23F9\uFE0F' : '\uD83C\uDFA4'}
                    </Text>

                    <View style={styles.voiceInfo}>
                      <Text
                        style={
                          isListening
                            ? styles.listeningTitle
                            : styles.speakTitle
                        }
                      >
                        {isListening ? 'Stop Listening' : 'Speak Answer'}
                      </Text>

                      <Text
                        style={
                          isListening
                            ? styles.listeningSubtitle
                            : styles.speakSubtitle
                        }
                      >
                        {isListening
                          ? 'Listening... speak your answer'
                          : 'Click and speak your answer'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {!speechSupported ? (
                    <Text style={styles.voiceWarning}>
                      Voice input is not available in this browser. Please use
                      Chrome or Edge.
                    </Text>
                  ) : null}
                </View>
              ) : null}

              {/* SHOW CORRECT ANSWER */}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (!answer.trim() || loadingAnswer) && styles.disabledButton,
                ]}
                onPress={showCorrectAnswer}
                disabled={!answer.trim() || loadingAnswer}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {loadingAnswer
                    ? 'Generating Correct Answer...'
                    : 'Show Correct Answer'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ERROR */}

          {error && question ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {/* CORRECT ANSWER */}

          {correctAnswer ? (
            <View style={styles.correctCard}>
              <View style={styles.correctHeader}>
                <Text style={styles.correctTitle}>Correct / Ideal Answer</Text>

                {Platform.OS === 'web' ? (
                  <TouchableOpacity
                    style={styles.listenButton}
                    onPress={readCorrectAnswer}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.listenButtonText}>
                      {'\uD83D\uDD0A'} Listen
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.correctText}>{correctAnswer}</Text>
            </View>
          ) : null}

          {/* RESULT */}

          {correctAnswer ? (
            <TouchableOpacity
              style={styles.resultButton}
              onPress={showResult}
              activeOpacity={0.8}
            >
              <Text style={styles.resultButtonText}>
                View AI Interview Result
              </Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f5f7fb',

    ...(Platform.OS === 'web'
      ? {
          minHeight: 'calc(100vh - 60px)',
        }
      : {}),
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  container: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingTop: 35,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 15,
  },

  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 25,
  },

  badge: {
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    marginBottom: 8,
  },

  badgeText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '700',
  },

  topicBadge: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 8,
  },

  topicText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 22,
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 16,
  },

  questionText: {
    fontSize: 18,
    lineHeight: 29,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 20,
  },

  loadingText: {
    fontSize: 16,
    lineHeight: 25,
    color: '#64748b',
    paddingVertical: 20,
  },

  answerHint: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 12,
  },

  answerInput: {
    minHeight: 220,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    lineHeight: 25,
    color: '#111827',
    backgroundColor: '#ffffff',
    textAlignVertical: 'top',
    marginBottom: 15,

    ...(Platform.OS === 'web'
      ? {
          outlineStyle: 'none',
        }
      : {}),
  },

  readButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },

  readButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '800',
  },

  stopVoiceButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 5,
  },

  stopVoiceText: {
    color: '#dc2626',
    fontSize: 15,
    fontWeight: '800',
  },

  speakButton: {
    minHeight: 68,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  listeningButton: {
    minHeight: 68,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 8,
  },

  voiceIcon: {
    fontSize: 25,
    marginRight: 12,
  },

  voiceInfo: {
    flex: 1,
  },

  speakTitle: {
    color: '#166534',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },

  speakSubtitle: {
    color: '#4d7c5a',
    fontSize: 13,
  },

  listeningTitle: {
    color: '#dc2626',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },

  listeningSubtitle: {
    color: '#b45353',
    fontSize: 13,
  },

  voiceWarning: {
    color: '#dc2626',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },

  primaryButton: {
    width: '100%',
    minHeight: 58,
    backgroundColor: '#2563eb',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginTop: 12,
  },

  disabledButton: {
    backgroundColor: '#94a3b8',
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },

  correctCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 22,
    marginBottom: 18,
  },

  correctHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  correctTitle: {
    flex: 1,
    fontSize: 19,
    fontWeight: '800',
    color: '#166534',
  },

  correctText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#334155',
  },

  listenButton: {
    minHeight: 38,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  listenButtonText: {
    color: '#166534',
    fontSize: 13,
    fontWeight: '800',
  },

  resultButton: {
    width: '100%',
    minHeight: 62,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
  },

  resultButtonText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },

  errorText: {
    color: '#dc2626',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 15,
  },

  bottomSpace: {
    height: 50,
  },
});
