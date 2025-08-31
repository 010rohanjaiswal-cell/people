import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebaseAuthService from '../services/firebaseAuthService';

const MainScreen = ({ navigation, route }) => {
  const { userRole } = route.params || { userRole: 'user' };

  const handleLogout = async () => {
    try {
      await firebaseAuthService.signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={80} color="#34C759" />
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.subtitle}>
          You are logged in as a {userRole}
        </Text>
        
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            ✅ Firebase Authentication successful
          </Text>
          <Text style={styles.infoText}>
            ✅ Role: {userRole}
          </Text>
          <Text style={styles.infoText}>
            ✅ Ready for next flow implementation
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginBottom: 40,
    textAlign: 'center',
  },
  infoContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 16,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MainScreen;
