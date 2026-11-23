// GMG Uganda Mobile App - Formatting Utilities

export function formatCurrency(amount: number, currency = 'UGX'): string {
  if (currency === 'UGX') {
    return `UGX ${amount.toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
  }
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPhone(phone: string): string {
  // Format +256XXXXXXXXX to +256 XXX XXX XXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('256') && cleaned.length === 12) {
    return `+256 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
}

export function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '256' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('256')) {
    cleaned = '256' + cleaned;
  }
  return '+' + cleaned;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-UG', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
}

export function formatTransactionType(type: string): string {
  const types: Record<string, string> = {
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    TRANSFER: 'Transfer',
    FEE: 'Fee',
    REVERSAL: 'Reversal',
  };
  return types[type] || type;
}

export function getTransactionIcon(type: string): string {
  const icons: Record<string, string> = {
    DEPOSIT: '↓',
    WITHDRAWAL: '↑',
    TRANSFER: '↔',
    FEE: '💰',
    REVERSAL: '↩',
  };
  return icons[type] || '•';
}

export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 7) + '***' + phone.slice(-3);
}
