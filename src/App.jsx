import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

// Material UI
// MUI
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Autocomplete from "@mui/material/Autocomplete";
import Rating from "@mui/material/Rating";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import CardActionArea from "@mui/material/CardActionArea";

import StarIcon from "@mui/icons-material/Star";

/***********************************
 * API client (REST, Spring Boot)
 ***********************************/
const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:8080"; // e.g. "http://localhost:8080"

async function apiJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  // 204 No Content → вернуть null/[]
  if (res.status === 204) {
    return null;
  }
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// Players
async function createOrGetPlayerByName(nickName) {
  // Try to create; on 409 fall back to get by nick; last resort: search
  const body = JSON.stringify({ nickName });
  try {
    return await apiJson(`${API_BASE}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    // Conflict or other
    if (String(e.message).startsWith("409 ")) {
      // try GET by nick (a couple of common patterns)
      const tryUrls = [
        `${API_BASE}/players/nick/${encodeURIComponent(nickName)}`,
      ];
      for (const u of tryUrls) {
        try {
          return await apiJson(u);
        } catch {}
      }
      // fallback to search
      const list = await searchPlayers(nickName, 1);
      if (list && list.length) return list[0];
    }
    throw e;
  }
}

async function getPlayerByNick(nick) {
  // Try common variants
  const tryUrls = [`${API_BASE}/players/nick/${encodeURIComponent(nick)}`];
  for (const u of tryUrls) {
    try {
      return await apiJson(u);
    } catch {}
  }
  throw new Error("Player not found by nick");
}

async function searchPlayers(query, limit = 12) {
  if (!query) return listRecentPlayers(limit);
  const url = `${API_BASE}/players/search?nick=${encodeURIComponent(query)}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list.slice(0, limit) : [];
}

async function listRecentPlayers(limit = 12) {
  const url = `${API_BASE}/players?limit=${limit}`;
  const list = await apiJson(url);
  return Array.isArray(list) ? list : [];
}

// Reviews (server endpoints may not exist yet; we fail soft)
async function fetchReviewsByPlayer(playerNick, days = 30) {
  try {
    const url = `${API_BASE}/reviews?player=${encodeURIComponent(
      playerNick
    )}&days=${days}`;
    const list = await apiJson(url);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function addReview(payload) {
  // payload: { playerNick, rank, grade, comment, screenshotUrl }
  try {
    const res = await apiJson(`${API_BASE}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res?.id ?? null;
  } catch (e) {
    console.error("addReview failed:", e);
    return null;
  }
}

/***********************************
 * Utils (accepted UI fixes)
 ***********************************/
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getAvg(arr) {
  if (!arr || arr.length === 0) return null;
  const sum = arr.reduce((s, v) => s + v, 0);
  return Math.round((sum / arr.length) * 10) / 10;
}

const RANK_NAMES = [
  "Bronze",
  "Silver",
  "Gold",
  "Platinum",
  "Diamond",
  "Grandmaster",
  "Celestial",
  "Eternity+",
];

function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = hash & 0xff,
    g = (hash >> 8) & 0xff,
    b = (hash >> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/***********************************
 * Small presentational bits
 ***********************************/
function Stars({ value = 0, size = "small" }) {
  const fullStars = Math.round(value ?? 0);
  return (
    <Box display="flex">
      {[...Array(5)].map((_, i) => (
        <StarIcon
          key={i}
          fontSize={size}
          sx={{ color: i < fullStars ? "gold" : "lightgray" }}
        />
      ))}
    </Box>
  );
}

/***********************************
 * Cards & Lists
 ***********************************/
function PlayerCard({ player }) {
  const navigate = useNavigate();
  const initials = player?.nickName?.[0]?.toUpperCase() ?? "?";
  const avatarBg = useMemo(
    () => colorFromString(player?.nickName || ""),
    [player?.nickName]
  );

  // last 30 days avg rank (soft-fail if no reviews backend)
  const [avgRank, setAvgRank] = useState(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const reviews = await fetchReviewsByPlayer(player.nickName, 30);
      if (cancelled) return;
      const ranks = reviews.map((r) => r.rank ?? 0);
      setAvgRank(getAvg(ranks));
    })();
    return () => {
      cancelled = true;
    };
  }, [player.nickName]);

  const rankLabel =
    avgRank != null
      ? RANK_NAMES[clamp(Math.round(avgRank), 0, RANK_NAMES.length - 1)]
      : "No recent rank";

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardActionArea onClick={() => navigate(`/player/${player.nickName}`)}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            {player.image ? (
              <Avatar alt={player.nickName} src={player.image} />
            ) : (
              <Avatar sx={{ bgcolor: avatarBg }}>{initials}</Avatar>
            )}
            <Box>
              <Typography variant="h6">{player.nickName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {rankLabel}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function PlayersGrid({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map((p) => (
        <Grid item key={p.id ?? p.nickName} xs={12} sm={6} md={4} lg={3}>
          <PlayerCard player={p} />
        </Grid>
      ))}
    </Grid>
  );
}

/***********************************
 * Pages
 ***********************************/
function Home() {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 400);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        if (debounced) {
          const list = await searchPlayers(debounced, 12);
          if (!cancelled) setResults(list);
        } else {
          const list = await listRecentPlayers(12);
          if (!cancelled) setRecent(list);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debounced]);

  return (
    <Container sx={{ py: 4 }}>
      <Box sx={{ my: 2 }}>
        <TextField
          fullWidth
          label="Search player by nickname"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </Box>
      {debounced ? (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Search results
          </Typography>
          <PlayersGrid items={results} />
        </>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Recently added
          </Typography>
          <PlayersGrid items={recent} />
        </>
      )}
      {loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      )}
      <Divider sx={{ my: 4 }} />
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick review
      </Typography>
      <ReviewForm
        onSubmit={async (f) => {
          const p = await createOrGetPlayerByName(f.playerNick);
          await addReview({ ...f, playerNick: p.nickName });
        }}
      />
    </Container>
  );
}

function PlayerProfile() {
  const { nick } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [avgRank, setAvgRank] = useState(null);
  const [avgGrade, setAvgGrade] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const p = await getPlayerByNick(nick);
        if (cancelled) return;
        setPlayer(p);

        // грузим отзывы и считаем средние
        const reviews = await fetchReviewsByPlayer(p.nickName, 30);
        if (cancelled) return;
        setAvgRank(getAvg(reviews.map((r) => Number(r.rank ?? 0))));
        setAvgGrade(getAvg(reviews.map((r) => Number(r.grade ?? 0))));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nick]);

  if (loading) return <Typography>Loading…</Typography>;
  if (!player) return <Typography>Player not found</Typography>;

  const avatarBg = colorFromString(player.nickName || "");
  const rankLabel =
    avgRank != null
      ? RANK_NAMES[clamp(Math.round(avgRank), 0, RANK_NAMES.length - 1)]
      : "No rank in 30 days";

  return (
    <div>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: avatarBg, width: 72, height: 72 }}>
          {player.nickName?.[0]?.toUpperCase() ?? "?"}
        </Avatar>
        <div>
          <Typography variant="h4">{player.nickName}</Typography>
          <Stars value={avgGrade ?? 0} size="large" />
          <Typography variant="h6">{rankLabel}</Typography>
        </div>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Leave a review</Typography>
        <ReviewForm
          initialNick={player.nickName}
          onSubmit={async (f) => {
            const p = await createOrGetPlayerByName(f.playerNick);
            await addReview({ ...f, playerNick: p.nickName });
          }}
        />
      </Paper>

      <Divider sx={{ mb: 2 }} />
      <Typography variant="h6" sx={{ mb: 1 }}>
        All reviews
      </Typography>
      <ReviewsList playerNick={player.nickName} />
    </div>
  );
}

/***********************************
 * Reviews UI (keep features; no edit/delete yet)
 ***********************************/
function AddReviewSection({ initialNick }) {
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(form) {
    // form: { playerNick, rank, grade, comment, screenshotUrl }
    setSubmitting(true);
    try {
      const player = await createOrGetPlayerByName(form.playerNick);
      await addReview({
        playerNick: player.nickName,
        rank: Number(form.rank),
        grade: Number(form.grade),
        comment: form.comment,
        screenshotUrl: form.screenshotUrl ?? null, // future
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Add your review
      </Typography>
      <ReviewForm
        initialNick={initialNick}
        onSubmit={handleSubmit}
        submitting={submitting}
      />
    </Box>
  );
}

function ReviewForm({ initialNick = "", onSubmit, submitting = false }) {
  const [playerNick, setPlayerNick] = useState(initialNick);
  const [rank, setRank] = useState(""); // индекс ранга, но показываем только текст
  const [grade, setGrade] = useState(0); // звёзды
  const [comment, setComment] = useState("");

  const isFormValid = playerNick.trim() !== "" && rank !== "" && grade > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    onSubmit({
      playerNick: playerNick.trim(),
      rank: Number(rank), // отдаём числом
      grade: Number(grade), // Rating уже число, но приведём на всякий
      comment: comment.trim(),
      screenshotUrl: null,
    });

    // после успешной отправки очищаем только оценку/ранг/комментарий; ник оставляем
    setComment("");
    setGrade(0);
    setRank("");
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        <TextField
          label="Player Nick"
          value={playerNick}
          onChange={(e) => setPlayerNick(e.target.value)}
          required
          disabled={submitting}
        />

        <FormControl fullWidth required disabled={submitting}>
          <InputLabel>Rank</InputLabel>
          <Select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            label="Rank"
          >
            {RANK_NAMES.map((name, idx) => (
              <MenuItem key={idx} value={idx}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography>Grade:</Typography>
          <Rating
            name="grade"
            value={grade}
            onChange={(_, newValue) => setGrade(newValue || 0)}
            disabled={submitting}
          />
        </Box>

        <TextField
          label="Comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          multiline
          rows={3}
          disabled={submitting}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={!isFormValid || submitting}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </Box>
    </Paper>
  );
}

function ReviewsList({ playerNick }) {
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

function ReviewItem({ review }) {
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

/***********************************
 * App shell & routing
 ***********************************/
export default function App() {
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{ color: "white", textDecoration: "none" }}
          >
            Marvel Rivals Reviews
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:nick" element={<PlayerProfile />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}
