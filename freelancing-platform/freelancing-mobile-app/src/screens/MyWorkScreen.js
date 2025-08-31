import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  FlatList,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MyWorkScreen = ({ navigation, route }) => {
  const { userRole } = route.params;
  const [activeTab, setActiveTab] = useState('active');

  const renderJobItem = ({ item }) => (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <Text style={styles.jobTitle}>{item.title}</Text>
        <Text style={styles.jobBudget}>₹{item.budget}</Text>
      </View>
      <Text style={styles.jobDescription}>{item.description}</Text>
      <View style={styles.jobFooter}>
        <View style={styles.jobTags}>
          {item.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.status === 'active' ? '#007AFF15' : '#34C75915' }]}>
          <Text style={[styles.statusText, { color: item.status === 'active' ? '#007AFF' : '#34C759' }]}>
            {item.status === 'active' ? 'Active' : 'Completed'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>My Work</Text>
          </View>
          
          <View style={styles.headerActions}>
            {/* Placeholder for future actions */}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.section}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
              Active Jobs
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {/* Jobs Content */}
        <View style={styles.jobsContainer}>
          {activeTab === 'active' ? (
            <FlatList
              data={[
                {
                  id: '1',
                  title: 'Website Development',
                  description: 'Building a professional website for a local business. Working on React and Node.js implementation.',
                  budget: '15,000',
                  tags: ['React', 'Node.js', 'Web Development'],
                  status: 'active'
                },
                {
                  id: '2',
                  title: 'Mobile App Design',
                  description: 'Designing UI/UX for a food delivery mobile application.',
                  budget: '8,000',
                  tags: ['UI/UX', 'Mobile Design', 'Figma'],
                  status: 'active'
                }
              ]}
              keyExtractor={(item) => item.id}
              renderItem={renderJobItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="briefcase-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyStateText}>No active jobs at the moment</Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={[
                {
                  id: '3',
                  title: 'Logo Design Project',
                  description: 'Created a modern logo design for a tech startup company.',
                  budget: '5,000',
                  tags: ['Logo Design', 'Branding', 'Illustrator'],
                  status: 'completed'
                }
              ]}
              keyExtractor={(item) => item.id}
              renderItem={renderJobItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#CCC" />
                  <Text style={styles.emptyStateText}>No completed jobs yet</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: Platform.OS === 'ios' ? 44 : (StatusBar.currentHeight || 0) + 10,
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  headerActions: {
    width: 40,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  jobsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 400,
  },
  jobCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },
  jobBudget: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#34C759',
  },
  jobDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    lineHeight: 20,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    backgroundColor: '#E0F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
    textAlign: 'center',
  },
});

export default MyWorkScreen;
