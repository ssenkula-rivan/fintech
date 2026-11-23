// Virtual Cards Management - Sprint 3
// NO MOCK DATA - Real API integration

const API_BASE = 'http://localhost:3004';

class CardsManager {
  constructor() {
    this.token = localStorage.getItem('token');
    this.cards = [];
    this.selectedCard = null;
  }

  async createCard(cardholderName, currency = 'UGX') {
    try {
      const response = await fetch(`${API_BASE}/cards/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          cardholder_name: cardholderName,
          currency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create card');
      }

      this.showSuccess('Virtual card created successfully!');
      await this.loadCards();
      return data;
    } catch (error) {
      this.showError(error.message);
      throw error;
    }
  }

  async loadCards() {
    try {
      const response = await fetch(`${API_BASE}/cards/list`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load cards');
      }

      this.cards = await response.json();
      this.renderCards();
      return this.cards;
    } catch (error) {
      this.showError(error.message);
      return [];
    }
  }

  async getCardDetails(cardId) {
    try {
      const response = await fetch(`${API_BASE}/cards/${cardId}/details`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load card details');
      }

      return await response.json();
    } catch (error) {
      this.showError(error.message);
      throw error;
    }
  }

  async fundCard(cardId, amount) {
    try {
      const response = await fetch(`${API_BASE}/cards/${cardId}/fund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fund card');
      }

      this.showSuccess(`Card funded with UGX ${amount.toLocaleString()}`);
      await this.loadCards();
      return data;
    } catch (error) {
      this.showError(error.message);
      throw error;
    }
  }

  async freezeCard(cardId) {
    try {
      const response = await fetch(`${API_BASE}/cards/${cardId}/freeze`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to freeze card');
      }

      this.showSuccess('Card frozen successfully');
      await this.loadCards();
      return data;
    } catch (error) {
      this.showError(error.message);
      throw error;
    }
  }

  async unfreezeCard(cardId) {
    try {
      const response = await fetch(`${API_BASE}/cards/${cardId}/unfreeze`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to unfreeze card');
      }

      this.showSuccess('Card unfrozen successfully');
      await this.loadCards();
      return data;
    } catch (error) {
      this.showError(error.message);
      throw error;
    }
  }

  async getCardTransactions(cardId) {
    try {
      const response = await fetch(`${API_BASE}/cards/${cardId}/transactions`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load transactions');
      }

      return await response.json();
    } catch (error) {
      this.showError(error.message);
      return [];
    }
  }

