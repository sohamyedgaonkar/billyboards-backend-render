import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../constants/Colors';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/Config';

const { width } = Dimensions.get('window');

const INDUSTRIES = ['Retail', 'Tech', 'Food & Beverage', 'Entertainment', 'Healthcare', 'Other'];

export default function RegisterScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState('');

  // Animation State
  const translateX = useSharedValue(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
      translateX.value = withSpring(-(step + 1) * width, { damping: 20, stiffness: 90 });
    } else {
      handleRegister();
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      translateX.value = withSpring(-(step - 1) * width, { damping: 20, stiffness: 90 });
    } else {
      router.back();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          business_name: businessName,
          industry
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      await AsyncStorage.setItem('user_id', data.id.toString());
      console.log('Registration success:', data);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 0 && styles.progressDotActive]} />
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>
        <View style={{ width: 24 }} />
      </View>

      <Animated.View style={[styles.slider, animatedStyle]}>
        
        {/* STEP 1: Personal Info */}
        <View style={styles.slide}>
          <Text style={styles.title}>Let's get started.</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={Colors.dark.tabIconDefault}
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={Colors.dark.tabIconDefault}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Create Password"
            placeholderTextColor={Colors.dark.tabIconDefault}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* STEP 2: Business Info */}
        <View style={styles.slide}>
          <Text style={styles.title}>Your Business</Text>
          <Text style={styles.subtitle}>What are you advertising?</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Business / Brand Name"
            placeholderTextColor={Colors.dark.tabIconDefault}
            value={businessName}
            onChangeText={setBusinessName}
          />
          
          <Text style={styles.label}>Select Industry:</Text>
          <View style={styles.pillContainer}>
            {INDUSTRIES.map(ind => (
              <TouchableOpacity
                key={ind}
                style={[styles.pill, industry === ind && styles.pillActive]}
                onPress={() => setIndustry(ind)}
              >
                <Text style={[styles.pillText, industry === ind && styles.pillTextActive]}>
                  {ind}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* STEP 3: Ready */}
        <View style={styles.slide}>
          <View style={styles.readyContainer}>
            <View style={styles.readyIconContainer}>
              <Ionicons name="rocket" size={80} color={Colors.dark.primary} />
            </View>
            <Text style={styles.title}>You're all set!</Text>
            <Text style={styles.subtitle}>
              Ready to launch your first digital out-of-home campaign?
            </Text>
          </View>
        </View>

      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.nextButton, loading && styles.nextButtonDisabled]}
          onPress={nextStep}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.nextButtonText}>
              {step === 2 ? 'Launch Platform' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  progressDotActive: {
    backgroundColor: Colors.dark.primary,
    width: 24,
  },
  slider: {
    flex: 1,
    flexDirection: 'row',
    width: width * 3,
  },
  slide: {
    width,
    padding: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.tabIconDefault,
    marginBottom: 40,
  },
  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 16,
    padding: 20,
    color: Colors.dark.text,
    fontSize: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: Colors.dark.text,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 16,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  pillActive: {
    backgroundColor: Colors.dark.tint,
    borderColor: Colors.dark.tint,
  },
  pillText: {
    color: Colors.dark.tabIconDefault,
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: Colors.dark.background,
  },
  readyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -80,
  },
  readyIconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.dark.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  footer: {
    padding: 32,
    paddingBottom: 50,
  },
  nextButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
