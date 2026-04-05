import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function useAccountingData() {
  const [deals, setDeals] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [dealsData, incomeData] = await Promise.all([api.deals.getAll(), api.income.getAll()]);
      setDeals(dealsData);
      setIncome(incomeData);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Make sure the backend is running on http://localhost:5001."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return {
    deals,
    income,
    loading,
    error,
    reload: loadData,
    setDeals,
    setIncome,
  };
}
