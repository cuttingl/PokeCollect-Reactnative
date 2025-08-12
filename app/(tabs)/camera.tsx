import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import PermissionScreen from '@/components/PermissionScreen';
import TextRecognition, { TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import React, { useState, useRef, useCallback } from 'react';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const camera = useRef<Camera>(null);
  const [processing, setProcessing] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const focusOpacity = useSharedValue(0);
  const focusScale = useSharedValue(1);

  const saveRecognizedText = async (text: string) => {
    try {
      const existingTexts = await AsyncStorage.getItem('recognizedTexts');
      const texts = existingTexts ? JSON.parse(existingTexts) : [];
      const newEntry = {
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };
      texts.push(newEntry);
      await AsyncStorage.setItem('recognizedTexts', JSON.stringify(texts));
      router.push('/(tabs)');
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  const focus = useCallback((point: { x: number; y: number }) => {
    const c = camera.current;
    if (c == null) return;

    setFocusPoint(point);
    focusOpacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 1000 })
    );
    focusScale.value = withSequence(
      withTiming(1.5, { duration: 100 }),
      withTiming(1, { duration: 200 })
    );

    c.focus(point);
  }, []);

  const recognizeText = async () => {
    if (camera.current && !processing) {
      try {
        setProcessing(true);
        const photo = await camera.current.takePhoto({
          flash: 'off',
        });
        const result: TextRecognitionResult = await TextRecognition.recognize(`file://${photo.path}`);
        if (result.text.trim()) {
          await saveRecognizedText(result.text);
        }
      } catch (error) {
        console.error('Text recognition error:', error);
      } finally {
        setProcessing(false);
      }
    }
  };

  const gesture = Gesture.Tap()
    .onEnd(({ x, y }) => {
      runOnJS(focus)({ x, y });
      runOnJS(recognizeText)();
    });

  const focusCircleStyle = useAnimatedStyle(() => {
    return {
      opacity: focusOpacity.value,
      transform: [{ scale: focusScale.value }],
    };
  });

  if (!hasPermission) {
    return <PermissionScreen onPress={requestPermission} />;
  }

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={styles.container}>
        <GestureDetector gesture={gesture}>
          <View style={styles.container}>
            {device && (
              <Camera
                ref={camera}
                style={styles.camera}
                device={device}
                isActive={true}
                photo={true}
              />
            )}

            {focusPoint && (
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    left: focusPoint.x - 40,
                    top: focusPoint.y - 40,
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    borderWidth: 2,
                    borderColor: 'white',
                    backgroundColor: 'transparent',
                  },
                  focusCircleStyle,
                ]}
              />
            )}

            {processing && (
              <View style={styles.processingOverlay}>
                <Text style={styles.processingText}>Processing...</Text>
              </View>
            )}
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  processingOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  processingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});