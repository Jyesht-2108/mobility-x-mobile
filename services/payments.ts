import * as SecureStore from 'expo-secure-store';

export type Transaction = {
  id: string;
  type: 'credit' | 'debit';
  amountCents: number;
  description: string;
  timestamp: number;
  status: 'completed' | 'pending' | 'failed';
  reference?: string;
};

export type Wallet = {
  balanceCents: number;
  lastUpdated: number;
  transactions: Transaction[];
};

const WALLET_KEY = 'wallet_v1';
const TRANSACTIONS_KEY = 'transactions_v1';

export async function getWallet(): Promise<Wallet> {
  const raw = await SecureStore.getItemAsync(WALLET_KEY);
  const transactionsRaw = await SecureStore.getItemAsync(TRANSACTIONS_KEY);
  
  if (raw) {
    const wallet = JSON.parse(raw) as Wallet;
    const transactions = transactionsRaw ? JSON.parse(transactionsRaw) as Transaction[] : [];
    return { ...wallet, transactions };
  }
  
  const initial: Wallet = { 
    balanceCents: 2500, 
    lastUpdated: Date.now(),
    transactions: []
  };
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(initial));
  await SecureStore.setItemAsync(TRANSACTIONS_KEY, JSON.stringify([]));
  return initial;
}

export async function addTransaction(transaction: Omit<Transaction, 'id' | 'timestamp'>): Promise<Transaction> {
  const newTransaction: Transaction = {
    ...transaction,
    id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };
  
  const transactionsRaw = await SecureStore.getItemAsync(TRANSACTIONS_KEY);
  const transactions = transactionsRaw ? JSON.parse(transactionsRaw) as Transaction[] : [];
  transactions.unshift(newTransaction);
  
  // Keep only last 50 transactions
  if (transactions.length > 50) {
    transactions.splice(50);
  }
  
  await SecureStore.setItemAsync(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return newTransaction;
}

export async function topUp(cents: number, method: string = 'Card'): Promise<Wallet> {
  const wallet = await getWallet();
  const next: Wallet = { 
    balanceCents: wallet.balanceCents + cents, 
    lastUpdated: Date.now(),
    transactions: wallet.transactions
  };
  
  await addTransaction({
    type: 'credit',
    amountCents: cents,
    description: `Top-up via ${method}`,
    status: 'completed'
  });
  
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(next));
  return next;
}

export async function charge(cents: number, description: string): Promise<Wallet> {
  const wallet = await getWallet();
  if (wallet.balanceCents < cents) {
    throw new Error('Insufficient balance');
  }
  
  const next: Wallet = { 
    balanceCents: wallet.balanceCents - cents, 
    lastUpdated: Date.now(),
    transactions: wallet.transactions
  };
  
  await addTransaction({
    type: 'debit',
    amountCents: cents,
    description,
    status: 'completed'
  });
  
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(next));
  return next;
}

export async function processPayment(itineraryId: string, amountCents: number, description: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const wallet = await charge(amountCents, description);
    return { success: true, transactionId: `txn-${Date.now()}` };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


