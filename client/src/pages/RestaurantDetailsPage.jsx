import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RestaurantDetailsUI from "./RestaurantDetails.jsx";
import Layout from "../components/Layout.jsx";
import LoadingSpinner from "../components/ui/LoadingSpinner.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import api from "../services/api.js";

/**
 * Route wrapper: /restaurant/:id
 * Fetches restaurant data then renders the existing RestaurantDetails UI component.
 */
export default function RestaurantDetailsPage() {
  const { id }    = useParams();
  const navigate  = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/api/restaurants/${id}`)
      .then(({ data }) => setRestaurant(data.data ?? data))
      .catch(() => setError("Restaurant not found."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Layout><LoadingSpinner variant="page" message="Loading restaurant…" /></Layout>;
  if (error || !restaurant) return (
    <Layout>
      <EmptyState
        icon="🍴"
        title="Restaurant not found"
        message={error ?? "This restaurant doesn't exist or has been removed."}
        action={{ label: "Browse Restaurants", onClick: () => navigate("/menu") }}
      />
    </Layout>
  );

  return (
    <Layout pageKey="restaurant">
      <RestaurantDetailsUI restaurant={restaurant} />
    </Layout>
  );
}
