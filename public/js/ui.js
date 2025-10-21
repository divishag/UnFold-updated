// This module handles all functions related to rendering and updating the user interface.

// Make sure to add chatHistory to the module scope for temporary storage/access during re-renders.
// Note: This is now being passed from main.js, but keeping the module scope clear of it.
const mainContent = document.getElementById('main-content');
const backToHomeBtn = document.getElementById('back-to-home');

/** Renders the home page with the list of cases. */
export function renderHomePage(cases, userId, onCaseSelect) {
    backToHomeBtn.classList.add('hidden');
    mainContent.className = 'py-12 px-4';
    document.querySelector('footer').innerHTML = 'Investigate, Connect, Solve.';

    mainContent.innerHTML = `
        <div class="max-w-4xl mx-auto">
            <h1 class="text-4xl font-bold mb-4 text-center text-gray-200">Select Your Mission</h1>
            <p class="text-center text-lg text-gray-400 mb-10">Uncover the web of causes and effects. User ID: ${userId}</p>
            <div id="case-list" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>
        </div>
    `;

    const caseList = document.getElementById('case-list');
    cases.forEach(caseItem => {
        const card = document.createElement('div');
        card.className = "bg-gray-800 p-6 rounded-xl shadow-xl border-l-4 border-yellow-600 hover:bg-gray-700 transition duration-300 transform hover:scale-[1.02] cursor-pointer";
        card.innerHTML = `
            <h3 class="text-2xl font-bold text-yellow-300 mb-2">${caseItem.title} 
            ${caseItem.difficulty === 'Advanced' ? '<span class="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">🔥 ADVANCED</span>' : ''}
            </h3>
            <p class="text-gray-400 mb-3">${caseItem.description}</p>
            <div class="flex justify-between items-center text-sm">
                <span class="font-semibold text-gray-300">Difficulty: ${caseItem.difficulty}</span>
                <span class="bg-yellow-600 text-gray-900 px-3 py-1 rounded-full font-bold">START CASE</span>
            </div>
        `;
        card.addEventListener('click', () => onCaseSelect(caseItem));
        caseList.appendChild(card);
    });
}

/** Renders the main mind map editor view. */
export function renderMindMapEditor(caseData, mindMapState, interactionHandlers, chatHistory) {
    backToHomeBtn.classList.remove('hidden');
    mainContent.className = '';
    mainContent.innerHTML = `
        <div id="mind-map-editor" class="main-content-grid-robust">
            <div class="flex flex-col bg-gray-800 rounded-xl shadow-2xl p-4 overflow-hidden">
                <h2 class="text-2xl font-bold mb-4 text-yellow-300">Evidence Drawer</h2>
                <p class="text-gray-400 text-sm mb-3 border-b border-gray-700 pb-2">Drag a card onto the timeline.</p>
                <div class="bg-gray-800 p-3 rounded mb-3 text-xs shadow-lg">
                    <div class="text-yellow-300 text-sm font-semibold mb-2">📋 How to Use Timeline:</div>
                    <div class="text-gray-300 text-xs space-y-1">
                        <div>1️⃣ Set start & end years above</div>
                        <div>2️⃣ Click "Update" to create timeline</div>
                        <div>3️⃣ Drag evidence cards to timeline</div>
                        <div>4️⃣ Double-click nodes to move them</div>
                        <div>5️⃣ Click two nodes to create links</div>
                    </div>
                </div>
                <div id="evidence-list" class="flex flex-col space-y-3 custom-scrollbar overflow-y-auto pr-1"></div>
            </div>
        <div id="mind-map-canvas" class="mind-map-canvas-container relative bg-gray-950 border-4 border-dashed border-gray-700 rounded-xl shadow-inner shadow-black/50">
            <div class="absolute top-2 left-2 text-gray-600 text-xs italic">Timeline View - Drag evidence to timeline</div>
            <div id="timeline-controls" class="absolute top-2 right-2 bg-gray-800 p-2 rounded-lg shadow-lg">
                <div class="flex items-center space-x-2 text-sm">
                    <label class="text-gray-300">Start:</label>
                    <input type="number" id="start-year" value="1985" class="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600">
                    <label class="text-gray-300">End:</label>
                    <input type="number" id="end-year" value="1990" class="w-16 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600">
                    <button id="update-timeline" class="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500">Update</button>
                </div>
            </div>
                <div id="timeline-line" class="absolute left-20 top-0 bottom-0 w-1 bg-blue-500"></div>
                <div id="timeline-years" class="absolute left-16 top-0 bottom-0"></div>
                <svg id="svg-links" class="absolute inset-0 w-full h-full pointer-events-none z-0"><defs id="svg-defs"></defs></svg>
            </div>
            <div id="ai-chat-panel" class="bg-gray-800 rounded-xl shadow-2xl p-4 overflow-hidden"></div>
        </div>
    `;
    
    // Add event listeners for the canvas
    const canvas = document.getElementById('mind-map-canvas');
    canvas.ondragover = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    };
    canvas.ondrop = interactionHandlers.handleDrop;
    
    // Populate the components
    populateEvidenceDrawer(caseData.evidence);
    populateAIBotChat(caseData, mindMapState, chatHistory, interactionHandlers);
    drawCanvasElements(mindMapState, interactionHandlers, null);
    document.querySelector('footer').innerHTML = `Current Case: <span class="text-gray-300">${caseData.headline}</span>`;
}

