/**
 * Enhanced Template Instructions
 *
 * Comprehensive, unique design instructions for each template type.
 * Timeline and Mindmap expanded from 9 lines to 150+ lines each.
 */

import type { DesignLanguage, TimelineLayout, MindmapLayout, SlideDesignSystem } from '../types/design-language';

/**
 * Get enhanced timeline instructions based on layout type
 */
export function getTimelineInstructions(layout: TimelineLayout, designLanguage: DesignLanguage): string {
  const baseInstructions = `
## TIMELINE TEMPLATE - IMMERSIVE CHRONOLOGICAL VISUALIZATION

Create a visually stunning, interactive timeline that brings the journey's chronology to life.

**Timeline Layout**: ${layout}
**Visual Style**: ${designLanguage.visualStyle.primary}
**Color Mode**: ${designLanguage.colorSystem.mode}

`;

  const layoutSpecific: Record<TimelineLayout, string> = {
    'Horizontal Scrolling': `
### Horizontal Scrolling Timeline

**Structure:**
- Full-viewport horizontal scroll with smooth momentum
- Timeline axis spans bottom 20% of viewport
- Events positioned above axis at varying heights
- Connecting lines from events to axis
- Milestone markers 2x larger than routine events

**CSS Implementation:**
\`\`\`css
.timeline-container {
  width: calc(var(--event-count) * 400px);
  height: 100vh;
  display: flex;
  align-items: flex-end;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
}

.timeline-axis {
  position: absolute;
  bottom: 15vh;
  height: 4px;
  width: 100%;
  background: linear-gradient(to right, ${designLanguage.colorSystem.palette.primary[0]}, ${designLanguage.colorSystem.palette.accent[0]});
}

.timeline-event {
  scroll-snap-align: center;
  width: 300px;
  margin: 0 50px;
  position: relative;
  bottom: var(--event-height); /* 25vh for normal, 40vh for milestones */
}

.event-marker {
  width: var(--marker-size); /* 12px normal, 20px milestone */
  height: var(--marker-size);
  border-radius: 50%;
  background: ${designLanguage.colorSystem.palette.accent[0]};
  position: absolute;
  bottom: -25vh;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 20px ${designLanguage.colorSystem.palette.accent[0]};
}

.connecting-line {
  width: 2px;
  background: ${designLanguage.colorSystem.palette.neutral[1]};
  position: absolute;
  bottom: -25vh;
  left: 50%;
  transform: translateX(-50%);
}
\`\`\`

**Event Card Design:**
- Background: ${designLanguage.visualStyle.primary === 'Glassmorphism' ? 'frosted glass (backdrop-filter: blur(10px))' : 'solid with shadow'}
- Padding: 2rem, Border-radius: 1rem
- Typography: Title (1.5rem bold), description (1rem), timestamp (0.875rem muted)
- Hover: scale(1.05), shadow deepens
- Click: expand to modal with full stage details

**Navigation:**
- Arrow buttons fixed to viewport sides
- Keyboard: Arrow keys, Home, End
- Drag with momentum
- Minimap at top showing all events + current position

**Visual Enhancements:**
- Stage type icons (SVG, 40x40px) above each event
- Color-coded by stage type (discovering: blue, solving: green, etc.)
- Progress bar at top fills as you scroll
- Parallax: background moves slower than timeline
`,

    'Vertical Scrollytelling': `
### Vertical Scrollytelling Timeline

**Structure:**
- Full-height vertical scroll with sticky timeline axis
- Axis on left (5px wide), events on right (75% viewport)
- Each event is full-viewport-height section
- Snap scrolling between events
- Date labels stick to axis as you scroll

**CSS Implementation:**
\`\`\`css
.timeline-container {
  width: 100vw;
  display: flex;
}

.timeline-axis {
  width: 5px;
  position: sticky;
  left: 15vw;
  top: 0;
  height: 100vh;
  background: ${designLanguage.colorSystem.palette.primary[0]};
}

.timeline-event {
  min-height: 100vh;
  width: 75vw;
  display: flex;
  align-items: center;
  padding: 4rem;
  scroll-snap-align: start;
}

.axis-label {
  position: sticky;
  top: 50vh;
  transform: translateY(-50%);
  padding: 1rem;
  background: ${designLanguage.colorSystem.palette.accent[0]};
  border-radius: 0.5rem;
  font-weight: bold;
  color: white;
}
\`\`\`

**Event Section Design:**
- Full-screen sections alternating left/right layouts
- Large stage number (20rem, ultra-thin, opacity: 0.05) as background
- Content overlays number
- Imagery/diagrams integrated
- Scroll indicator: "↓ Scroll to continue"

**Interactions:**
- Intersection Observer for scroll-triggered animations
- Axis grows from 0% to 100% as you progress
- Active section's label highlighted with glow
- Smooth scroll with CSS scroll-behavior: smooth

**Visual Enhancements:**
- Era backgrounds (fade between themes for temporal journeys)
- Parallax: bg images at 0.5x scroll speed
- Milestone markers: full-width colored bars with icon
`,

    'Spiral Timeline': `
### Spiral Timeline

**Structure:**
- Events arranged in Archimedean spiral
- Starts at center, spirals outward clockwise
- Earlier events at center, later at edges

**JavaScript Implementation:**
\`\`\`javascript
function getSpiralPosition(index, total) {
  const angle = index * (360 / total) * (Math.PI / 180) * 3; // 3 rotations
  const radius = 100 + index * 30;
  return {
    x: Math.cos(angle) * radius + window.innerWidth / 2,
    y: Math.sin(angle) * radius + window.innerHeight / 2,
    rotation: angle * (180 / Math.PI)
  };
}

// Position all events
events.forEach((event, i) => {
  const pos = getSpiralPosition(i, events.length);
  event.style.left = pos.x + 'px';
  event.style.top = pos.y + 'px';
  event.style.transform = \`rotate(\${pos.rotation}deg)\`;
});
\`\`\`

**Event Nodes:**
- Circular/hexagonal cards (200px diameter)
- Rotate to face outward from center
- Size increases as spiral expands
- Glow on hover
- Click to zoom and read

**Navigation:**
- Pinch/wheel to zoom
- Drag to pan
- Reset view button
- Minimap in corner

**Visual Enhancements:**
- Animated spiral path drawing on load (SVG stroke-dasharray)
- Gradient along path (${designLanguage.colorSystem.palette.primary[0]} → ${designLanguage.colorSystem.palette.accent[0]})
- Pulsing on milestones
- Radial gradient background from center
`,

    'Branching Paths': `
### Branching Paths Timeline

**Structure:**
- Main timeline path down center
- Branches split left/right for alternative paths or parallel developments
- Decision points marked with diamond nodes
- Paths converge/diverge based on journey structure

**Implementation:**
- SVG paths for branches (cubic bezier curves)
- Main path: vertical down center
- Branches: curve left/right at 45° angles
- Event nodes positioned along paths

**Event Styling:**
- Main path: larger nodes (120px)
- Branches: smaller nodes (80px)
- Decision points: diamond shape, ${designLanguage.colorSystem.palette.accent[0]}
- Connecting paths: ${designLanguage.colorSystem.palette.neutral[1]}, 3px stroke

**Interactions:**
- Click node: highlight entire path leading to it
- Hover path: show all events along that path
- Toggle branches: hide/show alternative paths

**Visual Enhancements:**
- Animated path drawing
- Flow particles moving along active paths
- Color-code by outcome (success: green, failure: red, neutral: gray)
`,

    'Zigzag Alternating': `
### Zigzag Alternating Timeline

**Structure:**
- Events alternate left and right of central vertical axis
- Zigzag connecting lines between events
- Clean, scannable layout

**CSS Layout:**
\`\`\`css
.timeline-event:nth-child(odd) {
  margin-left: 0;
  margin-right: auto;
  padding-right: 3rem;
  text-align: right;
}

.timeline-event:nth-child(even) {
  margin-left: auto;
  margin-right: 0;
  padding-left: 3rem;
  text-align: left;
}

.event-connector {
  position: absolute;
  width: 2px;
  height: 100px;
  background: ${designLanguage.colorSystem.palette.neutral[1]};
  left: 50%;
  transform: translateX(-50%) rotate(calc(var(--index) * 15deg));
}
\`\`\`

**Event Cards:**
- Width: 45% of viewport
- Alternate positioning
- Connecting lines zigzag between
- Date markers on central axis

**Visual Enhancements:**
- Fade-in as you scroll past
- Connecting lines draw on scroll
- Central axis has date labels
`,

    'Gantt-style Bars': `
### Gantt-style Timeline (Duration Bars)

**Structure:**
- Horizontal bars showing event duration
- Y-axis: categories or stages
- X-axis: time progression
- Overlapping bars for concurrent events

**CSS Grid Implementation:**
\`\`\`css
.gantt-timeline {
  display: grid;
  grid-template-columns: 150px repeat(auto-fill, minmax(50px, 1fr));
  grid-auto-rows: 60px;
  gap: 0.5rem;
}

.gantt-bar {
  grid-column: var(--start) / var(--end); /* Calculated from timestamps */
  background: linear-gradient(135deg, ${designLanguage.colorSystem.palette.primary[0]}, ${designLanguage.colorSystem.palette.primary[1]});
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 1rem;
}

.gantt-bar:hover {
  transform: scaleY(1.2);
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
\`\`\`

**Bar Styling:**
- Color by stage type or category
- Width proportional to duration
- Height: 60px (expands on hover)
- Text: event name, truncated with ellipsis

**Interactions:**
- Hover: show full details in tooltip
- Click: open modal with complete info
- Drag time axis to pan
- Zoom with wheel

**Visual Enhancements:**
- Today marker (if applicable)
- Milestone diamonds above bars
- Phase backgrounds (alternate row colors)
`,
  };

  return baseInstructions + layoutSpecific[layout] + `

### General Timeline Design Principles

**Temporal Clarity:**
- Clear chronological progression
- Date/time labels always visible
- Duration visualization (longer events = wider/taller)
- Gaps proportional to time passed

**Event Hierarchy:**
- **Milestones**: 2x size, special styling, prominent
- **Key Events**: Standard size, full details
- **Routine**: Smaller, summary only

**Interactivity:**
- Smooth navigation (keyboard, mouse, touch)
- Multiple zoom levels: Overview → Detail → Deep Dive
- Expandable extended thinking sections
- Tooltips on hover, modals on click

**Information Density:**
- Overview: title + icon + date
- Hover: +description + key insights
- Click: full stage output + artifacts

**Visual Storytelling:**
- Color progression showing journey evolution
- Icon system for stage types (consistent SVG set)
- Connecting lines show relationships
- Background reflects content themes

**Performance:**
- Lazy load details (render on demand)
- Virtual scrolling for 20+ events
- CSS transforms for 60fps animations
- Debounced scroll listeners

**Perpetua Branding:**
- Top-left header with "Perpetua" styled to match ${designLanguage.visualStyle.primary}
- Logo color: ${designLanguage.colorSystem.palette.primary[0]}
`;
}

