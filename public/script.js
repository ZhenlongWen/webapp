const imageInput = document.getElementById("imageInput");
const searchedImageContainer = document.getElementById("searchedImageContainer");
const canvasContainer = document.getElementById("canvasContainer");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const clearCanvasButton = document.getElementById("clearButton");
const sendDrawingButton = document.getElementById("analyzeButton");
const showInfoButton = document.getElementById("showInfo");
const imageInfoDiv = document.getElementById("imageInfo");
let showPrompt = true;
let hasUserDrawn = false;
let analysisData = null;
let isAnalyzing = false;

// Canvas drawing variables
let isDrawing = false;
let lastX = 0;
let lastY = 0;

// Create and style canvas
function initializeCanvas() {
  canvas.width = 450;
  canvas.height = 550;
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

  hasUserDrawn = true;
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
    ctx.fillText("Doodle and explore!", canvas.width / 2, canvas.height / 2);
  }
}

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];

  if (showPrompt) {
    showPrompt = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  //user has started drawing
  hasUserDrawn = true;
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
showInfoButton.addEventListener("click", toggleInfo);

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  showPrompt = true;
  drawPrompt();
  hasUserDrawn = false;
}

// Function to toggle the info display
function toggleInfo() {
  imageInfoDiv.classList.toggle("hidden");
  showInfoButton.classList.toggle("active");

  // Only show content when toggled open
  if (!imageInfoDiv.classList.contains("hidden")) {
    if (isAnalyzing) {
      imageInfoDiv.textContent = "Analyzing... Please wait.";
    } else if (analysisData) {
      imageInfoDiv.textContent = analysisData;
    } else {
      imageInfoDiv.textContent = "Please analyze your drawing first to see information.";
    }
  }
}

// Function to analyze whatever is on the canvas
async function analyzeCanvas() {
  // First check if canvas is empty
  if (!hasUserDrawn) {
    // Only show this message if info panel is already open
    if (!imageInfoDiv.classList.contains("hidden")) {
      imageInfoDiv.textContent = "Please draw something or upload an image first";
    }
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

  // Set analyzing flag
  isAnalyzing = true;

  // Only update the info panel if it's already open
  if (!imageInfoDiv.classList.contains("hidden")) {
    imageInfoDiv.textContent = "Analyzing... Please wait.";
  }

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: JSON.stringify({ image: base64Image }),
    });

    const data = await response.json();
    searchedImageContainer.innerHTML = "";
    renderGallery(data.cooperHewittData);

    // Store the analysis data but don't automatically show it
    analysisData = data.analysis;
    isAnalyzing = false;

    // Only update the info panel if it's already open
    if (!imageInfoDiv.classList.contains("hidden")) {
      imageInfoDiv.textContent = analysisData;
    }

  } catch (error) {
    console.error("Error:", error);
    isAnalyzing = false;

    // Only update the info panel if it's already open
    if (!imageInfoDiv.classList.contains("hidden")) {
      imageInfoDiv.textContent = "An error occurred while analyzing the image.";
    }
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

  //user has uploaded an image
  hasUserDrawn = true;
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

  // Ensure data has a maximum of 12 objects
  const objects = data.slice(0, 12);

  // Clear previous content
  searchedImageContainer.innerHTML = "";

  // Create two columns for results
  const leftColumn = document.createElement("div");
  leftColumn.classList.add("result-column");

  const rightColumn = document.createElement("div");
  rightColumn.classList.add("result-column");

  // Add objects to left and right columns alternately
  objects.forEach((item, index) => {
    // Create a container for each object
    const objectContainer = document.createElement("div");
    objectContainer.classList.add("object-card");

    // Add the image
    if (item.multimedia && item.multimedia.length > 0) {
      const firstImageUrl = item.multimedia[0].large.url;
      const imgElement = document.createElement("img");
      imgElement.src = firstImageUrl;
      imgElement.alt = item.title || "Cooper Hewitt object";
      imgElement.classList.add("object-image");
      objectContainer.appendChild(imgElement);
    }

    // Add title below the image
    const titleElement = document.createElement("h3");
    titleElement.textContent =
      (item.title && item.title[0] && item.title[0].value) || "Untitled Object";
    titleElement.classList.add("object-title");
    objectContainer.appendChild(titleElement);

    // Add description below the title
    const descriptionElement = document.createElement("p");
    descriptionElement.textContent =
      (item.description && item.description[0] && item.description[0].value) ||
      "No description available.";
    descriptionElement.classList.add("object-description");
    objectContainer.appendChild(descriptionElement);

    // Add to left column if even index, right column if odd
    if (index % 2 === 0) {
      leftColumn.appendChild(objectContainer);
    } else {
      rightColumn.appendChild(objectContainer);
    }
  });

  // Create a container for both columns
  const columnsContainer = document.createElement("div");
  columnsContainer.classList.add("results-columns");
  columnsContainer.appendChild(leftColumn);
  columnsContainer.appendChild(rightColumn);

  // Append the columns container to the main searchedImageContainer
  searchedImageContainer.appendChild(columnsContainer);
}

// Initialize canvas when the page loads
initializeCanvas();