// --- SUB-COMPONENT RENDERERS ---

function populateEvidenceDrawer(evidence) {
    const list = document.getElementById('evidence-list');
    list.innerHTML = '';
    
    // Add "Add Evidence" button at the top
    const addButton = document.createElement('div');
    addButton.className = "bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-500 transition duration-150 ease-in-out cursor-pointer border-l-4 border-blue-400 font-medium text-center mb-3";
    addButton.innerHTML = `
        <div class="flex items-center justify-center space-x-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Add Evidence</span>
        </div>
    `;
    addButton.addEventListener('click', () => {
        showAddEvidenceModal();
    });
    list.appendChild(addButton);
    
    // Add existing evidence cards
    evidence.forEach(item => {
        const card = document.createElement('div');
        card.className = "bg-gray-900 text-gray-100 p-3 rounded-lg shadow-lg hover:bg-gray-700 transition duration-150 ease-in-out cursor-grab border-l-4 border-yellow-500 font-medium";
        card.textContent = item.text;
        card.setAttribute('draggable', true);
        card.addEventListener('dragstart', (e) => {
            console.log('Drag started with:', item.text);
            e.dataTransfer.setData("text/plain", item.text);
            e.dataTransfer.effectAllowed = "copy";
        });
        card.addEventListener('dragend', (e) => {
            console.log('Drag ended');
        });
        list.appendChild(card);
    });
}

