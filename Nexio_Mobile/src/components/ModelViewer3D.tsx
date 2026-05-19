import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  glbUrl: string;
  height?: number;
}

export function ModelViewer3D({ glbUrl, height = 340 }: Props) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
  <script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #1A1412; width: 100vw; height: 100vh; overflow: hidden; }
    model-viewer {
      width: 100%;
      height: 100%;
      background-color: #1A1412;
      --poster-color: #1A1412;
    }
  </style>
</head>
<body>
  <model-viewer
    src="${glbUrl}"
    alt="3D product model"
    auto-rotate
    auto-rotate-delay="0"
    rotation-per-second="30deg"
    camera-controls
    touch-action="pan-y"
    shadow-intensity="1"
    environment-image="neutral"
    exposure="1"
    loading="eager"
  ></model-viewer>
</body>
</html>
`;

  return (
    <View style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1A1412' }}>
      <WebView
        source={{ html }}
        style={{ flex: 1, backgroundColor: '#1A1412' }}
        scrollEnabled={false}
        javaScriptEnabled
        originWhitelist={['*']}
        renderLoading={() => (
          <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1412' }}>
            <ActivityIndicator color="#E8664A" />
            <Text style={{ color: '#7A7A7A', fontSize: 12, marginTop: 10 }}>Loading 3D model…</Text>
          </View>
        )}
        startInLoadingState
      />
    </View>
  );
}