/**
 * Get enhanced mindmap instructions based on layout type
 */
export function getMindmapInstructions(layout: MindmapLayout, designLanguage: DesignLanguage): string {
  const baseInstructions = `
## MINDMAP TEMPLATE - INTERACTIVE CONCEPT VISUALIZATION

Create a visually stunning, interactive concept map revealing journey structure and relationships.

**Mindmap Layout**: ${layout}
**Visual Style**: ${designLanguage.visualStyle.primary}
**Color Mode**: ${designLanguage.colorSystem.mode}

`;

  const layoutSpecific: Record<MindmapLayout, string> = {
    'Radial Sunburst': `
### Radial Sunburst Mindmap

**Structure:**
- Central node: Journey question (200px diameter)
- Level 1: Stages radially around center (120px)
- Level 2: Insights branching from stages (60px)
- Level 3: Artifacts at outermost ring (40px)

**JavaScript Positioning:**
\`\`\`javascript
function getRadialPosition(parent, childIndex, totalChildren, level) {
  const angleStep = (2 * Math.PI) / totalChildren;
  const angle = childIndex * angleStep + (parent.angle || 0);
  const radius = 150 * level;
  return {
    x: parent.x + Math.cos(angle) * radius,
    y: parent.y + Math.sin(angle) * radius,
    angle: angle
  };
}
\`\`\`

**CSS Styling:**
\`\`\`css
.mindmap-node {
  position: absolute;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.mindmap-node:hover {
  transform: scale(1.15);
  box-shadow: 0 10px 40px rgba(0,0,0,0.3);
  z-index: 100;
}

.node-central {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, ${designLanguage.colorSystem.palette.primary[0]}, ${designLanguage.colorSystem.palette.primary[1]});
  color: white;
  font-size: 1.25rem;
  font-weight: bold;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
}

.node-stage {
  width: 120px;
  height: 120px;
  background: ${designLanguage.colorSystem.palette.accent[0]};
  color: white;
  font-size: 1rem;
  font-weight: 600;
}

.node-insight {
  width: 60px;
  height: 60px;
  background: ${designLanguage.colorSystem.palette.neutral[2]};
  font-size: 0.75rem;
}

.connection-line {
  position: absolute;
  height: 2px;
  background: ${designLanguage.colorSystem.palette.neutral[1]};
  transform-origin: 0 50%;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.connection-line.active {
  opacity: 1;
  background: ${designLanguage.colorSystem.palette.accent[0]};
  height: 3px;
}
\`\`\`

**Connections:**
- Straight lines from center to stages
- Curved lines from stages to insights (SVG paths)
- Thickness: 2px default, 4px on hover
- Animated drawing on load

**Interactions:**
- Click central: zoom to fit all
- Click stage: zoom to branch, dim others
- Click insight: modal with details
- Double-click: reset view
- Drag to pan, wheel to zoom

**Visual Enhancements:**
- Pulsing animation on central node
- Glow on hover (box-shadow with node color)
- Stage icons (SVG)
- Tooltip on hover
- Radial gradient background
`,

    'Force-Directed Graph': `
### Force-Directed Graph Mindmap

**Structure:**
- Physics-based layout using simulated forces
- Nodes repel each other (charge force)
- Connected nodes attract (link force)
- Organic, dynamic positioning

**Physics Simulation (Vanilla JS):**
\`\`\`javascript
class ForceSimulation {
  constructor(nodes, links) {
    this.nodes = nodes.map(n => ({
      ...n,
      vx: 0, vy: 0,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight
    }));
    this.links = links;
  }

  tick() {
    // Repulsion between all nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[j].x - this.nodes[i].x;
        const dy = this.nodes[j].y - this.nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 5000 / (dist * dist);

        this.nodes[i].vx -= (dx / dist) * force;
        this.nodes[i].vy -= (dy / dist) * force;
        this.nodes[j].vx += (dx / dist) * force;
        this.nodes[j].vy += (dy / dist) * force;
      }
    }

    // Attraction along links
    this.links.forEach(link => {
      const source = this.nodes[link.source];
      const target = this.nodes[link.target];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.01;

      source.vx += (dx / dist) * force;
      source.vy += (dy / dist) * force;
      target.vx -= (dx / dist) * force;
      target.vy -= (dy / dist) * force;
    });

    // Update positions with damping
    this.nodes.forEach(node => {
      node.vx *= 0.9;
      node.vy *= 0.9;
      node.x += node.vx;
      node.y += node.vy;

      // Keep in bounds
      node.x = Math.max(50, Math.min(window.innerWidth - 50, node.x));
      node.y = Math.max(50, Math.min(window.innerHeight - 50, node.y));
    });
  }

  run(iterations = 300) {
    for (let i = 0; i < iterations; i++) {
      this.tick();
    }
  }
}
\`\`\`

**Node Design:**
- Size by importance (central: 180px, stages: 100px, insights: 50px)
- Rounded rectangles or circles
- Color by category
- Hover: scale + show connections

**Connection Design:**
- SVG quadratic curves
- Thickness by relationship strength
- Color matches source node
- Arrows show directionality

**Interactions:**
- Drag nodes to reposition (re-run simulation)
- Click: highlight connected nodes
- Double-click: expand hidden connections
- Filter controls (show/hide types)
- Search to find nodes

**Visual Enhancements:**
- Smooth spring animations
- Hover effects propagate to connected nodes
- Background particles or grid
- Mini-map of full graph
`,

    'Tree Layout': `
### Tree Layout Mindmap

**Structure:**
- Hierarchical tree (top-down or left-right)
- Root: Journey question
- Level 1: Stages as children
- Level 2: Insights under stages
- Level 3: Artifacts at leaves

**Tree Layout Algorithm:**
\`\`\`javascript
function layoutTree(root, orientation = 'vertical') {
  const nodeWidth = 150;
  const nodeHeight = 80;
  const levelGap = orientation === 'vertical' ? 150 : 200;

  function assignPositions(node, depth = 0, offset = 0) {
    const childOffsets = [];
    let currentOffset = offset;

    node.children?.forEach(child => {
      const childOffset = assignPositions(child, depth + 1, currentOffset);
      childOffsets.push(childOffset);
      currentOffset = childOffset + nodeWidth + 20;
    });

    const nodeOffset = node.children?.length
      ? (childOffsets[0] + childOffsets[childOffsets.length - 1]) / 2
      : offset;

    if (orientation === 'vertical') {
      node.x = nodeOffset;
      node.y = depth * levelGap;
    } else {
      node.x = depth * levelGap;
      node.y = nodeOffset;
    }

    return nodeOffset;
  }

  assignPositions(root);
}
\`\`\`

**CSS Styling:**
\`\`\`css
.tree-node {
  position: absolute;
  width: 150px;
  min-height: 80px;
  padding: 1rem;
  background: white;
  border: 2px solid ${designLanguage.colorSystem.palette.primary[0]};
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tree-node:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.tree-connection {
  stroke: ${designLanguage.colorSystem.palette.neutral[1]};
  stroke-width: 2;
  fill: none;
}
\`\`\`

**Connection Types:**
- Elbow connectors (right angles)
- Smooth Bezier curves
- Orthogonal (step-like)
- Animated on expand

**Interactions:**
- Click to expand/collapse subtree
- Drag to reorder siblings
- Zoom to fit entire tree
- Focus mode: highlight path, dim rest

**Visual Enhancements:**
- Indentation guides (dashed lines)
- Level backgrounds (alternating)
- Breadcrumb path from root
- Minimap for large trees
`,

    'Organic Clusters': `
### Organic Clusters Mindmap

**Structure:**
- Thematically grouped nodes in organic clusters
- Clusters positioned by relatedness
- Flowing, natural boundaries
- Inter-cluster connections

**Clustering Algorithm:**
\`\`\`javascript
// K-means-style clustering by theme similarity
function clusterNodes(nodes, k = 5) {
  // Initialize cluster centers
  const centers = nodes.slice(0, k).map(n => ({x: n.x, y: n.y}));

  for (let iter = 0; iter < 20; iter++) {
    // Assign nodes to nearest cluster
    nodes.forEach(node => {
      let minDist = Infinity;
      let cluster = 0;
      centers.forEach((center, i) => {
        const dist = Math.hypot(node.x - center.x, node.y - center.y);
        if (dist < minDist) {
          minDist = dist;
          cluster = i;
        }
      });
      node.cluster = cluster;
    });

    // Recalculate centers
    centers.forEach((center, i) => {
      const clusterNodes = nodes.filter(n => n.cluster === i);
      if (clusterNodes.length > 0) {
        center.x = clusterNodes.reduce((sum, n) => sum + n.x, 0) / clusterNodes.length;
        center.y = clusterNodes.reduce((sum, n) => sum + n.y, 0) / clusterNodes.length;
      }
    });
  }

  return {nodes, centers};
}
\`\`\`

**Visual Design:**
- Cluster backgrounds: organic blob shapes (clip-path)
- Color per cluster (${designLanguage.colorSystem.palette.primary.join(', ')})
- Nodes positioned within clusters
- Inter-cluster lines: dashed, muted

**Interactions:**
- Click cluster: zoom to cluster, dim others
- Drag cluster: reposition entire group
- Merge/split clusters
- Toggle cluster visibility

**Visual Enhancements:**
- Animated blob morphing
- Glow around clusters
- Particle connections between clusters
- Cluster labels (theme names)
`,

    'Geometric Grid': `
### Geometric Grid Mindmap

**Structure:**
- Grid-based layout with geometric precision
- Hexagonal or square tiles
- Hierarchical sizing (central larger)
- Clean, organized appearance

**CSS Grid Implementation:**
\`\`\`css
.mindmap-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
}

.grid-node-central {
  grid-column: span 2;
  grid-row: span 2;
  width: 100%;
  aspect-ratio: 1;
}

.grid-node {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${designLanguage.colorSystem.palette.primary[0]};
  color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.3s;
}

.grid-node:hover {
  transform: scale(1.1);
  z-index: 10;
}
\`\`\`

**Hexagonal Variation:**
- Use clip-path: polygon() for hexagons
- Offset every other row by 50%
- Honeycomb pattern

**Connections:**
- SVG overlay for relationship lines
- Straight lines between connected nodes
- Color-coded by relationship type

**Interactions:**
- Click: expand with related nodes
- Hover: highlight connections
- Filter by category
- Sort by various metrics

**Visual Enhancements:**
- Geometric patterns in backgrounds
- Sharp, clean lines
- Grid animations on load
- Category color coding
`,

    '3D Perspective Layers': `
### 3D Perspective Layers Mindmap

**Structure:**
- Nodes arranged in 3D space with perspective
- Depth indicates hierarchy
- Central node closest (z: 0)
- Outer nodes further back (z: -500 to -1000)
- Isometric or perspective projection

**CSS 3D Implementation:**
\`\`\`css
.mindmap-3d {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.node-layer-1 {
  transform: translateZ(0) scale(1.2);
  z-index: 100;
}

.node-layer-2 {
  transform: translateZ(-200px) scale(1);
  z-index: 50;
}

.node-layer-3 {
  transform: translateZ(-400px) scale(0.8);
  z-index: 10;
}

.mindmap-3d:hover {
  transform: rotateY(var(--mouse-x)) rotateX(var(--mouse-y));
}
\`\`\`

**JavaScript for Mouse Parallax:**
\`\`\`javascript
document.addEventListener('mousemove', (e) => {
  const x = (e.clientX / window.innerWidth - 0.5) * 20;
  const y = (e.clientY / window.innerHeight - 0.5) * -20;
  document.querySelector('.mindmap-3d').style.setProperty('--mouse-x', x + 'deg');
  document.querySelector('.mindmap-3d').style.setProperty('--mouse-y', y + 'deg');
});
\`\`\`

**Visual Design:**
- Depth fog: farther nodes more transparent
- Size scales with depth
- Shadow depth increases closer to viewer
- Connecting lines in 3D space

**Interactions:**
- Mouse move: rotate entire mindmap
- Click node: bring to front (animate z)
- Scroll: zoom in/out
- Arrow keys: orbit around

**Visual Enhancements:**
- Parallax motion on mouse move
- Depth of field blur
- Lighting effects (closer nodes brighter)
- Floating animation
`,
  };

  return baseInstructions + layoutSpecific[layout] + `

### General Mindmap Design Principles

**Node Design:**
- **Central Question**: Most prominent, always visible, largest size
- **Stage Nodes**: Color by type, icon + short label, medium size
- **Insight Nodes**: Lighter style, text preview on hover, smaller
- **Artifact Nodes**: Distinct icons, click to view content, smallest

**Connection Design:**
- **Relationship Types:**
  * Parent-child: Solid lines (${designLanguage.colorSystem.palette.neutral[1]})
  * Cross-references: Dashed lines
  * Strong associations: Thick lines (3-4px)
  * Weak associations: Thin lines (1px)
- **Visual Cues:**
  * Arrows show direction
  * Color by strength (bright = strong, muted = weak)
  * Hover highlights entire path

**Hierarchy & Depth:**
- Size decreases with distance from center
- Opacity/saturation decreases with depth
- Font size scales with importance
- Collapse distant nodes to reduce clutter

**Interactivity:**
- **Navigation:**
  * Pan: Drag background
  * Zoom: Wheel/pinch
  * Reset: Double-click or button
- **Selection:**
  * Click: Highlight + details
  * Double-click: Full content
  * Right-click: Context menu
- **Filtering:**
  * Show/hide node types
  * Search highlighting
  * Path tracing between nodes

**Visual Storytelling:**
- Colors reflect content themes
- Layout reveals structure
- Clusters show related concepts
- Size indicates importance
- Animations guide attention

**Performance:**
- Lazy rendering (visible only)
- LOD: distant nodes simplified
- Canvas for 100+ nodes
- Debounced listeners
- Web Workers for physics

**Perpetua Branding:**
- Top-left header: "Perpetua" styled to match ${designLanguage.visualStyle.primary}
- Logo color: ${designLanguage.colorSystem.palette.primary[0]}
`;
}

