// Select the file input and image elements
const imageInput = document.getElementById("imageInput");
const outputElement = document.getElementById("output");
const uploadedImage = document.getElementById("uploadedImage");
const searchedImageContainer = document.getElementById("searchedImageContainer"); // Container to display the images

// Event listener for when a file is selected
imageInput.addEventListener("change", async () => {
  if (imageInput.files.length === 0) {
    console.log("No image uploaded");
  } else {
    console.log("Image uploaded");
    const file = imageInput.files[0]; // Get the selected file
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
  const reader = new FileReader(); // Create a FileReader to read the file
  const file = imageInput.files[0]; // Get the selected file
  reader.readAsDataURL(file); // Read the file as a Data URL
  // console.log('this is the reader: ', reader)
  reader.onload = async function (e) {
    uploadedImage.src = e.target.result; // Set the src of the image to the file content
    uploadedImage.style.display = "block"; // Show the image
    // Show loading text while processing
    outputElement.textContent = "Analyzing...";
    // Send the image to the backend for analysis
    try {
      //console.log('reader result: ', reader.result);
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ image: reader.result }),
      });
      const data = await response.json();
      console.log(data.cooperHewittData);

      // Clear previous images if any
      searchedImageContainer.innerHTML = "";

      renderGallery(data.cooperHewittData);

      outputElement.textContent = data.analysis;
    } catch (error) {
      console.error("Error:", error);
      outputElement.textContent = "An error occurred while analyzing the image.";
    }
  };
};


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

