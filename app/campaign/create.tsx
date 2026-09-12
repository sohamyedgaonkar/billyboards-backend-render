import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../../constants/Config';
import Colors from '../../constants/Colors';

const TIME_SLOTS = [
  { id: 'all_day', label: 'All Day', multiplier: 1 },
  { id: 'morning', label: 'Morning (6AM - 12PM)', multiplier: 0.6 },
  { id: 'prime', label: 'Prime Time (6PM - 11PM)', multiplier: 1.5 },
];

const SCHEDULES = [
  { id: '10x', label: '10x / day', multiplier: 1 },
  { id: '20x', label: '20x / day', multiplier: 1.8 },
  { id: '50x', label: '50x / day', multiplier: 4 },
];

export default function CreateCampaignScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campaign Configuration States
  const [days, setDays] = useState(7);
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [schedule, setSchedule] = useState(SCHEDULES[0]);

  const baseRate = 500; // Base rate in ₹

  // Calculate dynamic cost based on duration, time slot, and repetition
  const estimatedCost = Math.round(baseRate * days * timeSlot.multiplier * schedule.multiplier);

  const pickVideo = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleLaunch = async () => {
    if (!videoUri) return;
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('user_id', '1'); // Hardcoded user ID for now
      formData.append('location_id', 's1'); // Should come from params in real scenario, hardcoding s1 for demo
      formData.append('days', days.toString());
      formData.append('time_slot', timeSlot.id);
      formData.append('schedule', schedule.id);
      formData.append('total_cost', estimatedCost.toString());
      
      const filename = videoUri.split('/').pop() || 'video.mp4';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `video/${match[1]}` : `video`;
      
      formData.append('video', { uri: videoUri, name: filename, type } as any);
      
      const res = await fetch(`${API_URL}/campaigns`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      const json = await res.json();
      console.log("Campaign created:", json);
      router.replace('/(tabs)');
    } catch (err) {
      console.error("Failed to launch campaign", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configure Campaign</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Creative Assets</Text>
          <TouchableOpacity style={styles.uploadArea} onPress={pickVideo}>
            {videoUri ? (
              <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle" size={48} color={Colors.dark.tint} />
                <Text style={styles.uploadText}>Video Selected</Text>
              </View>
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={40} color={Colors.dark.tabIconDefault} />
                <Text style={styles.uploadText}>Tap to select MP4 from Gallery</Text>
                <Text style={styles.uploadSubtext}>Max size: 50MB</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Campaign Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Campaign Duration</Text>
          <View style={styles.durationSelector}>
            {[1, 3, 7, 14, 30].map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationPill, days === d && styles.durationPillActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[styles.durationText, days === d && styles.durationTextActive]}>{d}d</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Time of Play */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time of Play</Text>
          <View style={styles.optionsList}>
            {TIME_SLOTS.map(slot => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.optionRow, timeSlot.id === slot.id && styles.optionRowActive]}
                onPress={() => setTimeSlot(slot)}
              >
                <Text style={[styles.optionText, timeSlot.id === slot.id && styles.optionTextActive]}>
                  {slot.label}
                </Text>
                {timeSlot.id === slot.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.dark.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Repeated Schedule */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Play Frequency</Text>
          <View style={styles.optionsList}>
            {SCHEDULES.map(freq => (
              <TouchableOpacity
                key={freq.id}
                style={[styles.optionRow, schedule.id === freq.id && styles.optionRowActive]}
                onPress={() => setSchedule(freq)}
              >
                <Text style={[styles.optionText, schedule.id === freq.id && styles.optionTextActive]}>
                  {freq.label}
                </Text>
                {schedule.id === freq.id && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.dark.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>

      <View style={styles.stickyBottom}>
        <View style={styles.costRow}>
          <Text style={styles.costLabel}>Total Estimated Cost</Text>
          <Text style={styles.costValue}>₹{estimatedCost.toLocaleString('en-IN')}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.launchButton, (!videoUri || isSubmitting) && styles.launchButtonDisabled]} 
          onPress={handleLaunch}
          disabled={!videoUri || isSubmitting}
        >
          {isSubmitting ? (
            <Text style={styles.launchButtonText}>Launching...</Text>
          ) : (
            <>
              <Ionicons name="rocket-outline" size={20} color="#000" style={styles.launchIcon} />
              <Text style={styles.launchButtonText}>Pay & Launch Campaign</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  scrollContent: { flex: 1, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 32, marginTop: 40 },
  backButton: { marginRight: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 12 },
  uploadArea: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    borderRadius: 16,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: { alignItems: 'center' },
  uploadText: { color: Colors.dark.text, marginTop: 12, fontSize: 14, fontWeight: 'bold' },
  uploadSubtext: { color: Colors.dark.tabIconDefault, marginTop: 4, fontSize: 12 },
  durationSelector: { flexDirection: 'row', justifyContent: 'space-between' },
  durationPill: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  durationPillActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  durationText: { color: Colors.dark.tabIconDefault, fontWeight: 'bold' },
  durationTextActive: { color: '#000' },
  optionsList: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  optionRowActive: {
    backgroundColor: Colors.dark.tint,
  },
  optionText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextActive: {
    color: Colors.dark.background,
    fontWeight: 'bold',
  },
  stickyBottom: {
    backgroundColor: Colors.dark.surface,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  costLabel: { color: Colors.dark.tabIconDefault, fontSize: 14 },
  costValue: { color: Colors.dark.text, fontSize: 28, fontWeight: 'bold' },
  launchButton: {
    backgroundColor: Colors.dark.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  launchButtonDisabled: {
    opacity: 0.5,
  },
  launchIcon: { marginRight: 8 },
  launchButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});
