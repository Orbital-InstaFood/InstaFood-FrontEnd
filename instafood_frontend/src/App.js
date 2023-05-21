import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';

import { auth } from './firebaseConfig';

import Login from './authentication/login';
import Signup from './authentication/signup';
import Logout from './authentication/logout';

import Dashboard from './pages/dashboard';
import UserInfo from './pages/UserInfo';
import NewPost from './pages/NewPost';
import Navbar from './Navbar';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  }, []);

  if (user) {
    return (
      <Router>
        <h1>Instafood</h1>
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/newPost" element={<NewPost />} />
          <Route path="/editProfile" element={<UserInfo />} />
        </Routes>
        <Logout />
      </Router>
    );
  }

  return (
    <Router>
      <h1>Instafood</h1>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
