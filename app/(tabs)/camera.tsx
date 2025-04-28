import { StyleSheet, Button } from 'react-native';
import { Text, View } from '@/components/Themed';
import PermissionScreen from '@/components/PermissionScreen';
import TextRecognition, {TextRecognitionResult } from '@react-native-ml-kit/text-recognition';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import React, { useState, useRef } from 'react';

export default function CameraScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const camera = useRef<Camera>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [processing, setProcessing] = useState(false);

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
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
      />
      
      <View style={styles.controlsContainer}>
        <Button 
          title={processing ? "Processing..." : "Scan Text"} 
          onPress={recognizeText}
          disabled={processing} 
        />
        
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
    marginVertical: 10,
    height: 1,
    width: '100%',
  },
});