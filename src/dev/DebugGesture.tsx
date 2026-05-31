import React, { useState } from 'react';
import { View, TouchableWithoutFeedback } from 'react-native';

interface Props {
  children: React.ReactNode;
  onDoubleTap: () => void;
}

export function DebugGesture({ children, onDoubleTap }: Props) {
  const [lastTap, setLastTap] = useState(0);

  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (now - lastTap < DOUBLE_PRESS_DELAY) {
      onDoubleTap();
      setLastTap(0); // Reset after success
    } else {
      setLastTap(now);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}
