// GMG Global Mobile App - Profile Screen
// Redesigned to match modern fintech app style
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ImageBackground,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotification } from '../utils/useNotification';
import { formatPhone } from '../utils/format';
import ENV from '../config/environment';
import api from '../services/api';

interface MenuItem {
  icon: string;
  label: string;
  description: string;
  screen?: string;
  action?: () => void;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, logout, updateUser } = useAuth();
  const { colors } = useTheme();
  const { showSuccess, showError } = useNotification();

  // Profile photo state
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Check if we should start KYC from navigation params
  React.useEffect(() => {
    if (route.params?.startKYC) {
      navigation.navigate('KYC', { startKYC: true });
    }
  }, [route.params]);

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log out', style: 'destructive', onPress: logout },
      ]
    );
  };

  // Handle profile photo change
  const handleChangePhoto = () => {
    setShowPhotoModal(true);
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    setShowPhotoModal(false);
    
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePhoto(result.assets[0]);
    }
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    setShowPhotoModal(false);
    
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadProfilePhoto(result.assets[0]);
    }
  };

  // Upload profile photo to server
  const uploadProfilePhoto = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    setUploadingPhoto(true);
    
    try {
      console.log('[ProfileScreen] Starting photo upload...');
      console.log('[ProfileScreen] Image size:', imageAsset.base64?.length || 0, 'chars');
      
      // Check if base64 data exists
      if (!imageAsset.base64) {
        Alert.alert('Error', 'Failed to process image. Please try again.');
        setUploadingPhoto(false);
        return;
      }
      
      // Create base64 data URL
      const base64Image = `data:image/jpeg;base64,${imageAsset.base64}`;
      
      console.log('[ProfileScreen] Uploading to server...');
      
      // Upload to server
      const response = await api.updateProfilePhoto(base64Image);
      
      console.log('[ProfileScreen] Upload response:', JSON.stringify(response));
      
      if (response.success) {
        // Update local user state with new photo
        if (updateUser && response.data?.profilePicture) {
          updateUser({ profilePicture: response.data.profilePicture });
        }
        showSuccess('Photo Updated', 'Your profile photo has been updated!', '📸');
      } else {
        console.error('[ProfileScreen] Upload failed:', response.error);
        showError('Upload Failed', response.error || 'Failed to update profile photo');
      }
    } catch (error: any) {
      console.error('[ProfileScreen] Upload error:', error);
      console.error('[ProfileScreen] Error details:', error.message, error.response?.data);
      showError('Upload Error', error.message || 'Failed to upload profile photo. Please try again.', '😔');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Remove profile photo
  const removeProfilePhoto = async () => {
    setShowPhotoModal(false);
    
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setUploadingPhoto(true);
            try {
              const response = await api.removeProfilePhoto();
              if (response.success) {
                if (updateUser) {
                  updateUser({ profilePicture: undefined });
                }
                showSuccess('Photo Removed', 'Your profile photo has been removed', '🗑️');
              } else {
                showError('Error', response.error || 'Failed to remove photo');
              }
            } catch (error) {
              showError('Error', 'Failed to remove photo');
            } finally {
              setUploadingPhoto(false);
            }
          },
        },
      ]
    );
  };

  // Profile section items
  const profileItems: MenuItem[] = [
    {
      icon: '👤',
      label: 'Personal information',
      description: 'Check your name, email and address',
      screen: 'Settings',
    },
    {
      icon: '📋',
      label: 'Transaction history',
      description: 'A history of your transactions',
      screen: 'Transactions',
    },
    {
      icon: '🔐',
      label: 'Security & PIN',
      description: 'Manage your security settings',
      screen: 'Security',
    },
    {
      icon: '✓',
      label: 'KYC Verification',
      description: 'Verify your identity for higher limits',
      screen: 'KYC',
    },
  ];

  // App configuration items
  const configItems: MenuItem[] = [
    {
      icon: '🌐',
      label: 'Language',
      description: 'Change the app language',
      screen: 'Settings',
    },
    {
      icon: '💱',
      label: 'Currency',
      description: 'Change the app currency',
      screen: 'Settings',
    },
    {
      icon: '🔔',
      label: 'Notifications center',
      description: 'Manage app and marketing notifications',
      screen: 'Notifications',
    },
    {
      icon: '📊',
      label: 'Transaction Limits',
      description: 'View and manage your limits',
      screen: 'Limits',
    },
    {
      icon: '❓',
      label: 'Help & Support',
      description: 'Get help and contact support',
      screen: 'Help',
    },
  ];

  const renderMenuItem = (item: MenuItem, index: number, isLast: boolean) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.menuItem,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
      onPress={() => item.screen && navigation.navigate(item.screen)}
      activeOpacity={0.7}
    >
      <View style={styles.menuIconContainer}>
        <Text style={styles.menuIcon}>{item.icon}</Text>
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, { color: colors.text }]}>{item.label}</Text>
        <Text style={[styles.menuDescription, { color: colors.textSecondary }]}>
          {item.description}
        </Text>
      </View>
      <Text style={[styles.menuArrow, { color: colors.primary }]}>›</Text>
    </TouchableOpacity>
  );

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return '👤';
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return formatPhone(user?.phone || 'User');
  };

  // Get full profile picture URL
  const getProfilePictureUrl = () => {
    if (!user?.profilePicture) return null;
    // If it's already a full URL, return as is
    if (user.profilePicture.startsWith('http')) return user.profilePicture;
    // Otherwise, prepend the API base URL
    return `${ENV.apiUrl}${user.profilePicture}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Header with dark background */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={require('../../assets/splash-icon.png')}
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImage}
          >
            <View style={styles.headerOverlay}>
              <SafeAreaView edges={['top']}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Account</Text>
                  <View style={styles.userRow}>
                    <TouchableOpacity 
                      style={styles.avatarContainer} 
                      onPress={handleChangePhoto}
                      activeOpacity={0.8}
                    >
                      {uploadingPhoto ? (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                          <ActivityIndicator color="#fff" />
                        </View>
                      ) : getProfilePictureUrl() ? (
                        <View>
                          <Image source={{ uri: getProfilePictureUrl()! }} style={styles.avatar} />
                          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="camera" size={14} color="#fff" />
                          </View>
                        </View>
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                          <Text style={styles.avatarText}>{getUserInitials()}</Text>
                          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="camera" size={14} color="#fff" />
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{getUserName()}</Text>
                      <TouchableOpacity onPress={handleChangePhoto}>
                        <Text style={styles.changePhotoText}>Change photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </SafeAreaView>
            </View>
          </ImageBackground>
        </View>

        {/* Main content with rounded top */}
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {/* Profile Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
              {profileItems.map((item, index) =>
                renderMenuItem(item, index, index === profileItems.length - 1)
              )}
            </View>
          </View>

          {/* App Configuration Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>App configuration</Text>
            <View style={[styles.menuCard, { backgroundColor: colors.surface }]}>
              {configItems.map((item, index) =>
                renderMenuItem(item, index, index === configItems.length - 1)
              )}
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log out</Text>
            <Text style={styles.logoutIcon}>🚪</Text>
          </TouchableOpacity>

          {/* Version */}
          <Text style={[styles.version, { color: colors.textMuted }]}>
            GMG Global v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* Photo Picker Modal */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowPhotoModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Profile Photo</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={takePhotoWithCamera}
            >
              <View style={[styles.modalOptionIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="camera" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: colors.border }]} 
              onPress={pickImageFromGallery}
            >
              <View style={[styles.modalOptionIconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="images" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.modalOptionText, { color: colors.text }]}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            {user?.profilePicture && (
              <TouchableOpacity 
                style={[styles.modalOption, { borderBottomColor: colors.border }]} 
                onPress={removeProfilePhoto}
              >
                <View style={[styles.modalOptionIconContainer, { backgroundColor: '#ef444420' }]}>
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </View>
                <Text style={[styles.modalOptionText, { color: '#ef4444' }]}>Remove Photo</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={styles.modalCancelBtn} 
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Header styles
  headerContainer: {
    height: 180,
  },
  headerBackground: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  headerBackgroundImage: {
    opacity: 0.15,
    resizeMode: 'cover',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 16,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#FFFFFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  // Content styles
  contentContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 500,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    marginBottom: 16,
  },
  menuCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuIcon: {
    fontSize: 26,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 13,
    fontFamily: 'Montserrat_400Regular',
  },
  menuArrow: {
    fontSize: 28,
    fontFamily: 'Montserrat_300Light',
    marginLeft: 8,
  },
  // Logout button
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
    color: '#ef4444',
    marginRight: 8,
  },
  logoutIcon: {
    fontSize: 16,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Montserrat_400Regular',
    marginTop: 24,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_600SemiBold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
  },
  modalOptionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalOptionText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
  modalCancelBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 16,
    fontFamily: 'Montserrat_500Medium',
  },
});
