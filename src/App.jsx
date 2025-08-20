import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import TelegramLoginButton from "./components/TelegramLoginButton";
import { verifyTelegramAuth } from "./services/telegramAuth";
import NicknameBindingModal from "./components/NicknameBindingModal";
import { getUserData } from "./services/userService";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
  useNavigate,
} from "react-router-dom";

import {
  createOrGetPlayerByName,
  addReview,
  fetchReviewsByPlayer,
  searchPlayers,
  listRandomPlayers,
} from "./services/db";

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
import Paper from "@mui/material/Paper";
import StarIcon from "@mui/icons-material/Star";

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

// Helpers
// Utilities
function Stars({ value, size = "medium" }) {
  const fullStars = Math.round(value);
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
const randomRgbColor = () => {
  const red = Math.floor(Math.random() * 256); // Random number between 0-255
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);
  return `rgb(${red}, ${green}, ${blue})`;
};

function getAvg(arr) {
  if (!arr.length) return 0;
  const sum = arr.reduce((s, v) => s + v, 0);
  return Math.round((sum / arr.length) * 10) / 10;
}

function withinLastNDays(createdAt, n) {
  let date;
  if (createdAt?.toDate) {
    date = createdAt.toDate();
  } else {
    date = new Date(createdAt);
  }
  return Date.now() - date.getTime() <= n * 24 * 60 * 60 * 1000;
}

// App
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthAppBar />
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player/:id" element={<PlayerProfile />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </AuthProvider>
  );
}

const AuthAppBar = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleTelegramAuth = async (telegramData) => {
    try {
      const userData = await verifyTelegramAuth(telegramData);
      login(userData);
      navigate("/nickname-binding");
    } catch (error) {
      console.error("Telegram auth failed:", error);
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{ color: "white", textDecoration: "none", flexGrow: 1 }}
        >
          Marvel Rivals Reviews
        </Typography>

        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Avatar src={user.photoURL} sx={{ width: 32, height: 32 }} />
            <Typography>{user?.username}</Typography>
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          </Box>
        ) : (
          <TelegramLoginButton
            botName="MarvelRivalsReviewsAuthBot" // <-- замените на реальный username без @
            onAuth={handleTelegramAuth}
          />
        )}
      </Toolbar>
    </AppBar>
  );
};

