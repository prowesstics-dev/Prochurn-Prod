import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import styles from "./SignUp.module.css"; // 👈 Now using signup styles
import LoginButton from "./LoginButton";

const SignUp = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignUp = async () => {
    const { username, email, password, confirmPassword } = userData;

    if (!username || !email || !password || !confirmPassword) {
      Swal.fire("Error", "All fields are required!", "error");
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire("Error", "Enter a valid email address!", "error");
      return;
    }

    if (password.length < 6) {
      Swal.fire("Error", "Password must be at least 6 characters!", "error");
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire("Error", "Passwords do not match!", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/register/`, {
        username, email, password
      });

      if (res.status === 201) {
        Swal.fire("Success", "Account created! Redirecting...", "success");
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      let msg = "Something went wrong. Please try again.";
      if (err.response?.status === 409) msg = "Username or email already exists.";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.bubbleBackground}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={styles.bubble}></div>
        ))}
      </div>

      <div className={styles.signupBox}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logoBrand}>
            <span className={styles.fullText}>ProChurn AI</span>
          </h1>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter Username"
              value={userData.username}
              onChange={handleInputChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              name="email"
              placeholder="Enter Email"
              value={userData.email}
              onChange={handleInputChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter Password"
              value={userData.password}
              onChange={handleInputChange}
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={userData.confirmPassword}
              onChange={handleInputChange}
              className={styles.formInput}
            />
          </div>

          <LoginButton onClick={handleSignUp} disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </LoginButton>

          <div className={styles.signUpContainer}>
            <p className={styles.signUpText}>
              Already have an account?{" "}
              <Link to="/login" className={styles.signUpLink}>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerItem}>
          📍 Prowesstics IT Service, Chennai – 600029
        </div>
        <div className={styles.footerItem}>
          ✉️ <a href="mailto:contact@prowesstics.com">contact@prowesstics.com</a>
        </div>
        <div className={styles.footerItem}>
          🌐 <a href="https://www.prowesstics.com" target="_blank" rel="noreferrer">prowesstics.com</a>
        </div>
      </footer>
    </div>
  );
};

export default SignUp;
