/**
 * African Countries Data for Phone Number Selection
 */

const africanCountries = [
    { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256' },
    { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
    { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255' },
    { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250' },
    { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
    { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233' },
    { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
    { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20' },
    { code: 'MA', name: 'Morocco', flag: '🇲🇦', dialCode: '+212' },
    { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
    { code: 'SN', name: 'Senegal', flag: '🇸🇳', dialCode: '+221' },
    { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮', dialCode: '+225' },
    { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', dialCode: '+226' },
    { code: 'ML', name: 'Mali', flag: '🇲🇱', dialCode: '+223' },
    { code: 'NE', name: 'Niger', flag: '🇳🇪', dialCode: '+227' },
    { code: 'TD', name: 'Chad', flag: '🇹🇩', dialCode: '+235' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲', dialCode: '+237' },
    { code: 'CF', name: 'Central African Republic', flag: '🇨🇫', dialCode: '+236' },
    { code: 'CG', name: 'Republic of the Congo', flag: '🇨🇬', dialCode: '+242' },
    { code: 'CD', name: 'Democratic Republic of the Congo', flag: '🇨🇩', dialCode: '+243' },
    { code: 'GA', name: 'Gabon', flag: '🇬🇦', dialCode: '+241' },
    { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', dialCode: '+240' },
    { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹', dialCode: '+239' },
    { code: 'AO', name: 'Angola', flag: '🇦🇴', dialCode: '+244' },
    { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260' },
    { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', dialCode: '+263' },
    { code: 'BW', name: 'Botswana', flag: '🇧🇼', dialCode: '+267' },
    { code: 'NA', name: 'Namibia', flag: '🇳🇦', dialCode: '+264' },
    { code: 'SZ', name: 'Eswatini', flag: '🇸🇿', dialCode: '+268' },
    { code: 'LS', name: 'Lesotho', flag: '🇱🇸', dialCode: '+266' },
    { code: 'MW', name: 'Malawi', flag: '🇲🇼', dialCode: '+265' },
    { code: 'MZ', name: 'Mozambique', flag: '🇲🇿', dialCode: '+258' },
    { code: 'MG', name: 'Madagascar', flag: '🇲🇬', dialCode: '+261' },
    { code: 'MU', name: 'Mauritius', flag: '🇲🇺', dialCode: '+230' },
    { code: 'SC', name: 'Seychelles', flag: '🇸🇨', dialCode: '+248' },
    { code: 'KM', name: 'Comoros', flag: '🇰🇲', dialCode: '+269' },
    { code: 'DJ', name: 'Djibouti', flag: '🇩🇯', dialCode: '+253' },
    { code: 'SO', name: 'Somalia', flag: '🇸🇴', dialCode: '+252' },
    { code: 'ER', name: 'Eritrea', flag: '🇪🇷', dialCode: '+291' },
    { code: 'SD', name: 'Sudan', flag: '🇸🇩', dialCode: '+249' },
    { code: 'SS', name: 'South Sudan', flag: '🇸🇸', dialCode: '+211' },
    { code: 'LY', name: 'Libya', flag: '🇱🇾', dialCode: '+218' },
    { code: 'TN', name: 'Tunisia', flag: '🇹🇳', dialCode: '+216' },
    { code: 'DZ', name: 'Algeria', flag: '🇩🇿', dialCode: '+213' },
    { code: 'LR', name: 'Liberia', flag: '🇱🇷', dialCode: '+231' },
    { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱', dialCode: '+232' },
    { code: 'GN', name: 'Guinea', flag: '🇬🇳', dialCode: '+224' },
    { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', dialCode: '+245' },
    { code: 'CV', name: 'Cape Verde', flag: '🇨🇻', dialCode: '+238' },
    { code: 'GM', name: 'Gambia', flag: '🇬🇲', dialCode: '+220' },
    { code: 'MR', name: 'Mauritania', flag: '🇲🇷', dialCode: '+222' },
    { code: 'EH', name: 'Western Sahara', flag: '🇪🇭', dialCode: '+212' },
    { code: 'BI', name: 'Burundi', flag: '🇧🇮', dialCode: '+257' }
];

let selectedCountry = africanCountries[0]; // Default to Uganda

// Search countries
function searchCountries(searchTerm) {
    if (!searchTerm) return africanCountries;
    
    const term = searchTerm.toLowerCase();
    return africanCountries.filter(country => 
        country.name.toLowerCase().includes(term) ||
        country.dialCode.includes(term) ||
        country.code.toLowerCase().includes(term)
    );
}

// Set selected country
function setSelectedCountry(code) {
    const country = africanCountries.find(c => c.code === code);
    if (country) {
        selectedCountry = country;
        return country;
    }
    return null;
}

// Get selected country
function getSelectedCountry() {
    return selectedCountry;
}

// Export for global access
window.africanCountries = africanCountries;
window.searchCountries = searchCountries;
window.setSelectedCountry = setSelectedCountry;
window.getSelectedCountry = getSelectedCountry;