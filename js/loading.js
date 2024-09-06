document.addEventListener('DOMContentLoaded', function () {
  const music = document.getElementById('background-music');
  const playMusicButton = document.getElementById('play-music');

  // Autoplay music for GMod (and fallback for browser testing)
  function autoPlayMusic() {
    music.volume = 0.5; // Set volume
    music.play()
      .then(() => {
        playMusicButton.style.display = "none"; // Hide button when autoplay works
      })
      .catch(() => {
        playMusicButton.style.display = "block"; // Show button if autoplay fails
      });
  }

  // Try to autoplay music
  autoPlayMusic();

  // Fallback for browsers: Click to start/stop music
  playMusicButton.addEventListener('click', function () {
    if (music.paused) {
      music.play();
      playMusicButton.innerText = "Click to Stop Music";
    } else {
      music.pause();
      playMusicButton.innerText = "Click to Start Music";
    }
  });
});

/* --- T2 style scrolling text --*/
document.addEventListener('DOMContentLoaded', function () {

  function getRandomAssemblyLine() {
    return {
      address: addresses[Math.floor(Math.random() * addresses.length)],
      instruction: `${instructions[Math.floor(Math.random() * instructions.length)]} ${registers[Math.floor(Math.random() * registers.length)]}`
    };
  }

  let leftLineNumber = 1;  // Starting line number for left column
  let rightLineNumber = 101;  // Starting line number for right column
  let currentAsmLineLeft = 0;
  let currentAsmLineRight = 0;
  const maxLines = 20;  // Maximum lines to display before resetting

  const leftAsmDelay = 500;  // Delay for the left column
  const rightAsmDelay = 700;  // Delay for the right column

  // Function to insert a complete block of predefined code with separators
  function insertPredefinedBlock(feedId, block, lineNumber) {
    const feed = document.getElementById(feedId);

    // Insert block label (announcement)
    const labelElement = document.createElement('div');
    labelElement.classList.add('assembly-line');
    labelElement.innerHTML = `<span>${lineNumber}</span> <span>${block.label}</span>`;
    feed.appendChild(labelElement);
    lineNumber++;

    // Insert line separator ----------------
    const separatorElementStart = document.createElement('div');
    separatorElementStart.classList.add('assembly-line');
    separatorElementStart.innerHTML = `<span>${lineNumber}</span> <span>--------------------</span>`;
    feed.appendChild(separatorElementStart);
    lineNumber++;

    // Insert each line of the block code, prefixed with '>'
    block.code.forEach((codeLine) => {
      const codeElement = document.createElement('div');
      codeElement.classList.add('assembly-line', 'indented'); // Added 'indented' class
      codeElement.innerHTML = `<span>${lineNumber}</span> <span>> ${codeLine}</span>`;
      feed.appendChild(codeElement);
      lineNumber++;
    });

    // Insert line separator to end the block
    const separatorElementEnd = document.createElement('div');
    separatorElementEnd.classList.add('assembly-line');
    separatorElementEnd.innerHTML = `<span>${lineNumber}</span> <span>--------------------</span>`;
    feed.appendChild(separatorElementEnd);
    lineNumber++;

    return lineNumber;  // Return updated line number after inserting block
  }

  function addLeftAssemblyLine() {
    const lineData = getRandomAssemblyLine();
    const feed = document.getElementById('assembly-feed-left');
    const lineElement = document.createElement('div');
    lineElement.classList.add('assembly-line');

    // Randomly insert predefined code blocks with separators
    if (Math.random() > 0.85) {
      const block = predefinedBlocks[Math.floor(Math.random() * predefinedBlocks.length)];
      leftLineNumber = insertPredefinedBlock('assembly-feed-left', block, leftLineNumber);
    } else {
      lineElement.innerHTML = `<span>${leftLineNumber}</span> <span>${lineData.address}</span> <span>${lineData.instruction}</span>`;
      feed.appendChild(lineElement);
      leftLineNumber++;
    }

    currentAsmLineLeft++;

    // Remove old lines after max limit
    if (currentAsmLineLeft > maxLines) {
      feed.firstChild.remove();
      currentAsmLineLeft--;
    }

    setTimeout(addLeftAssemblyLine, leftAsmDelay);
  }

  function addRightAssemblyLine() {
    const lineData = getRandomAssemblyLine();
    const feed = document.getElementById('assembly-feed-right');
    const lineElement = document.createElement('div');
    lineElement.classList.add('assembly-line');

    // Randomly insert predefined code blocks with separators
    if (Math.random() > 0.85) {
      const block = predefinedBlocks[Math.floor(Math.random() * predefinedBlocks.length)];
      rightLineNumber = insertPredefinedBlock('assembly-feed-right', block, rightLineNumber);
    } else {
      lineElement.innerHTML = `<span>${rightLineNumber}</span> <span>${lineData.address}</span> <span>${lineData.instruction}</span>`;
      feed.appendChild(lineElement);
      rightLineNumber++;
    }

    currentAsmLineRight++;

    // Remove old lines after max limit
    if (currentAsmLineRight > maxLines) {
      feed.firstChild.remove();
      currentAsmLineRight--;
    }

    setTimeout(addRightAssemblyLine, rightAsmDelay);
  }

  // Start both feeds independently
  addLeftAssemblyLine();
  addRightAssemblyLine();
});

