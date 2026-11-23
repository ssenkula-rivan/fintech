// All World Languages - Complete list like Google Translate
export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  // ★ Languages with full translations (show first)
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'lg', name: 'Luganda', nativeName: 'Oluganda', flag: '🇺🇬' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  
  // Major World Languages (fallback to English)
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', flag: '🇷🇸' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', flag: '🇸🇮' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', flag: '🇱🇹' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', flag: '🇱🇻' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', flag: '🇪🇪' },
  
  // African Languages
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼' },
  { code: 'rn', name: 'Kirundi', nativeName: 'Ikirundi', flag: '🇧🇮' },
  { code: 'am', name: 'Amharic', nativeName: 'አማርኛ', flag: '🇪🇹' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹' },
  { code: 'ti', name: 'Tigrinya', nativeName: 'ትግርኛ', flag: '🇪🇷' },
  { code: 'so', name: 'Somali', nativeName: 'Soomaali', flag: '🇸🇴' },
  { code: 'ha', name: 'Hausa', nativeName: 'Hausa', flag: '🇳🇬' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', flag: '🇳🇬' },
  { code: 'ig', name: 'Igbo', nativeName: 'Igbo', flag: '🇳🇬' },
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', flag: '🇿🇦' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', flag: '🇧🇼' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { code: 'ny', name: 'Chichewa', nativeName: 'Chichewa', flag: '🇲🇼' },
  { code: 'mg', name: 'Malagasy', nativeName: 'Malagasy', flag: '🇲🇬' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳' },
  { code: 'ff', name: 'Fulani', nativeName: 'Fulfulde', flag: '🇳🇬' },
  { code: 'ak', name: 'Akan', nativeName: 'Akan', flag: '🇬🇭' },
  { code: 'tw', name: 'Twi', nativeName: 'Twi', flag: '🇬🇭' },
  { code: 'ee', name: 'Ewe', nativeName: 'Eʋegbe', flag: '🇬🇭' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikongo', flag: '🇨🇩' },
  
  // Middle Eastern Languages
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', rtl: true },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', flag: '🇮🇷', rtl: true },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '🇮🇶' },
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', flag: '🇦🇫', rtl: true },
  
  // South Asian Languages
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', flag: '🇱🇰' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' },
  { code: 'my', name: 'Burmese', nativeName: 'မြန်မာ', flag: '🇲🇲' },
  { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
  
  // Southeast Asian Languages
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'tl', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭' },
  { code: 'jv', name: 'Javanese', nativeName: 'Basa Jawa', flag: '🇮🇩' },
  { code: 'su', name: 'Sundanese', nativeName: 'Basa Sunda', flag: '🇮🇩' },
  
  // Central Asian Languages
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbek', flag: '🇺🇿' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ', flag: '🇰🇿' },
  { code: 'ky', name: 'Kyrgyz', nativeName: 'Кыргызча', flag: '🇰🇬' },
  { code: 'tg', name: 'Tajik', nativeName: 'Тоҷикӣ', flag: '🇹🇯' },
  { code: 'tk', name: 'Turkmen', nativeName: 'Türkmen', flag: '🇹🇲' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', flag: '🇲🇳' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan', flag: '🇦🇿' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', flag: '🇬🇪' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերdelays', flag: '🇦🇲' },
  
  // Other European Languages
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸' },
  { code: 'gl', name: 'Galician', nativeName: 'Galego', flag: '🇪🇸' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸' },
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', flag: '🇮🇪' },
  { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', flag: '🇮🇸' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', flag: '🇲🇹' },
  { code: 'lb', name: 'Luxembourgish', nativeName: 'Lëtzebuergesch', flag: '🇱🇺' },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱' },
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', flag: '🇲🇰' },
  { code: 'bs', name: 'Bosnian', nativeName: 'Bosanski', flag: '🇧🇦' },
  { code: 'be', name: 'Belarusian', nativeName: 'Беларуская', flag: '🇧🇾' },
  
  // Pacific Languages
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿' },
  { code: 'haw', name: 'Hawaiian', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🇺🇸' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', flag: '🇼🇸' },
  { code: 'to', name: 'Tongan', nativeName: 'Lea Faka-Tonga', flag: '🇹🇴' },
  { code: 'fj', name: 'Fijian', nativeName: 'Vosa Vakaviti', flag: '🇫🇯' },
  
  // Americas Indigenous Languages
  { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', flag: '🇵🇪' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', flag: '🇧🇴' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañeʼẽ', flag: '🇵🇾' },
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  
  // Other Languages
  { code: 'eo', name: 'Esperanto', nativeName: 'Esperanto', flag: '🌍' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🇻🇦' },
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', flag: '🇮🇱', rtl: true },
];

export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

export const searchLanguages = (query: string): Language[] => {
  const lowerQuery = query.toLowerCase();
  return LANGUAGES.filter(
    lang =>
      lang.name.toLowerCase().includes(lowerQuery) ||
      lang.nativeName.toLowerCase().includes(lowerQuery) ||
      lang.code.toLowerCase().includes(lowerQuery)
  );
};

export default LANGUAGES;