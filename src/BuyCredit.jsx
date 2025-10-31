import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getToken } from "./ManageToken";
import { API_BASE_URL } from "./Config";

export default function BuyCredit() {
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!amount || Number(amount) <= 0) return "Amount must be greater than 0";
    if (!name.trim()) return "Cardholder name is required";
    if (!/^[0-9]{12,19}$/.test(cardNumber.replace(/\s+/g, "")))
      return "Enter a valid card number";
    if (!/^(0[1-9]|1[0-2])\/?([0-9]{2}|[0-9]{4})$/.test(expiry))
      return "Expiry must be MM/YY or MM/YYYY";
    if (!/^[0-9]{3,4}$/.test(cvc)) return "Enter a valid CVC";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);

    setLoading(true);
    const loadingToast = toast.loading("Processing payment...");

    try {
      const payload = {
        amount: Number(amount),
        currency: "USD",
        cardholderName: name,
        card: { number: cardNumber.replace(/\s+/g, ""), expiry, cvc },
        token: getToken(),
      };

      const res = await fetch(`${API_BASE_URL}/user/credits/add-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        console.log(err);
      }

      toast.dismiss(loadingToast);

      if (!res.ok) {
        toast.error(data.message || "Something went wrong");
        setLoading(false);
        return;
      }

      toast.success(data?.message || `Added ${payload.amount} credits 🎉`);
      setAmount("");
      setName("");
      setCardNumber("");
      setExpiry("");
      setCvc("");
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-indigo-50 p-6">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Buy Credits</h1>
          <p className="mt-2 text-gray-500 text-sm">1 credit = $1</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (credits)"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cardholder Name"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <input
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Card Number"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <input
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="CVC"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-500 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : "Buy Credit"}
          </button>
        </form>
      </div>
    </div>
  );
}
