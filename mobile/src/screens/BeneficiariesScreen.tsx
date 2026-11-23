// GMG Uganda - Beneficiaries Screen
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { Beneficiary } from '../types';

export default function BeneficiariesScreen({ navigation }: { navigation: any }) {
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const loadBeneficiaries = async () => {
    const result = await api.getBeneficiaries();
    if (result.success && result.data) {
      setBeneficiaries(result.data.beneficiaries || []);
    }
    setLoading(false);
  };

  const detectNetwork = (phone: string): string => {
    if (phone.startsWith('077') || phone.startsWith('078') || phone.startsWith('076')) return 'MTN';
    if (phone.startsWith('070') || phone.startsWith('075')) return 'Airtel';
    if (phone.startsWith('079')) return 'Africell';
    return 'Other';
  };

  const getNetworkFromPhone = (phone: string): string => detectNetwork(phone);

  const handleAddBeneficiary = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      Alert.alert('Error', 'Please enter name and phone number');
      return;
    }
    const result = await api.addBeneficiary(newPhone, newName);
    if (result.success) {
      loadBeneficiaries();
      setShowAddModal(false);
      setNewName('');
      setNewPhone('');
      Alert.alert('Success', 'Beneficiary added successfully');
    } else {
      Alert.alert('Error', result.error || 'Failed to add beneficiary');
    }
  };

  const handleDeleteBeneficiary = (id: string, name: string) => {
    Alert.alert('Delete Beneficiary', `Remove ${name} from your beneficiaries?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const result = await api.deleteBeneficiary(id);
        if (result.success) loadBeneficiaries();
      }}
    ]);
  };

  const handleSendMoney = (beneficiary: Beneficiary) => {
    navigation.navigate('Send', { recipient: beneficiary.phone, recipientName: beneficiary.name });
  };

  const filteredBeneficiaries = beneficiaries.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone.includes(searchQuery)
  );

  const favorites = filteredBeneficiaries.filter(b => b.isFavorite);
  const others = filteredBeneficiaries.filter(b => !b.isFavorite);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t('beneficiaries.title')}</Text>
        <TouchableOpacity onPress={() => setShowAddModal(true)}>
          <Text style={[styles.addBtn, { color: colors.success }]}>+ {t('beneficiaries.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.card, color: colors.text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('beneficiaries.searchPlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {loading ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}><Text style={[styles.emptyText, { color: colors.text }]}>{t('common.loading')}</Text></View>
        ) : filteredBeneficiaries.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>{t('beneficiaries.noBeneficiaries')}</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>{t('beneficiaries.addPeople')}</Text>
            <TouchableOpacity style={styles.addFirstBtn} onPress={() => setShowAddModal(true)}>
              <Text style={styles.addFirstBtnText}>+ {t('beneficiaries.addBeneficiary')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {favorites.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>⭐ {t('beneficiaries.favorites')}</Text>
                {favorites.map(renderBeneficiary)}
              </>
            )}
            {others.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('beneficiaries.allBeneficiaries')}</Text>
                {others.map(renderBeneficiary)}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Modal */}
      {showAddModal && (
        <View style={styles.modal}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('beneficiaries.addBeneficiary')}</Text>
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]} value={newName} onChangeText={setNewName} placeholder={t('beneficiaries.name')} placeholderTextColor={colors.textMuted} />
            <TextInput style={[styles.modalInput, { backgroundColor: colors.background, color: colors.text }]} value={newPhone} onChangeText={setNewPhone} placeholder={t('beneficiaries.phonePlaceholder')} placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.surfaceVariant }]} onPress={() => setShowAddModal(false)}>
                <Text style={[styles.cancelBtnText, { color: colors.text }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddBeneficiary}>
                <Text style={styles.saveBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );

  function renderBeneficiary(beneficiary: Beneficiary) {
    return (
      <TouchableOpacity key={beneficiary.id} style={[styles.beneficiaryCard, { backgroundColor: colors.card }]} onPress={() => handleSendMoney(beneficiary)} onLongPress={() => handleDeleteBeneficiary(beneficiary.id.toString(), beneficiary.name)}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{beneficiary.name.charAt(0)}</Text></View>
        <View style={styles.beneficiaryInfo}>
          <Text style={[styles.beneficiaryName, { color: colors.text }]}>{beneficiary.name}</Text>
          <Text style={[styles.beneficiaryPhone, { color: colors.textSecondary }]}>{beneficiary.phone} • {getNetworkFromPhone(beneficiary.phone)}</Text>
        </View>
        <TouchableOpacity style={styles.sendBtn} onPress={() => handleSendMoney(beneficiary)}>
          <Text style={styles.sendBtnText}>{t('common.send')}</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  addBtn: { color: '#10b981', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  searchContainer: { paddingHorizontal: 16, marginBottom: 8 },
  searchInput: { borderRadius: 12, padding: 14, fontSize: 16 },
  content: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 12, marginTop: 8 },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  emptySubtext: { color: '#CCCCCC', fontSize: 14, marginBottom: 20 },
  addFirstBtn: { backgroundColor: '#0066FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  addFirstBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  beneficiaryCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  beneficiaryInfo: { flex: 1 },
  beneficiaryName: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  beneficiaryPhone: { color: '#CCCCCC', fontSize: 12 },
  sendBtn: { backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sendBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: 'Montserrat_600SemiBold' },
  modal: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontFamily: 'Montserrat_700Bold', marginBottom: 20, textAlign: 'center' },
  modalInput: { borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { fontSize: 16 },
  saveBtn: { flex: 1, backgroundColor: '#0066FF', borderRadius: 12, padding: 14, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
});
