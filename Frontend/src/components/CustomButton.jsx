import React from "react";
import styles from "./Button.module.css";

const CustomButton = ({ onClick, children }) => {
  return (
    <button className={styles.customButton} onClick={onClick}>
      <span className={styles.buttonText}>{children}</span>
      <span className={styles.buttonArrow}>→</span>
    </button>
  );
};

export default CustomButton;
