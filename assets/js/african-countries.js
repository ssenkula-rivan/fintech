/**
 * African Countries Phone Codes
 * Complete list of all 54 African countries with dial codes
 */

const africanCountries = [
    { name: "Algeria", code: "DZ", dialCode: "+213", flag: "🇩🇿" },
    { name: "Angola", code: "AO", dialCode: "+244", flag: "🇦🇴" },
    { name: "Benin", code: "BJ", dialCode: "+229", flag: "🇧🇯" },
    { name: "Botswana", code: "BW", dialCode: "+267", flag: "🇧🇼" },
    { name: "Burkina Faso", code: "BF", dialCode: "+226", flag: "🇧🇫" },
    { name: "Burundi", code: "BI", dialCode: "+257", flag: "🇧🇮" },
    { name: "Cameroon", code: "CM", dialCode: "+237", flag: "🇨🇲" },
    { name: "Cape Verde", code: "CV", dialCode: "+238", flag: "🇨🇻" },
    { name: "Central African Republic", code: "CF", dialCode: "+236", flag: "🇨🇫" },
    { name: "Chad", code: "TD", dialCode: "+235", flag: "🇹🇩" },
    { name: "Comoros", code: "KM", dialCode: "+269", flag: "🇰🇲" },
    { name: "Congo (Brazzaville)", code: "CG", dialCode: "+242", flag: "🇨🇬" },
    { name: "Congo (Kinshasa)", code: "CD", dialCode: "+243", flag: "🇨🇩" },
    { name: "Côte d'Ivoire", code: "CI", dialCode: "+225", flag: "🇨🇮" },
    { name: "Djibouti", code: "DJ", dialCode: "+253", flag: "🇩🇯" },
    { name: "Egypt", code: "EG", dialCode: "+20", flag: "🇪🇬" },
    { name: "Equatorial Guinea", code: "GQ", dialCode: "+240", flag: "🇬🇶" },
    { name: "Eritrea", code: "ER", dialCode: "+291", flag: "🇪🇷" },
    { name: "Eswatini", code: "SZ", dialCode: "+268", flag: "🇸🇿" },
    { name: "Ethiopia", code: "ET", dialCode: "+251", flag: "🇪🇹" },
    { name: "Gabon", code: "GA", dialCode: "+241", flag: "🇬🇦" },
    { name: "Gambia", code: "GM", dialCode: "+220", flag: "🇬🇲" },
    { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
    { name: "Guinea", code: "GN", dialCode: "+224", flag: "🇬🇳" },
    { name: "Guinea-Bissau", code: "GW", dialCode: "+245", flag: "🇬🇼" },
    { name: "Kenya", code: "KE", dialCode: "+254", flag: "🇰🇪" },
    { name: "Lesotho", code: "LS", dialCode: "+266", flag: "🇱🇸" },
    { name: "Liberia", code: "LR", dialCode: "+231", flag: "🇱🇷" },
    { name: "Libya", code: "LY", dialCode: "+218", flag: "🇱🇾" },
    { name: "Madagascar", code: "MG", dialCode: "+261", flag: "🇲🇬" },
    { name: "Malawi", code: "MW", dialCode: "+265", flag: "🇲🇼" },
    { name: "Mali", code: "ML", dialCode: "+223", flag: "🇲🇱" },
    { name: "Mauritania", code: "MR", dialCode: "+222", flag: "🇲🇷" },
    { name: "Mauritius", code: "MU", dialCode: "+230", flag: "🇲🇺" },
    { name: "Morocco", code: "MA", dialCode: "+212", flag: "🇲🇦" },
    { name: "Mozambique", code: "MZ", dialCode: "+258", flag: "🇲🇿" },
    { name: "Namibia", code: "NA", dialCode: "+264", flag: "🇳🇦" },
    { name: "Niger", code: "NE", dialCode: "+227", flag: "🇳🇪" },
    { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
    { name: "Rwanda", code: "RW", dialCode: "+250", flag: "🇷🇼" },
    { name: "São Tomé and Príncipe", code: "ST", dialCode: "+239", flag: "🇸🇹" },
    { name: "Senegal", code: "SN", dialCode: "+221", flag: "🇸🇳" },
    { name: "Seychelles", code: "SC", dialCode: "+248", flag: "🇸🇨" },
    { name: "Sierra Leone", code: "SL", dialCode: "+232", flag: "🇸🇱" },
    { name: "Somalia", code: "SO", dialCode: "+252", flag: "🇸🇴" },
    { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
    { name: "South Sudan", code: "SS", dialCode: "+211", flag: "🇸🇸" },
    { name: "Sudan", code: "SD", dialCode: "+249", flag: "🇸🇩" },
    { name: "Tanzania", code: "TZ", dialCode: "+255", flag: "🇹🇿" },
    { name: "Togo", code: "TG", dialCode: "+228", flag: "🇹🇬" },
    { name: "Tunisia", code: "TN", dialCode: "+216", flag: "🇹🇳" },
    { name: "Uganda", code: "UG", dialCode: "+256", flag: "🇺🇬" },
    { name: "Zambia", code: "ZM", dialCode: "+260", flag: "🇿🇲" },
    { name: "Zimbabwe", code: "ZW", dialCode: "+263", flag: "🇿🇼" }
];

// Current selected country
let selectedCountry = africanCountries.find(c => c.code === 'UG'); // Default Uganda

// Get country by dial code
function getCountryByDialCode(dialCode) {
    return africanCountries.find(country => country.dialCode === dialCode);
}

// Get country by ISO code
function getCountryByCode(code) {
    return africanCountries.find(country => country.code === code);
}

// Search countries
function searchCountries(searchTerm) {
    const term = searchTerm.toLowerCase();
    return africanCountries.filter(country =>
        country.name.toLowerCase().includes(term) ||
        country.dialCode.includes(term)
    );
}

// Format phone number with country code
function formatPhoneNumber(dialCode, localNumber) {
    const cleanNumber = localNumber.replace(/^0+/, '').replace(/\D/g, '');
    return `${dialCode}${cleanNumber}`;
}

// Get selected dial code
function getSelectedDialCode() {
    return selectedCountry ? selectedCountry.dialCode : '+256';
}

// Set selected country
function setSelectedCountry(code) {
    selectedCountry = getCountryByCode(code);
    return selectedCountry;
}

console.log('✅ African Countries loaded:', africanCountries.length, 'countries');