/**
 * Get enhanced website instructions with layout system
 */
export function getWebsiteInstructions(designLanguage: DesignLanguage): string {
  // Website instructions are already comprehensive (91 lines)
  // Just add layout system specific guidance
  const layoutGuidance = designLanguage.layout.system === 'Magazine Editorial'
    ? `
**LAYOUT SYSTEM: Magazine Editorial**
- Use asymmetric column layouts (60/40 or 70/30 splits)
- Large pull quotes overlaying sections
- Image+text overlays with varied positioning
- Dynamic font sizing for emphasis
- White space as a design element`
    : designLanguage.layout.system === 'Bento Box Grid'
    ? `
**LAYOUT SYSTEM: Bento Box Grid**
- CSS Grid with varied cell sizes (1x1, 2x1, 2x2)
- Create visual hierarchy through size
- Rounded corners, shadows on cards
- Hover effects: scale up, shadow deepens`
    : designLanguage.layout.system === 'Scrollytelling'
    ? `
**LAYOUT SYSTEM: Scrollytelling**
- Narrative-driven vertical scroll
- Sticky elements reveal content
- Parallax background layers
- Content fades/slides in on scroll
- Progress indicator showing completion`
    : '';

  return layoutGuidance + `\n\n(Use existing comprehensive website template instructions from ClaudePageGenerator)`;
}

