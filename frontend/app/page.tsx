'use client';

import { useState, useEffect } from 'react';

interface Account {
  id: string;
  name: string;
  balance: number;
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountData, setAccountData] = useState({
    name: '',
    balance: '',
  });

  const [pixData, setPixData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:3000/accounts');
      if (!response.ok) throw new Error('Failed to fetch accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      
      if (!response.ok) throw new Error('Failed to create account');
      
      const data = await response.json();
      alert(`Account created! ID: ${data.id}`);
      setAccountData({ name: '', balance: '' });
      fetchAccounts();
    } catch (error) {
      alert('Error creating account: ' + error);
    }
  };

  const sendPix = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pixData),
      });
      
      if (!response.ok) throw new Error('Failed to send Pix');
      
      const data = await response.json();
      alert(`Pix sent! Transaction ID: ${data.transactionId}`);
      setPixData({
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: '',
      });
    } catch (error) {
      alert('Error sending Pix: ' + error);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900">Bank App</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Account Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Create Account</h2>
            <form onSubmit={createAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={accountData.balance}
                  onChange={(e) => setAccountData({ ...accountData, balance: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Create Account
              </button>
            </form>
          </div>

          {/* Send Pix Form */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Send Pix</h2>
            <form onSubmit={sendPix} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                <select
                  value={pixData.fromAccount}
                  onChange={(e) => setPixData({ ...pixData, fromAccount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - R$ {account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                <select
                  value={pixData.toAccount}
                  onChange={(e) => setPixData({ ...pixData, toAccount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select account</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - R$ {account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={pixData.amount}
                  onChange={(e) => setPixData({ ...pixData, amount: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={pixData.description}
                  onChange={(e) => setPixData({ ...pixData, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Send Pix
              </button>
            </form>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Accounts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 border border-gray-200 rounded-md hover:shadow-md transition-shadow">
                <h3 className="font-semibold text-gray-900">{account.name}</h3>
                <p className="text-sm text-gray-600">ID: {account.id}</p>
                <p className="text-lg font-bold text-green-600 mt-2">
                  R$ {account.balance.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 