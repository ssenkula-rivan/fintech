// GMG Uganda - Cards Screen (Virtual & Physical Cards)
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

interface Card {
  id: string;
  type: 'virtual' | 'physical';
  name: string;
  lastFour: string;
  balance: number;
  status: 'active' | 'frozen' | 'pending';
  expiryDate: string;
}

export default function CardsScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const [cards, setCards] = useState<Card[]>([]);
  const [showCardDetails, setShowCardDetails] = useState<string | null>(null);

  const handleCreateVirtualCard = () => {
    Alert.alert(
      'Create Virtual Card',
      'Create a virtual Visa card for online payments? A fee of UGX 5,000 applies.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Create', onPress: () => {
          const newCard: Card = {
            id: Date.now().toString(),
            type: 'virtual',
            name: 'GMG Virtual Card',
            lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
            balance: 0,
            status: 'active',
            expiryDate: '12/27',
          };
          setCards([...cards, newCard]);
          Alert.alert('Success', 'Virtual card created successfully!');
        }}
      ]
    );
  };

  const handleRequestPhysicalCard = () => {
    Alert.alert(
      'Request Physical Card',
      'Request a physical Visa debit card? Delivery fee: UGX 25,000. Delivery time: 5-7 business days.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request', onPress: () => Alert.alert('Success', 'Physical card request submitted!') }
      ]
    );
  };

  const toggleCardFreeze = (cardId: string) => {
    setCards(cards.map(card => 
      card.id === cardId 
        ? { ...card, status: card.status === 'active' ? 'frozen' : 'active' }
        : card
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtn, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Cards</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Cards List */}
        {cards.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text style={styles.emptyIcon}>💳</Text>
            <Text style={[styles.emptyText, { color: colors.text }]}>No cards yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>Create a virtual card or request a physical one</Text>
          </View>
        ) : (
          cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[styles.cardItem, card.status === 'frozen' && styles.cardFrozen]}
              onPress={() => setShowCardDetails(showCardDetails === card.id ? null : card.id)}
            >
              <View style={styles.cardVisual}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardType}>{card.type === 'virtual' ? '🌐 Virtual' : '💳 Physical'}</Text>
                  <Text style={styles.cardBrand}>VISA</Text>
                </View>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.lastFour}</Text>
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.cardLabel}>Balance</Text>
                    <Text style={styles.cardBalance}>{formatCurrency(card.balance)}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardLabel}>Expires</Text>
                    <Text style={styles.cardExpiry}>{card.expiryDate}</Text>
                  </View>
                  <View style={[styles.statusBadge, card.status === 'frozen' && styles.statusFrozen]}>
                    <Text style={styles.statusText}>{card.status.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              
              {showCardDetails === card.id && (
                <View style={[styles.cardActions, { backgroundColor: colors.card }]}>
                  <TouchableOpacity style={styles.cardAction} onPress={() => toggleCardFreeze(card.id)}>
                    <Text style={styles.actionIcon}>{card.status === 'frozen' ? '🔓' : '🔒'}</Text>
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>{card.status === 'frozen' ? 'Unfreeze' : 'Freeze'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardAction}>
                    <Text style={styles.actionIcon}>💰</Text>
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Top Up</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardAction}>
                    <Text style={styles.actionIcon}>📊</Text>
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardAction}>
                    <Text style={styles.actionIcon}>⚙️</Text>
                    <Text style={[styles.actionText, { color: colors.textSecondary }]}>Settings</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}

        {/* Create Card Options */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Get a Card</Text>
        <TouchableOpacity style={[styles.optionCard, { backgroundColor: colors.card }]} onPress={handleCreateVirtualCard}>
          <Text style={styles.optionIcon}>🌐</Text>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Virtual Card</Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>Instant • Online payments • UGX 5,000</Text>
          </View>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionCard, { backgroundColor: colors.card }]} onPress={handleRequestPhysicalCard}>
          <Text style={styles.optionIcon}>💳</Text>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionTitle, { color: colors.text }]}>Physical Card</Text>
            <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>5-7 days delivery • ATM & POS • UGX 25,000</Text>
          </View>
          <Text style={[styles.arrow, { color: colors.primary }]}>→</Text>
        </TouchableOpacity>

        {/* Card Benefits */}
        <View style={[styles.benefitsCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>Card Benefits</Text>
          <View style={styles.benefitItem}><Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text><Text style={[styles.benefitText, { color: colors.text }]}>Shop online worldwide</Text></View>
          <View style={styles.benefitItem}><Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text><Text style={[styles.benefitText, { color: colors.text }]}>Withdraw at any Visa ATM</Text></View>
          <View style={styles.benefitItem}><Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text><Text style={[styles.benefitText, { color: colors.text }]}>Instant freeze/unfreeze</Text></View>
          <View style={styles.benefitItem}><Text style={[styles.benefitIcon, { color: colors.success }]}>✓</Text><Text style={[styles.benefitText, { color: colors.text }]}>Real-time notifications</Text></View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  backBtn: { color: '#0066FF', fontSize: 16 },
  title: { fontSize: 20, fontFamily: 'Montserrat_700Bold' },
  content: { flex: 1, padding: 16 },
  emptyState: { alignItems: 'center', padding: 40, borderRadius: 16, marginBottom: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold' },
  emptySubtext: { color: '#CCCCCC', fontSize: 14 },
  cardItem: { marginBottom: 16 },
  cardFrozen: { opacity: 0.7 },
  cardVisual: { backgroundColor: '#0066FF', borderRadius: 16, padding: 20 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  cardType: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  cardBrand: { color: '#FFFFFF', fontSize: 18, fontFamily: 'Montserrat_700Bold' },
  cardNumber: { color: '#FFFFFF', fontSize: 22, letterSpacing: 2, marginBottom: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  cardBalance: { color: '#FFFFFF', fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  cardExpiry: { color: '#FFFFFF', fontSize: 14 },
  statusBadge: { backgroundColor: '#10b981', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusFrozen: { backgroundColor: '#ef4444' },
  statusText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Montserrat_600SemiBold' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 12, padding: 12, marginTop: 8 },
  cardAction: { alignItems: 'center' },
  actionIcon: { fontSize: 20, marginBottom: 4 },
  actionText: { color: '#CCCCCC', fontSize: 10 },
  sectionTitle: { fontSize: 18, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16, marginTop: 8 },
  optionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16, marginBottom: 12 },
  optionIcon: { fontSize: 32, marginRight: 12 },
  optionInfo: { flex: 1 },
  optionTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold' },
  optionDesc: { color: '#CCCCCC', fontSize: 12 },
  arrow: { color: '#0066FF', fontSize: 20 },
  benefitsCard: { borderRadius: 16, padding: 20, marginTop: 16 },
  benefitsTitle: { fontSize: 16, fontFamily: 'Montserrat_600SemiBold', marginBottom: 16 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  benefitIcon: { color: '#10b981', fontSize: 16, marginRight: 12 },
  benefitText: { fontSize: 14 },
});
