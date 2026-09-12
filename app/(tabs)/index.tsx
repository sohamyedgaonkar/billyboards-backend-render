import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../../constants/Colors';
import { API_URL } from '../../constants/Config';

const screenWidth = Dimensions.get('window').width;

const formatNumber = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id') || '1';
        const res = await fetch(`${API_URL}/dashboard?user_id=${userId}`);
        const json = await res.json();
        setData(json);

        const invRes = await fetch(`${API_URL}/inventory`);
        const invJson = await invRes.json();
        setInventory(invJson);
      } catch (err) {
        console.error("Failed to fetch dashboard", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleCampaignPress = (id: string) => {
    router.push(`/campaign/${id}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Banner */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>Take lead through advertising just from your home</Text>
        <Image
          source={require('../../assets/images/dashboard_mascot.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Performance Overview</Text>
        <Text style={{ color: Colors.dark.tint, fontSize: 10, marginTop: -10, marginBottom: 16, fontWeight: 'bold' }}>LIVE</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>{data ? formatNumber(data.verified_impressions) : '0'}</Text>
            <Text style={styles.metricLabel}>Verified Impressions</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricBox}>
            <Text style={styles.metricValue}>₹{data ? formatNumber(data.total_ad_spend) : '0'}</Text>
            <Text style={styles.metricLabel}>Total Ad Spend</Text>
          </View>
        </View>
      </View>

      {/* New Billboard Locations Carousel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Billboard Locations</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {inventory.map((item: any) => (
            <TouchableOpacity
              key={item.id}
              style={styles.campaignCard}
              onPress={() => router.push('/(tabs)/map')}
            >
              <Image source={{ uri: item.photos[0] }} style={styles.campaignImage} />
              <View style={styles.campaignInfo}>
                <Text style={styles.campaignTitle}>{item.title}</Text>
                <View style={styles.statusRow}>
                  <Ionicons name="location-outline" size={14} color={Colors.dark.tabIconDefault} style={{ marginRight: 4 }} />
                  <Text style={styles.campaignStatus}>{item.type}</Text>
                </View>
                <Text style={[styles.spentText, { color: Colors.dark.success, fontSize: 12, fontWeight: 'bold' }]}>₹{item.price}/day</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Foot Traffic Sparkline */}
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Network Foot Traffic (7 Days)</Text>
        <LineChart
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{ data: (data?.foot_traffic?.length > 0) ? data.foot_traffic : [0, 0, 0, 0, 0, 0, 0] }]
          }}
          width={screenWidth - 48}
          height={180}
          chartConfig={{
            backgroundColor: Colors.dark.surface,
            backgroundGradientFrom: Colors.dark.surface,
            backgroundGradientTo: Colors.dark.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => Colors.dark.tint,
            labelColor: (opacity = 1) => Colors.dark.tabIconDefault,
            style: { borderRadius: 16 },
            propsForDots: { r: '4', strokeWidth: '2', stroke: Colors.dark.tint }
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Active Campaigns Carousel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Campaigns</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(!data?.active_campaigns || data.active_campaigns.length === 0) ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="sad-outline" size={48} color={Colors.dark.tabIconDefault} />
              <Text style={styles.emptyStateText}>You haven't run a campaign yet</Text>
            </View>
          ) : (
            data.active_campaigns.map((campaign: any) => (
              <TouchableOpacity
                key={campaign.id}
                style={styles.campaignCard}
                onPress={() => handleCampaignPress(campaign.id)}
              >
                <Image source={{ uri: campaign.thumbnail }} style={styles.campaignImage} />
                <View style={styles.campaignInfo}>
                  <Text style={styles.campaignTitle}>{campaign.title}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: campaign.status === 'Active' ? Colors.dark.success : Colors.dark.tint }]} />
                    <Text style={styles.campaignStatus}>{campaign.status}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${campaign.spent * 100}%` }]} />
                  </View>
                  <Text style={styles.spentText}>{Math.round(campaign.spent * 100)}% Budget Spent</Text>
                </View>
              </TouchableOpacity>
            ))
          )}

          <TouchableOpacity style={styles.newCampaignCard} onPress={() => router.push('/(tabs)/map')}>
            <Ionicons name="add-circle-outline" size={40} color={Colors.dark.tint} />
            <Text style={styles.newCampaignText}>New Campaign</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.background },
  content: { padding: 24, paddingBottom: 100 },
  welcomeSection: { marginBottom: 24, alignItems: 'center' },
  mascotImage: { width: '100%', height: 200, marginTop: 16 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.dark.text, lineHeight: 32, textAlign: 'center' },
  heroCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: Colors.dark.tint,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  heroTitle: { color: Colors.dark.tabIconDefault, fontSize: 14, textTransform: 'uppercase', marginBottom: 16, fontWeight: 'bold' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricBox: { flex: 1 },
  metricValue: { color: Colors.dark.text, fontSize: 32, fontWeight: 'bold', marginBottom: 4 },
  metricLabel: { color: Colors.dark.tabIconDefault, fontSize: 12 },
  metricDivider: { width: 1, height: '80%', backgroundColor: Colors.dark.border, marginHorizontal: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { color: Colors.dark.text, fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  chartContainer: { marginBottom: 24 },
  chart: { borderRadius: 16, borderWidth: 1, borderColor: Colors.dark.border },
  campaignCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    width: 240,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  campaignImage: { width: '100%', height: 120 },
  campaignInfo: { padding: 16 },
  campaignTitle: { color: Colors.dark.text, fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  campaignStatus: { color: Colors.dark.tabIconDefault, fontSize: 12 },
  progressBarBg: { height: 4, backgroundColor: Colors.dark.surfaceElevated, borderRadius: 2, marginBottom: 8 },
  progressBarFill: { height: '100%', backgroundColor: Colors.dark.tint, borderRadius: 2 },
  spentText: { color: Colors.dark.tabIconDefault, fontSize: 10 },
  newCampaignCard: {
    width: 120,
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
  },
  newCampaignText: { color: Colors.dark.tint, marginTop: 8, fontSize: 12, fontWeight: 'bold' },
  emptyStateContainer: {
    width: 240,
    marginRight: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: Colors.dark.tabIconDefault,
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  }
});
