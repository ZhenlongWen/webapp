document.getElementById("upload-button").addEventListener("click", async () => {
  const fileInput = document.getElementById("file-input");
  const file = fileInput.files[0];

  if (!file) {
      alert("Please select an image!");
      return;
  }

  // Convert the file to a Base64 string
  const base64Image = await convertToBase64(file);

  try {
      // Send the Base64 image to the server
      const response = await fetch("api/analyze", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Image }),
      });

      const result = await response.json();

      if (result.success) {
          displayResult(result.query);
      } else {
          alert("Analysis failed!");
      }
  } catch (error) {
      console.error("Error:", error);
      alert("An error occurred!");
  }
});

// Convert file to Base64 string
function convertToBase64(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
  });
}

function displayResult(query) {
  const resultDiv = document.getElementById("result");
  resultDiv.textContent = `Query: ${query}`;
}