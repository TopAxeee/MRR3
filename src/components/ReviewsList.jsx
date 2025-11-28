// src/components/ReviewsList.jsx
import React, { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import ReviewItem from "./ReviewItem";
import Pagination from "./Pagination";
import { fetchReviewsByPlayer } from "../services/api";

export default function ReviewsList({ playerNick, refreshKey }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const data = await fetchReviewsByPlayer(playerNick, 30, currentPage, 10);
      if (!cancelled) {
        setItems(data.items);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [playerNick, currentPage, refreshKey]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) return <Typography>Loading reviews…</Typography>;
  
  if (!items.length)
    return (
      <Typography variant="body2" color="text.secondary">
        No reviews yet.
      </Typography>
    );

  return (
    <>
      <Stack spacing={2}>
        {items.map((r) => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </Stack>
      
      {totalElements > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
          Showing {items.length} of {totalElements} reviews
        </Typography>
      )}
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={handlePageChange} 
      />
    </>
  );
}