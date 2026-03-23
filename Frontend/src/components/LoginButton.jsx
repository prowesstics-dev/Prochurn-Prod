import React from "react";
import styles from "./LoginButton.module.css";

const LoginButton = ({ onClick, children }) => {
  return (
    <button className={styles.customButton} onClick={onClick}>
      <span className={styles.buttonText}>{children}</span>
      <span className={styles.buttonArrow}>→</span>
    </button>
  );
};

export default LoginButton;