// Function to show the add evidence modal
function showAddEvidenceModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modalOverlay.id = 'evidence-modal-overlay';
    
    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.className = 'bg-gray-800 rounded-xl p-6 w-96 max-w-md mx-4 shadow-2xl';
    modalContent.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-xl font-bold text-yellow-300">Add Custom Evidence</h3>
            <button id="close-modal" class="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Evidence Description</label>
                <textarea 
                    id="evidence-text" 
                    class="w-full p-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500 resize-none" 
                    rows="3" 
                    placeholder="Enter your custom evidence..."
                ></textarea>
            </div>
            <div class="flex space-x-3">
                <button 
                    id="add-evidence-btn" 
                    class="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition duration-150 font-medium"
                >
                    Add Evidence
                </button>
                <button 
                    id="cancel-evidence-btn" 
                    class="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition duration-150 font-medium"
                >
                    Cancel
                </button>
            </div>
            <div class="text-xs text-gray-400 text-center">
                Press Ctrl+Enter to add, Escape to cancel
            </div>
        </div>
    `;
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Add event listeners
    document.getElementById('close-modal').addEventListener('click', closeEvidenceModal);
    document.getElementById('cancel-evidence-btn').addEventListener('click', closeEvidenceModal);
    document.getElementById('add-evidence-btn').addEventListener('click', addCustomEvidence);
    
    // Close modal when clicking overlay
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeEvidenceModal();
        }
    });
    
    // Keyboard support
    const textarea = document.getElementById('evidence-text');
    textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            addCustomEvidence();
        }
    });
    
    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeEvidenceModal();
        }
    });
    
    // Focus on textarea
    textarea.focus();
}

function closeEvidenceModal() {
    const modal = document.getElementById('evidence-modal-overlay');
    if (modal) {
        modal.remove();
    }
}

function addCustomEvidence() {
    const evidenceText = document.getElementById('evidence-text').value.trim();
    
    if (!evidenceText) {
        alert('Please enter evidence description');
        return;
    }
    
    // Add the custom evidence to the current case data
    if (window.currentCaseData && window.currentCaseData.evidence) {
        window.currentCaseData.evidence.push({ text: evidenceText });
        
        // Refresh the evidence drawer
        populateEvidenceDrawer(window.currentCaseData.evidence);
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        successMsg.textContent = 'Custom evidence added successfully!';
        document.body.appendChild(successMsg);
        
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    closeEvidenceModal();
}

/** Renders all chat elements and the submit/finalize controls. */
export function populateAIBotChat(caseData, mindMapState, chatHistory, interactionHandlers = {}) {
    const container = document.getElementById('ai-chat-panel');
    if (!container) return; // Exit if not in the map editor view
    
    // Logic for the Finalize button
    const totalCauseNodes = mindMapState.nodes.filter(n => n.type === 'cause').length;
    const linkCount = mindMapState.links.length;
    const canProceed = totalCauseNodes >= 3 && linkCount >= 2;

    container.innerHTML = `
        <div class="h-full flex flex-col justify-between">
            <div class="flex-grow space-y-4 text-sm custom-scrollbar overflow-y-auto pr-2" id="chat-messages-container">
                <h3 class="text-xl font-bold text-red-400 border-b pb-2 border-gray-700 sticky top-0 bg-gray-800 z-10">AI Challenger 🤖 | Probe Logic</h3>
            </div>
            <div class="mt-4 pt-4 border-t border-gray-700 space-y-3">
                <div class="flex space-x-2">
                    <input type="text" id="chat-input" placeholder="Respond or type a new hypothesis..." class="flex-grow p-3 bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-yellow-500 focus:border-yellow-500"/>
                    <button id="send-chat-button" class="px-4 py-2 bg-yellow-600 text-gray-900 font-bold rounded-lg hover:bg-yellow-500 transition duration-150">Send</button>
                </div>

                <button id="finalize-button" class="w-full px-4 py-3 text-lg font-extrabold rounded-lg transition-all duration-300 shadow-xl 
                    ${canProceed ? 'bg-green-600 text-white hover:bg-green-500' : 'bg-gray-500 text-gray-200 cursor-not-allowed'}"
                    ${!canProceed ? 'disabled' : ''}
                >
                    ${canProceed ? `Finalize Map & Chat →` : `(Need ${Math.max(0, 3 - totalCauseNodes)} Causes, ${Math.max(0, 2 - linkCount)} Links)`}
                </button>
            </div>
        </div>
    `;

    // Render the actual chat history
    renderChatMessages(chatHistory);

    // Add event listeners for chat submission
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-chat-button');

    if (chatInput && sendButton && interactionHandlers.handleChatSubmit) {
        const submitHandler = () => {
            const message = chatInput.value.trim();
            if (message) {
                interactionHandlers.handleChatSubmit(message);
                chatInput.value = ''; // Clear input field
            }
        };

        sendButton.addEventListener('click', submitHandler);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                submitHandler();
            }
        });
    }

    // Add event listener for finalize button
    const finalizeButton = document.getElementById('finalize-button');
    if (finalizeButton && interactionHandlers.handleFinalizeMap) {
        finalizeButton.addEventListener('click', interactionHandlers.handleFinalizeMap);
    }
}

function renderChatMessages(history) {
    const chatContainer = document.getElementById('chat-messages-container');
    if (!chatContainer) return;

    // Clear previous messages, but keep the sticky header
    const messagesDiv = document.createElement('div');
    messagesDiv.id = 'messages-content';

    // Add null check for history
    if (!history || !Array.isArray(history)) {
        console.log('No chat history provided, using empty array');
        history = [];
    }

    history.forEach(msg => {
        const isUser = msg.role === 'user';
        const isLoading = msg.role === 'loading';
        
        const messageElement = document.createElement('div');
        messageElement.className = `p-3 rounded-lg shadow-md max-w-[85%] ${
            isUser 
                ? 'bg-blue-600 text-white ml-auto' 
                : (isLoading 
                    ? 'bg-gray-600 text-gray-300 animate-pulse flex items-center space-x-2' 
                    : 'bg-gray-700 text-gray-200 mr-auto'
                  )
        }`;
        
        if (isLoading) {
            messageElement.innerHTML = `
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>${msg.content}</span>
            `;
        } else {
            const sender = isUser ? 'You' : 'PROBE';
            messageElement.innerHTML = `<p class="font-bold ${isUser ? 'text-blue-200' : 'text-red-300'}">${sender}:</p><p class="mt-1 whitespace-pre-wrap">${msg.content}</p>`;
        }

        messagesDiv.appendChild(messageElement);
    });

    // Replace the old messages content, preserving the header
    const oldMessagesContent = document.getElementById('messages-content');
    if (oldMessagesContent) {
        chatContainer.removeChild(oldMessagesContent);
    }
    chatContainer.appendChild(messagesDiv);
    
    // Auto-scroll to the latest message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


/** Draws all nodes and links on the canvas. */
export function drawCanvasElements(mindMapState, interactionHandlers, selectedNodeId) {
    const canvasContainer = document.getElementById('mind-map-canvas');
    if (!canvasContainer) {
        console.log('Canvas container not found!');
        return;
    }
    
    // Clear existing nodes and delete buttons
    Array.from(canvasContainer.children).forEach(child => {
        if (child.classList.contains('node-base') || child.tagName === 'BUTTON') {
            canvasContainer.removeChild(child);
        }
    });

    // Add Nodes
    mindMapState.nodes.forEach((node, index) => {
        canvasContainer.appendChild(createNodeElement(node, selectedNodeId, interactionHandlers));
    });

    // Draw Links
    drawLinks(mindMapState, selectedNodeId);
}


function createNodeElement(node, selectedNodeId, { handleDragStart, handleNodeClick, handleDeleteNode }) {
    const isOutcome = node.type === 'outcome';
    const isSelected = selectedNodeId === node.id;
    
    // Set a max width and use flex-col for the content inside for better wrapping
    const baseClasses = "node-base rounded-xl px-4 py-2 shadow-xl transition-all duration-150 transform min-w-[200px] max-w-[250px] text-center font-semibold text-sm select-none whitespace-normal";
    const typeClasses = isOutcome ? "bg-red-700 text-white border-4 border-red-500 z-20 shadow-red-500/50 cursor-default" : "bg-gray-800 text-white border-2 border-gray-600 z-10 hover:bg-gray-700 cursor-grab";
    const selectedClasses = isSelected ? "ring-4 ring-offset-2 ring-yellow-500 ring-offset-gray-900" : "";
    
    const nodeElement = document.createElement('div');
    nodeElement.id = node.id;
    nodeElement.className = `${baseClasses} ${typeClasses} ${selectedClasses}`;
    nodeElement.textContent = node.text.length > 50 ? node.text.substring(0, 47) + '...' : node.text;
    
    // Add delete button for selected non-outcome nodes
    if (isSelected && !isOutcome) {
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.className = 'absolute bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg transition-colors duration-150';
        deleteBtn.title = 'Delete node';
        // Position at top-right corner of the node, accounting for max-width
        deleteBtn.style.left = `${node.x + 200 - 8}px`; 
        deleteBtn.style.top = `${node.y - 8}px`;
        deleteBtn.style.zIndex = '30';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Use a custom non-alert confirmation (for now, just log and proceed)
            console.warn('Node delete requested. Implement custom confirmation modal.');
            handleDeleteNode(node.id); // For now, delete directly
        });
        
        // Add delete button to canvas container instead of node
        const canvasContainer = document.getElementById('mind-map-canvas');
        canvasContainer.appendChild(deleteBtn);
        
        // Store reference to delete button for cleanup (optional, handled by clearing all buttons)
        nodeElement.deleteButton = deleteBtn;
    }
    
    nodeElement.style.left = `${node.x}px`;
    nodeElement.style.top = `${node.y}px`;
    
    // Add event listeners for click (linking) and double-click (dragging)
    nodeElement.addEventListener('click', (e) => {
        console.log('Click event fired on node:', node.id);
        e.stopPropagation();
        handleNodeClick(node.id);
    });
    
    nodeElement.addEventListener('dblclick', (e) => {
        console.log('Double click on node:', node.id);
        e.preventDefault();
        e.stopPropagation();
        // Start dragging immediately on double-click
        handleDragStart(e, node.id);
    });
    
    // Touch event listener for drag/click handling on mobile
    let touchTimeout = null;
    let isDragging = false;
    
    nodeElement.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        
        // Set a short timer to treat it as a click if no movement (tap)
        touchTimeout = setTimeout(() => {
            // Long press or slight movement starts drag
            isDragging = true;
            handleDragStart(e, node.id);
        }, 300); // 300ms for long press/drag start
        
        // Prevent default behavior to avoid scrolling, but only if we are starting a drag
        if (!isOutcome) {
            e.preventDefault();
        }
    }, { passive: false });
    
    nodeElement.addEventListener('touchmove', (e) => {
        // Clear the timeout if we move, confirming drag intent
        clearTimeout(touchTimeout);
        if (isDragging) {
            // The handleDragStart initiated the move listeners, so nothing to do here
        }
    }, { passive: false });

    nodeElement.addEventListener('touchend', (e) => {
        clearTimeout(touchTimeout);
        if (!isDragging) {
            // It was a short tap, treat as a click
            handleNodeClick(node.id);
        }
        isDragging = false; // Reset drag state
    });

    return nodeElement;
}

function drawLinks(mindMapState, selectedNodeId) {
    const svg = document.getElementById('svg-links');
    const defs = document.getElementById('svg-defs');
    if (!svg || !defs) return;

    svg.innerHTML = '<defs id="svg-defs"></defs>'; // Clear previous links but keep defs
    
    if (!document.getElementById('arrowhead-d1d5db')) {
        defs.innerHTML = `
            <marker id="arrowhead-d1d5db" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="#d1d5db"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
            <marker id="arrowhead-fcd34d" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse" fill="#fcd34d"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
        `;
    }

    mindMapState.links.forEach(link => {
        const sourceNode = mindMapState.nodes.find(n => n.id === link.source);
        const targetNode = mindMapState.nodes.find(n => n.id === link.target);
        if (!sourceNode || !targetNode) return;
        
        const sourceCenter = getNodeCenter(sourceNode);
        const targetCenter = getNodeCenter(targetNode);
        
        const isSelected = link.source === selectedNodeId || link.target === selectedNodeId;
        const strokeColor = isSelected ? "#fcd34d" : "#d1d5db";
        const markerFill = isSelected ? "fcd34d" : "d1d5db"; 
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', sourceCenter.x);
        line.setAttribute('y1', sourceCenter.y);
        line.setAttribute('x2', targetCenter.x);
        line.setAttribute('y2', targetCenter.y);
        line.setAttribute('stroke', strokeColor);
        line.setAttribute('stroke-width', "3");
        line.setAttribute('marker-end', `url(#arrowhead-${markerFill})`);
        
        svg.appendChild(line);
    });
    
    // Draw dotted lines from timeline to nodes
    mindMapState.nodes.forEach(node => {
        if (node.type !== 'outcome' && node.year) {
            // Get the actual timeline settings from the global variables
            // We need to calculate the timeline position for this specific year
            const timelineStartY = 180;
            const yearSpacing = 100;
            
            // Get the timeline start and end years from the input fields
            const startYearInput = document.getElementById('start-year');
            const endYearInput = document.getElementById('end-year');
            const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
            const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
            
            // Calculate position with reversed timeline (end year at top, start year at bottom)
            const yearIndex = timelineEndYear - node.year;
            const timelineY = timelineStartY + (yearIndex * yearSpacing);
            
            console.log(`Drawing dotted line for node ${node.text} (year ${node.year}): timelineY=${timelineY}, nodeY=${node.y}`);
            
            // Draw dotted line from timeline to node
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute('x1', '80'); // Timeline line position
            line.setAttribute('y1', timelineY);
            line.setAttribute('x2', node.x); // Node left edge
            line.setAttribute('y2', timelineY); // Connect to the same Y as the timeline ridge
            line.setAttribute('stroke', '#94a3b8'); // Gray color
            line.setAttribute('stroke-width', '2');
            line.setAttribute('stroke-dasharray', '5,5'); // Dotted line
            line.setAttribute('data-node-id', node.id); // Add data attribute to track which node this line belongs to
            console.log('Created dotted line for node:', node.id, 'with data attribute:', line.getAttribute('data-node-id'));
            
            svg.appendChild(line);
        }
    });
}

