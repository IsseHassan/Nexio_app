import React, { useRef } from 'react';
import { View, Image, PanResponder, Animated, Text } from 'react-native';

const MAX_ROT_Y = 35;
const MAX_ROT_X = 25;

interface Props {
  imageUri: string;
  size: number;
}

export function Image3DViewer({ imageUri, size }: Props) {
  const rotY   = useRef(new Animated.Value(0)).current;
  const rotX   = useRef(new Animated.Value(0)).current;
  const scaleA = useRef(new Animated.Value(1)).current;

  const curY = useRef(0);
  const curX = useRef(0);
  const startY = useRef(0);
  const startX = useRef(0);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 3 || Math.abs(gs.dy) > 3,
      onPanResponderGrant: () => {
        startY.current = curY.current;
        startX.current = curX.current;
        Animated.spring(scaleA, { toValue: 1.03, useNativeDriver: false, speed: 40 }).start();
      },
      onPanResponderMove: (_, gs) => {
        const ny = Math.max(-MAX_ROT_Y, Math.min(MAX_ROT_Y, startY.current + gs.dx * 0.4));
        const nx = Math.max(-MAX_ROT_X, Math.min(MAX_ROT_X, startX.current - gs.dy * 0.3));
        curY.current = ny;
        curX.current = nx;
        rotY.setValue(ny);
        rotX.setValue(nx);
      },
      onPanResponderRelease: () => {
        Animated.parallel([
          Animated.spring(rotY,  { toValue: 0, useNativeDriver: false, friction: 6, tension: 80 }),
          Animated.spring(rotX,  { toValue: 0, useNativeDriver: false, friction: 6, tension: 80 }),
          Animated.spring(scaleA, { toValue: 1, useNativeDriver: false, friction: 6, tension: 60 }),
        ]).start(() => { curY.current = 0; curX.current = 0; });
      },
    })
  ).current;

  const ry = rotY.interpolate({ inputRange: [-MAX_ROT_Y, MAX_ROT_Y], outputRange: [`-${MAX_ROT_Y}deg`, `${MAX_ROT_Y}deg`] });
  const rx = rotX.interpolate({ inputRange: [-MAX_ROT_X, MAX_ROT_X], outputRange: [`-${MAX_ROT_X}deg`, `${MAX_ROT_X}deg`] });

  return (
    <View style={{ width: size, alignItems: 'center' }}>
      <Animated.View
        {...pan.panHandlers}
        style={{
          width: size, height: size, borderRadius: 16, overflow: 'hidden',
          transform: [{ perspective: 800 }, { rotateY: ry }, { rotateX: rx }, { scale: scaleA }],
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <Image source={{ uri: imageUri }} style={{ width: size, height: size }} resizeMode="cover" />
      </Animated.View>
      <Text style={{ color: 'rgba(0,0,0,0.28)', fontSize: 10, fontWeight: '600', marginTop: 8, letterSpacing: 0.4 }}>
        drag to rotate
      </Text>
    </View>
  );
}