  renderCards() {
    const container = document.getElementById('cardsContainer');
    if (!container) return;

    if (this.cards.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-credit-card fa-3x mb-3"></i>
          <h4>No Virtual Cards</h4>
          <p>Create your first virtual card to start shopping online securely</p>
          <button class="btn btn-primary" onclick="cardsManager.showCreateCardModal()">
            <i class="fas fa-plus"></i> Create Card
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.cards
      .map(
        (card) => `
      <div class="card-item ${card.status === 'FROZEN' ? 'frozen' : ''}" data-card-id="${card.card_id}">
        <div class="card-visual">
          <div class="card-chip"></div>
          <div class="card-number">${card.card_number}</div>
          <div class="card-info">
            <div>
              <small>CARDHOLDER</small>
              <div>${card.cardholder_name}</div>
            </div>
            <div>
              <small>EXPIRES</small>
              <div>${card.expiry_date}</div>
            </div>
          </div>
          <div class="card-balance">
            <small>BALANCE</small>
            <h3>${card.currency} ${parseFloat(card.balance).toLocaleString()}</h3>
          </div>
          ${card.status === 'FROZEN' ? '<div class="frozen-badge">FROZEN</div>' : ''}
        </div>
        <div class="card-actions">
          <button class="btn btn-sm btn-primary" onclick="cardsManager.showFundModal(${card.card_id})">
            <i class="fas fa-plus"></i> Fund
          </button>
          <button class="btn btn-sm btn-info" onclick="cardsManager.showCardDetails(${card.card_id})">
            <i class="fas fa-eye"></i> Details
          </button>
          <button class="btn btn-sm btn-secondary" onclick="cardsManager.showTransactions(${card.card_id})">
            <i class="fas fa-list"></i> Transactions
          </button>
          ${
            card.status === 'ACTIVE'
              ? `<button class="btn btn-sm btn-warning" onclick="cardsManager.freezeCard(${card.card_id})">
                  <i class="fas fa-snowflake"></i> Freeze
                </button>`
              : `<button class="btn btn-sm btn-success" onclick="cardsManager.unfreezeCard(${card.card_id})">
                  <i class="fas fa-unlock"></i> Unfreeze
                </button>`
          }
        </div>
      </div>
    `,
      )
      .join('');
  }

  showCreateCardModal() {
    const modal = document.getElementById('createCardModal');
    if (modal) {
      modal.style.display = 'block';
    }
  }

  showFundModal(cardId) {
    this.selectedCard = this.cards.find((c) => c.card_id === cardId);
    const modal = document.getElementById('fundCardModal');
    if (modal) {
      document.getElementById('fundCardId').value = cardId;
      modal.style.display = 'block';
    }
  }

  async showCardDetails(cardId) {
    try {
      const details = await this.getCardDetails(cardId);
      const modal = document.getElementById('cardDetailsModal');
      if (modal) {
        document.getElementById('detailsCardNumber').textContent = details.card_number;
        document.getElementById('detailsCardHolder').textContent = details.cardholder_name;
        document.getElementById('detailsExpiry').textContent = details.expiry_date;
        document.getElementById('detailsCVV').textContent = details.cvv;
        document.getElementById('detailsBalance').textContent = `${details.currency} ${parseFloat(details.balance).toLocaleString()}`;
        modal.style.display = 'block';
      }
    } catch (error) {
      console.error('Failed to load card details:', error);
    }
  }

  async showTransactions(cardId) {
    try {
      const transactions = await this.getCardTransactions(cardId);
      const modal = document.getElementById('transactionsModal');
      const container = document.getElementById('transactionsList');

      if (transactions.length === 0) {
        container.innerHTML = '<p class="text-center">No transactions yet</p>';
      } else {
        container.innerHTML = transactions
          .map(
            (tx) => `
          <div class="transaction-item">
            <div>
              <strong>${tx.merchant_name}</strong>
              <small class="d-block text-muted">${new Date(tx.created_at).toLocaleString()}</small>
            </div>
            <div class="text-end">
              <strong class="text-danger">-${tx.currency} ${parseFloat(tx.amount).toLocaleString()}</strong>
              <small class="d-block badge bg-${tx.status === 'APPROVED' ? 'success' : tx.status === 'DECLINED' ? 'danger' : 'warning'}">${tx.status}</small>
            </div>
          </div>
        `,
          )
          .join('');
      }

      modal.style.display = 'block';
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }

  showSuccess(message) {
    alert(message); // Replace with better notification system
  }

  showError(message) {
    alert('Error: ' + message); // Replace with better notification system
  }
}

// Initialize
const cardsManager = new CardsManager();

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cardsContainer')) {
    cardsManager.loadCards();
  }

  // Create card form
  const createForm = document.getElementById('createCardForm');
  if (createForm) {
    createForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cardholderName = document.getElementById('cardholderName').value;
      const currency = document.getElementById('cardCurrency').value;
      await cardsManager.createCard(cardholderName, currency);
      createForm.reset();
      document.getElementById('createCardModal').style.display = 'none';
    });
  }

  // Fund card form
  const fundForm = document.getElementById('fundCardForm');
  if (fundForm) {
    fundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const cardId = document.getElementById('fundCardId').value;
      const amount = parseFloat(document.getElementById('fundAmount').value);
      await cardsManager.fundCard(cardId, amount);
      fundForm.reset();
      document.getElementById('fundCardModal').style.display = 'none';
    });
  }

  // Close modals
  document.querySelectorAll('.modal .close').forEach((btn) => {
    btn.addEventListener('click', function () {
      this.closest('.modal').style.display = 'none';
    });
  });
});
