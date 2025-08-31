import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../../services/apiService';

const OffersScreen = ({ route, navigation }) => {
  const { job } = route.params;
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingOffer, setProcessingOffer] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const result = await apiService.getJobOffers(job._id);
      
      if (result.success) {
        // Handle nested data structure from API service
        const offers = result.data.data?.offers || result.data.offers || [];
        console.log('🔍 Loaded offers:', offers.map(o => ({ id: o._id, status: o.status })));
        setOffers(offers);
      } else {
        Alert.alert('Error', result.message || 'Failed to load offers');
      }
    } catch (error) {
      console.error('Load offers error:', error);
      Alert.alert('Error', 'Failed to load offers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadOffers();
  };

  const handleRespondToOffer = async (offerId, action) => {
    console.log('🔍 handleRespondToOffer called:', { offerId, action });
    setProcessingOffer(offerId);
    try {
      const result = await apiService.respondToOffer(
        offerId, 
        action, 
        action === 'accept' ? 'Offer accepted' : 'Offer rejected'
      );

      if (result.success) {
        setSuccessMessage(result.message);
        setShowSuccessModal(true);
        setShowConfirmModal(false);
        
        // Refresh offers
        await loadOffers();
        
        // If accepted, go back to dashboard after a delay
        if (action === 'accept') {
          setTimeout(() => {
            setShowSuccessModal(false);
            navigation.goBack();
          }, 2000);
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to respond to offer');
      }
    } catch (error) {
      console.error('Respond to offer error:', error);
      Alert.alert('Error', 'Failed to respond to offer');
    } finally {
      setProcessingOffer(null);
    }
  };

  const confirmAction = (offer, action) => {
    console.log('🔍 confirmAction called:', { offerId: offer._id, action });
    Alert.alert('Debug', `Button pressed: ${action} for offer ${offer._id}`);
    setSelectedOffer(offer);
    setSelectedAction(action);
    setShowConfirmModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FF9800';
      case 'accepted': return '#4CAF50';
      case 'rejected': return '#F44336';
      case 'withdrawn': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'withdrawn': return 'Withdrawn';
      default: return status;
    }
  };

  const renderOffer = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.freelancerInfo}>
          <View style={styles.freelancerAvatar}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
          <View style={styles.freelancerDetails}>
            <Text style={styles.freelancerName}>
              {item.freelancerId?.freelancerProfile?.fullName || 'Freelancer'}
            </Text>
            <Text style={styles.freelancerId}>
              ID: {item.freelancerId?.freelancerProfile?.freelancerId || 'N/A'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      <View style={styles.offerDetails}>
        <View style={styles.amountContainer}>
          <Text style={styles.amountLabel}>Offered Amount:</Text>
          <Text style={styles.amountValue}>₹{item.offeredAmount}</Text>
        </View>
        
        {item.originalAmount !== item.offeredAmount && (
          <View style={styles.originalAmount}>
            <Text style={styles.originalAmountText}>
              Original: ₹{item.originalAmount}
            </Text>
          </View>
        )}

        {item.message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Message:</Text>
            <Text style={styles.messageText}>{item.message}</Text>
          </View>
        )}

        <Text style={styles.offerDate}>
          Offered on {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Always show action buttons for debugging */}
      <View style={styles.actionButtons}>
        {(() => { console.log('🔍 Rendering action buttons for offer:', item._id, 'status:', item.status); return null; })()}
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => confirmAction(item, 'accept')}
            disabled={processingOffer === item._id}
          >
            {processingOffer === item._id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => confirmAction(item, 'reject')}
            disabled={processingOffer === item._id}
          >
            {processingOffer === item._id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="close" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading offers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.statusBarSpacer} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Offers</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.jobInfo}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobAmount}>Original Amount: ₹{job.amount}</Text>
      </View>

      {offers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Offers Yet</Text>
          <Text style={styles.emptySubtitle}>
            No freelancers have made offers for this job yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          renderItem={renderOffer}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.offersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Custom Confirmation Modal */}
      <Modal
        visible={showConfirmModal && selectedOffer && selectedAction}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.confirmIcon}>
              <Ionicons 
                name={selectedAction === 'accept' ? 'checkmark-circle' : 'close-circle'} 
                size={60} 
                color={selectedAction === 'accept' ? '#4CAF50' : '#F44336'} 
              />
            </View>
            <Text style={styles.confirmTitle}>
              {selectedAction === 'accept' ? 'Accept Offer' : 'Reject Offer'}
            </Text>
            <Text style={styles.confirmMessage}>
              {selectedAction === 'accept' 
                ? 'Are you sure you want to accept this offer? Once accepted, the job will be assigned to the freelancer.'
                : 'Are you sure you want to reject this offer?'
              }
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowConfirmModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.confirmActionButton,
                  selectedAction === 'accept' ? styles.acceptConfirmButton : styles.rejectConfirmButton
                ]}
                onPress={() => {
                  console.log('🔍 Confirm button pressed:', { selectedOffer: selectedOffer?._id, selectedAction });
                  setShowConfirmModal(false);
                  if (selectedOffer && selectedOffer._id) {
                    handleRespondToOffer(selectedOffer._id, selectedAction);
                  }
                }}
                disabled={processingOffer === (selectedOffer?._id || null)}
              >
                {processingOffer === (selectedOffer?._id || null) ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmActionButtonText}>
                    {selectedAction === 'accept' ? 'Accept' : 'Reject'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#34C759" />
            </View>
            <Text style={styles.successTitle}>Success!</Text>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  statusBarSpacer: {
    height: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  jobInfo: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 10,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  jobAmount: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  offersList: {
    padding: 20,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  freelancerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  freelancerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  freelancerDetails: {
    flex: 1,
  },
  freelancerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  freelancerId: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  offerDetails: {
    marginBottom: 15,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  originalAmount: {
    marginBottom: 8,
  },
  originalAmountText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  messageContainer: {
    marginBottom: 8,
  },
  messageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  offerDate: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  confirmIcon: {
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmActionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  rejectConfirmButton: {
    backgroundColor: '#F44336',
  },
  confirmActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default OffersScreen;
