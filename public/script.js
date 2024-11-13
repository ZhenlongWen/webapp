document.getElementById("uploadForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fileInput = document.getElementById("imageInput");
  const file = fileInput.files[0];
  if (!file) {
      alert("Please upload an image!");
      return;
  }

  const formData = new FormData();
  formData.append("image", file);

  try {
      const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
      });

      const data = await response.json();
      displayResults(data.description);
  } catch (error) {
      console.error("Error:", error);
      displayResults("Failed to analyze the image.");
  }
});

function displayResults(description) {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = `<h2>Description:</h2><p>${description}</p>`;
}