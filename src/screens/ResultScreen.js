import React, { useCallback, useEffect, useRef, useState } from 'react';

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
} from 'react-native';

const API_URL = 'http://localhost:5000';

export default function ResultScreen({ route, navigation }) {
  const params = route?.params || {};

  const category =
    typeof params.category === 'string' ? params.category : 'General';

  const difficulty =
    typeof params.difficulty === 'string' ? params.difficulty : 'Medium';

  const customTopic =
    typeof params.customTopic === 'string' ? params.customTopic : '';

  const question = typeof params.question === 'string' ? params.question : '';

  const candidateAnswer =
    typeof params.candidateAnswer === 'string' ? params.candidateAnswer : '';

  const correctAnswer =
    typeof params.correctAnswer === 'string' ? params.correctAnswer : '';

  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState(null);
  const [error, setError] = useState('');

  // ==========================================================
  // ANIMATION VALUES
  // ==========================================================

  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  const progress = useRef(new Animated.Value(0)).current;

  // ==========================================================
  // HIDE NATIVE NAVIGATION HEADER
  // We use our own Result header.
  // ==========================================================

  useEffect(() => {
    if (navigation?.setOptions) {
      navigation.setOptions({
        headerShown: false,
      });
    }
  }, [navigation]);

  // ==========================================================
  // LOADING ANIMATION
  // ==========================================================

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 800,
          useNativeDriver: false,
        }),

        Animated.timing(pulse, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );

    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: false,
        }),

        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 800,
          useNativeDriver: false,
        }),
      ]),
    );

    const dotAnimation1 = Animated.loop(
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: -10,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.timing(dot1, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.delay(600),
      ]),
    );

    const dotAnimation2 = Animated.loop(
      Animated.sequence([
        Animated.delay(200),

        Animated.timing(dot2, {
          toValue: -10,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.timing(dot2, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.delay(400),
      ]),
    );

    const dotAnimation3 = Animated.loop(
      Animated.sequence([
        Animated.delay(400),

        Animated.timing(dot3, {
          toValue: -10,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.timing(dot3, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),

        Animated.delay(200),
      ]),
    );

    const progressAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: false,
        }),

        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ]),
    );

    pulseAnimation.start();
    opacityAnimation.start();
    dotAnimation1.start();
    dotAnimation2.start();
    dotAnimation3.start();
    progressAnimation.start();

    return () => {
      pulseAnimation.stop();
      opacityAnimation.stop();
      dotAnimation1.stop();
      dotAnimation2.stop();
      dotAnimation3.stop();
      progressAnimation.stop();
    };
  }, [pulse, opacity, dot1, dot2, dot3, progress]);

  // ==========================================================
  // AI REVIEW
  // ==========================================================

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      console.log('==============================');
      console.log('REQUESTING AI REVIEW');
      console.log('Category:', category);
      console.log('Difficulty:', difficulty);
      console.log('Custom Topic:', customTopic);
      console.log('Question:', question);
      console.log('Candidate Answer:', candidateAnswer);
      console.log('Correct Answer:', correctAnswer);
      console.log('==============================');

      if (!question.trim()) {
        throw new Error('Interview question is missing.');
      }

      if (!candidateAnswer.trim()) {
        throw new Error('Please provide an answer before viewing the result.');
      }

      const response = await fetch(`${API_URL}/review-answer`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          category,
          difficulty,
          customTopic,
          question,
          candidateAnswer,
          correctAnswer,
        }),
      });

      console.log('Review HTTP status:', response.status);

      const responseText = await response.text();

      console.log('Review raw response:', responseText);

      let data;

      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON PARSE ERROR:', jsonError);

        throw new Error('Backend returned invalid JSON.');
      }

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || `Backend error: ${response.status}`,
        );
      }

      let result = data?.review || data;

      // Sometimes the AI/backend may return
      // the review as a JSON string.

      if (
        result &&
        typeof result === 'object' &&
        typeof result.answer === 'string' &&
        result.score === undefined
      ) {
        try {
          const parsedAnswer = JSON.parse(result.answer);

          if (parsedAnswer && typeof parsedAnswer === 'object') {
            result = parsedAnswer;
          }
        } catch {
          // Keep original result.
        }
      }

      if (!result || typeof result !== 'object') {
        throw new Error('Invalid review data received from AI.');
      }

      console.log('FINAL REVIEW DATA:', result);

      setReview(result);
    } catch (err) {
      console.error('RESULT SCREEN ERROR:', err);

      setError(err?.message || 'Unable to analyze your answer.');
    } finally {
      setLoading(false);
    }
  }, [
    category,
    difficulty,
    customTopic,
    question,
    candidateAnswer,
    correctAnswer,
  ]);

  // ==========================================================
  // START REVIEW
  // ==========================================================

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  // ==========================================================
  // HELPERS
  // ==========================================================

  function cleanText(value) {
    if (value === null || value === undefined) {
      return '';
    }

    return String(value)
      .replace(/```[\s\S]*?```/g, '')
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*/g, '')
      .replace(/__/g, '')
      .replace(/`/g, '')
      .replace(/\|/g, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .trim();
  }

  function getArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim()) {
      return [value];
    }

    return [];
  }

  function getScore() {
    const value = Number(review?.score ?? review?.ratingScore ?? 0);

    if (!Number.isFinite(value)) {
      return 0;
    }

    return Math.max(0, Math.min(10, value));
  }

  function getRating() {
    return review?.rating || review?.overallRating || 'Needs Improvement';
  }

  function getFeedback() {
    return (
      review?.feedback ||
      review?.overallFeedback ||
      review?.suggestions ||
      'Keep practicing and try to give a more complete answer.'
    );
  }

  const score = getScore();

  const percentage = Math.round(score * 10);

  const strengths = getArray(review?.strengths);

  const weaknesses = getArray(review?.weaknesses);

  const topicsToImprove = getArray(review?.topicsToImprove);

  const recommendedTopics = getArray(review?.recommendedTopics);

  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    const animatedProgressWidth = progress.interpolate({
      inputRange: [0, 1],
      outputRange: ['5%', '95%'],
    });

    return (
      <View style={styles.page}>
        <ResultHeader navigation={navigation} />

        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.aiCircleOuter,
              {
                opacity,
                transform: [
                  {
                    scale: pulse,
                  },
                ],
              },
            ]}
          >
            <View style={styles.aiCircleInner}>
              <Text style={styles.aiText}>AI</Text>
            </View>
          </Animated.View>

          <View style={styles.dotsContainer}>
            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateY: dot1,
                    },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateY: dot2,
                    },
                  ],
                },
              ]}
            />

            <Animated.View
              style={[
                styles.dot,
                {
                  transform: [
                    {
                      translateY: dot3,
                    },
                  ],
                },
              ]}
            />
          </View>

          <Text style={styles.loadingTitle}>Analyzing your answer</Text>

          <Text style={styles.loadingText}>
            AI is reviewing your interview answer and preparing your performance
            feedback.
          </Text>

          <View style={styles.loadingProgressBackground}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  width: animatedProgressWidth,
                },
              ]}
            />
          </View>

          <Text style={styles.waitText}>Evaluating your response...</Text>
        </View>
      </View>
    );
  }

  // ==========================================================
  // ERROR SCREEN
  // ==========================================================

  if (error) {
    return (
      <View style={styles.page}>
        <ResultHeader navigation={navigation} />

        <View style={styles.errorContainer}>
          <View style={styles.errorCircle}>
            <Text style={styles.errorIcon}>!</Text>
          </View>

          <Text style={styles.errorTitle}>Unable to analyze answer</Text>

          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity style={styles.primaryButton} onPress={loadReview}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ==========================================================
  // RESULT CONTENT
  // ==========================================================

  const resultContent = (
    <>
      {/* COMPLETED CARD */}

      <View style={styles.completedCard}>
        <View style={styles.checkCircle}>
          <Text style={styles.checkText}>✓</Text>
        </View>

        <View style={styles.completedTextContainer}>
          <Text style={styles.completedTitle}>Interview Answer Reviewed</Text>

          <Text style={styles.completedSubtitle}>
            AI has evaluated your {category} answer.
          </Text>
        </View>
      </View>

      {/* SCORE CARD */}

      <View style={styles.scoreCard}>
        <Text style={styles.smallLabel}>Your Score</Text>

        <View style={styles.scoreRow}>
          <Text style={styles.scoreNumber}>{score}</Text>

          <Text style={styles.scoreOutOf}>/ 10</Text>
        </View>

        <Text style={styles.percentage}>{percentage}%</Text>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progress,
              {
                width: `${percentage}%`,
              },
            ]}
          />
        </View>

        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>{cleanText(getRating())}</Text>
        </View>
      </View>

      {/* QUESTION */}

      {question ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Interview Question</Text>

          <Text style={styles.questionText}>{cleanText(question)}</Text>
        </View>
      ) : null}

      {/* YOUR ANSWER */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Answer</Text>

        <View style={styles.answerBox}>
          <Text style={styles.answerText}>{cleanText(candidateAnswer)}</Text>
        </View>
      </View>

      {/* CORRECT ANSWER */}

      {correctAnswer ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Correct / Ideal Answer</Text>

          <View style={styles.correctAnswerBox}>
            <Text style={styles.correctAnswerText}>
              {cleanText(correctAnswer)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* PERFORMANCE */}

      <Text style={styles.mainSectionTitle}>Performance Review</Text>

      {/* STRENGTHS */}

      <ReviewCard
        icon="✓"
        title="Strengths"
        items={strengths}
        empty="No specific strengths were identified."
        cleanText={cleanText}
      />

      {/* WEAKNESSES */}

      <ReviewCard
        icon="↑"
        title="Areas to Improve"
        items={weaknesses}
        empty="No major weaknesses were identified."
        cleanText={cleanText}
      />

      {/* TOPICS TO IMPROVE */}

      <View style={styles.reviewCard}>
        <Text style={styles.reviewIcon}>📚</Text>

        <Text style={styles.reviewTitle}>Topics You Should Improve</Text>

        {topicsToImprove.length > 0 ? (
          topicsToImprove.map((item, index) => (
            <View key={`topic-${index}`} style={styles.topicBox}>
              <View style={styles.topicNumber}>
                <Text style={styles.topicNumberText}>{index + 1}</Text>
              </View>

              <Text style={styles.topicText}>{cleanText(item)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Continue practicing the current topic.
          </Text>
        )}
      </View>

      {/* RECOMMENDED TOPICS */}

      <ReviewCard
        icon="★"
        title="Recommended Topics"
        items={recommendedTopics}
        empty={`Keep practicing ${category} interview questions.`}
        cleanText={cleanText}
      />

      {/* AI FEEDBACK */}

      <View style={styles.feedbackCard}>
        <Text style={styles.feedbackTitle}>AI Feedback</Text>

        <Text style={styles.feedbackText}>{cleanText(getFeedback())}</Text>
      </View>

      {/* PRACTICE AGAIN */}

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() =>
          navigation.navigate('Interview', {
            category,
            difficulty,
            customTopic,
          })
        }
      >
        <Text style={styles.primaryButtonText}>Practice Another Question</Text>
      </TouchableOpacity>

      {/* HOME */}

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.secondaryButtonText}>Back to Home</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpace} />
    </>
  );

  // ==========================================================
  // FINAL RESULT SCREEN
  //
  // IMPORTANT:
  // On Web we use View + overflowY.
  // This avoids the blank ScrollView problem.
  //
  // On Android/iOS we continue using ScrollView.
  // ==========================================================

  return (
    <View style={styles.page}>
      <ResultHeader navigation={navigation} />

      {Platform.OS === 'web' ? (
        <View style={styles.webScroll}>
          <View style={styles.content}>{resultContent}</View>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator
        >
          {resultContent}
        </ScrollView>
      )}
    </View>
  );
}

// ============================================================
// RESULT HEADER
// ============================================================

function ResultHeader({ navigation }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Result</Text>
    </View>
  );
}

// ============================================================
// REVIEW CARD
// ============================================================

function ReviewCard({ icon, title, items, empty, cleanText }) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewIcon}>{icon}</Text>

      <Text style={styles.reviewTitle}>{title}</Text>

      {items.length > 0 ? (
        items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.listRow}>
            <Text style={styles.bullet}>•</Text>

            <Text style={styles.listText}>{cleanText(item)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>{empty}</Text>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // PAGE
  // ==========================================================

  page: {
    flex: 1,
    minHeight: '100vh',
    backgroundColor: '#f5f7fb',
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 58,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#111827',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scroll: {
    flex: 1,
  },

  webScroll: {
    flex: 1,
    minHeight: 0,
    height: 'calc(100vh - 58px)',
    overflowY: 'auto',
    overflowX: 'hidden',
  },

  content: {
    width: '100%',
    maxWidth: 950,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  aiCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },

  aiText: {
    color: '#ffffff',
    fontSize: 21,
    fontWeight: '800',
  },

  dotsContainer: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2563eb',
    marginHorizontal: 5,
  },

  loadingTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginTop: 6,
    textAlign: 'center',
  },

  loadingText: {
    maxWidth: 560,
    marginTop: 12,
    fontSize: 16,
    lineHeight: 25,
    color: '#64748b',
    textAlign: 'center',
  },

  loadingProgressBackground: {
    width: '80%',
    maxWidth: 500,
    height: 7,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginTop: 30,
  },

  loadingProgress: {
    height: 7,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },

  waitText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94a3b8',
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorContainer: {
    flex: 1,
    minHeight: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },

  errorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorIcon: {
    fontSize: 30,
    fontWeight: '800',
    color: '#dc2626',
  },

  errorTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginTop: 18,
    textAlign: 'center',
  },

  errorText: {
    maxWidth: 650,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    color: '#64748b',
    textAlign: 'center',
  },

  // ==========================================================
  // COMPLETED CARD
  // ==========================================================

  completedCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  checkCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  checkText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#16a34a',
  },

  completedTextContainer: {
    flex: 1,
  },

  completedTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },

  completedSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },

  // ==========================================================
  // SCORE
  // ==========================================================

  scoreCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginBottom: 22,
  },

  smallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },

  scoreNumber: {
    fontSize: 58,
    fontWeight: '800',
    color: '#2563eb',
  },

  scoreOutOf: {
    fontSize: 22,
    color: '#64748b',
    marginLeft: 5,
  },

  percentage: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginTop: -3,
  },

  progressBackground: {
    width: '90%',
    maxWidth: 700,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginTop: 20,
  },

  progress: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563eb',
  },

  ratingBadge: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
  },

  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },

  // ==========================================================
  // GENERAL CARDS
  // ==========================================================

  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },

  questionText: {
    fontSize: 16,
    lineHeight: 25,
    color: '#374151',
  },

  answerBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 16,
  },

  answerText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },

  correctAnswerBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 10,
    padding: 16,
  },

  correctAnswerText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#166534',
  },

  // ==========================================================
  // PERFORMANCE REVIEW
  // ==========================================================

  mainSectionTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 14,
    marginTop: 5,
  },

  reviewCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },

  reviewIcon: {
    fontSize: 22,
    color: '#2563eb',
    marginBottom: 7,
  },

  reviewTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },

  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 7,
  },

  bullet: {
    fontSize: 18,
    lineHeight: 22,
    color: '#2563eb',
    marginRight: 8,
  },

  listText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: '#475569',
  },

  topicBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 9,
    padding: 12,
    marginTop: 8,
  },

  topicNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  topicNumberText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  topicText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
  },

  // ==========================================================
  // AI FEEDBACK
  // ==========================================================

  feedbackCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },

  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e40af',
    marginBottom: 10,
  },

  feedbackText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
  },

  // ==========================================================
  // BUTTONS
  // ==========================================================

  primaryButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2563eb',
  },

  bottomSpace: {
    height: 30,
  },
});
