import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundGradientFrom: Colors.dark.surface,
  backgroundGradientTo: Colors.dark.background,
  color: (opacity = 1) => `rgba(0, 255, 255, ${opacity})`, // Neon Cyan
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/Config';

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id') || '1';
        const res = await fetch(`${API_URL}/analytics?user_id=${userId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Campaign Analytics</Text>
        <Text style={styles.headerSubtitle}>Live data from backend</Text>
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="eye" size={24} color={Colors.dark.primary} />
          <Text style={styles.summaryValue}>{data ? formatNumber(data.total_impressions) : '0'}</Text>
          <Text style={styles.summaryLabel}>Total Impressions</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="cash" size={24} color="#00E676" />
          <Text style={styles.summaryValue}>₹{data ? formatNumber(data.total_spend) : '0'}</Text>
          <Text style={styles.summaryLabel}>Total Spend</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Impressions (Last 7 Days)</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: (data?.impressions?.length > 0) ? data.impressions : [0,0,0,0,0,0,0] }]
          }}
          width={screenWidth - 48}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <Text style={styles.sectionTitle}>Traffic by Location</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={{
            labels: (data?.locations?.length > 0) ? data.locations : ['No Data'],
            datasets: [{ data: (data?.location_data?.length > 0) ? data.location_data : [0] }]
          }}
          width={screenWidth - 48}
          height={220}
          yAxisLabel=""
          yAxisSuffix="M"
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(188, 19, 254, ${opacity})`, // Neon Purple
          }}
          style={styles.chart}
          showValuesOnTopOfBars
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.dark.tabIconDefault,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: Colors.dark.surface,
    padding: 20,
    borderRadius: 16,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginTop: 12,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.dark.tabIconDefault,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 32,
  },
  chart: {
    borderRadius: 8,
  },
});
