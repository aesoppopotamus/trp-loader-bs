document.addEventListener('DOMContentLoaded', function () {
  const music = document.getElementById('background-music');
  const playMusicButton = document.getElementById('play-music');

  // Autoplay music for GMod and browser fallback
  function autoPlayMusic() {
    music.volume = 0.5; // Set volume
    music.play()
      .then(() => {
        playMusicButton.style.display = "none"; // Hide button if autoplay works
      })
      .catch(() => {
        playMusicButton.style.display = "block"; // Show button if autoplay fails
      });
  }

  // Try to autoplay music on page load
  autoPlayMusic();

  // Allow manual music play/stop if autoplay fails
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

/*--- T2 style scrolling text --*/
document.addEventListener('DOMContentLoaded', function () {
  const maxLines = 20;  // Maximum lines to display before resetting
  const leftAsmDelay = 500;
  const rightAsmDelay = 700;
  let leftLineNumber = 1;
  let rightLineNumber = 101;
  let currentAsmLineLeft = 0;
  let currentAsmLineRight = 0;

  // Function to get a random assembly line
  function getRandomAssemblyLine() {
    return {
      address: addresses[Math.floor(Math.random() * addresses.length)],
      instruction: `${instructions[Math.floor(Math.random() * instructions.length)]} ${registers[Math.floor(Math.random() * registers.length)]}`
    };
  }

  // Function to insert predefined blocks of code
  function insertPredefinedBlock(feedId, block, lineNumber) {
    const feed = document.getElementById(feedId);

    feed.innerHTML += `
      <div class="assembly-line"><span>${lineNumber}</span> <span>${block.label}</span></div>
      <div class="assembly-line"><span>${lineNumber + 1}</span> <span>--------------------</span></div>
      ${block.code.map((line, idx) => `<div class="assembly-line indented"><span>${lineNumber + 2 + idx}</span> <span>> ${line}</span></div>`).join('')}
      <div class="assembly-line"><span>${lineNumber + block.code.length + 2}</span> <span>--------------------</span></div>
    `;

    return lineNumber + block.code.length + 3;
  }

  // Function to add an assembly line to the left feed
  function addLeftAssemblyLine() {
    const feed = document.getElementById('assembly-feed-left');
    const lineData = getRandomAssemblyLine();

    if (Math.random() > 0.85) {
      const block = predefinedBlocks[Math.floor(Math.random() * predefinedBlocks.length)];
      leftLineNumber = insertPredefinedBlock('assembly-feed-left', block, leftLineNumber);
    } else {
      feed.innerHTML += `<div class="assembly-line"><span>${leftLineNumber}</span> <span>${lineData.address}</span> <span>${lineData.instruction}</span></div>`;
      leftLineNumber++;
    }

    currentAsmLineLeft++;

    if (currentAsmLineLeft > maxLines) {
      feed.firstChild.remove();
      currentAsmLineLeft--;
    }

    setTimeout(addLeftAssemblyLine, leftAsmDelay);
  }

  // Function to add an assembly line to the right feed
//  function addRightAssemblyLine() {
//    const feed = document.getElementById('assembly-feed-right');
//    const lineData = getRandomAssemblyLine();
//
//    feed.innerHTML += `<div class="assembly-line"><span>${rightLineNumber}</span> <span>${lineData.address}</span> <span>${lineData.instruction}</span></div>`;
//    rightLineNumber++;
//
//    currentAsmLineRight++;
//
//    if (currentAsmLineRight > maxLines) {
//      feed.firstChild.remove();
//      currentAsmLineRight--;
//    }
//
//    setTimeout(addRightAssemblyLine, rightAsmDelay);
//  }

  // Start scrolling text on both sides
  addLeftAssemblyLine();
});

  /* Cursortyper */
  document.addEventListener('DOMContentLoaded', function () {
    const consoleText = document.getElementById('console-text');
    const typingSpeed = 0; // Adjust typing speed here
    const pauseAfterTyping = 12000; // Adjust pause before wiping and typing next message
    let shuffledRumors = shuffleArray([...rumors]); // Shuffling rumors
    let arrayIndex = 0;
    let charIndex = 0;
  
    // Fisher-Yates Shuffle function
    function shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }
  
    function typeText() {
      if (charIndex < shuffledRumors[arrayIndex].length) {
        consoleText.textContent += shuffledRumors[arrayIndex][charIndex];
        charIndex++;
        setTimeout(typeText, typingSpeed); // Continue typing
      } else {
        setTimeout(startNextText, pauseAfterTyping); // Pause after finishing typing
      }
    }
  
    function startNextText() {
      // Clear only the dynamic text
      consoleText.textContent = '';
      charIndex = 0; // Reset charIndex for new text
      arrayIndex++; // Move to the next message
  
      if (arrayIndex >= shuffledRumors.length) {
        shuffledRumors = shuffleArray([...rumors]); // Reshuffle if all are typed
        arrayIndex = 0; // Start from the beginning
      }
      setTimeout(typeText, typingSpeed); // Start typing the next text
    }
  
    // Start the typing effect
    typeText();
  });
  
  document.addEventListener('DOMContentLoaded', function () {
    const loreFeed = document.getElementById('lore-feed');
  
    // Lore updates will come from your config.js
    const loreUpdates = window.motdArray; // Assuming 'loreFeedArray' is in config.js
  
    // Function to cycle through lore updates
    let loreIndex = 0;
    function updateLoreFeed() {
      loreFeed.textContent = loreUpdates[loreIndex];
      loreIndex = (loreIndex + 1) % loreUpdates.length; // Loop through array
    }
  
    // Initial update
    updateLoreFeed();
  
    // Update the lore feed every 5 seconds
    setInterval(updateLoreFeed, 7000);
  });