function getNodeCenter(node) {
    const nodeElement = document.getElementById(node.id);
    if (!nodeElement) return { x: node.x + 100, y: node.y + 20 }; // Fallback for estimated size
    return { x: node.x + nodeElement.offsetWidth / 2, y: node.y + nodeElement.offsetHeight / 2 };
}

// --- TIMELINE FUNCTIONS (Restored from original code) ---

export function initializeTimeline() {
    console.log('Initializing timeline...');
    
    // Set up timeline controls
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const updateButton = document.getElementById('update-timeline');
    
    console.log('Timeline elements found:', {
        startYearInput: !!startYearInput,
        endYearInput: !!endYearInput,
        updateButton: !!updateButton
    });
    
    if (startYearInput && endYearInput && updateButton) {
        startYearInput.value = 1985; // timelineStartYear
        endYearInput.value = 1990; // timelineEndYear
        
        console.log('Adding click listener to update button');
        updateButton.addEventListener('click', () => {
            // Get the current mindMap and other required data from global scope
            if (window.mindMap && window.interactionHandlers && window.selectedNodeId !== undefined && window.chatHistory && window.saveMindMapToServer && window.currentCase) {
                updateTimeline(window.mindMap, window.interactionHandlers, window.selectedNodeId, window.chatHistory, window.saveMindMapToServer, window.currentCase);
            } else {
                console.error('Missing required data for timeline update');
            }
        });
        
        // Set initial canvas height
        updateCanvasHeight();
        
        // Draw timeline by default when page loads
        console.log('Drawing initial timeline...');
        drawTimeline(window.mindMap || { nodes: [], links: [] });
    } else {
        console.log('Some timeline elements not found, retrying in 100ms...');
        setTimeout(initializeTimeline, 100);
    }
}

