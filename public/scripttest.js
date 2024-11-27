const imageInput = document.getElementById("imageInput");
const outputElement = document.getElementById("output");
const uploadedImage = document.getElementById("uploadedImage");
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
    canvas.width = 300;
    canvas.height = 300;
    canvas.style.border = "1.5px solid black";
    canvas.style.backgroundColor = "white";
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
}

function startDrawing(e) {
    isDrawing = true;
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function draw(e) {
    if (!isDrawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
    [lastX, lastY] = [e.offsetX, e.offsetY];
}

function stopDrawing() {
    isDrawing = false;
}

// Button to send canvas drawing
clearCanvasButton.addEventListener("click", clearCanvas);
sendDrawingButton.addEventListener("click", sendCanvasImage);


function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

async function sendCanvasImage() {
    // Convert canvas to base64 image
    const base64Image = canvas.toDataURL("image/png");

    // Show loading text while processing
    outputElement.textContent = "Analyzing";

    // Send the image to the backend for analysis
    try {
        const response = await fetch("/api/analyze", {
            method: "POST",
            body: JSON.stringify({ image: base64Image }),
        });
        const data = await response.json();
        console.log(data.cooperHewittData);

        // Clear previous images if any
        searchedImageContainer.innerHTML = "";

        renderGallery(data.cooperHewittData);

        outputElement.textContent = " ";
    } catch (error) {
        console.error("Error:", error);
        outputElement.textContent = "An error occurred while analyzing the drawing.";
    }
}

// Existing image upload event listener
imageInput.addEventListener("change", async () => {
    if (imageInput.files.length === 0) {
        console.log("No image uploaded");
    } else {
        console.log("Image uploaded");
        const file = imageInput.files[0];
        if (file) {
            console.log('this is the file: ', file)
            await sendImage();
        }
        else {
            console.log('no file found!!')
        }
    }
});

async function sendImage() {
    const reader = new FileReader();
    const file = imageInput.files[0];
    reader.readAsDataURL(file);
    reader.onload = async function (e) {
        // Create an image element to load the uploaded image
        const img = new Image();
        img.onload = async function () {
            // Keep canvas size fixed at 500x500
            const CANVAS_SIZE = 300;
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;

            // Calculate scaling to fit image proportionally
            const scale = Math.min(
                CANVAS_SIZE / img.width,
                CANVAS_SIZE / img.height
            );

            // Calculate centered position
            const x = (CANVAS_SIZE - img.width * scale) / 2;
            const y = (CANVAS_SIZE - img.height * scale) / 2;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the image scaled and centered
            ctx.drawImage(
                img,
                x,
                y,
                img.width * scale,
                img.height * scale
            );

            // Show the image on uploadedImage element as well
            uploadedImage.src = e.target.result;
            uploadedImage.style.display = "block";

            outputElement.textContent = "Analyzing...";
            try {
                const response = await fetch("/api/analyze", {
                    method: "POST",
                    body: JSON.stringify({ image: reader.result }),
                });
                const data = await response.json();
                console.log(data.cooperHewittData);

                searchedImageContainer.innerHTML = "";

                renderGallery(data.cooperHewittData);

                outputElement.textContent = data.analysis;
            } catch (error) {
                console.error("Error:", error);
                outputElement.textContent = "An error occurred while analyzing the image.";
            }
        };

        // Set the source of the image
        img.src = e.target.result;
    };
}

// Existing renderGallery function remains the same
function renderGallery(data) {
    if (!data || data.length === 0) {
        searchedImageContainer.innerHTML = "<p>No objects found!</p>";
        return;
    }

    // Ensure data has a maximum of 10 objects
    const objects = data.slice(0, 10);

    // Create a grid container
    const gridContainer = document.createElement("div");
    gridContainer.classList.add("grid-container");

    // Loop through objects to create cards
    objects.forEach((item) => {
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

        // Add the overlay for title and description
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

        // Append the overlay to the object container
        objectContainer.appendChild(overlay);

        // Append the object container to the grid
        gridContainer.appendChild(objectContainer);
    });

    // Append the grid container to the main searchedImageContainer
    searchedImageContainer.appendChild(gridContainer);
}

// Initialize canvas when the page loads
initializeCanvas();