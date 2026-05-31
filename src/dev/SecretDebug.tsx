import React, { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';

interface Props {
  onUnlock: () => void;
}

export function SecretDebug({ onUnlock }: Props) {
  const [code, setCode] = useState('');

  const handleTextChange = (text: string) => {
    setCode(text);
    if (text === '12345') {
      setCode('');
      onUnlock();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.hiddenInput}
        value={code}
        onChangeText={handleTextChange}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={true}
        placeholder="."
        placeholderTextColor="rgba(255,255,255,0.01)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    opacity: 0.1, // Almost invisible
    zIndex: 9999,
  },
  hiddenInput: {
    width: '100%',
    height: '100%',
    color: 'transparent',
  }
});