export function updateTimeline(mindMap, interactionHandlers, selectedNodeId, chatHistory, saveMindMapToServer, currentCase) {
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    
    console.log('Update timeline clicked');
    console.log('Start year input:', startYearInput);
    console.log('End year input:', endYearInput);
    
    if (startYearInput && endYearInput) {
        const timelineStartYear = parseInt(startYearInput.value);
        const timelineEndYear = parseInt(endYearInput.value);
        
        console.log('New timeline range:', timelineStartYear, 'to', timelineEndYear);
        
        // Calculate required canvas height based on timeline range
        updateCanvasHeight();
        
        // Redraw timeline with new years
        drawTimeline(mindMap);
        
        // Reposition existing nodes based on their years
        repositionNodesOnTimeline(mindMap);
        
        // Redraw canvas
        drawCanvasElements(mindMap, interactionHandlers, selectedNodeId, chatHistory);
        
        // Save the updated timeline settings
        if (saveMindMapToServer && currentCase) {
            saveMindMapToServer(currentCase.id, mindMap);
        }
    } else {
        console.log('Timeline inputs not found');
    }
}

export function drawTimeline(mindMap) {
    console.log('Drawing timeline...');
    const timelineYears = document.getElementById('timeline-years');
    if (!timelineYears) {
        console.log('Timeline years element not found');
        return;
    }
    
    console.log('Clearing timeline years');
    timelineYears.innerHTML = '';
    
    const canvas = document.getElementById('mind-map-canvas');
    if (!canvas) {
        console.log('Canvas not found');
        return;
    }
    
    const timelineHeight = canvas.offsetHeight - 200; // Leave more margin for root node
    const timelineStartY = 180; // Start timeline much lower below the root node
    const yearSpacing = 100; // Increased spacing between years for better room
    
    // Get current timeline settings
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
    const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
    
    // First, collect all years from existing nodes
    const usedYears = new Set();
    if (mindMap && mindMap.nodes) {
        mindMap.nodes.forEach(node => {
            if (node.type !== 'outcome') {
                const year = extractYearFromText(node.text);
                if (year >= timelineStartYear && year <= timelineEndYear) {
                    usedYears.add(year);
                }
            }
        });
    }
    
    // Show ALL years from start to end - no skipping, but in reverse order (end year at top, start year at bottom)
    console.log('Creating years from', timelineEndYear, 'to', timelineStartYear, '(reversed)');
    for (let year = timelineEndYear; year >= timelineStartYear; year--) {
        const isUsed = usedYears.has(year);
        
        // Calculate position from bottom (start year at bottom, end year at top)
        const yearIndex = timelineEndYear - year;
        const yPosition = timelineStartY + (yearIndex * yearSpacing) - 25; // Move year card further above the ridge
        
        console.log('Creating year element for:', year, 'at position:', yPosition);
        
        const yearElement = document.createElement('div');
        yearElement.className = `absolute text-xs font-semibold px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${
            isUsed ? 'text-yellow-300 bg-yellow-800' : 'text-blue-300 bg-gray-800'
        }`;
        yearElement.textContent = year;
        yearElement.setAttribute('data-year', year);
        
        yearElement.style.left = '0px';
        yearElement.style.top = `${yPosition}px`;
        
        // Make years clickable to edit
        yearElement.addEventListener('click', () => editYear(year, yearElement, mindMap));
        
        timelineYears.appendChild(yearElement);
        
        // Add horizontal line for each year (ridge)
        const yearLine = document.createElement('div');
        yearLine.className = `absolute w-4 h-0.5 ${isUsed ? 'bg-yellow-400' : 'bg-blue-400'}`;
        yearLine.style.left = '16px';
        yearLine.style.top = `${timelineStartY + (yearIndex * yearSpacing)}px`; // Ridge at the actual timeline position
        timelineYears.appendChild(yearLine);
    }
    
    console.log('Timeline drawing complete. Total children:', timelineYears.children.length);
}