/**
 * Get enhanced presentation instructions with slide design
 */
export function getPresentationInstructions(slideDesign: SlideDesignSystem, designLanguage: DesignLanguage): string {
  const designGuidance: Record<SlideDesignSystem, string> = {
    'Minimal High-Contrast': `
**SLIDE DESIGN: Minimal High-Contrast**
- Large, bold typography (h1: 4-5rem)
- Maximum 5 words per slide
- High contrast (black bg + white text OR white bg + black text)
- Single accent color: ${designLanguage.colorSystem.palette.accent[0]}
- Generous margins (20% of viewport)
- Instant cut transitions (no animations)`,

    'Visual Storytelling': `
**SLIDE DESIGN: Visual Storytelling**
- 50% visual, 50% text per slide
- Split screen or overlay text on imagery
- SVG illustrations for concepts
- Smooth fade/slide transitions
- Minimal bullet points (icons + 3-4 words)`,

    'Data-Focused': `
**SLIDE DESIGN: Data-Focused**
- Large data visualizations (charts, graphs)
- Minimal text (let data speak)
- Color-coded data categories
- Animated data reveals
- One key insight per slide`,

    'Bold Typography': `
**SLIDE DESIGN: Bold Typography**
- Huge, statement typography (8-12rem)
- 1-3 words maximum per slide
- Typography creates visual rhythm
- Kinetic text effects on transitions
- Minimal colors, maximum impact`,

    'Image-Heavy': `
**SLIDE DESIGN: Image-Heavy**
- Full-bleed imagery on every slide
- Text overlays with contrast treatments
- Cinematic transitions
- Storytelling through visuals
- Minimal UI elements`,

    'Elegant Minimal': `
**SLIDE DESIGN: Elegant Minimal**
- Generous whitespace (40%+ empty space)
- Refined typography with careful hierarchy
- Subtle animations and transitions
- Monochromatic or limited palette
- Premium, sophisticated feel`,
  };

  return designGuidance[slideDesign] + `\n\n(Use existing comprehensive presentation template instructions from ClaudePageGenerator including vanilla JS navigation, print styles, etc.)`;
}
