// Language Switcher Component - Modal with all world languages
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../i18n';

interface LanguageSwitcherProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguageSwitcher({ visible, onClose }: LanguageSwitcherProps) {
  const { language, setLanguage, allLanguages, t } = useLanguage();
  const [search, setSearch] = useState('');

  const filteredLanguages = useMemo(() => {
    if (!search.trim()) return allLanguages;
    const query = search.toLowerCase();
    return allLanguages.filter(
      lang =>
        lang.name.toLowerCase().includes(query) ||
        lang.nativeName.toLowerCase().includes(query) ||
        lang.code.toLowerCase().includes(query)
    );
  }, [search, allLanguages]);

  const handleSelect = async (lang: Language) => {
    await setLanguage(lang.code);
    onClose();
  };

  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === language;
    return (
      <TouchableOpacity
        style={[styles.languageItem, isSelected && styles.languageItemSelected]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{item.flag}</Text>
        <View style={styles.languageInfo}>
          <Text style={[styles.languageName, isSelected && styles.languageNameSelected]}>
            {item.name}
          </Text>
          <Text style={styles.nativeName}>{item.nativeName}</Text>
        </View>
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder={t('language.searchPlaceholder')}
              placeholderTextColor="#888"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Language Count */}
          <Text style={styles.countText}>
            {filteredLanguages.length} {t('language.allLanguages').toLowerCase()}
          </Text>

          {/* Language List */}
          <FlatList
            data={filteredLanguages}
            keyExtractor={item => item.code}
            renderItem={renderLanguageItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            initialNumToRender={20}
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Compact Language Button for Header
export function LanguageButton({ onPress }: { onPress: () => void }) {
  const { languageInfo } = useLanguage();

  return (
    <TouchableOpacity style={styles.langButton} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.langButtonFlag}>{languageInfo?.flag || '🌐'}</Text>
      <Text style={styles.langButtonCode}>{languageInfo?.code.toUpperCase() || 'EN'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Montserrat_700Bold',
    color: '#fff',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
  },
  clearBtn: {
    color: '#888',
    fontSize: 16,
    padding: 4,
  },
  countText: {
    color: '#888',
    fontSize: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageItemSelected: {
    backgroundColor: '#0066FF20',
  },
  flag: {
    fontSize: 28,
    marginRight: 14,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'Montserrat_500Medium',
  },
  languageNameSelected: {
    color: '#0066FF',
  },
  nativeName: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: '#0066FF',
    fontFamily: 'Montserrat_700Bold',
  },
  // Language Button styles
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  langButtonFlag: {
    fontSize: 16,
  },
  langButtonCode: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Montserrat_600SemiBold',
  },
});