export function updateCanvasHeight() {
    console.log('Updating canvas height for timeline range');
    
    const canvas = document.getElementById('mind-map-canvas');
    if (!canvas) {
        console.log('Canvas not found');
        return;
    }
    
    // Get current timeline settings
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
    const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
    
    // Calculate required height based on timeline range
    const yearRange = timelineEndYear - timelineStartYear;
    const timelineStartY = 180; // Start position below root node
    const yearSpacing = 100; // Spacing between years
    const bottomMargin = 100; // Extra space at bottom
    
    // Calculate total required height
    const requiredHeight = timelineStartY + (yearRange * yearSpacing) + bottomMargin;
    
    console.log('Calculated required height:', requiredHeight, 'for', yearRange + 1, 'years');
    
    // Set the canvas height
    canvas.style.height = `${requiredHeight}px`;
    
    console.log('Canvas height updated to:', canvas.style.height);
}

export function updateTimelineHighlighting(mindMap) {
    console.log('Updating timeline highlighting...');
    
    // Get all year elements
    const yearElements = document.querySelectorAll('[data-year]');
    console.log('Found year elements:', yearElements.length);
    
    // Collect all years from existing nodes
    const usedYears = new Set();
    if (mindMap && mindMap.nodes) {
        mindMap.nodes.forEach(node => {
            if (node.type !== 'outcome') {
                const year = extractYearFromText(node.text);
                const startYearInput = document.getElementById('start-year');
                const endYearInput = document.getElementById('end-year');
                const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
                const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
                if (year >= timelineStartYear && year <= timelineEndYear) {
                    usedYears.add(year);
                }
            }
        });
    }
    
    console.log('Used years:', Array.from(usedYears));
    
    // Update highlighting for each year element
    yearElements.forEach(element => {
        const year = parseInt(element.getAttribute('data-year'));
        const isUsed = usedYears.has(year);
        
        console.log('Updating year element:', year, 'isUsed:', isUsed);
        
        // Update year card styling
        element.className = `absolute text-xs font-semibold px-2 py-1 rounded cursor-pointer hover:bg-gray-700 ${
            isUsed ? 'text-yellow-300 bg-yellow-800' : 'text-blue-300 bg-gray-800'
        }`;
        
        // Update horizontal line styling
        const yearLine = element.nextElementSibling;
        if (yearLine) {
            yearLine.className = `absolute w-4 h-0.5 ${isUsed ? 'bg-yellow-400' : 'bg-blue-400'}`;
        }
    });
}

