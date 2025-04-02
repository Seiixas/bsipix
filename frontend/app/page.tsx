"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Snowflake, Send, PlusCircle, RefreshCw, CreditCard } from "lucide-react"

interface Account {
  id: string
  accountNumber: string
  name: string
  cpf: string
  balance: number
}

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountData, setAccountData] = useState({
    name: "",
    cpf: "",
    balance: "",
  })

  const [pixData, setPixData] = useState({
    fromAccount: "",
    toAccount: "",
    amount: "",
    description: "",
  })

  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`)
      if (!response.ok) throw new Error("Falha ao buscar contas")
      const data = await response.json()
      setAccounts(data)
    } catch (error) {
      console.error("Erro ao buscar contas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      })

      if (!response.ok) throw new Error("Falha ao criar conta")

      const data = await response.json()
      alert(`Conta criada com sucesso! ID: ${data.id}`)
      setAccountData({ name: "", cpf: "", balance: "" })
      fetchAccounts()
    } catch (error) {
      alert("Erro ao criar conta: " + error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      console.log("Enviando dados PIX:", {
        from_account: pixData.fromAccount,
        to_account: pixData.toAccount,
        amount: Number.parseFloat(pixData.amount),
        description: pixData.description,
      })

      const response = await fetch("/api/pix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from_account: pixData.fromAccount,
          to_account: pixData.toAccount,
          amount: Number.parseFloat(pixData.amount),
          description: pixData.description,
        }),
      })

      const data = await response.json()
      console.log("Resposta da API:", data)

      if (!response.ok) {
        throw new Error(data.error || "Erro ao processar PIX")
      }

      if (!data.transaction_id) {
        throw new Error("ID da transação não recebido")
      }

      setSuccessMessage(`PIX realizado com sucesso! ID da transação: ${data.transaction_id}`)
      setPixData({
        fromAccount: "",
        toAccount: "",
        amount: "",
        description: "",
      })
    } catch (error) {
      alert("Erro ao enviar Pix: " + error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-900 to-sky-950 text-white">
      {/* Header */}
      <header className="bg-sky-950 shadow-lg py-4 border-b border-sky-800">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Snowflake className="h-8 w-8 text-sky-400" />
            <h1 className="text-3xl font-bold tracking-tight">Cold Bank</h1>
          </div>
          <button
            onClick={fetchAccounts}
            className="flex items-center gap-2 bg-sky-800 hover:bg-sky-700 px-3 py-1.5 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Account Form */}
          <div className="bg-sky-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-sky-700">
            <div className="flex items-center gap-2 mb-4">
              <PlusCircle className="h-5 w-5 text-sky-400" />
              <h2 className="text-2xl font-semibold text-sky-100">Criar Conta</h2>
            </div>
            <form onSubmit={createAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Nome Completo</label>
                <input
                  type="text"
                  value={accountData.name}
                  onChange={(e) => setAccountData({ ...accountData, name: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">CPF</label>
                <input
                  type="text"
                  value={accountData.cpf}
                  onChange={(e) => setAccountData({ ...accountData, cpf: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                  pattern="[0-9]{11}"
                  title="CPF deve conter 11 dígitos numéricos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  value={accountData.balance}
                  onChange={(e) => setAccountData({ ...accountData, balance: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-sky-600 text-white py-2 rounded-md hover:bg-sky-500 transition-colors disabled:bg-sky-800 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processando..." : "Criar Conta"}
              </button>
            </form>
          </div>

          {/* Send Pix Form */}
          <div className="bg-sky-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-sky-700">
            <div className="flex items-center gap-2 mb-4">
              <Send className="h-5 w-5 text-sky-400" />
              <h2 className="text-2xl font-semibold text-sky-100">Enviar Pix</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Conta de Origem</label>
                <select
                  value={pixData.fromAccount}
                  onChange={(e) => setPixData({ ...pixData, fromAccount: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                >
                  <option value="">Selecione a conta</option>
                  {accounts.map((account) => (
                    <option key={`from-${account.id}`} value={account.accountNumber}>
                      {account.name} - {account.accountNumber} - R$ {account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Conta de Destino</label>
                <select
                  value={pixData.toAccount}
                  onChange={(e) => setPixData({ ...pixData, toAccount: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                >
                  <option value="">Selecione a conta</option>
                  {accounts.map((account) => (
                    <option key={`to-${account.id}`} value={account.accountNumber}>
                      {account.name} - {account.accountNumber} - R$ {account.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  value={pixData.amount}
                  onChange={(e) => setPixData({ ...pixData, amount: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-sky-200 mb-1">Descrição</label>
                <input
                  type="text"
                  value={pixData.description}
                  onChange={(e) => setPixData({ ...pixData, description: e.target.value })}
                  className="w-full p-2 bg-sky-950/70 border border-sky-700 rounded-md focus:ring-2 focus:ring-sky-400 focus:border-sky-400 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || pixData.fromAccount === pixData.toAccount}
                className="w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-500 transition-colors disabled:bg-emerald-800 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processando..." : "Enviar Pix"}
              </button>
              {pixData.fromAccount === pixData.toAccount && pixData.fromAccount && (
                <p className="text-amber-400 text-sm">Não é possível enviar Pix para a mesma conta</p>
              )}
            </form>
          </div>
        </div>

        {/* Accounts List */}
        <div className="bg-sky-800/50 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-sky-700">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-sky-400" />
            <h2 className="text-2xl font-semibold text-sky-100">Minhas Contas</h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-400"></div>
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-center py-8 text-sky-300">Nenhuma conta encontrada. Crie sua primeira conta!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-sky-900/80 p-5 rounded-lg border border-sky-700 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold text-sky-100 text-lg">{account.name}</h3>
                  <p className="text-sm text-sky-300">Conta: {account.accountNumber}</p>
                  <p className="text-sm text-sky-300">
                    CPF: {account.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}
                  </p>
                  <div className="mt-3 pt-3 border-t border-sky-700">
                    <p className="text-lg font-bold text-emerald-400">R$ {account.balance.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {successMessage && (
          <div className="bg-emerald-900/70 backdrop-blur-sm p-6 rounded-xl shadow-xl border border-emerald-700 animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4 text-emerald-300">Transação Concluída!</h2>
            <p className="text-emerald-100">{successMessage}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-sky-950 py-4 border-t border-sky-800 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sky-400 text-sm">
          <p>© 2024 Cold Bank - O banco que congela suas economias para o futuro</p>
        </div>
      </footer>
    </main>
  )
}
