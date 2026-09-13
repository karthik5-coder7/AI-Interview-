import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';

const categories = [
  'Java',
  'Python',
  'JavaScript',
  'SQL',
  'React',
  'React Native',
  'Data Structures',
  'DBMS',
  'Operating Systems',
  'Computer Networks',
  'Power BI',
  'HTML',
  'CSS',
  'Full Stack Development',
  'Other / Custom',
];

const difficulties = [
  {
    name: 'Easy',
    description: 'Basic concepts and beginner questions',
  },
  {
    name: 'Medium',
    description: 'Intermediate technical and practical questions',
  },
  {
    name: 'Hard',
    description: 'Advanced and challenging questions',
  },
];

export default function HomeScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [customTopic, setCustomTopic] = useState('');

  const isCustomCategory = selectedCategory === 'Other / Custom';

  const selectCategory = category => {
    setSelectedCategory(category);
    setSelectedDifficulty('');

    /*
     * Clear the custom topic when switching
     * back to a normal category.
     */
    if (category !== 'Other / Custom') {
      setCustomTopic('');
    }
  };

  const selectDifficulty = difficulty => {
    setSelectedDifficulty(difficulty);
  };

  const startInterview = () => {
    const topic = customTopic.trim();

    /*
     * Category is required.
     */
    if (!selectedCategory) {
      return;
    }

    /*
     * Difficulty is required.
     */
    if (!selectedDifficulty) {
      return;
    }

    /*
     * Other / Custom requires a topic.
     */
    if (isCustomCategory && !topic) {
      return;
    }

    navigation.navigate('Interview', {
      category: selectedCategory,
      difficulty: selectedDifficulty,
      customTopic: topic,
    });
  };

  /*
   * A normal category does not require a custom topic.
   * Other / Custom requires one.
   */
  const canStart =
    selectedCategory !== '' &&
    selectedDifficulty !== '' &&
    (!isCustomCategory || customTopic.trim() !== '');

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.container}>
          {/* ================================
              HEADER
          ================================= */}

          <Text style={styles.title}>AI Interview</Text>

          <Text style={styles.subtitle}>
            Practice technical interviews with AI. Choose your category and
            difficulty, or search for any custom topic.
          </Text>

          {/* ================================
              CATEGORY
          ================================= */}

          <Text style={styles.sectionTitle}>1. Select Interview Category</Text>

          <View style={styles.categoryGrid}>
            {categories.map(category => {
              const selected = selectedCategory === category;

              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selected && styles.categoryButtonSelected,
                  ]}
                  onPress={() => selectCategory(category)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      selected && styles.categoryButtonTextSelected,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ================================
              CUSTOM TOPIC SEARCH
          ================================= */}

          {isCustomCategory ? (
            <View style={styles.customSection}>
              <Text style={styles.sectionTitle}>
                2. Search / Enter Your Topic
              </Text>

              <Text style={styles.customDescription}>
                Search for any technical topic you want to practice. It can be a
                topic that is not available in the categories above.
              </Text>

              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>🔎</Text>

                <TextInput
                  value={customTopic}
                  onChangeText={setCustomTopic}
                  placeholder="Example: Generative AI, AWS, Docker, Cyber Security..."
                  placeholderTextColor="#94a3b8"
                  style={styles.searchInput}
                  returnKeyType="done"
                />
              </View>

              <Text style={styles.examplesTitle}>
                You can search for topics such as:
              </Text>

              <View style={styles.exampleRow}>
                {[
                  'Generative AI',
                  'Machine Learning',
                  'AWS',
                  'Docker',
                  'Cyber Security',
                  'System Design',
                ].map(topic => (
                  <TouchableOpacity
                    key={topic}
                    style={styles.exampleChip}
                    onPress={() => setCustomTopic(topic)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.exampleChipText}>{topic}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* ================================
              DIFFICULTY
          ================================= */}

          {selectedCategory ? (
            <View style={styles.difficultySection}>
              <Text style={styles.sectionTitle}>
                {isCustomCategory ? '3' : '2'}. Select Difficulty
              </Text>

              <View style={styles.difficultyList}>
                {difficulties.map(difficulty => {
                  const selected = selectedDifficulty === difficulty.name;

                  return (
                    <TouchableOpacity
                      key={difficulty.name}
                      style={[
                        styles.difficultyCard,
                        selected && styles.difficultyCardSelected,
                      ]}
                      onPress={() => selectDifficulty(difficulty.name)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.radioOuter,
                          selected && styles.radioOuterSelected,
                        ]}
                      >
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>

                      <View style={styles.difficultyInfo}>
                        <Text
                          style={[
                            styles.difficultyName,
                            selected && styles.difficultyNameSelected,
                          ]}
                        >
                          {difficulty.name}
                        </Text>

                        <Text style={styles.difficultyDescription}>
                          {difficulty.description}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* ================================
              SELECTION SUMMARY
          ================================= */}

          {selectedCategory ? (
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Your Selection</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Category</Text>

                <Text style={styles.summaryValue}>{selectedCategory}</Text>
              </View>

              {isCustomCategory && customTopic.trim() ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Topic</Text>

                  <Text style={styles.summaryValue}>{customTopic.trim()}</Text>
                </View>
              ) : null}

              {selectedDifficulty ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Difficulty</Text>

                  <Text style={styles.summaryValue}>{selectedDifficulty}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Select a category above to continue.
              </Text>
            </View>
          )}

          {/* ================================
              START INTERVIEW
          ================================= */}

          {selectedCategory ? (
            <View style={styles.startSection}>
              {!selectedDifficulty ? (
                <Text style={styles.helperText}>
                  Select a difficulty to start your interview.
                </Text>
              ) : isCustomCategory && !customTopic.trim() ? (
                <Text style={styles.helperText}>
                  Enter a topic above before starting the interview.
                </Text>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.startButton,
                  !canStart && styles.startButtonDisabled,
                ]}
                onPress={startInterview}
                disabled={!canStart}
                activeOpacity={0.8}
              >
                <Text style={styles.startButtonText}>Start AI Interview</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.bottomSpace} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#ffffff',

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
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 25,
    paddingTop: 55,
  },

  /* ================================
     HEADER
  ================================= */

  title: {
    fontSize: 46,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    lineHeight: 28,
    color: '#64748b',
    marginBottom: 48,
    maxWidth: 850,
  },

  /* ================================
     SECTION
  ================================= */

  sectionTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 22,
  },

  /* ================================
     CATEGORY
  ================================= */

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },

  categoryButton: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },

  categoryButtonSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },

  categoryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#24416d',
  },

  categoryButtonTextSelected: {
    color: '#ffffff',
  },

  /* ================================
     CUSTOM TOPIC
  ================================= */

  customSection: {
    marginTop: 20,
    marginBottom: 25,
    padding: 25,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe4ef',
    borderRadius: 16,
  },

  customDescription: {
    fontSize: 16,
    lineHeight: 25,
    color: '#64748b',
    marginBottom: 18,
    maxWidth: 850,
  },

  searchBox: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    marginBottom: 18,
  },

  searchIcon: {
    fontSize: 21,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    minHeight: 58,
    fontSize: 16,
    color: '#111827',
    outlineStyle: 'none',
  },

  examplesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
  },

  exampleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  exampleChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginRight: 8,
    marginBottom: 8,
  },

  exampleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },

  /* ================================
     DIFFICULTY
  ================================= */

  difficultySection: {
    marginTop: 20,
    marginBottom: 20,
  },

  difficultyList: {
    width: '100%',
  },

  difficultyCard: {
    minHeight: 90,
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },

  difficultyCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },

  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  radioOuterSelected: {
    borderColor: '#2563eb',
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2563eb',
  },

  difficultyInfo: {
    flex: 1,
  },

  difficultyName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 5,
  },

  difficultyNameSelected: {
    color: '#2563eb',
  },

  difficultyDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: '#64748b',
  },

  /* ================================
     SUMMARY
  ================================= */

  summaryBox: {
    marginTop: 20,
    padding: 22,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  summaryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 15,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },

  summaryLabel: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
    marginRight: 20,
  },

  summaryValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    color: '#111827',
    fontWeight: '700',
  },

  infoBox: {
    marginTop: 20,
    minHeight: 72,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  infoText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },

  /* ================================
     START BUTTON
  ================================= */

  startSection: {
    marginTop: 25,
  },

  helperText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b',
    marginBottom: 12,
  },

  startButton: {
    width: '100%',
    minHeight: 64,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },

  startButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },

  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 60,
  },
});