export function editYear(year, element, mindMap) {
    const newYear = prompt(`Edit year for this position:`, year);
    if (newYear && !isNaN(newYear) && newYear !== year.toString()) {
        const newYearNum = parseInt(newYear);
        
        // Update the year in the timeline
        element.textContent = newYearNum;
        element.setAttribute('data-year', newYearNum);
        
        // Update any nodes that were positioned at this timeline position
        if (mindMap && mindMap.nodes) {
            const yPosition = element.style.top;
            mindMap.nodes.forEach(node => {
                if (node.type !== 'outcome' && Math.abs(node.y - parseInt(yPosition)) < 20) {
                    const nodeYear = extractYearFromText(node.text);
                    if (nodeYear === year) {
                        node.text = node.text.replace(/\(\d{4}\)/, `(${newYearNum})`);
                    }
                }
            });
        }
    }
}

export function extractYearFromText(text) {
    // Extract year from text like "Gorbachev's Reforms (1985)" or "Mass protests in Leipzig (1989)"
    const yearMatch = text.match(/\((\d{4})\)/);
    if (yearMatch) {
        return parseInt(yearMatch[1]);
    }
    
    // If no year found, return middle of timeline
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
    const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
    return Math.floor((timelineStartYear + timelineEndYear) / 2);
}

