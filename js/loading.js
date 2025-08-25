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

// === Fast DOM helpers ========================================================

// Reusable "ring buffer" appender: keeps at most `max` rows in the DOM.
// It RECYCLES nodes instead of creating/destroying endlessly.
function makeRingAppender(container, max = 200) {
  const pool = [];
  return function appendLine(lineNo, ...parts) {
    // optional last arg: options object, e.g. { className: 'indented' }
    let opts = {};
    if (
      parts.length &&
      typeof parts[parts.length - 1] === 'object' &&
      parts[parts.length - 1] !== null &&
      !Array.isArray(parts[parts.length - 1])
    ) {
      opts = parts.pop();
    }

    // acquire or create a row
    let node;
    if (pool.length < max) {
      node = document.createElement('div');
      node.className = 'assembly-line';
      // first <span> = line number
      node.appendChild(document.createElement('span'));
      container.appendChild(node);
      pool.push(node);
    }

    // rotate oldest to end and reuse it
    node = pool.shift();

    // reset base class + optional class
    node.className = 'assembly-line' + (opts.className ? ' ' + opts.className : '');

    // ensure we have enough spans for number + text parts
    while (node.children.length < parts.length + 1) {
      node.appendChild(document.createElement('span'));
    }

    // write number + texts
    node.children[0].textContent = String(lineNo);
    for (let i = 0; i < parts.length; i++) {
      node.children[i + 1].textContent = parts[i];
    }

    // clear any EXTRA spans left over from a previous longer line
    for (let j = parts.length + 1; j < node.children.length; j++) {
      node.children[j].textContent = '';
    }

    // move to end (visual scroll) and re-queue
    container.appendChild(node);
    pool.push(node);
  };
}

/*--- T2 style scrolling text --*/
document.addEventListener('DOMContentLoaded', function () {
  const maxLines = 100;  // Maximum lines to display before resetting
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
// --- Left feed (fast, bounded DOM) ------------------------------------------
const leftFeedEl = document.getElementById('assembly-feed-left');
const appendLeft = makeRingAppender(leftFeedEl, maxLines); // cap at maxLines

function appendPredefinedBlockLeft(block) {
  // label
  appendLeft(leftLineNumber++, block.label);
  // dashes
  appendLeft(leftLineNumber++, '--------------------');

  // code lines (with the "indented" look)
  for (let i = 0; i < block.code.length; i++) {
    appendLeft(leftLineNumber++, `> ${block.code[i]}`, { className: 'indented' });
  }

  // dashes
  appendLeft(leftLineNumber++, '--------------------');
}

function addLeftAssemblyLineFast() {
  const lineData = getRandomAssemblyLine();

  if (Math.random() > 0.85) {
    const block = predefinedBlocks[Math.floor(Math.random() * predefinedBlocks.length)];
    appendPredefinedBlockLeft(block);
  } else {
    // number, address, instruction (three spans total)
    appendLeft(leftLineNumber++, lineData.address, lineData.instruction);
  }

  setTimeout(addLeftAssemblyLineFast, leftAsmDelay);
}
  addLeftAssemblyLineFast();
});

  /* Cursortyper */
  document.addEventListener("DOMContentLoaded", () => {
    runCursorTyperFromConfig();
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

  (function () {
  function getParams() {
    const u = new URL(window.location.href);
    return {
      mute: u.searchParams.get("mute") === "1",
      seed: u.searchParams.get("seed"),
    };
  }

  function renderScanText() {
    const root = document.getElementById("top-right");
    if (!root) return;
    const cfg = (window.UI && window.UI.scanText) || [];
    const baseClass = (window.UI && window.UI.scanTextClass) || "scan-text";
    root.innerHTML = "";
    cfg.forEach(({ tag = "div", text = "", className = "" }) => {
      const el = document.createElement(tag);
      el.className = (className ? `${baseClass} ${className}` : baseClass).trim();
      el.textContent = text;
      root.appendChild(el);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      renderScanText();
      const p = getParams();
      if (window.UI?.defaults) {
        if (p.mute) window.UI.defaults.mute = true;
        if (p.seed) window.UI.defaults.seed = Number(p.seed);
      }
    });
  } else {
    renderScanText();
  }
})();