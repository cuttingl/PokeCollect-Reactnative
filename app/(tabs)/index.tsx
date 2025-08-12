import { StyleSheet, Platform, FlatList, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from '@/components/Themed';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface RecognizedTextEntry {
  text: string;
  timestamp: string;
}

export default function TabOneScreen() {
  const [recognizedTexts, setRecognizedTexts] = useState<RecognizedTextEntry[]>([]);

  const loadRecognizedTexts = async () => {
    try {
      const stored = await AsyncStorage.getItem('recognizedTexts');
      if (stored) {
        const texts = JSON.parse(stored);
        // Sort by timestamp, newest first
        const sortedTexts = texts.sort((a: RecognizedTextEntry, b: RecognizedTextEntry) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setRecognizedTexts(sortedTexts);
      }
    } catch (error) {
      console.error('Error loading texts:', error);
    }
  };

  const clearAllTexts = async () => {
    Alert.alert(
      'Clear All',
      'Are you sure you want to clear all recognized texts?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('recognizedTexts');
              setRecognizedTexts([]);
            } catch (error) {
              console.error('Error clearing texts:', error);
            }
          },
        },
      ]
    );
  };

  const deleteItem = async (index: number) => {
    try {
      const updatedTexts = recognizedTexts.filter((_, i) => i !== index);
      await AsyncStorage.setItem('recognizedTexts', JSON.stringify(updatedTexts));
      setRecognizedTexts(updatedTexts);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRecognizedTexts();
    }, [])
  );

  const renderTextItem = ({ item, index }: { item: RecognizedTextEntry; index: number }) => (
    <TouchableOpacity
      style={styles.textItem}
      onLongPress={() => deleteItem(index)}
    >
      <Text style={styles.textContent}>{item.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recognized Texts</Text>
      {recognizedTexts.length > 0 && (
        <TouchableOpacity style={styles.clearButton} onPress={clearAllTexts}>
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      )}
      
      {recognizedTexts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No texts recognized yet</Text>
          <Text style={styles.instructionText}>Go to Camera tab and tap to scan text</Text>
        </View>
      ) : (
        <FlatList
          data={recognizedTexts}
          renderItem={renderTextItem}
          keyExtractor={(_, index) => index.toString()}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
      
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  clearButton: {
    backgroundColor: '#ff4444',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  textItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  textContent: {
    fontSize: 16,
    marginBottom: 5,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 10,
    opacity: 0.7,
  },
  instructionText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
});
