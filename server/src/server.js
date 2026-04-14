const app = require("./app");
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    "Tip: On macOS, port 5000 may be used by Control Center (AirPlay/AirTunes).",
  );
});
