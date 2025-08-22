const prompt = document.querySelector("#prompt");
const submitbtn = document.querySelector("#submit");
const chatContainer = document.querySelector(".chat-container");
const imagebtn = document.querySelector("#image");
const image = document.querySelector("#image img");
const imageinput = document.querySelector("#image input");

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=Ypur API key";

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");
    
    // Prepare the request payload
    let requestPayload = {
        contents: [{
            parts: []
        }]
    };

    // Add text if available
    if (user.message && user.message.trim() !== "") {
        requestPayload.contents[0].parts.push({
            text: user.message
        });
    }

    // Add image if available
    if (user.file.data) {
        requestPayload.contents[0].parts.push({
            inline_data: {
                mime_type: user.file.mime_type,
                data: user.file.data
            }
        });
    }

    // Don't send request if no content
    if (requestPayload.contents[0].parts.length === 0) {
        text.innerHTML = "Please enter a message or upload an image";
        return;
    }

    try {
        let response = await fetch(API_URL, {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        let data = await response.json();
        
        // Check if response structure is valid
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            let apiResponse = data.candidates[0].content.parts[0].text;
            text.innerHTML = apiResponse.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").trim();
        } else {
            text.innerHTML = "Sorry, I couldn't process that request. Please try again.";
        }
    } catch(error) {
        console.error("API Error:", error);
        text.innerHTML = "Error: Failed to get response. Please check your connection and try again.";
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        image.src = "img.svg";
        image.classList.remove("choose");
        user.file = {};
    }
}

function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

function handlechatResponse(userMessage) {
    user.message = userMessage || (user.file.data ? "What's in this image?" : "");
    
    let html = `<img src="user.png" alt="" id="userImage" width="8%">
    <div class="user-chat-area">
        ${user.message}
        ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg" />` : ""}
    </div>`;
    
    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

    setTimeout(() => {
        let html = `<img src="ai.png" alt="" id="aiImage" width="10%">
            <div class="ai-chat-area">
                <img src="loading.webp" alt="" class="load" width="50px">
            </div>`;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

prompt.addEventListener("keydown", (e) => {
    if (e.key == "Enter" && (prompt.value.trim() || user.file.data)) {
        handlechatResponse(prompt.value);
    }
});

submitbtn.addEventListener("click", () => {
    if (prompt.value.trim() || user.file.data) {
        handlechatResponse(prompt.value);
    }
});

imageinput.addEventListener("change", () => {
    const file = imageinput.files[0];
    if (!file) return;
    
    // Basic image validation
    if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
    }

    let reader = new FileReader();
    reader.onload = (e) => {
        let base64string = e.target.result.split(",")[1];
        user.file = {
            mime_type: file.type,
            data: base64string
        };
        image.src = `data:${user.file.mime_type};base64,${user.file.data}`;
        image.classList.add("choose");
    };
    reader.onerror = () => {
        alert("Error reading image file");
    };
    reader.readAsDataURL(file);
});

imagebtn.addEventListener("click", () => {
    imageinput.click();

});
