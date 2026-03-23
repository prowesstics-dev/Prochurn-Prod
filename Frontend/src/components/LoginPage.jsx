import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";
import styles from "./LoginPage.module.css";
import { useAuth } from "./AuthContext";
import LoginButton from "./LoginButton";
import axios from "axios"; // ✅ Add this if you don't have axiosInstance for public calls

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, axiosInstance } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
    role: "",
  });

  const [roles, setRoles] = useState([]); // ✅ State for roles

  // ✅ Fetch roles on mount
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${API_URL}/roles/`);
        setRoles(res.data.roles);
      } catch (err) {
        console.error("Failed to load roles:", err);
      }
    };
    fetchRoles();
  }, [API_URL]);

  const handleBackendCheck = async () => {
  try {
    const res = await axios.get(`${API_URL}/backend-status/`);
    const message = res?.data?.message || "No message received";

    Swal.fire("Backend Response", message, "success");
  } catch (error) {
    console.error("Backend check failed:", error);
    Swal.fire("Error", "Failed to fetch backend message", "error");
  }
};

  const handleInputChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    const { username, password, role } = loginData;

    // if (!username || !password || !role) {
    //   Swal.fire("Error", "All fields including role are required!", "error");
    //   return;
    // }

    try {
      const tokens = await login(username, password, role);
      const userRes = await axiosInstance.get(`${API_URL}/user-details/`);

      if (userRes?.data?.username) {
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...userRes.data,
            role,
          })
        );
        Swal.fire("Success", "Login successful!", "success").then(() => {
          navigate("/retentionpathway");
        });
      } else {
        Swal.fire("Error", "Failed to load user info", "error");
      }
    } catch (error) {
      console.error("Login failed:", error);
      let errorMessage = "Invalid credentials or server error";

      if (error.response?.data?.role) {
        errorMessage = Array.isArray(error.response.data.role)
          ? error.response.data.role[0]
          : error.response.data.role;
      } else if (error.response?.data?.non_field_errors) {
        errorMessage = error.response.data.non_field_errors[0];
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }

      Swal.fire("Error", errorMessage, "error");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.bubbleBackground}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className={styles.bubble}></div>
        ))}
      </div>

      <div className={styles.loginBox}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logoBrand}>
            <span className={styles.fullText}>ProChurn AI 1 2 3 4 5</span>
          </h1>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email/Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter Email or Username"
              value={loginData.username}
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
              value={loginData.password}
              onChange={handleInputChange}
              className={styles.formInput}
            />
          </div>

          {/* <div className={styles.formGroup}>
            <label className={styles.formLabel}>Role</label>
            <select
              name="role"
              value={loginData.role}
              onChange={handleInputChange}
              className={styles.formInput}
            >
              <option value="">-- Select Role --</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div> */}

          <LoginButton onClick={handleLogin}>Login</LoginButton>
          {/* <button
  type="button"
  onClick={handleBackendCheck}
  className={styles.secondaryButton} // or create a new class like styles.secondaryButton
>
  Check Backend Message !
</button> */}

          {/* <div className={styles.signUpContainer}>
            <p className={styles.signUpText}>
              Don't have an account?{" "}
              <Link to="/signup" className={styles.signUpLink}>
                Sign up here
              </Link>
            </p>
          </div> */}
        </div>
      </div>

      <footer className={styles.footer}>
        <div className={styles.footerItem}>
          📍 Prowesstics IT Service, Chennai – 600029
        </div>
        <div className={styles.footerItem}>
          ✉️{" "}
          <a href="mailto:contact@prowesstics.com">
            contact@prowesstics.com
          </a>
        </div>
        <div className={styles.footerItem}>
          🌐{" "}
          <a
            href="https://www.prowesstics.com"
            target="_blank"
            rel="noreferrer"
          >
            prowesstics.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;
