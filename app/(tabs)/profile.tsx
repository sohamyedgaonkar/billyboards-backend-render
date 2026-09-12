import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../../constants/Config';

export default function ProfileScreen() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userId = await AsyncStorage.getItem('user_id') || '1';
        const res = await fetch(`${API_URL}/profile?user_id=${userId}`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  const renderSettingRow = (icon: any, title: string, subtitle?: string, hasSwitch = false, value = false, isDestructive = false) => (
    <TouchableOpacity style={styles.settingRow} disabled={hasSwitch}>
      <View style={[styles.settingIcon, isDestructive && { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
        <Ionicons name={icon} size={20} color={isDestructive ? '#FF3B30' : Colors.dark.primary} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, isDestructive && { color: '#FF3B30' }]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {hasSwitch ? (
        <Switch value={value} trackColor={{ false: '#333', true: Colors.dark.primary }} />
      ) : (
        <Ionicons name="chevron-forward" size={20} color={Colors.dark.tabIconDefault} />
      )}
    </TouchableOpacity>
  );

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
        <View style={styles.avatarContainer}>
          <Ionicons name="person" size={40} color={Colors.dark.background} />
        </View>
        <Text style={styles.userName}>{data?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{data?.email || ''}</Text>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>{data?.industry?.toUpperCase() || 'ADVERTISER'}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.cardGroup}>
        {renderSettingRow('business-outline', 'Business Name', data?.business_name || 'N/A')}
        <View style={styles.divider} />
        {renderSettingRow('briefcase-outline', 'My Campaigns')}
        <View style={styles.divider} />
        {renderSettingRow('card-outline', 'Payment Methods', 'Visa ending in 4242')}
        <View style={styles.divider} />
        {renderSettingRow('receipt-outline', 'Invoices & Billing')}
      </View>

      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.cardGroup}>
        {renderSettingRow('notifications-outline', 'Push Notifications', undefined, true, true)}
        <View style={styles.divider} />
        {renderSettingRow('moon-outline', 'Dark Mode', undefined, true, true)}
      </View>

      <View style={[styles.cardGroup, { marginTop: 32 }]}>
        <TouchableOpacity style={styles.settingRow} onPress={() => router.replace('/login')}>
          <View style={[styles.settingIcon, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: '#FF3B30' }]}>Sign Out</Text>
          </View>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.dark.tabIconDefault,
    marginBottom: 12,
  },
  proBadge: {
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.primary,
  },
  proBadgeText: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.dark.tabIconDefault,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardGroup: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.dark.tabIconDefault,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: 68,
  }
});
