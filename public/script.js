const imageInput = document.getElementById("imageInput");
const outputElement = document.getElementById("output");
const searchedImageContainer = document.getElementById("searchedImageContainer");
const canvasContainer = document.getElementById("canvasContainer");
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const clearCanvasButton = document.getElementById("clearButton");
const sendDrawingButton = document.getElementById("analyzeButton");

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
}

function startDrawing(e) {
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
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
}

// Function to analyze whatever is on the canvas
async function analyzeCanvas() {
  // Create a temporary larger canvas
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  tempCanvas.width = 800;
  tempCanvas.height = 800;
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
    //console.log("GPT's analysis:", data.analysis);
    //console.log("Cooper Hewitt data:", data.cooperHewittData);

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