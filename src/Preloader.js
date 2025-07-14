import React from "react";
import logo from "./assets/logo.png"; // adjust path if needed

function Preloader() {
  return (
    <div style={styles.container}>
      <img src={logo} alt="1Bingo Logo" style={styles.logo} />
      <p style={styles.text}>Loading...</p>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000", // black background
  },
  logo: {
    width: "150px",
    height: "auto",
    marginBottom: "20px",
  },
  text: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "bold",
  },
};

export default Preloader;