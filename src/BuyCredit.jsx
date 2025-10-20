import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getToken } from "./ManageToken";

export default function BuyCredit({ apiBase = "" }) {
  const [amount, setAmount] = useState();
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
    toast.loading("Processing payment...");

    try {
      const payload = {
        amount: Number(amount),
        currency: "USD",
        cardholderName: name,
        card: { number: cardNumber.replace(/\s+/g, ""), expiry, cvc },
      };

      const res = await fetch(`${apiBase}/api/add-credit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", auth: getToken() },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      toast.dismiss();

      if (!res.ok) {
        toast.error(data?.error || data?.message || "Payment failed on server");
        setLoading(false);
        return;
      }

      toast.success(data?.message || `Added ${payload.amount} credits 🎉`);
      setCardNumber("");
      setExpiry("");
      setCvc("");
    } catch {
      toast.dismiss();
      toast.error("Network error — try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-white">
      <div className="w-full max-w-md bg-gray-100 rounded-2xl shadow-lg p-6">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2000,
          }}
        />
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold">Buy Credits</h1>
          <p className="mt-1 text-sm text-gray-600">1 credit = $1</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (credits)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cardholder Name"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <input
            inputMode="numeric"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
            placeholder="Card Number"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
              placeholder="MM/YY"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <input
              inputMode="numeric"
              value={cvc}
              onChange={(e) => setCvc(e.target.value)}
              placeholder="CVC"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:brightness-95 disabled:opacity-60"
          >
            Buy credit
          </button>
        </form>
      </div>
    </div>
  );
}
