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
  console.log('this is the reader: ', reader)
  reader.onload = async function (e) {
    uploadedImage.src = e.target.result; // Set the src of the image to the file content
    uploadedImage.style.display = "block"; // Show the image
    // Show loading text while processing
    outputElement.textContent = "Analyzing...";
    // Send the image to the backend for analysis
    try {
      console.log('reader result: ', reader.result);
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ image: reader.result }),
      });
      const data = await response.json();
      console.log(data.cooperHewittData);

      // Clear previous images if any
      searchedImageContainer.innerHTML = "";

      // Loop through cooperHewittData (array of objects) and get the first image from each multimedia array
      data.cooperHewittData.forEach((item) => {
        // Check if multimedia exists and has at least one item
        if (item.multimedia && item.multimedia.length > 0) {
          const firstImageUrl = item.multimedia[0].large.url;

          // Create a new image element and set its src to the first image URL
          const imgElement = document.createElement("img");
          imgElement.src = firstImageUrl;
          imgElement.alt = item.title || "Cooper Hewitt object";
          imgElement.style.width = "10%"; // Adjust size as needed
          imgElement.style.marginBottom = "10px";

          // Append the image element to the container
          searchedImageContainer.appendChild(imgElement);
        }
      });

      // Display the analysis result
      outputElement.textContent = data.analysis;
    } catch (error) {
      console.error("Error:", error);
      outputElement.textContent = "An error occurred while analyzing the image.";
    }
  };
};
