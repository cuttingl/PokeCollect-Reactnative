import { StyleSheet, Button, TouchableOpacity } from 'react-native';
import { Text, View } from '@/components/Themed';
import PermissionScreen from '@/components/PermissionScreen';
import TextRecognition, {TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import React, { useState, useRef, useCallback } from 'react';
import {Gesture, GestureDetector, GestureHandlerRootView} from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const camera = useRef<Camera>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  const focus = useCallback((point: { x: number; y: number }) => {
    const c = camera.current;
    if (c == null) return;
    c.focus(point);
  }, []);

  const gesture = Gesture.Tap()
    .onEnd(({ x, y }) => {
      runOnJS(focus)({ x, y });
    });

  const recognizeText = async () => {
    if (camera.current && !processing) {
      try {
        setProcessing(true);
        
        // Take a photo
        const photo = await camera.current.takePhoto({
          flash: 'off',
        });
        // Process the image
        const result: TextRecognitionResult = await  TextRecognition.recognize(`file://${photo.path}`);
        // Update state with the recognized text
        setRecognizedText(result.text);
      } catch (error) {
        console.error('Text recognition error:', error);
        setRecognizedText('Error recognizing text');
      } finally {
        setProcessing(false);
      }
    }
  };

  if (!hasPermission) {
    return <PermissionScreen onPress={requestPermission} />;
  }

  if (device == null) {
    return (
      <View style={styles.container}>
        <Text>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GestureHandlerRootView>

        <GestureDetector gesture={gesture}>
          <Camera
            ref={camera}
            style={styles.camera}
            device={device}
            isActive={true}
            photo={true}
          />
        </GestureDetector>
      </GestureHandlerRootView>


      <View style={styles.controlsContainer}>
      <TouchableOpacity style={styles.custombuttonview}
          onPress={() => recognizeText()}>
          <Text style={styles.buttonText}>Scan Text</Text>
        </TouchableOpacity>

        <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />

        <TouchableOpacity style={styles.custombuttonview}
          onPress={() => setRecognizedText('')}>
          <Text style={styles.buttonText}>Clear Scanned Text</Text>
        </TouchableOpacity>
        
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Recognized Text:</Text>
          <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
          <Text>{recognizedText || "No text recognized yet"}</Text>
        </View>
      </View>
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
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  separator: {
    marginVertical: 3,
    height: 1,
    width: '100%',
  },

  custombuttonview: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor:"#007AFF",
  },

  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});