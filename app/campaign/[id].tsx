import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

const screenWidth = Dimensions.get('window').width;

const mockVideoSource = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

export default function CampaignDeepDiveScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isActive, setIsActive] = useState(true);

  const player = useVideoPlayer(mockVideoSource, player => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const toggleCampaignState = () => setIsActive(previousState => !previousState);

  const barData = {
    labels: ['10a', '12p', '2p', '4p', '6p', '8p'],
    datasets: [{
      data: [20, 45, 28, 80, 99, 43],
    }]
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Campaign Details</Text>
        </View>

        {/* Video Preview */}
        <View style={styles.videoContainer}>
          <VideoView 
            style={styles.video} 
            player={player}
            allowsFullscreen 
            allowsPictureInPicture 
          />
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, !isActive && { backgroundColor: Colors.dark.danger }]} />
            <Text style={styles.liveText}>{isActive ? 'LIVE PREVIEW' : 'PAUSED'}</Text>
          </View>
        </View>

        {/* Control Section */}
        <View style={styles.controlCard}>
          <View>
            <Text style={styles.controlTitle}>Edge Node Status</Text>
            <Text style={styles.controlSubtext}>{isActive ? 'Currently broadcasting to screen' : 'Transmission suspended'}</Text>
          </View>
          <Switch
            trackColor={{ false: Colors.dark.border, true: Colors.dark.tint }}
            thumbColor={Colors.dark.text}
            ios_backgroundColor={Colors.dark.border}
            onValueChange={toggleCampaignState}
            value={isActive}
          />
        </View>

        {/* Analytics Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Radar Audience Metrics (Today)</Text>
          <Text style={styles.sectionSubtitle}>Peak traffic observed during rush hours</Text>
          
          <BarChart
            data={barData}
            width={screenWidth - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix="k"
            chartConfig={{
              backgroundColor: Colors.dark.surface,
              backgroundGradientFrom: Colors.dark.surface,
              backgroundGradientTo: Colors.dark.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(227, 184, 115, ${opacity})`,
              labelColor: (opacity = 1) => Colors.dark.tabIconDefault,
              style: { borderRadius: 16 },
              barPercentage: 0.6,
            }}
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 40 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  liveBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.dark.success,
    marginRight: 6,
  },
  liveText: { color: '#fff', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  controlCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    padding: 20,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  controlTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 4 },
  controlSubtext: { fontSize: 12, color: Colors.dark.tabIconDefault },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, color: Colors.dark.tabIconDefault, marginBottom: 16 },
  chart: { borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
});
