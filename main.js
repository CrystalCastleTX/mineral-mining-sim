// TITLE SCREEN SETUP
function showTitleScreen() {
  const titleScreen = document.createElement("div");
  titleScreen.id = "title-screen";
  titleScreen.style.position = "absolute";
  titleScreen.style.top = "0";
  titleScreen.style.left = "0";
  titleScreen.style.width = "100%";
  titleScreen.style.height = "100%";
  titleScreen.style.backgroundImage = "url('images/title-background.png')";
  titleScreen.style.backgroundSize = "cover";
  titleScreen.style.display = "flex";
  titleScreen.style.flexDirection = "column";
  titleScreen.style.alignItems = "center";
  titleScreen.style.justifyContent = "center";
  titleScreen.style.fontFamily = "sans-serif";
  titleScreen.style.color = "#fff";
  titleScreen.style.zIndex = "10";

  const title = document.createElement("h1");
  title.textContent = "Mineral Mining Sim";
  title.style.fontSize = "3rem";
  title.style.marginBottom = "1rem";

  const subtitle = document.createElement("h2");
  subtitle.textContent = "A Collector's Journey";
  subtitle.style.fontSize = "1.5rem";
  subtitle.style.marginBottom = "2rem";

  const startButton = document.createElement("button");
  startButton.textContent = "Start Game";
  startButton.style.padding = "1rem 2rem";
  startButton.style.fontSize = "1.2rem";
  startButton.style.cursor = "pointer";
  startButton.onclick = () => {
    titleScreen.remove();
    startGame();
  };

  titleScreen.appendChild(title);
  titleScreen.appendChild(subtitle);
  titleScreen.appendChild(startButton);
  document.body.appendChild(titleScreen);
}

function startGame() {
  alert("Game is starting! (Hook up your game logic here)");
}

window.addEventListener('DOMContentLoaded', () => {
  showTitleScreen();
});
