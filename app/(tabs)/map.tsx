import React, { useRef, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import Colors from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { API_URL } from '../../constants/Config';

// Removed mock fetchInventory function

export default function MapScreen() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '75%'], []);
  
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/inventory?t=${new Date().getTime()}`, {
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then((data: any) => {
        setInventory(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch inventory", err);
        setLoading(false);
      });
  }, []);

  // HTML for Leaflet Map
  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { padding: 0; margin: 0; background-color: #0A0A0A; }
        html, body, #map { height: 100%; width: 100%; }
        /* CSS Filter to make OpenStreetMap dark mode */
        .leaflet-layer,
        .leaflet-control-zoom-in,
        .leaflet-control-zoom-out,
        .leaflet-control-attribution {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container { background: #0A0A0A; }
        
        /* Custom Marker Style */
        .custom-marker {
          background-color: #00FFFF;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          border: 3px solid #0A0A0A;
          box-shadow: 0 0 10px rgba(0,255,255,0.8);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          zoomControl: false
        }).setView([18.5204, 73.8567], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '© OpenStreetMap'
        }).addTo(map);

        var locations = ${JSON.stringify(inventory)};
        
        locations.forEach(function(loc) {
          var icon = L.divIcon({
            className: 'custom-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });
          
          var marker = L.marker([loc.lat, loc.lng], {icon: icon}).addTo(map);
          marker.on('click', function() {
            // Send message to React Native
            window.ReactNativeWebView.postMessage(JSON.stringify(loc));
          });
        });
      </script>
    </body>
    </html>
  `;

  const onMessage = (event: any) => {
    try {
      const locationData = JSON.parse(event.nativeEvent.data);
      setSelectedLocation(locationData);
      bottomSheetRef.current?.snapToIndex(0);
    } catch (e) {
      console.error('Error parsing map message', e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Location</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
          <Text style={styles.loadingText}>Fetching Live Inventory...</Text>
        </View>
      ) : (
        <WebView
          source={{ html: mapHtml }}
          style={styles.map}
          onMessage={onMessage}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1} // Closed by default
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backgroundStyle={{ backgroundColor: Colors.dark.surface }}
        handleIndicatorStyle={{ backgroundColor: Colors.dark.border }}
      >
        <BottomSheetView style={styles.sheetContent}>
          {selectedLocation ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.locationType}>{selectedLocation.type.toUpperCase()}</Text>
                  <Text style={styles.sheetTitle}>{selectedLocation.title}</Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>₹{selectedLocation.price}</Text>
                  <Text style={styles.pricePeriod}>/day</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
                {selectedLocation.photos.map((photo: string, index: number) => (
                  <Image key={index} source={{ uri: photo }} style={styles.photoImage} />
                ))}
              </ScrollView>

              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Ionicons name="people" size={24} color={Colors.dark.primary} />
                  <Text style={styles.statValue}>{selectedLocation.footfall}</Text>
                  <Text style={styles.statLabel}>Footfall</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="tv-outline" size={24} color={Colors.dark.primary} />
                  <Text style={styles.statValue}>{selectedLocation.screens}</Text>
                  <Text style={styles.statLabel}>Screens</Text>
                </View>
                <View style={styles.statBox}>
                  <Ionicons name="expand" size={24} color={Colors.dark.primary} />
                  <Text style={styles.statValue}>{selectedLocation.size}</Text>
                  <Text style={styles.statLabel}>Resolution</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.bookButton}
                onPress={() => router.push(`/campaign/create`)}
              >
                <Text style={styles.bookButtonText}>Book This Location</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <Text style={styles.sheetTitle}>Select a location on the map</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: Colors.dark.surface,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: Colors.dark.primary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
  },
  map: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  sheetContent: {
    flex: 1,
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  locationType: {
    color: Colors.dark.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.dark.text,
    maxWidth: '80%',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  pricePeriod: {
    color: Colors.dark.tabIconDefault,
    fontSize: 12,
  },
  photoScroll: {
    marginBottom: 24,
  },
  photoImage: {
    width: 280,
    height: 180,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: Colors.dark.background,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statValue: {
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    color: Colors.dark.tabIconDefault,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  bookButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  bookButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
