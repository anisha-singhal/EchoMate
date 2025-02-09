// Replace with your actual Gemini API key
const API_KEY = 'AIzaSyC6PdVjZ1ps1hxkiejSHb2BtXT9-ppGfJY'; 
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// DOM Elements
const chatContainer = document.querySelector('.chat-container');
const inputField = document.querySelector('.input-field');
const sendButton = document.querySelector('.send-button');
const voiceBtn = document.querySelector('#voice-btn');
const actionButtons = document.querySelectorAll('.action-button');
const md = window.markdownit({
    html: false,
    linkify: true,
    typographer: true
});

// Initialize Speech Recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputField.value = transcript;
        handleUserInput(); // Auto-submit after voice input
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
        console.log('Speech recognition ended.');
    };
} else {
    voiceBtn.style.display = 'none';
}

// Add message to chat and return the message element
function addMessage(message, isUser = true, isMarkdown = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.innerHTML = isUser ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>';

    const content = document.createElement('div');
    content.className = 'message-content';

    // Render Markdown or plain text
    if (isMarkdown) {
        content.innerHTML = md.render(message); // Render Markdown to HTML
        addCopyButtons(content); // Add copy buttons for code blocks
    } else {
        content.textContent = message; // Plain text message
    }

    if (!isUser) {
        content.classList.add('ai-response');
    }

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatContainer.appendChild(messageDiv);

    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;

    return messageDiv;
}

// Add copy buttons for code blocks
function addCopyButtons(container) {
    container.querySelectorAll('pre code').forEach((codeBlock) => {
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy code';

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeBlock.textContent)
                .then(() => {
                    copyButton.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
                    }, 2000);
                })
                .catch((err) => console.error('Failed to copy:', err));
        });

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';
        wrapper.appendChild(codeBlock.cloneNode(true));
        wrapper.appendChild(copyButton);

        codeBlock.parentNode.replaceChild(wrapper, codeBlock);
    });
}

// Check if response is Markdown
function isMarkdown(text) {
    const markdownPatterns = [
        /\[.+\]\(.+\)/,         // Links: [text](url)
        /#{1,6}\s+.+/,          // Headers: # Header
        /\*\*.+\*\*/,           // Bold: **text**
        /\*.+\*/,               // Italic: *text*
        /`.+`/,                 // Inline code: `code`
        /```[\s\S]*?```/,       // Code block: ```code```
        /- .+/,                 // Unordered lists: - item
        /!\[.+\]\(.+\)/         // Images: ![alt](url)
    ];

    // Check if any pattern matches the text
    return markdownPatterns.some((pattern) => pattern.test(text));
}

// Get response from Gemini API// Get response from Gemini API
async function getAIResponse(prompt) {
    try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt // Removed the Markdown formatting instruction
                            }
                        ]
                    }
                ]
            })
        });

        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;

        // Check if the response contains Markdown
        return { text: responseText, isMarkdown: isMarkdown(responseText) };
    } catch (error) {
        console.error('Error:', error);
        return { text: 'Sorry, I encountered an error. Please try again.', isMarkdown: false };
    }
}

// Speak the response using text-to-speech
function speakResponse(text) {
    if ('speechSynthesis' in window) {
        // Strip Markdown for speech
        const plainText = text.replace(/[#*`\[\]()]/g, '');
        const utterance = new SpeechSynthesisUtterance(plainText);
        utterance.lang = 'en-US';
        speechSynthesis.speak(utterance);
    } else {
        console.warn('Text-to-speech not supported in this browser.');
    }
}

// Handle user input
async function handleUserInput() {
    const prompt = inputField.value.trim();
    if (!prompt) return;

    addMessage(prompt, true);

    inputField.value = '';

    // Show loading indicator
    const loadingMessage = addMessage('Thinking...', false);

    try {
        const { text, isMarkdown } = await getAIResponse(prompt);

        // Replace loading message with the actual response
        chatContainer.removeChild(loadingMessage);
        addMessage(text, false, isMarkdown);

        // Speak the response if text-to-speech is supported
        speakResponse(text);
    } catch (error) {
        // Replace loading message with an error message
        chatContainer.removeChild(loadingMessage);
        addMessage('Error processing your request.', false);
    }
}

// Event Listeners
sendButton.addEventListener('click', handleUserInput);

inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleUserInput();
});

voiceBtn.addEventListener('click', () => {
    if (recognition) {
        recognition.start();
    }
});

actionButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const prompt = button.textContent;
        inputField.value = prompt;
        handleUserInput();
    });
});

