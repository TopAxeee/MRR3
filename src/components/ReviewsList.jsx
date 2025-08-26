// src/components/ReviewsList.jsx
import React, { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ReviewItem from "./ReviewItem";
import { fetchReviewsByPlayer } from "../services/api";

export default function ReviewsList({ playerNick }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const list = await fetchReviewsByPlayer(playerNick, 30);
      if (!cancelled) setItems(list);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [playerNick]);

  if (loading) return <Typography>Loading reviews…</Typography>;
  if (!items.length)
    return (
      <Typography variant="body2" color="text.secondary">
        No reviews yet.
      </Typography>
    );

  return (
    <Stack spacing={2}>
      {items.map((r) => (
        <ReviewItem key={r.id} review={r} />
      ))}
    </Stack>
  );
}