/*--Welcome Message--*/
// This part is simulated for local testing
document.addEventListener('DOMContentLoaded', function () {
  let playerName = "Survivor"; // Default name for local testing
  let playerNameReceived = false; // Flag to check if player name has been received

  // GMod Hook: SetStatusChanged function to get player name
  window.SetStatusChanged = function (status) {
    if (status.includes("Player")) {
      playerName = status.split(" ")[1]; // Extract player name from GMod status
      playerNameReceived = true; // Player name received successfully
      updatePlayerName(); // Call function to update the player name in DOM
    }
  };

  // Function to update player name in DOM
  function updatePlayerName() {
    playerNameElement.innerText = `Welcome to the Future War, ${playerName}`;
  }

  // Polling function to keep checking for the player name until received
  function checkPlayerName() {
    if (!playerNameReceived) {
      setTimeout(checkPlayerName, 500); // Retry every 500ms
    } else {
      updatePlayerName(); // Once received, update the player name
    }
  }

    // Start checking for the player name (in case it's delayed)
    checkPlayerName();

  // Fallback for local testing if GMod hook is not called
  setTimeout(() => {
    document.getElementById('playerName').innerText = `Welcome to the Future War, ${playerName}`;
  }, 8000); // Simulated 3-second delay for local testing
});

  /* Cursortyper */
  document.addEventListener('DOMContentLoaded', function () {
    const consoleText = document.getElementById('console-text');
    const cursor = document.getElementById('cursor');
    
    let arrayIndex = 0; // Index to track which string we're typing
    let charIndex = 0; // Index to track the current character being typed
    let typingSpeed = 75; // Speed of typing (in ms)
    let wipingSpeed = 15; // Speed of wiping (in ms)
    let pauseAfterTyping = 5000; // Pause before wiping and typing next line
    
    function typeText() {
      if (charIndex < rumors[arrayIndex].length) {
        // Type the next character
        consoleText.textContent += rumors[arrayIndex][charIndex];
        charIndex++;
        setTimeout(typeText, typingSpeed); // Continue typing
      } else {
        // Pause before wiping the text
        setTimeout(wipeText, pauseAfterTyping);
      }
    }
  
    function wipeText() {
      if (charIndex > 0) {
        // Wipe the last character
        consoleText.textContent = consoleText.textContent.slice(0, -1);
        charIndex--;
        setTimeout(wipeText, wipingSpeed); // Continue wiping
      } else {
        // After wiping, move to the next string in the array
        arrayIndex = (arrayIndex + 1) % rumors.length; // Loop back to start if at end
        setTimeout(typeText, typingSpeed); // Start typing the next line
      }
    }
  
    // Start the typing effect initially
    typeText();
  });