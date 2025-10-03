import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Container from "@mui/material/Container";

import Header from "./components/Header";
import Home from "./pages/Home";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/player/:nick" element={<PlayerProfile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
}