import { customFetch } from "@/utils/customAxios";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import React from "react";
import { Suspense } from "react";
import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const CheckoutContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchClientSecret = useCallback(async () => {
    const response = await customFetch.post("/coin/secret", {
      total: Number.parseInt(searchParams.get("total")),
    });

    return response.data.clientSecret;
  }, []);

  const options = { fetchClientSecret };
  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout></EmbeddedCheckout>
      </EmbeddedCheckoutProvider>
    </div>
  );
};

const CheckOut = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CheckoutContent></CheckoutContent>
    </Suspense>
  );
};

export default CheckOut;
