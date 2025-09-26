import * as SecureStore from 'expo-secure-store';

export type Wallet = {
  balanceCents: number;
  lastUpdated: number;
};

const WALLET_KEY = 'wallet_v1';

export async function getWallet(): Promise<Wallet> {
  const raw = await SecureStore.getItemAsync(WALLET_KEY);
  if (raw) return JSON.parse(raw) as Wallet;
  const initial: Wallet = { balanceCents: 2500, lastUpdated: Date.now() };
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(initial));
  return initial;
}

export async function topUp(cents: number): Promise<Wallet> {
  const wallet = await getWallet();
  const next: Wallet = { balanceCents: wallet.balanceCents + cents, lastUpdated: Date.now() };
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(next));
  return next;
}

export async function charge(cents: number): Promise<Wallet> {
  const wallet = await getWallet();
  if (wallet.balanceCents < cents) {
    throw new Error('Insufficient balance');
  }
  const next: Wallet = { balanceCents: wallet.balanceCents - cents, lastUpdated: Date.now() };
  await SecureStore.setItemAsync(WALLET_KEY, JSON.stringify(next));
  return next;
}