function AuthenticatedAuthApp() {
  const { user, loading } = useAuth();
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nicknameCheckComplete, setNicknameCheckComplete] = useState(false);

  useEffect(() => {
    const checkNicknameBinding = async () => {
      if (user) {
        const userData = await getUserData(user.uid);

        if (!userData?.gameNickname) {
          setShowNicknameModal(true);
        }

        setNicknameCheckComplete(true);
      }
    };

    if (user && !loading) {
      checkNicknameBinding();
    }
  }, [user, loading]);

  if (loading || (user && !nicknameCheckComplete)) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <BrowserRouter>
        <AuthAppBar />
        <Container sx={{ mt: 4 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/player/:id" element={<PlayerProfile />} />
          </Routes>
        </Container>
      </BrowserRouter>

      <NicknameBindingModal
        open={showNicknameModal}
        onClose={() => setShowNicknameModal(false)}
      />
    </>
  );
}
function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [randomPlayers, setRandomPlayers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const items = query
        ? await searchPlayers(query, 12)
        : await listRandomPlayers(12);
      if (!cancelled) {
        if (query) setResults(items);
        else setRandomPlayers(items);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div>
      <Box sx={{ mb: 3, display: "flex", gap: 2 }}>
        <TextField
          label="Search players by nickname"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button variant="contained" onClick={() => setQuery("")}>
          Clear
        </Button>
      </Box>

      <Grid container spacing={2}>
        {(query ? results : randomPlayers).map((p) => (
          <Grid key={p.id} item xs={6} sm={6} md={3}>
            <PlayerCard key={p.id} player={p} />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" sx={{ mb: 2 }}>
        Quick review — submit a player review
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ReviewForm onSubmit={addReview} />
      </Paper>
    </div>
  );
}

function PlayerCard({ player }) {
  const [avgRank, setAvgRank] = useState(null);
  const [avgGrade, setAvgGrade] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      const reviews = await fetchReviewsByPlayer(player.id, 30);
      console.log(player);
      if (!cancelled) {
        const ranks = reviews.map((r) => r.rank);
        const grades = reviews.map((r) => r.grade);
        setAvgRank(getAvg(ranks));
        setAvgGrade(getAvg(grades));
      }
    }

    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [player.id]);

  return (
    <Card sx={{ height: 110 }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Avatar sx={{ bgcolor: randomRgbColor }}>
          {player.displayName[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="subtitle1"
            sx={{
              width: 188,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              textAlign: "left",
            }}
          >
            {player.displayName}
          </Typography>

          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mb: 1, gap: 20 }}
          >
            {avgRank !== null
              ? RANK_NAMES[Math.round(avgRank)]
              : "No recent rank"}
            {/* Средний grade в виде звёзд */}

            {avgGrade !== null && (
              <Rating value={avgGrade} precision={0.5} readOnly size="medium" />
            )}
          </Typography>

          <Button component={Link} to={`/player/${player.id}`} size="small">
            View profile
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

function PlayerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState(null);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const players = await searchPlayers("", 1000);
      const found = players.find((p) => p.id === id);
      if (!cancelled) {
        if (!found) navigate("/", { replace: true });
        else setPlayer(found);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      const data = await fetchReviewsByPlayer(id, 30);
      if (!cancelled) setReviews(data);
    }
    loadReviews();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!player) return null;

  const lastMonthReviews = reviews.filter((r) =>
    withinLastNDays(r.createdAt, 30)
  );
  console.log(reviews);

  const avgRank = getAvg(lastMonthReviews.map((r) => r.rank));
  const avgGrade = getAvg(lastMonthReviews.map((r) => r.grade));

  return (
    <div>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: randomRgbColor, width: 72, height: 72 }}>
          {player.displayName[0]?.toUpperCase()}
        </Avatar>
        <div>
          <Typography variant="h4">{player.displayName}</Typography>
          <Stars value={avgGrade} size="large" />
          <Typography variant="h6">
            {RANK_NAMES[Math.round(avgRank)] || "No rank in 30 days"}
          </Typography>
        </div>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6">Leave a review</Typography>
        <ReviewForm initialPlayerId={player.id} onSubmit={addReview} />
      </Paper>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 1 }}>
        All reviews
      </Typography>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {reviews.map((r) => (
          <ReviewItem
            key={r.id}
            review={r}
            player={player}
            onEdit={(patch) => updateReview(r.id, patch)}
            onDelete={() => deleteReview(r.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewItem({ review, player, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box>
            <Typography variant="subtitle1">{player.displayName}</Typography>
            <Typography variant="caption">
              {(review.createdAt?.toDate
                ? review.createdAt.toDate()
                : new Date(review.createdAt)
              ).toLocaleString()}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography>
              Rank: {RANK_NAMES[review.rank] || review.rank}
            </Typography>{" "}
            <Rating value={review.grade} precision={1} readOnly />
          </Box>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Typography sx={{ whiteSpace: "pre-wrap" }}>
          {review.comment}
        </Typography>

        {review.screenshot && (
          <Box sx={{ mt: 1 }}>
            <img
              src={review.screenshot}
              alt="screenshot"
              style={{ maxWidth: "100%", borderRadius: 8 }}
            />
          </Box>
        )}

        {/* <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
          <Button size="small" onClick={() => setEditing(true)}>Edit</Button>
          <Button size="small" color="error" onClick={onDelete}>Delete</Button>
        </Box> */}

        <Modal open={editing} onClose={() => setEditing(false)}>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              bgcolor: "background.paper",
              p: 3,
              width: 400,
            }}
          >
            <Typography variant="h6">Edit review</Typography>
            <EditReviewForm
              review={review}
              onCancel={() => setEditing(false)}
              onSave={(patch) => {
                onEdit(patch);
                setEditing(false);
              }}
            />
          </Box>
        </Modal>
      </CardContent>
    </Card>
  );
}

function EditReviewForm({ review, onCancel, onSave }) {
  const [rank, setRank] = useState(review.rank);
  const [grade, setGrade] = useState(review.grade);
  const [comment, setComment] = useState(review.comment);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
      <FormControl>
        <InputLabel>Rank</InputLabel>
        <Select
          value={rank}
          label="Rank"
          onChange={(e) => setRank(e.target.value)}
          required
        >
          {RANK_NAMES.map((name, i) => (
            <MenuItem key={i} value={i}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box>
        <Typography sx={{ mb: 1 }}>Grade</Typography>
        <Rating
          value={grade}
          precision={0.5}
          onChange={(_, v) => setGrade(v || 0)}
          required
        />
      </Box>

      <TextField
        label="Comment"
        multiline
        minRows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          variant="contained"
          onClick={() => onSave({ rank, grade, comment })}
        >
          Save
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
}

function ReviewForm({ initialPlayerId, onSubmit }) {
  const [displayName, setdisplayName] = useState("");
  const [rank, setRank] = useState("");
  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");
  const [screenshot, setScreenshot] = useState(null);

  useEffect(() => {
    if (initialPlayerId) {
      (async () => {
        const players = await searchPlayers("", 1000);
        const p = players.find((pl) => pl.id === initialPlayerId);
        if (p) {
          setdisplayName(p.displayName);
        }
      })();
    }
  }, [initialPlayerId]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setScreenshot(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    const playerId = await createOrGetPlayerByName(displayName.trim());

    let screenshotUrl = null;
    if (screenshot) {
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput?.files[0]) {
        screenshotUrl = await uploadScreenshot(fileInput.files[0], playerId);
      }
    }

    await addReview({
      playerId,
      rank: Number(rank),
      grade: Number(grade),
      comment,
      screenshotUrl,
    });

    setComment("");
    setGrade("");
    setRank("");
    setScreenshot(null);
    setdisplayName("");
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
    >
      <Autocomplete
        freeSolo
        options={[]}
        value={displayName}
        onInputChange={(_, v) => setdisplayName(v)}
        renderInput={(params) => (
          <TextField {...params} label="Nickname (start typing...)" required />
        )}
      />

      <FormControl>
        <InputLabel>Rank</InputLabel>
        <Select
          value={rank}
          label="Rank"
          onChange={(e) => setRank(e.target.value)}
          required
        >
          {RANK_NAMES.map((name, i) => (
            <MenuItem key={i} value={i}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box>
        <Typography sx={{ mb: 1 }}>Grade*</Typography>
        <Rating
          value={grade}
          precision={1}
          onChange={(_, v) => setGrade(v || 0)}
          required
        />
      </Box>

      <TextField
        label="Comment"
        multiline
        minRows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />

      <Box>
        <Button variant="outlined" component="label">
          Upload screenshot (optional)
          <input
            hidden
            accept="image/*"
            type="file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </Button>
        {screenshot && (
          <Box sx={{ mt: 1 }}>
            <img
              src={screenshot}
              alt="preview"
              style={{ maxWidth: 160, borderRadius: 6 }}
            />
          </Box>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button type="submit" variant="contained">
          Submit review
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setdisplayName("");
            setComment("");
            setGrade("");
            setRank("");
            setScreenshot(null);
          }}
        >
          Reset
        </Button>
      </Box>
    </Box>
  );
}
