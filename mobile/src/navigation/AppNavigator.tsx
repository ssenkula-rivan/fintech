// GMG Uganda Mobile App - Navigation
import React from 'react';
import { ActivityIndicator, View, Text, Image, StyleSheet, Platform, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// Icons
const homeIcon = require('../../assets/home.png');
const gmgLogo = require('../../assets/splash-icon.png');
import SettingsIcon from '../components/icons/SettingsIcon';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import SendScreen from '../screens/SendScreen';
import DepositScreen from '../screens/DepositScreen';
import WithdrawScreen from '../screens/WithdrawScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MoreScreen from '../screens/MoreScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import WalletScreen from '../screens/WalletScreen';
import AirtimeScreen from '../screens/AirtimeScreen';
import DataScreen from '../screens/DataScreen';
import BillsScreen from '../screens/BillsScreen';
import BanksScreen from '../screens/BanksScreen';
import ExchangeScreen from '../screens/ExchangeScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SavingsScreen from '../screens/SavingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoansScreen from '../screens/LoansScreen';
import InsuranceScreen from '../screens/InsuranceScreen';
import RequestMoneyScreen from '../screens/RequestMoneyScreen';
import CardsScreen from '../screens/CardsScreen';
import BeneficiariesScreen from '../screens/BeneficiariesScreen';
import TradingHubScreen from '../screens/TradingHubScreen';
import ForexScreen from '../screens/ForexScreen';
import StocksScreen from '../screens/StocksScreen';
import CryptoTradingScreen from '../screens/CryptoTradingScreen';
import CommoditiesScreen from '../screens/CommoditiesScreen';
import KYCScreen from '../screens/KYCScreen';
import SecurityScreen from '../screens/SecurityScreen';
import HelpScreen from '../screens/HelpScreen';
import LimitsScreen from '../screens/LimitsScreen';
import URAScreen from '../screens/URAScreen';
import CrashLogsScreen from '../screens/CrashLogsScreen';
import ExchangeRatesScreen from '../screens/ExchangeRatesScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Get screen height to detect devices with gesture navigation
const { height: screenHeight } = Dimensions.get('window');

// Tab Navigator for authenticated users
function MainTabs() {
  const insets = useSafeAreaInsets();
  
  // Calculate bottom padding based on device safe area
  // Devices with gesture navigation have insets.bottom > 0
  const hasGestureNavigation = insets.bottom > 0;
  const tabBarHeight = 60;
  const bottomPadding = hasGestureNavigation ? insets.bottom : 10;
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E8ECF0',
          borderTopWidth: 1,
          height: tabBarHeight + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 8,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: '#0066FF',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'Montserrat_500Medium' },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Image 
              source={homeIcon} 
              style={{ 
                width: 24, 
                height: 24, 
                tintColor: focused ? '#0066FF' : '#6B7280',
              }} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Wallet" 
        component={WalletScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22 }}>💳</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen}
        options={{
          tabBarLabel: 'Discover',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerTabContainer}>
              <View style={[styles.centerTabButton, focused && styles.centerTabButtonActive]}>
                <Image 
                  source={gmgLogo} 
                  style={styles.centerTabLogo} 
                  resizeMode="contain"
                />
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.profileIconCircle, focused && styles.profileIconCircleActive]}>
                <Text style={styles.profileIconText}>👤</Text>
              </View>
            </View>
          ),
        }}
      />
      <Tab.Screen 
        name="More" 
        component={MoreScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', gap: 2 }}>
                <View style={[styles.moreIconDot, focused && styles.moreIconDotActive]} />
                <View style={[styles.moreIconDot, focused && styles.moreIconDotActive]} />
              </View>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                <View style={[styles.moreIconDot, focused && styles.moreIconDotActive]} />
                <View style={[styles.moreIconDot, focused && styles.moreIconDotActive]} />
              </View>
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple tab icon component
function TabIcon({ icon, color }: { icon: string; color: string }) {
  return (
    <View style={{ opacity: color === '#0066FF' ? 1 : 0.5, alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centerTabContainer: {
    position: 'absolute',
    top: -25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTabButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#E8ECF0',
  },
  centerTabButtonActive: {
    borderColor: '#0066FF',
    shadowOpacity: 0.5,
  },
  centerTabLogo: {
    width: 40,
    height: 40,
  },
  moreIconDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6B7280',
  },
  moreIconDotActive: {
    backgroundColor: '#0066FF',
  },
  profileIconCircle: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconCircleActive: {
    backgroundColor: 'transparent',
  },
  profileIconText: {
    fontSize: 22,
  },
});

// Main App Navigator
export default function AppNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#87CEEB' }}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            <Stack.Screen name="Send" component={SendScreen} />
            <Stack.Screen name="Deposit" component={DepositScreen} />
            <Stack.Screen name="Withdraw" component={WithdrawScreen} />
            <Stack.Screen name="Airtime" component={AirtimeScreen} />
            <Stack.Screen name="Data" component={DataScreen} />
            <Stack.Screen name="Bills" component={BillsScreen} />
            <Stack.Screen name="Banks" component={BanksScreen} />
            <Stack.Screen name="Exchange" component={ExchangeScreen} />
            <Stack.Screen name="QRCode" component={QRCodeScreen} />
            <Stack.Screen name="Savings" component={SavingsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Loans" component={LoansScreen} />
            <Stack.Screen name="Insurance" component={InsuranceScreen} />
            <Stack.Screen name="RequestMoney" component={RequestMoneyScreen} />
            <Stack.Screen name="Cards" component={CardsScreen} />
            <Stack.Screen name="Beneficiaries" component={BeneficiariesScreen} />
            <Stack.Screen name="TradingHub" component={TradingHubScreen} />
            <Stack.Screen name="Forex" component={ForexScreen} />
            <Stack.Screen name="Stocks" component={StocksScreen} />
            <Stack.Screen name="CryptoTrading" component={CryptoTradingScreen} />
            <Stack.Screen name="Commodities" component={CommoditiesScreen} />
            <Stack.Screen name="KYC" component={KYCScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="Limits" component={LimitsScreen} />
            <Stack.Screen name="URA" component={URAScreen} />
            <Stack.Screen name="CrashLogs" component={CrashLogsScreen} />
            <Stack.Screen name="ExchangeRates" component={ExchangeRatesScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
