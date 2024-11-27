const imageInput = document.getElementById("imageInput");
const outputElement = document.getElementById("output");
const searchedImageContainer = document.getElementById("searchedImageContainer");
const canvasContainer = document.getElementById("canvasContainer");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const clearCanvasButton = document.getElementById("clearButton");
const sendDrawingButton = document.getElementById("analyzeButton");
let showPrompt = true;

// Canvas drawing variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Create and style canvas
function initializeCanvas() {
  canvas.width = 400;
  canvas.height = 400;
  canvas.style.backgroundColor = "#f5f5f5";
  canvasContainer.appendChild(canvas);

  // Add drawing event listeners
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Add touch events
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", handleTouchEnd);

  // Prevent scrolling while drawing
  canvas.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });

  drawPrompt();
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  isDrawing = true;
  [lastX, lastY] = [x, y];

  // Clear prompt on first draw
  if (showPrompt) {
    showPrompt = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function handleTouchMove(e) {
  e.preventDefault();
  if (!isDrawing) return;

  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;

  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.stroke();

  [lastX, lastY] = [x, y];
}

function handleTouchEnd(e) {
  e.preventDefault();
  isDrawing = false;
}

function drawPrompt() {
  if (showPrompt) {
    ctx.font = "25px BerkeleyMono";  // Match your font
    ctx.fillStyle = "#e4e4e4";  // Light gray color for the text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Draw something here", canvas.width / 2, canvas.height / 2);
  }
}

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];

  if (showPrompt) {
    showPrompt = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function draw(e) {
  if (!isDrawing) return;
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
  isDrawing = false;
}

// Add button event listeners
clearCanvasButton.addEventListener("click", clearCanvas);
sendDrawingButton.addEventListener("click", analyzeCanvas);

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  showPrompt = true;
  drawPrompt();
}

// Function to analyze whatever is on the canvas
async function analyzeCanvas() {
  // First check if canvas is empty
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  // Check if all pixels are the background color
  let isEmpty = true;
  for (let i = 0; i < pixels.length; i += 4) {
    // Check if pixel is not the background color (f5f5f5)
    if (pixels[i] !== 245 || pixels[i + 1] !== 245 || pixels[i + 2] !== 245 || pixels[i + 3] !== 255) {
      isEmpty = false;
      break;
    }
  }

  if (isEmpty) {
    outputElement.textContent = "Please draw something or upload an image first";
    return;
  }

  // Create a temporary larger canvas with white background
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  tempCanvas.width = 800;
  tempCanvas.height = 800;

  // Fill with white background first
  tempCtx.fillStyle = "white";
  tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

  // Draw the original canvas content
  tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, tempCanvas.width, tempCanvas.height);

  const base64Image = tempCanvas.toDataURL("image/png");
  console.log("Image being sent to GPT:", base64Image);

  outputElement.textContent = "Analyzing...";

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await response.json();
    searchedImageContainer.innerHTML = "";
    renderGallery(data.cooperHewittData);
    outputElement.textContent = data.analysis;

  } catch (error) {
    console.error("Error:", error);
    outputElement.textContent = "An error occurred while analyzing the image.";
  }
}

// Function to draw image on canvas
function drawImageOnCanvas(img) {
  showPrompt = false;
  const CANVAS_SIZE = 400;
  const scale = Math.min(
    CANVAS_SIZE / img.width,
    CANVAS_SIZE / img.height
  );

  const x = (CANVAS_SIZE - img.width * scale) / 2;
  const y = (CANVAS_SIZE - img.height * scale) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    img,
    x,
    y,
    img.width * scale,
    img.height * scale
  );
}

// Handle image upload 
imageInput.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => drawImageOnCanvas(img);
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }
});

// Gallery rendering
function renderGallery(data) {
  if (!data || data.length === 0) {
    searchedImageContainer.innerHTML = "<p>No objects found!</p>";
    return;
  }

  const objects = data.slice(0, 10);
  const gridContainer = document.createElement("div");
  gridContainer.classList.add("grid-container");

  objects.forEach((item) => {
    const objectContainer = document.createElement("div");
    objectContainer.classList.add("object-card");

    if (item.multimedia && item.multimedia.length > 0) {
      const firstImageUrl = item.multimedia[0].large.url;
      const imgElement = document.createElement("img");
      imgElement.src = firstImageUrl;
      imgElement.alt = item.title || "Cooper Hewitt object";
      imgElement.classList.add("object-image");
      objectContainer.appendChild(imgElement);
    }

    const overlay = document.createElement("div");
    overlay.classList.add("object-overlay");

    const firstImageUrl = item.multimedia[0].large.url;
    const imgElement = document.createElement("img");
    imgElement.src = firstImageUrl;
    imgElement.alt = item.title || "Cooper Hewitt object full";
    imgElement.classList.add("fullImage");
    overlay.appendChild(imgElement);

    const titleElement = document.createElement("h3");
    titleElement.textContent =
      (item.title && item.title[0] && item.title[0].value) || "Untitled Object";
    titleElement.classList.add("object-title");
    overlay.appendChild(titleElement);

    const descriptionElement = document.createElement("p");
    descriptionElement.textContent =
      (item.description && item.description[0] && item.description[0].value) ||
      "No description available.";
    descriptionElement.classList.add("object-description");
    overlay.appendChild(descriptionElement);

    objectContainer.appendChild(overlay);
    gridContainer.appendChild(objectContainer);
  });

  searchedImageContainer.appendChild(gridContainer);
}

// Initialize canvas when the page loads
initializeCanvas();