export function getTimelinePosition(year) {
    const timelineStartY = 180; // Same offset as in drawTimeline
    const yearSpacing = 100; // Same spacing as in drawTimeline
    
    // Get current timeline settings
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
    const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
    
    // Calculate position with reversed timeline (end year at top, start year at bottom)
    const yearIndex = timelineEndYear - year;
    const yPosition = timelineStartY + (yearIndex * yearSpacing);
    return yPosition;
}

export function findClosestYearLine(mouseY) {
    const canvas = document.getElementById('mind-map-canvas');
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const relativeY = mouseY - rect.top;
    
    console.log('Finding closest year line for mouse Y:', mouseY, 'relative Y:', relativeY);
    
    // Get current timeline settings
    const startYearInput = document.getElementById('start-year');
    const endYearInput = document.getElementById('end-year');
    const timelineStartYear = startYearInput ? parseInt(startYearInput.value) : 1985;
    const timelineEndYear = endYearInput ? parseInt(endYearInput.value) : 1990;
    
    // Find the closest year line using the same logic as drawTimeline
    const timelineStartY = 180;
    const yearSpacing = 100;
    
    let closestYear = null;
    let closestDistance = Infinity;
    
    for (let year = timelineEndYear; year >= timelineStartYear; year--) {
        const yearIndex = timelineEndYear - year;
        const yearY = timelineStartY + (yearIndex * yearSpacing);
        const distance = Math.abs(relativeY - yearY);
        
        console.log(`Year ${year}: Y=${yearY}, distance=${distance}`);
        
        if (distance < closestDistance) {
            closestDistance = distance;
            closestYear = year;
        }
    }
    
    console.log('Closest year found:', closestYear, 'with distance:', closestDistance);
    return closestYear;
}

export function repositionNodesOnTimeline(mindMap) {
    if (mindMap && mindMap.nodes) {
        mindMap.nodes.forEach(node => {
            if (node.type !== 'outcome') {
                const year = extractYearFromText(node.text);
                const nodeHeight = 60; 
                const halfHeight = nodeHeight / 2;
                
                node.y = getTimelinePosition(year) - halfHeight;
                node.x = 250; // Position nodes to the right of timeline
            }
        });
    }
}
