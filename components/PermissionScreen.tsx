import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';


interface PermissionScreenProps {
  onPress: () => void;
}

const PermissionScreen: React.FC<PermissionScreenProps> = ({ onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Camera permission is required to use this feature.</Text>
      <Button title="Grant Permission" onPress={onPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});

export default PermissionScreen;