// src/components/ReviewItem.jsx
import React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import Stars from "./Stars";

export default function ReviewItem({ review }) {
  return (
    <Box
      sx={{
        p: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="subtitle1">
            {review.author ?? "Anonymous"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(review.createdAt ?? Date.now()).toLocaleString()}
          </Typography>
        </Box>
        <Stars value={review.grade ?? 0} />
      </Stack>
      {review.comment && (
        <Typography sx={{ mt: 1 }}>{review.comment}</Typography>
      )}
      {review.screenshotUrl && (
        <Box sx={{ mt: 1 }}>
          <img
            src={review.screenshotUrl}
            alt="screenshot"
            style={{ maxWidth: "100%", borderRadius: 8 }}
          />
        </Box>
      )}
    </Box>
  );
}