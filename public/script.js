// frontend/script.js

document.getElementById("sendButton").addEventListener("click", async () => {
    const userInput = document.getElementById("userInput").value;
  
    // Send a POST request to the backend
    const response = await fetch("http://localhost:8000/chatgpt.html", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: userInput }),
    });
  
    const data = await response.json();
  
    // Display the response in the "response" div
    document.getElementById("response").textContent = data.reply;
  });